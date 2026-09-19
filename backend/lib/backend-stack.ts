import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export class BackendStack extends cdk.Stack {
  public readonly apiUrl: string;
  public readonly documentBucket: s3.Bucket;
  public readonly claimsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const demoMode = process.env.DEMO_MODE === 'true';

    // ----------------------------------------------------
    // 1. S3 Document Vault
    // ----------------------------------------------------
    this.documentBucket = new s3.Bucket(this, 'VasuliDocumentVault', {
      bucketName: `vasuli-docs-${this.account}-${this.region}`,
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
    });

    // ----------------------------------------------------
    // 2. DynamoDB Tables
    // ----------------------------------------------------
    this.claimsTable = new dynamodb.Table(this, 'ClaimsTable', {
      tableName: 'vasuli_claims',
      partitionKey: { name: 'claim_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const buyerSessionsTable = new dynamodb.Table(this, 'BuyerSessionsTable', {
      tableName: 'vasuli_buyer_sessions',
      partitionKey: { name: 'claim_token', type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: 'expires_at',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const configTable = new dynamodb.Table(this, 'ConfigTable', {
      tableName: 'vasuli_config',
      partitionKey: { name: 'config_key', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const auditLogsTable = new dynamodb.Table(this, 'AuditLogsTable', {
      tableName: 'vasuli_audit_logs',
      partitionKey: { name: 'log_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ----------------------------------------------------
    // 3. IAM Managed Policies & Shared Env
    // ----------------------------------------------------
    const sharedLambdaEnv = {
      DOCUMENT_BUCKET: this.documentBucket.bucketName,
      CLAIMS_TABLE: this.claimsTable.tableName,
      BUYER_SESSIONS_TABLE: buyerSessionsTable.tableName,
      CONFIG_TABLE: configTable.tableName,
      AUDIT_LOGS_TABLE: auditLogsTable.tableName,
      DEMO_MODE: demoMode ? 'true' : 'false',
      RBI_BANK_RATE: '5.50',
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    };

    // ----------------------------------------------------
    // 4. Lambda Functions
    // ----------------------------------------------------
    const lambdaDir = path.join(__dirname, '../lambda');

    // Central API Router / Lambda Handler
    const apiHandler = new lambda.Function(this, 'VasuliApiHandler', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'api_handler.lambda_handler',
      code: lambda.Code.fromAsset(lambdaDir),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: sharedLambdaEnv,
    });

    // Grant Permissions
    this.documentBucket.grantReadWrite(apiHandler);
    this.claimsTable.grantReadWriteData(apiHandler);
    buyerSessionsTable.grantReadWriteData(apiHandler);
    configTable.grantReadWriteData(apiHandler);
    auditLogsTable.grantReadWriteData(apiHandler);

    // Bedrock & Textract access
    apiHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'bedrock:InvokeModel',
          'textract:AnalyzeExpense',
          'textract:DetectDocumentText',
        ],
        resources: ['*'],
      })
    );

    // ----------------------------------------------------
    // 5. Step Functions Escalation State Machine
    // ----------------------------------------------------
    const waitDuration = demoMode ? sfn.Duration.seconds(30) : sfn.Duration.days(5);

    const initialTier1Task = new tasks.LambdaInvoke(this, 'SendTier1Notice', {
      lambdaFunction: apiHandler,
      payload: sfn.TaskInput.fromObject({
        action: 'SEND_TIER1_NOTICE',
        claim_id: sfn.JsonPath.stringAt('$.claim_id'),
      }),
      resultPath: '$.tier1_result',
    });

    const waitPeriod = new sfn.Wait(this, 'WaitForSettlementOrGracePeriod', {
      time: sfn.WaitTime.duration(waitDuration),
    });

    const checkSettlementTask = new tasks.LambdaInvoke(this, 'CheckSettlementStatus', {
      lambdaFunction: apiHandler,
      payload: sfn.TaskInput.fromObject({
        action: 'CHECK_STATUS',
        claim_id: sfn.JsonPath.stringAt('$.claim_id'),
      }),
      resultPath: '$.status_check',
    });

    const escalationChoice = new sfn.Choice(this, 'IsSettledChoice');

    const sendTier2Task = new tasks.LambdaInvoke(this, 'SendTier2StatutoryNotice', {
      lambdaFunction: apiHandler,
      payload: sfn.TaskInput.fromObject({
        action: 'SEND_TIER2_NOTICE',
        claim_id: sfn.JsonPath.stringAt('$.claim_id'),
      }),
      resultPath: '$.tier2_result',
    });

    const waitTier2Period = new sfn.Wait(this, 'WaitForTier2Period', {
      time: sfn.WaitTime.duration(demoMode ? sfn.Duration.seconds(30) : sfn.Duration.days(15)),
    });

    const generateSamadhaanDossier = new tasks.LambdaInvoke(this, 'GenerateSamadhaanDossier', {
      lambdaFunction: apiHandler,
      payload: sfn.TaskInput.fromObject({
        action: 'GENERATE_TIER3_DOSSIER',
        claim_id: sfn.JsonPath.stringAt('$.claim_id'),
      }),
      resultPath: '$.tier3_result',
    });

    const settledState = new sfn.Succeed(this, 'ClaimSuccessfullySettled');

    // Chain workflow
    const definition = initialTier1Task
      .next(waitPeriod)
      .next(checkSettlementTask)
      .next(
        escalationChoice
          .when(
            sfn.Condition.stringEquals('$.status_check.Payload.status', 'SETTLED'),
            settledState
          )
          .otherwise(
            sendTier2Task
              .next(waitTier2Period)
              .next(generateSamadhaanDossier)
          )
      );

    const stateMachine = new sfn.StateMachine(this, 'VasuliEscalationWorkflow', {
      stateMachineName: `vasuli-recovery-workflow-${demoMode ? 'demo' : 'prod'}`,
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      timeout: cdk.Duration.days(30),
    });

    stateMachine.grantStartExecution(apiHandler);

    // ----------------------------------------------------
    // 6. API Gateway REST API
    // ----------------------------------------------------
    const api = new apigateway.RestApi(this, 'VasuliRestApi', {
      restApiName: 'Vasuli Recovery Engine API',
      description: 'API Gateway for MSME Delayed Payment Recovery Platform',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['*'],
      },
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
      },
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(apiHandler);

    // /claims
    const claims = api.root.addResource('claims');
    claims.addMethod('GET', lambdaIntegration);
    claims.addMethod('POST', lambdaIntegration);

    // /claims/{claim_id}
    const singleClaim = claims.addResource('{claim_id}');
    singleClaim.addMethod('GET', lambdaIntegration);
    singleClaim.addMethod('PUT', lambdaIntegration);

    // /claims/{claim_id}/audit
    const audit = singleClaim.addResource('audit');
    audit.addMethod('POST', lambdaIntegration);

    // /claims/{claim_id}/classify-excuse
    const classify = singleClaim.addResource('classify-excuse');
    classify.addMethod('POST', lambdaIntegration);

    // /claims/{claim_id}/generate-notice
    const notice = singleClaim.addResource('generate-notice');
    notice.addMethod('POST', lambdaIntegration);

    // /claims/{claim_id}/start-recovery
    const startRecovery = singleClaim.addResource('start-recovery');
    startRecovery.addMethod('POST', lambdaIntegration);

    // /buyer/portal/{token}
    const buyer = api.root.addResource('buyer');
    const buyerPortal = buyer.addResource('portal').addResource('{token}');
    buyerPortal.addMethod('GET', lambdaIntegration);

    // /buyer/portal/{token}/respond
    const buyerRespond = buyerPortal.addResource('respond');
    buyerRespond.addMethod('POST', lambdaIntegration);

    // /claims/{claim_id}/notices/{tier}/pdf
    const notices = singleClaim.addResource('notices');
    const noticeTier = notices.addResource('{tier}');
    const noticePdf = noticeTier.addResource('pdf');
    noticePdf.addMethod('GET', lambdaIntegration);

    // /claims/{claim_id}/dossier/pdf
    const dossier = singleClaim.addResource('dossier');
    const dossierPdf = dossier.addResource('pdf');
    dossierPdf.addMethod('GET', lambdaIntegration);

    // /claims/{claim_id}/settlement-agreement/pdf
    const settlementAgreement = singleClaim.addResource('settlement-agreement');
    const agreementPdf = settlementAgreement.addResource('pdf');
    agreementPdf.addMethod('GET', lambdaIntegration);

    // /claims/{claim_id}/dispatch
    const dispatch = singleClaim.addResource('dispatch');
    dispatch.addMethod('POST', lambdaIntegration);

    // /claims/{claim_id}/resolve
    const resolve = singleClaim.addResource('resolve');
    resolve.addMethod('GET', lambdaIntegration);
    resolve.addMethod('POST', lambdaIntegration);

    // /resolve/{claim_id} (Direct Buyer Resolution Route)
    const resolveDirect = api.root.addResource('resolve').addResource('{claim_id}');
    resolveDirect.addMethod('GET', lambdaIntegration);
    resolveDirect.addMethod('POST', lambdaIntegration);

    // /telemetry/logs
    const telemetry = api.root.addResource('telemetry');
    const telemetryLogs = telemetry.addResource('logs');
    telemetryLogs.addMethod('GET', lambdaIntegration);

    // /api/{proxy+} - Catch-all proxy for Person A frontend routes (/api/audit, /api/claims/...)
    const apiProxy = api.root.addResource('api');
    apiProxy.addProxy({
      defaultIntegration: lambdaIntegration,
      anyMethod: true,
    });

    // Health check at /
    api.root.addMethod('GET', lambdaIntegration);

    this.apiUrl = api.url;

    // ----------------------------------------------------
    // 7. CloudFormation Stack Outputs
    // ----------------------------------------------------
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'Public REST API Gateway URL',
      exportName: 'VasuliApiGatewayUrl',
    });

    new cdk.CfnOutput(this, 'DocumentBucketOutput', {
      value: this.documentBucket.bucketName,
      description: 'S3 Document Vault Bucket Name',
    });

    new cdk.CfnOutput(this, 'ClaimsTableOutput', {
      value: this.claimsTable.tableName,
      description: 'DynamoDB Claims Table Name',
    });

    new cdk.CfnOutput(this, 'StateMachineArnOutput', {
      value: stateMachine.stateMachineArn,
      description: 'Step Functions Escalation Workflow ARN',
    });
  }
}

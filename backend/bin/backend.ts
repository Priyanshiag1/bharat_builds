#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BackendStack } from '../lib/backend-stack';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from backend or root
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID || '755329540684';
const region = process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';

new BackendStack(app, 'VasuliBackendStack', {
  env: {
    account: account,
    region: region,
  },
  description: 'Vasuli MSME Statutory Delayed Payment Recovery Infrastructure (Ship It Track)',
});

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { TextractClient, AnalyzeExpenseCommand } from '@aws-sdk/client-textract';
import { FixtureLoader } from '../fixtures/fixture-loader';

export interface DocumentSource {
  documentId: string;
  s3Bucket?: string;
  s3Key?: string;
  localFixtureId?: string;
}

export interface DocumentExtractionProvider {
  extractDocument(source: DocumentSource): Promise<Record<string, any>>;
}

export class TextractParser {
  /**
   * Flattens AWS Textract AnalyzeExpense response into the flat map expected by Module 1.
   */
  public parseExpenseResponse(textractResponse: any): Record<string, any> {
    const result: Record<string, any> = {};
    
    if (!textractResponse || !textractResponse.ExpenseDocuments) {
      return result;
    }

    for (const doc of textractResponse.ExpenseDocuments) {
      if (doc.SummaryFields) {
        for (const field of doc.SummaryFields) {
          const type = field.Type?.Text;
          const value = field.ValueDetection?.Text;
          if (type && value) {
            result[type] = value;
          }
        }
      }
    }

    return result;
  }
}

export class TextractS3Adapter implements DocumentExtractionProvider {
  private s3: S3Client;
  private textract: TextractClient;
  private parser: TextractParser;

  constructor() {
    this.s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });
    this.textract = new TextractClient({ region: process.env.AWS_REGION || 'ap-south-1' });
    this.parser = new TextractParser();
  }

  public async extractDocument(source: DocumentSource): Promise<Record<string, any>> {
    if (!source.s3Bucket || !source.s3Key) {
      throw new Error('S3 bucket and key are required for TextractS3Adapter');
    }

    try {
      // In a real pipeline, we might fetch the document from S3 then call Textract.
      // Or we can tell Textract to read directly from S3.
      const command = new AnalyzeExpenseCommand({
        Document: {
          S3Object: {
            Bucket: source.s3Bucket,
            Name: source.s3Key
          }
        }
      });
      
      const response = await this.textract.send(command);
      return this.parser.parseExpenseResponse(response);
    } catch (error) {
      throw new Error(`Textract extraction failed: ${(error as Error).message}`);
    }
  }
}

export class LocalFixtureProvider implements DocumentExtractionProvider {
  private loader: FixtureLoader;

  constructor() {
    this.loader = new FixtureLoader();
  }

  public async extractDocument(source: DocumentSource): Promise<Record<string, any>> {
    if (!source.localFixtureId) {
      throw new Error('localFixtureId is required for LocalFixtureProvider');
    }
    
    const fixture = this.loader.loadFixture(source.localFixtureId);
    
    // In our fixture, rawExtractionPayloads is a map of docId -> payload
    // We just return the first one or a specific one
    const payloadIds = Object.keys(fixture.rawExtractionPayloads);
    if (payloadIds.length === 0) {
      throw new Error('No raw extraction payloads found in fixture');
    }
    
    return fixture.rawExtractionPayloads[payloadIds[0]];
  }
}

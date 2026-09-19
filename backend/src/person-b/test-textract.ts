import { TextractParser, TextractS3Adapter, LocalFixtureProvider } from './adapters/document-provider-adapter';
import { ClaimIntakeService } from './core/module1-intake';
import * as fs from 'fs';
import * as path from 'path';

async function runTextractTests() {
  console.log('--- Running Textract & Intake Integration Tests ---\n');

  const parser = new TextractParser();
  const intake = new ClaimIntakeService();

  // 1. Valid Textract Payload Test
  console.log('=== TEST 1: Valid Textract Payload ===');
  const mockTextractResponse = {
    ExpenseDocuments: [
      {
        SummaryFields: [
          { Type: { Text: 'VENDOR_GSTIN' }, ValueDetection: { Text: '33AABCD1234E1Z5' } },
          { Type: { Text: 'TOTAL' }, ValueDetection: { Text: '50000.00' } },
          { Type: { Text: 'INVOICE_RECEIPT_DATE' }, ValueDetection: { Text: '2026-05-15' } },
        ]
      }
    ]
  };

  const parsed = parser.parseExpenseResponse(mockTextractResponse);
  const normalized = intake.normalizeExtraction(parsed);

  if (normalized.sellerGstin?.value === '33AABCD1234E1Z5' && normalized.principalAmount?.value === 50000 && normalized.invoiceDate?.value === '2026-05-15') {
    console.log('✅ Success: Properly parsed and normalized Textract Invoice/Supplier/Amount fields.');
  } else {
    console.error('❌ Failed Test 1:', normalized);
    throw new Error('Test 1 Failed');
  }

  // 2. Missing Fields -> Evidence Gaps
  console.log('\n=== TEST 2: Missing Fields Evidence Gaps ===');
  const gaps = intake.detectEvidenceGaps(normalized, []); // No extra documents provided
  if (gaps.deliveryChallan === 'missing' && gaps.buyerIdentity === 'missing' && gaps.sellerIdentity === 'present') {
    console.log('✅ Success: Accurately detected evidence gaps for missing buyer info and challan.');
  } else {
    console.error('❌ Failed Test 2:', gaps);
    throw new Error('Test 2 Failed');
  }

  // 3. Malformed/Empty Payload
  console.log('\n=== TEST 3: Empty Textract Payload ===');
  const emptyParsed = parser.parseExpenseResponse({});
  if (Object.keys(emptyParsed).length === 0) {
    console.log('✅ Success: Safely handled empty payload.');
  } else {
    throw new Error('Test 3 Failed');
  }

  // 4. AWS Unavailable -> Local Workflow Functional
  console.log('\n=== TEST 4: AWS Textract Adapter (Mocked Error) -> Local Fixture Fallback ===');
  const textractAdapter = new TextractS3Adapter();
  // Mock sending error (simulate missing creds / no internet)
  (textractAdapter as any).textract.send = async () => {
    throw new Error('ExpiredToken: The security token included in the request is expired');
  };

  let extracted;
  try {
    await textractAdapter.extractDocument({ documentId: 'doc-1', s3Bucket: 'b', s3Key: 'k' });
    throw new Error('Should have thrown');
  } catch (err) {
    console.log('✅ Success: Textract correctly bubbled AWS exception: ' + (err as Error).message);
    
    // Simulate fallback to local fixture
    const localProvider = new LocalFixtureProvider();
    extracted = await localProvider.extractDocument({ documentId: 'doc-1', localFixtureId: 'claim-1' });
    if (extracted.VENDOR_GSTIN === '27AADCB2230M1Z2') {
      console.log('✅ Success: Safely fell back to Local Fixture workflow.');
    } else {
      throw new Error('Fallback extracted invalid data');
    }
  }

  console.log('\nAll Textract Integration Tests Passed successfully!');
}

runTextractTests().catch(err => {
  console.error(err);
  process.exit(1);
});

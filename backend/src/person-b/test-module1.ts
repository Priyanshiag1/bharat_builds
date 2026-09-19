import { ClaimIntakeService } from './core/module1-intake';
import { PersonCApiAdapter } from './adapters/person-c-adapter';
import { FixtureLoader } from './fixtures/fixture-loader';

async function runTest() {
  const loader = new FixtureLoader();
  const fixture = loader.loadFixture('claim-1');
  
  const intake = new ClaimIntakeService();
  
  // 1. Normalize Extraction
  console.log('--- 1. Extraction Normalization ---');
  const rawInvoice = fixture.rawExtractionPayloads['doc-inv-1'];
  const normalized = intake.normalizeExtraction(rawInvoice);
  console.log(JSON.stringify(normalized, null, 2));

  // 2. Evidence Gap Detection
  console.log('\n--- 2. Evidence Gaps ---');
  const gaps = intake.detectEvidenceGaps(normalized, fixture.documents);
  console.log(JSON.stringify(gaps, null, 2));

  // 3. Interest Calculation (Adapter Pattern)
  console.log('\n--- 3. Interest Calculation (Adapter Pattern) ---');
  console.log('NOTE: If Person C API is not running locally, this test validates the offline fallback mechanism.');
  const adapter = new PersonCApiAdapter();
  const interest = await adapter.calculateInterest(fixture.claimId, normalized);
  console.log(JSON.stringify(interest, null, 2));
}

runTest().catch(console.error);

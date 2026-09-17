import { FixtureLoader } from './fixtures/fixture-loader';
import { ClaimIntakeService } from './core/module1-intake';
import { ClaimScoringService } from './core/module2-scoring';
import { LocalBuyerClassifier } from './adapters/buyer-classifier-adapter';
import { PersonCApiAdapter } from './adapters/person-c-adapter';

async function runCLI() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('ERROR: Missing fixture path.\nUsage: npx tsx src/person-b/cli.ts <path-to-fixture.json>');
    process.exit(1);
  }

  const fixturePath = args[0];

  try {
    const loader = new FixtureLoader();
    let fixture;
    try {
      fixture = loader.loadFixtureByPath(fixturePath);
    } catch (e) {
      console.error(`ERROR loading fixture: ${(e as Error).message}`);
      process.exit(1);
    }
    
    if (!fixture.claimId) {
      console.error('ERROR: Fixture missing required claimId field.');
      process.exit(1);
    }

    const intake = new ClaimIntakeService();
    const scoring = new ClaimScoringService();
    const classifier = new LocalBuyerClassifier();
    const interestAdapter = new PersonCApiAdapter();

    console.log(`\nProcessing Claim ID: ${fixture.claimId}`);
    console.log('------------------------------------------------');

    // Module 1
    const rawInvoiceId = Object.keys(fixture.rawExtractionPayloads)[0];
    const rawInvoice = fixture.rawExtractionPayloads[rawInvoiceId];
    if (!rawInvoice) {
      console.error('ERROR: Missing raw extraction payload for invoice.');
      process.exit(1);
    }

    const normalized = intake.normalizeExtraction(rawInvoice);
    const gaps = intake.detectEvidenceGaps(normalized, fixture.documents);
    
    // Interest
    const interest = await interestAdapter.calculateInterest(fixture.claimId, normalized);

    // Module 2
    const rawChatId = Object.keys(fixture.rawCommunicationPayloads)[0];
    const rawChat = rawChatId ? fixture.rawCommunicationPayloads[rawChatId] : '';
    const classification = rawChat ? await classifier.classifyReply(rawChat) : null;

    const assessment = scoring.calculateScore(fixture.claimId, normalized, gaps, classification, interest);

    console.log('\n--- SUMMARY ---');
    console.log(`Claim ID:          ${fixture.claimId}`);
    console.log(`Calculation Mode:  ${interest.calculationMode === 'api' ? '✅ Person C API' : '⚠️ Offline Fallback'}`);
    console.log(`RBI Rate / Mult:   ${interest.bankRate}% / ${interest.statutoryMultiplier}x`);
    console.log(`Strength Score:    ${assessment.strengthScore?.score}/100`);
    console.log(`Buyer Class:       ${assessment.buyerReplyClassification?.category || 'None'}`);
    console.log(`Interest Provider: ${interest.explanation}`);
    console.log(`Missing Data:      ${assessment.strengthScore?.missingDataHandling || 'None'}`);
    console.log(`Recommended Act:   ${assessment.strengthScore?.recommendedAction}`);
    
    console.log('\n--- COMPLETE JSON RESULT ---');
    console.log(JSON.stringify(assessment, null, 2));

  } catch (err) {
    console.error('UNEXPECTED ERROR:', (err as Error).message);
    process.exit(1);
  }
}

runCLI();

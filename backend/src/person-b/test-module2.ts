import { ClaimIntakeService } from './core/module1-intake';
import { ClaimScoringService } from './core/module2-scoring';
import { LocalBuyerClassifier } from './adapters/buyer-classifier-adapter';
import { PersonCApiAdapter } from './adapters/person-c-adapter';
import { FixtureLoader } from './fixtures/fixture-loader';

async function runModule2Tests() {
  const loader = new FixtureLoader();
  const intake = new ClaimIntakeService();
  const scoring = new ClaimScoringService();
  const interestAdapter = new PersonCApiAdapter();
  const classifier = new LocalBuyerClassifier();

  // Test Categories
  const categories = [
    { name: 'Liquidity Crisis', text: 'We are facing a severe liquidity crunch. Need funds.' },
    { name: 'Deflection', text: 'Let me check with the processing team next week.' },
    { name: 'Phantom Dispute', text: 'We never received these items. This invoice is fake.' },
    { name: 'Valid Dispute', text: 'The parts had a defect. Quality rejected.' },
    { name: 'Unknown/Ambiguous', text: 'Hello, I got your email. Thanks.' }
  ];

  console.log('=== TEST 1: Classification Categories ===');
  for (const cat of categories) {
    const result = await classifier.classifyReply(cat.text);
    console.log(`[${cat.name}] -> Category: ${result.category} (Confidence: ${result.confidence})`);
    if (cat.name === 'Unknown/Ambiguous' && result.category !== 'unknown') throw new Error('Failed to classify unknown');
  }

  console.log('\n=== TEST 2: Complete End-To-End Assessment (Claim 1) ===');
  const fixture = loader.loadFixture('claim-1');
  
  // Mod 1
  const rawInvoice = fixture.rawExtractionPayloads['doc-inv-1'];
  const normalized = intake.normalizeExtraction(rawInvoice);
  const gaps = intake.detectEvidenceGaps(normalized, fixture.documents);
  const interest = await interestAdapter.calculateInterest(fixture.claimId, normalized);
  
  // Mod 2
  const rawChat = fixture.rawCommunicationPayloads['doc-chat-1'];
  const classification = await classifier.classifyReply(rawChat);

  const finalAssessment = scoring.calculateScore(fixture.claimId, normalized, gaps, classification, interest);
  
  console.log(JSON.stringify(finalAssessment.strengthScore, null, 2));

  if (finalAssessment.strengthScore!.score < 0 || finalAssessment.strengthScore!.score > 100) {
    throw new Error('Score out of bounds');
  }
  
  console.log('\n✅ All Module 2 Tests Passed deterministically without AWS credentials!');
}

runModule2Tests().catch(console.error);

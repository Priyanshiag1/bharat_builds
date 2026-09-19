import { BedrockBuyerClassifier } from './adapters/bedrock-classifier';
import { LocalBuyerClassifier } from './adapters/buyer-classifier-adapter';

async function runBedrockTests() {
  console.log('--- Running Bedrock Classifier Unit Tests ---\n');

  // Test 1: Fallback due to missing AWS credentials
  console.log('=== TEST 1: Missing AWS Credentials (Fallback) ===');
  const classifier = new BedrockBuyerClassifier(new LocalBuyerClassifier());
  // Assuming no AWS credentials or invalid dummy region will cause fallback
  process.env.AWS_REGION = 'us-east-1';
  process.env.AWS_ACCESS_KEY_ID = 'dummy';
  process.env.AWS_SECRET_ACCESS_KEY = 'dummy';

  const res1 = await classifier.classifyReply("We are having liquidity issues.");
  if (res1.classificationMode === 'offline_fallback' && res1.category === 'liquidity_crisis') {
    console.log('✅ Success: Fallback handled missing credentials cleanly.');
  } else {
    console.error('❌ Failed Test 1:', res1);
    throw new Error('Test 1 Failed');
  }

  // Clear dummy env
  delete process.env.AWS_ACCESS_KEY_ID;
  delete process.env.AWS_SECRET_ACCESS_KEY;

  // Test 2: Local Fallback Determinism
  console.log('\n=== TEST 2: Determinism in Fallback Mode ===');
  const replies = [
    { text: "We found a defect in the materials.", expected: 'valid_dispute' },
    { text: "Please wait, check with finance next week.", expected: 'deflection' },
    { text: "We never received this invoice.", expected: 'phantom_dispute' }
  ];

  for (const { text, expected } of replies) {
    const res = await classifier.classifyReply(text);
    if (res.classificationMode === 'offline_fallback' && res.category === expected) {
      console.log(`✅ Success: '${text}' -> ${expected}`);
    } else {
      console.error(`❌ Failed Test 2 on '${text}':`, res);
      throw new Error('Test 2 Failed');
    }
  }

  // Test 3: Response parsing (Mocking Bedrock client)
  console.log('\n=== TEST 3: Bedrock JSON Response Parsing (Mocked) ===');
  const mockClassifier = new BedrockBuyerClassifier();
  
  // Create a mock payload matching a successful bedrock API response
  const mockBedrockResponse = {
    category: 'valid_dispute',
    confidence: 0.99,
    reason: 'Stub reason'
  };

  // Stub the client send method
  (mockClassifier as any).client.send = async () => {
    return {
      body: new TextEncoder().encode(JSON.stringify({
        content: [{ text: JSON.stringify(mockBedrockResponse) }]
      }))
    };
  };

  const res3 = await mockClassifier.classifyReply("Valid dispute stub");
  if (res3.classificationMode === 'bedrock' && res3.category === 'valid_dispute' && res3.confidence === 0.99) {
    console.log('✅ Success: Properly parsed Bedrock response.');
  } else {
    console.error('❌ Failed Test 3:', res3);
    throw new Error('Test 3 Failed');
  }

  // Test 4: Malformed Bedrock Response (Fallback expected)
  console.log('\n=== TEST 4: Malformed Bedrock Response (Fallback expected) ===');
  (mockClassifier as any).client.send = async () => {
    return {
      body: new TextEncoder().encode(JSON.stringify({
        content: [{ text: '{"category": "NOT_REAL_CATEGORY", "confidence": "high"}' }]
      }))
    };
  };

  const res4 = await mockClassifier.classifyReply("We are having liquidity issues.");
  if (res4.classificationMode === 'offline_fallback') {
    console.log('✅ Success: Invalid response safely triggered deterministic fallback.');
  } else {
    console.error('❌ Failed Test 4:', res4);
    throw new Error('Test 4 Failed');
  }

  console.log('\nAll Bedrock Integration Tests Passed successfully!');
}

runBedrockTests().catch(err => {
  console.error(err);
  process.exit(1);
});

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { BuyerClassifierEngine, LocalBuyerClassifier } from './buyer-classifier-adapter';
import { BuyerReplyClassification, BuyerReplyCategory } from '../domain/models';

export class BedrockBuyerClassifier implements BuyerClassifierEngine {
  private client: BedrockRuntimeClient;
  private fallback: BuyerClassifierEngine;
  private modelId: string;

  constructor(fallback?: BuyerClassifierEngine) {
    this.fallback = fallback || new LocalBuyerClassifier();
    this.modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0';
    
    // Client configuration picks up AWS_REGION and credentials automatically from environment if present.
    // We intentionally don't hardcode credentials.
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }

  public async classifyReply(replyText: string): Promise<BuyerReplyClassification> {
    const prompt = `
You are an expert commercial dispute resolution AI for the Vasuli MSME debt recovery platform.
Classify the following buyer reply into exactly one of these categories:
- liquidity_crisis: Buyer indicates temporary inability to pay due to cash-flow constraints.
- deflection: Buyer employs stalling tactics without a substantive dispute.
- phantom_dispute: Buyer denies existence of the transaction despite evidence.
- valid_dispute: Buyer raises a material dispute regarding goods/services.
- unknown: Insufficient evidence to categorize the response.

Return ONLY a strict JSON object with this exact schema:
{
  "category": "<one of the categories>",
  "confidence": <number between 0.0 and 1.0>,
  "reason": "<short explanation>"
}

Buyer Reply:
"""
${replyText}
"""
`;

    try {
      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 300,
          temperature: 0.0,
          messages: [{ role: "user", content: prompt }]
        })
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const content = responseBody.content[0].text;
      
      const parsed = JSON.parse(content);
      
      // Validate schema
      const validCategories: BuyerReplyCategory[] = ['liquidity_crisis', 'deflection', 'phantom_dispute', 'valid_dispute', 'unknown'];
      if (!validCategories.includes(parsed.category) || typeof parsed.confidence !== 'number' || typeof parsed.reason !== 'string') {
        throw new Error('Malformed Bedrock response schema');
      }

      let recommendedAction = 'Proceed with Tier 1 negotiation';
      if (parsed.category === 'valid_dispute') recommendedAction = 'Pause escalation; resolve defect dispute';
      if (parsed.category === 'phantom_dispute') recommendedAction = 'Proceed immediately to Tier 2 escalation';

      return {
        category: parsed.category as BuyerReplyCategory,
        confidence: parsed.confidence,
        explanation: parsed.reason,
        detectedSignals: ['bedrock_analysis'],
        recommendedAction,
        classificationMode: 'bedrock'
      };

    } catch (error) {
      console.warn(`⚠️ Bedrock classification failed (${(error as Error).message}). Falling back to Local Classifier.`);
      return this.fallback.classifyReply(replyText);
    }
  }
}

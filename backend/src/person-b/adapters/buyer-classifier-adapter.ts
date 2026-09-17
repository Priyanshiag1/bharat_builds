import { BuyerReplyClassification, BuyerReplyCategory } from '../domain/models';

export interface BuyerClassifierEngine {
  classifyReply(replyText: string): Promise<BuyerReplyClassification>;
}

/**
 * Local deterministic classifier.
 * Operates entirely offline without needing Person C's API or AWS Bedrock.
 */
export class LocalBuyerClassifier implements BuyerClassifierEngine {
  
  public async classifyReply(replyText: string): Promise<BuyerReplyClassification> {
    const text = replyText.toLowerCase();
    
    if (text.includes('liquidity') || text.includes('funds') || text.includes('cash flow')) {
      return this.buildClassification('liquidity_crisis', 0.85, 'Buyer admits to financial difficulty but does not dispute the claim', ['liquidity', 'funds']);
    }
    
    if (text.includes('defect') || text.includes('quality') || text.includes('damaged')) {
      return this.buildClassification('valid_dispute', 0.90, 'Buyer raises a material dispute regarding goods/services', ['defect', 'quality']);
    }

    if (text.includes('never received') || text.includes('no record') || text.includes('fake')) {
      return this.buildClassification('phantom_dispute', 0.95, 'Buyer denies existence of the transaction despite evidence', ['never received', 'fake']);
    }

    if (text.includes('check with') || text.includes('processing') || text.includes('next week')) {
      return this.buildClassification('deflection', 0.75, 'Buyer is employing stalling tactics without a substantive dispute', ['check with', 'processing']);
    }

    return this.buildClassification('unknown', 0.50, 'Insufficient evidence to categorize the response', []);
  }

  private buildClassification(
    category: BuyerReplyCategory, 
    confidence: number, 
    explanation: string, 
    detectedSignals: string[]
  ): BuyerReplyClassification {
    let recommendedAction = 'Proceed with Tier 1 negotiation';
    if (category === 'valid_dispute') recommendedAction = 'Pause escalation; resolve defect dispute';
    if (category === 'phantom_dispute') recommendedAction = 'Proceed immediately to Tier 2 escalation';

    return { category, confidence, explanation, detectedSignals, recommendedAction };
  }
}

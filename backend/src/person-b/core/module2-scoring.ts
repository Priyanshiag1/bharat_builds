import { ClaimAssessment, ClaimStrengthScore, NormalizedClaimData, EvidenceGaps, BuyerReplyClassification, InterestCalculation, ProcessingStatus } from '../domain/models';

export class ClaimScoringService {

  public calculateScore(
    claimId: string,
    data: NormalizedClaimData,
    gaps: EvidenceGaps,
    classification: BuyerReplyClassification | null,
    interest: InterestCalculation | null
  ): ClaimAssessment {
    
    let score = 0;
    const evidenceSupportingScore: string[] = [];
    const missingDataHandling: string[] = [];

    // 1. Invoice Completeness & Evidence Gaps (Max 40 points)
    let paperworkCompleteness = 0;
    if (gaps.invoiceNumber === 'present' && gaps.invoiceDate === 'present') paperworkCompleteness += 15;
    else missingDataHandling.push('Missing core invoice data');
    
    if (gaps.purchaseOrder === 'present') paperworkCompleteness += 10;
    if (gaps.deliveryChallan === 'present') paperworkCompleteness += 15;
    else missingDataHandling.push('Missing delivery challan weakens position');

    score += paperworkCompleteness;
    evidenceSupportingScore.push(`Paperwork score: ${paperworkCompleteness}/40`);

    // 2. Payment Delay / Time Decay (Max 35 points)
    let timeDecay = 0;
    const daysOverdue = interest?.daysOverdue || 0;
    
    if (daysOverdue > 0) {
      // Score decreases as claim gets too old (harder to recover), but initial overdue is strong.
      // Example logic: optimal recovery is 0-180 days.
      if (daysOverdue < 180) timeDecay = 35;
      else if (daysOverdue < 365) timeDecay = 20;
      else timeDecay = 5;
    } else {
      missingDataHandling.push('Claim is not yet overdue');
    }
    
    score += timeDecay;
    evidenceSupportingScore.push(`Time decay score: ${timeDecay}/35 (Days overdue: ${daysOverdue})`);

    // 3. Buyer Response / Communication Signal (Max 25 points)
    let communicationSignal = 15; // default if no reply
    
    if (classification) {
      if (classification.category === 'liquidity_crisis') {
        communicationSignal = 25; // Acknowledged debt
        evidenceSupportingScore.push('Buyer acknowledges debt (liquidity crisis)');
      } else if (classification.category === 'phantom_dispute') {
        communicationSignal = 20; // Easily disprovable
        evidenceSupportingScore.push('Buyer raised phantom dispute');
      } else if (classification.category === 'deflection') {
        communicationSignal = 15; // Standard stalling
        evidenceSupportingScore.push('Buyer is stalling/deflecting');
      } else if (classification.category === 'valid_dispute') {
        communicationSignal = 0; // High risk of failure
        evidenceSupportingScore.push('High risk: Valid defect dispute raised');
      }
    } else {
      missingDataHandling.push('No buyer communication provided');
    }

    score += communicationSignal;
    evidenceSupportingScore.push(`Communication signal score: ${communicationSignal}/25`);

    // Assessment Orchestration
    const strengthScore: ClaimStrengthScore = {
      score,
      componentScores: { paperworkCompleteness, timeDecay, communicationSignal },
      inputFeatures: { daysOverdue, category: classification?.category || 'none' },
      weights: { paperwork: 40, time: 35, communication: 25 },
      explanation: `Total strength score is ${score}/100.`,
      evidenceSupportingScore,
      missingDataHandling: missingDataHandling.join('; '),
      recommendedAction: score > 70 ? 'Proceed with Tier 1' : 'Gather more evidence before escalation'
    };

    return {
      claimId,
      documentsProcessed: 0, // Injected later by orchestrator
      status: 'processed' as ProcessingStatus,
      normalizedData: data,
      evidenceGaps: gaps,
      interestCalculation: interest,
      buyerReplyClassification: classification,
      strengthScore
    };
  }
}

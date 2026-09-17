export type DocumentType = 'invoice' | 'purchase_order' | 'delivery_challan' | 'buyer_communication';
export type ProcessingStatus = 'pending' | 'processed' | 'failed';
export type EvidenceGapStatus = 'present' | 'missing' | 'invalid' | 'not_checked' | 'inconsistent';
export type BuyerReplyCategory = 'deflection' | 'phantom_dispute' | 'liquidity_crisis' | 'valid_dispute' | 'unknown';

export interface Document {
  id: string;
  type: DocumentType;
  sourceUri: string; // Could be a local path or an S3 URI
  uploadedAt: string;
}

export interface ExtractedField<T> {
  value: T;
  confidence?: number;
  sourceDocumentId?: string;
}

// Canonical claim JSON
export interface NormalizedClaimData {
  sellerGstin?: ExtractedField<string>;
  buyerGstin?: ExtractedField<string>;
  invoiceNumber?: ExtractedField<string>;
  invoiceDate?: ExtractedField<string>; // ISO-8601 YYYY-MM-DD
  dueDate?: ExtractedField<string>;
  principalAmount?: ExtractedField<number>;
  currency?: ExtractedField<string>;
  purchaseOrderReference?: ExtractedField<string>;
  deliveryChallanReference?: ExtractedField<string>;
  sellerName?: ExtractedField<string>;
  buyerName?: ExtractedField<string>;
}

export interface EvidenceGaps {
  invoiceNumber: EvidenceGapStatus;
  invoiceDate: EvidenceGapStatus;
  buyerIdentity: EvidenceGapStatus;
  sellerIdentity: EvidenceGapStatus;
  gstinFormat: EvidenceGapStatus;
  dueDate: EvidenceGapStatus;
  purchaseOrder: EvidenceGapStatus;
  deliveryChallan: EvidenceGapStatus;
  amountsConsistent: EvidenceGapStatus;
  datesConsistent: EvidenceGapStatus;
}

export interface InterestCalculation {
  daysOverdue: number;
  bankRate: number;
  applicableInterestRate: number;
  interestAccrued: number;
  totalClaimAmount: number;
  explanation: string;
  calculationMode?: 'api' | 'offline_fallback';
  statutoryMultiplier?: number;
}

export interface BuyerReplyClassification {
  category: BuyerReplyCategory;
  confidence: number;
  explanation: string;
  detectedSignals: string[];
  recommendedAction: string;
}

export interface ClaimStrengthScore {
  score: number;
  componentScores: {
    paperworkCompleteness: number;
    timeDecay: number;
    communicationSignal: number;
  };
  inputFeatures: Record<string, any>;
  weights: Record<string, number>;
  explanation: string;
  evidenceSupportingScore: string[];
  missingDataHandling: string;
  recommendedAction: string;
}

// Complete Assessment returned by the Service
export interface ClaimAssessment {
  claimId: string;
  documentsProcessed: number;
  status: ProcessingStatus;
  normalizedData: NormalizedClaimData;
  evidenceGaps: EvidenceGaps;
  interestCalculation: InterestCalculation | null;
  buyerReplyClassification: BuyerReplyClassification | null;
  strengthScore: ClaimStrengthScore | null;
  processingErrors?: string[];
}

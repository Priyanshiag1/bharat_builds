export interface ClaimData {
  claim_id: string;
  invoice_number: string;
  invoice_date: string;
  delivery_date: string;
  principal_amount: number;
  agreed_credit_days: number;
  seller_gstin: string;
  buyer_gstin: string;
  buyer_name: string;
  has_signed_pod: boolean;
  days_overdue: number;
  statutory_due_date: string;
  is_section_15_violated: boolean;
  accrued_interest: number;
  total_claimable_amount: number;
  claim_strength_score: number;
  stalling_category: "Administrative Deflection" | "Phantom Dispute" | "Admission of Debt" | string;
  stalling_message_snippet?: string;
  counter_reasoning?: string;
  tier_1_letter: string;
  tier_2_notice: string;
  tier_3_petition?: string;
  status: "AUDITED" | "NOTICE_SENT" | "SETTLED";
  settlement_type?: "LUMP_SUM_DISCOUNT" | "EMI_PLAN";
  settled_at?: string;
  classification_mode?: "bedrock" | "offline_fallback";
  tax_disallowance_penalty?: number;
  sec43b_tax_disallowance?: number;
  total_exposure?: number;
  buyer_phone?: string;
  buyer_email?: string;
  dispatched_at?: string;
  tax_disallowance_rate?: number;
  is_section_43b_violated?: boolean;
  tax_disallowance_impact_summary?: string;
  dispatch_channels?: {
    email?: { recipient: string; message_id: string; status: string };
    whatsapp?: { recipient: string; deep_link: string; status: string };
    step_functions?: { execution_arn: string; status: string };
  };
  component_scores?: {
    paperworkCompleteness: number;
    timeDecay: number;
    communicationSignal: number;
  };
}

export interface IntakeFormData {
  invoiceFile: File | null;
  challanFile: File | null;
  noPodCheckbox: boolean;
  udyamNumber: string;
  buyerName: string;
  buyerGstin: string;
  chatText: string;
}


// Person B ClaimAssessment types
export type BuyerReplyCategory = "deflection" | "phantom_dispute" | "liquidity_crisis" | "valid_dispute" | "unknown";
export type EvidenceGapStatus = "present" | "missing" | "invalid" | "not_checked" | "inconsistent";

export interface ExtractedField<T> {
  value: T;
  confidence?: number;
  sourceDocumentId?: string;
}

export interface NormalizedClaimData {
  sellerGstin?: ExtractedField<string>;
  buyerGstin?: ExtractedField<string>;
  invoiceNumber?: ExtractedField<string>;
  invoiceDate?: ExtractedField<string>;
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
  calculationMode?: "api" | "offline_fallback";
  statutoryMultiplier?: number;
}

export interface BuyerReplyClassification {
  category: BuyerReplyCategory;
  confidence: number;
  explanation: string;
  detectedSignals: string[];
  recommendedAction: string;
  classificationMode?: "bedrock" | "offline_fallback";
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

export interface ClaimAssessment {
  claimId: string;
  documentsProcessed: number;
  status: "pending" | "processed" | "failed";
  normalizedData: NormalizedClaimData;
  evidenceGaps: EvidenceGaps;
  interestCalculation: InterestCalculation | null;
  buyerReplyClassification: BuyerReplyClassification | null;
  strengthScore: ClaimStrengthScore | null;
  processingErrors?: string[];
}

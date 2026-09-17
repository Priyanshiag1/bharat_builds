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
  status: "AUDITED" | "NOTICE_SENT" | "SETTLED";
  settlement_type?: "LUMP_SUM_DISCOUNT" | "EMI_PLAN";
  settled_at?: string;
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

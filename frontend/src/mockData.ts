import { ClaimData } from "./types/claim";

export const mockClaim: ClaimData = {
  claim_id: "CLM-9082",
  invoice_number: "INV-2024-089",
  invoice_date: "2024-05-10",
  delivery_date: "2024-05-14",
  principal_amount: 250000,
  agreed_credit_days: 30,
  seller_gstin: "27AAACW1234F1Z5",
  buyer_gstin: "07AAAAA0000A1Z5",
  buyer_name: "Apex Infrastructure Ltd",
  buyer_phone: "+91 98765 43210",
  buyer_email: "accounts@apexinfra.com",
  has_signed_pod: true,
  days_overdue: 72,
  statutory_due_date: "2024-06-13",
  is_section_15_violated: true,
  accrued_interest: 8450.75,
  total_claimable_amount: 258450.75,
  sec43b_tax_disallowance: 75000, // 30% Corporate Tax Disallowance under Section 43B(h)
  total_exposure: 333450.75,      // Principal (2.5L) + Sec 16 Interest (8.45K) + Sec 43B(h) Penalty (75K)
  claim_strength_score: 88,
  stalling_category: "Administrative Deflection",
  counter_reasoning: "Buyer claims internal audit delay. Under Section 15 of MSMED Act 2006, payment credit terms are legally capped at 45 days regardless of buyer internal audits. Goods were accepted on 2024-05-14 with signed POD and zero objection raised within the statutory 15-day defect notification window (Section 15 deemed-acceptance).",
  stalling_message_snippet: "Sir our quarterly statutory audit is ongoing, director is traveling. Payment will be released once accounts department completes verification.",
  status: "AUDITED",
  tier_1_letter: `Subject: Amicable Settlement Proposal - Invoice INV-2024-089 | Apex Infrastructure Ltd

Dear Accounts & Finance Leadership,

Reference: Supply of Industrial Assemblies under Invoice No. INV-2024-089 dated 10-May-2024 (Principal: INR 2,50,000.00).

We value our commercial partnership with Apex Infrastructure Ltd and appreciate the collaborative relationship built over the past years. We understand that periodic accounting audits and cash-flow adjustments can introduce administrative friction.

However, as per our records, payment for the referenced invoice is currently 72 days past the statutory 45-day deadline mandated under Section 15 of the Micro, Small and Medium Enterprises Development (MSMED) Act, 2006. As of today, the compounding penal interest accrued under Section 16 (calculated at 3x the prevailing RBI Bank Rate of 5.50% = 16.50% p.a., compounded monthly) stands at INR 8,450.75, bringing the total statutory claim to INR 2,58,450.75.

In addition, under Section 43B(h) of the Income Tax Act, 1961 (Finance Act 2023), failure to liquidate this outstanding MSME sum within 45 days attracts mandatory disallowance of deduction, creating a direct 30% corporate tax penalty of INR 75,000.00 on your enterprise.

In the spirit of preserving our mutual business goodwill and reaching an amicable resolution without formal statutory escalation to the Micro and Small Enterprises Facilitation Council (MSEFC), we are pleased to extend two simplified settlement pathways:

  - OPTION A (Immediate Settlement with Full Penalty Waiver):
    Remit INR 2,37,500.00 (reflecting a 5% prompt settlement incentive on principal) within 48 hours. Upon receipt, we will waive 100% of accrued statutory interest (INR 8,450.75) and issue a full discharge certificate.

  - OPTION B (Structured 3-Month EMI Plan):
    Settle via 3 monthly installments of INR 86,150.00 each, commencing immediately.

You may review the verified claim audit and execute your preferred option directly through our secure resolution link:
http://localhost:3000/resolve/CLM-9082

We look forward to confirming your resolution within 48 hours.

Warm regards,

Credit Control & Finance Operations
Authorized Vendor Representative
Registered MSME: UDYAM-MH-01-0012345`,

  tier_2_notice: `FORMAL STATUTORY DEMAND NOTICE
UNDER SECTIONS 15 & 16 OF MSMED ACT, 2006 & SECTION 43B(h) OF THE INCOME TAX ACT, 1961

REGISTERED STATUTORY DEMAND & LEGAL NOTICE
Date: Current Date
Claim Reference: CLM-9082 / INV-2024-089

TO:
The Board of Directors & Chief Financial Officer
Apex Infrastructure Ltd
GSTIN: 07AAAAA0000A1Z5

FROM:
Authorized Legal Counsel
On behalf of: Registered MSME Supplier (Udyam: UDYAM-MH-01-0012345)
GSTIN: 27AAACW1234F1Z5

SUBJECT: FORMAL DEMAND FOR IMMEDIATE DISCHARGE OF OVERDUE PRINCIPAL (INR 2,50,000.00), STATUTORY 3X PENAL COMPOUND INTEREST (INR 8,450.75), AND NOTICE OF MANDATORY SECTION 43B(h) CORPORATE TAX DISALLOWANCE PENALTY (INR 75,000.00).

SIR/MADAM,

Under instructions from and on behalf of our client, we hereby serve this Formal Statutory Notice:

1. SUPPLY AND ACCEPTANCE OF GOODS:
Our client duly delivered industrial assemblies against Tax Invoice No. INV-2024-089 dated 10-May-2024 for a principal amount of INR 2,50,000.00. Physical delivery of the consignment was received and formally acknowledged by your authorized representative on 14-May-2024 via signed Delivery Challan.

2. STATUTORY DEFAULT UNDER SECTION 15 (MSMED ACT 2006):
No dispute was raised within 15 days of receipt. Under Section 15, credit terms are statutorily capped at 45 days. The payment is actively 72 days overdue past the statutory milestone.

3. SECTION 16 STATUTORY PENAL INTEREST (16.50% p.a.):
Section 16 mandates payment of compound interest with monthly rests at 3x the RBI Bank Rate (16.50% p.a.).
  - Principal Overdue: INR 2,50,000.00
  - Accrued 3x Penal Interest: INR 8,450.75
  - Total Statutory Sum: INR 2,58,450.75

4. CRITICAL: SECTION 43B(h) INCOME TAX DISALLOWANCE PENALTY:
TAKE NOTE that under Section 43B(h) of the Income Tax Act, 1961, introduced via Finance Act 2023, amounts due to registered MSMEs beyond 45 days stand MANDATORILY DISALLOWED as deductible business expenditure for your financial year. This triggers a direct, non-appealable corporate income tax penalty of 30% (INR 75,000.00) on your enterprise, bringing your total financial exposure to INR 3,33,450.75.

5. 15-DAY CURE PERIOD & MSEFC ARBITRATION:
You are hereby called upon to liquidate the outstanding debt within FIFTEEN (15) DAYS, or execute an authorized digital settlement deed at http://localhost:3000/resolve/CLM-9082. Failure to comply will result in an immediate Section 18 reference before the Micro and Small Enterprises Facilitation Council (MSEFC). Under Section 19 of the Act, no court or appellate tribunal shall entertain any appeal without mandatory prior deposit of 75% of the decreed award.

Yours faithfully,

Statutory Legal Counsel
Vasuli Automated MSME Legal Recovery Suite`
};

export const sampleCases = [
  {
    id: "case-1",
    label: "Case 1: Happy Path (INR 2.5L)",
    source: "Bharat Builds Standard",
    invNumber: "INV-2024-089",
    buyer: "Apex Infrastructure Ltd",
    buyerGstin: "07AAAAA0000A1Z5",
    amount: 250000,
    excuse: "Sir our quarterly statutory audit is ongoing, director is traveling.",
    days: 72,
    hasPod: true
  },
  {
    id: "case-2",
    label: "Case 2: Severe Default (INR 5.8L)",
    source: "Bharat Builds Escalation",
    invNumber: "INV-2024-041",
    buyer: "Zenith Mills Pvt Ltd",
    buyerGstin: "29BBBBB1111B1Z2",
    amount: 580000,
    excuse: "Management has not approved the budget due to acute liquidity crisis.",
    days: 120,
    hasPod: true
  },
  {
    id: "case-3",
    label: "Case 3: Missing POD Warning (INR 1.8L)",
    source: "Bharat Builds Evidentiary Gap",
    invNumber: "INV-2024-112",
    buyer: "Metro Infra Logistics",
    buyerGstin: "06CCCCC2222C1Z8",
    amount: 180000,
    excuse: "We need to re-verify if all parts were received at the site.",
    days: 50,
    hasPod: false
  },
  {
    id: "case-hf-1",
    label: "HF Synthetic 1: CloudWave (INR 3.4L)",
    source: "HuggingFace: alamgirqazi/invoice-ocr-synthetic",
    invNumber: "INV-20230815-001",
    buyer: "Acme Manufacturing Co. India",
    buyerGstin: "27AAACW8899F1Z1",
    amount: 340000,
    excuse: "Payment is stuck in vendor verification portal. We require 30 more days.",
    days: 64,
    hasPod: true
  },
  {
    id: "case-hf-2",
    label: "HF Synthetic 2: PixelWave (INR 4.2L)",
    source: "HuggingFace: alamgirqazi/invoice-ocr-synthetic",
    invNumber: "INV-2023-0098",
    buyer: "Greenfield Marketing Ltd",
    buyerGstin: "07DDDDD3333D1Z9",
    amount: 420000,
    excuse: "Client has not cleared our milestone payout yet.",
    days: 85,
    hasPod: true
  }
];

export const awsServiceStatuses = [
  {
    name: "Amazon Textract",
    badge: "OCR & Expense",
    role: "Extracts GSTINs, PO line items, and detects challan signatures",
    status: "Active",
    region: "us-east-1"
  },
  {
    name: "Amazon S3",
    badge: "Encrypted Trade Vault",
    role: "Bucket: vasuli-docs-vault (SSE-S3 enabled)",
    status: "Configured",
    region: "us-east-1"
  },
  {
    name: "Amazon Bedrock",
    badge: "Claude 3 Haiku",
    role: "Legal reasoning, stalling classifier & dual-tier notice drafter",
    status: "Access Granted",
    region: "us-east-1"
  },
  {
    name: "Amazon DynamoDB",
    badge: "Claim Ledger",
    role: "Table: vasuli_claims (Tracks AUDITED, NOTICE_SENT, SETTLED)",
    status: "Connected",
    region: "us-east-1"
  },
  {
    name: "AWS Step Functions",
    badge: "Dispute Orchestrator",
    role: "Workflow: vasuli-recovery-workflow-demo (Multi-day cure period machine)",
    status: "Running",
    region: "us-east-1"
  },
  {
    name: "Amazon SES",
    badge: "Notice Dispatcher",
    role: "Dispatches debtor magic links and dispute notices via email",
    status: "Standby",
    region: "us-east-1"
  }
];

export const structuredTelemetryLogs = [
  {
    service: "Amazon Textract",
    action: "EXTRACT_EXPENSE_SUCCESS",
    latency_ms: 320,
    status: "SUCCESS",
    details: { invoice: "INV-2024-089", fields_extracted: 14, confidence: 0.98 }
  },
  {
    service: "Amazon Bedrock",
    action: "EXCUSE_CLASSIFIED",
    latency_ms: 640,
    status: "SUCCESS",
    details: { model: "anthropic.claude-3-haiku", category: "Administrative Deflection", confidence: 0.94 }
  },
  {
    service: "Amazon DynamoDB",
    action: "CLAIM_AUDIT_COMMITTED",
    latency_ms: 12,
    status: "COMMITTED",
    details: { table: "vasuli_claims", claim_id: "CLM-9082", status: "AUDITED" }
  },
  {
    service: "AWS Step Functions",
    action: "START_EXECUTION",
    latency_ms: 45,
    status: "RUNNING",
    details: { state_machine: "vasuli-recovery-workflow-demo", state: "SendTier1Notice" }
  },
  {
    service: "Amazon SES",
    action: "SEND_DISPUTE_NOTICE_EMAIL",
    latency_ms: 175,
    status: "DELIVERED",
    details: { recipient: "accounts@apexinfra.com", template: "MSMED_TIER1_OFFER" }
  }
];

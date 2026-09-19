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
  has_signed_pod: true,
  days_overdue: 72,
  statutory_due_date: "2024-06-13",
  is_section_15_violated: true,
  accrued_interest: 8450.75,
  total_claimable_amount: 258450.75,
  tax_disallowance_penalty: 75000,
  tax_disallowance_rate: 0.30,
  is_section_43b_violated: true,
  tax_disallowance_impact_summary: "Under Section 43B(h) of the Income Tax Act, debtor incurs a direct corporate tax penalty of INR 75,000.00 (30% tax) if this expense is not liquidated.",
  claim_strength_score: 88,
  stalling_category: "Administrative Deflection",
  counter_reasoning: "Buyer claims internal audit delay. Under Section 15 of the MSMED Act 2006, payment credit terms are legally capped at 45 days regardless of buyer internal audits. Goods were accepted on 2024-05-14 with signed POD and zero objection raised within the statutory 15-day defect notification window (Section 15 deemed-acceptance).",
  stalling_message_snippet: "Sir our quarterly statutory audit is ongoing, director is traveling. Payment will be released once accounts department completes verification.",
  status: "AUDITED",
  tier_1_letter: `Subject: Amicable Settlement Proposal - Invoice INV-2024-089 | Apex Infrastructure Ltd

Dear Accounts & Finance Leadership,

Reference: Supply of Industrial Assemblies under Invoice No. INV-2024-089 dated 10-May-2024 (Principal: INR 2,50,000.00).

We value our commercial partnership with Apex Infrastructure Ltd and appreciate the collaborative relationship built over the past years. We understand that periodic accounting audits and cash-flow adjustments can introduce administrative friction.

However, as per our records, payment for the referenced invoice is currently 72 days past the statutory 45-day deadline mandated under Section 15 of the Micro, Small and Medium Enterprises Development (MSMED) Act, 2006. As of today, the compounding penal interest accrued under Section 16 (calculated at 3x the prevailing RBI Bank Rate of 6.75% = 20.25% p.a., compounded monthly) stands at INR 8,450.75, bringing the total statutory claim to INR 2,58,450.75.

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
UNDER SECTIONS 15 & 16 OF THE MICRO, SMALL AND MEDIUM ENTERPRISES DEVELOPMENT (MSMED) ACT, 2006

REGISTERED DEMAND & LEGAL INTROSPECTION
Date: Current Date
Claim Reference: CLM-9082 / INV-2024-089

TO:
The Board of Directors & Managing Authority
Apex Infrastructure Ltd
GSTIN: 07AAAAA0000A1Z5

FROM:
Authorized Legal Counsel
On behalf of: Registered MSME Supplier (Udyam: UDYAM-MH-01-0012345)
GSTIN: 27AAACW1234F1Z5

SUBJECT: FORMAL DEMAND FOR PAYMENT OF OUTSTANDING PRINCIPAL DEBT OF INR 2,50,000.00 ALONG WITH MANDATORY COMPOUND STATUTORY INTEREST UNDER SECTION 16 OF THE MSMED ACT, 2006.

SIR/MADAM,

Under instructions from and on behalf of our client, we hereby issue this Statutory Demand Notice regarding unpaid commercial supplies:

1. SUPPLY AND ACCEPTANCE OF GOODS:
Our client duly delivered industrial materials and supplies against Tax Invoice No. INV-2024-089 dated 10-May-2024 for a principal amount of INR 2,50,000.00. Physical delivery of the consignment was received and formally acknowledged by your authorized representative on 14-May-2024 via signed Delivery Challan.

2. STATUTORY BREACH UNDER SECTION 15:
No dispute regarding specifications, quality, or shortages was communicated to our client within the statutory fifteen (15) day period from delivery date. By virtue of the proviso to Section 2(b) and Section 15 of the MSMED Act, 2006, the goods stand deemed accepted without demur. In terms of Section 15, the maximum allowable credit period is statutorily capped at forty-five (45) days. Your company has committed an active statutory default, with payment remaining delinquent for 72 days past the statutory deadline.

3. MANDATORY STATUTORY LIABILITY UNDER SECTION 16:
Section 16 of the MSMED Act, 2006 stipulates that compound interest with monthly rests is payable at three times the RBI bank rate (20.25% p.a.).
  - Principal Sum Overdue: INR 2,50,000.00
  - Accrued Penal Interest as of Date: INR 8,450.75
  - Total Statutory Sum Payable: INR 2,58,450.75

4. DEMAND AND FIFTEEN (15) DAY NOTICE PERIOD:
You are hereby called upon to remit the full statutory amount of INR 2,58,450.75 within FIFTEEN (15) DAYS from receipt of this notice, or execute an authorized settlement agreement at http://localhost:3000/resolve/CLM-9082.

TAKE NOTICE that failure to comply within 15 days will result in a formal reference under Section 18 to the Micro and Small Enterprises Facilitation Council (MSEFC) via MSME Samadhaan. Under Section 19, no appeal can be entertained without pre-depositing 75% of the decreed amount.

Yours faithfully,

Advocate & Statutory Legal Counsel
Vasuli AI Automated Recovery Suite`,

  tier_3_petition: `PETITION BEFORE THE MICRO AND SMALL ENTERPRISES FACILITATION COUNCIL (MSEFC)
Under Section 18 read with Sections 15 & 16 of the Micro, Small and Medium Enterprises Development (MSMED) Act, 2006

PARTIES:
1. Claimant: MSME Supplier (Udyam: UDYAM-MH-01-0012345)
   Address: Registered Trade Operations, Maharashtra, India
2. Respondent: Apex Infrastructure Ltd (GSTIN: 07AAAAA0000A1Z5)
   Address: Commercial District, New Delhi, India

FACTS OF DISPUTE:
1. The Claimant is a registered Micro/Small Enterprise under the MSMED Act, 2006.
2. The Claimant delivered industrial assemblies under Invoice No. INV-2024-089 dated 10-May-2024 for Principal INR 2,50,000.00.
3. Consignment delivery acknowledged via signed Delivery Challan on 14-May-2024 without any defect dispute within statutory 15 days (Section 15 deemed-acceptance).
4. Statutory credit period of 45 days under Section 15 elapsed on 13-June-2024.
5. Principal sum remains delinquent for 72 days past the statutory 45-day deadline.

COMPUTATION OF STATUTORY CLAIM UNDER SECTION 16:
- Principal Sum Overdue: INR 2,50,000.00
- Statutory Compound Interest (3x RBI Bank Rate = 20.25% compounded monthly): INR 8,450.75
- Total Claimable Amount: INR 2,58,450.75

PRAYER:
a) Direct Respondent to immediately remit INR 2,58,450.75 alongside continuing compound interest until full realization.
b) Issue an Arbitral Award under Section 18(3) enforceable as an arbitration decree.

DATED: Current Date | ATTESTED 1-CLICK SAMADHAAN PETITION DOSSIER`
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
    role: "Bucket: vasuli-trade-vault-2026 (SSE-S3 enabled)",
    status: "Configured",
    region: "us-east-1"
  },
  {
    name: "Amazon Bedrock",
    badge: "Claude 3.5 Sonnet",
    role: "Legal reasoning, stalling classifier & dual-tier notice drafter",
    status: "Access Granted",
    region: "us-east-1"
  },
  {
    name: "Amazon DynamoDB",
    badge: "Claim Ledger",
    role: "Table: VasuliClaims (Tracks AUDITED, NOTICE_SENT, SETTLED)",
    status: "Connected",
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

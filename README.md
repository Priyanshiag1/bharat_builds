# DhanSetu.AI (formerly Vasuli) — MSME Statutory Debt Recovery & Reconciliation Engine

> **Built for AWS Bharat Builds Hackathon (First Commit Tour 2026)**  
> **Target Tracks**: **Ship It** (Grand Prize ₹2,00,000) & **Best UI** (₹1,00,000)  
> **AWS Region**: `us-east-1` / `ap-south-1` | **Statutory Rate**: 16.50% p.a. (3x RBI 5.50% Bank Rate)

---

## 📌 Executive Summary

India’s 63 million Micro, Small, and Medium Enterprises (MSMEs) are trapped in a **₹10.7 Lakh Crore delayed payments crisis**. While Section 16 of the MSMED Act, 2006 mandates compounding penal interest at **3x the RBI Bank Rate (16.50% p.a.)** with monthly rests, and Section 43B(h) of the Income Tax Act enforces direct 30% corporate tax disallowances, MSME claims collapse in practice due to:
1. **Physical ground-level paperwork chaos** (faded carbon copies, smudged transporter biltys, unverified margin Katoti).
2. **Commercial reconciliation mismatches** (running account lump-sums, unverified TDS debit notes, defect liability retentions).
3. **Statutory & legal traps** (*Silpi Industries* Udyam registration timing, 90-day PO clauses, IBC NCLT moratoriums).

**DhanSetu.AI** is India's first end-to-end statutory debt recovery and commercial reconciliation platform built natively on **AWS Serverless Infrastructure**. It bridges ground-level factory realities with enforceable Supreme Court case law and instant, dispute-free debtor settlement.

---

## 🏛️ Comprehensive Edge Cases Solved (Categories 1 to 5)

### Category 1: Physical Documents & Ground-Level Ingestion
* **Edge Case 1: Faded Carbon Copies & OCR Hallucination**: Added `validate_ocr_math_checksum()` verifying `Subtotal + Tax == Grand Total`, catching dropped zeros (e.g., ₹45,000 vs. ₹4,50,000).
* **Edge Case 2: Transporter Bilty (Lorry Receipt / LR) Chaos**: Anchors statutory Section 15 timer to the physical Bilty delivery date and flags missing stamped consignee POD as an evidence gap.
* **Edge Case 3: Mobile Photos & Glare Distortion**: Resilient multi-tier extraction pipeline using Amazon Textract with local normalized fallback parsing.
* **Edge Case 4: Handwritten "Katoti" & Spot Margin Rejections**: Reconciles warehouse clerk margin notes (-₹3,000 broken packaging) to prevent claims from being dismissed for inflated billing.
* **Edge Case 5: Vernacular Units of Measurement (UOM)**: Built-in trade dictionary normalizing Thaan, Bora, Peti, Nag, and Gatta into standardized metric SI units.
* **Edge Case 6: Staggered Batch Deliveries**: Calculates independent 45-day statutory clocks per truck dispatch batch on single consolidated invoices (`calculate_staggered_batch_interest`).
* **Edge Case 7: "Kacha Bill" vs. "Pakka Bill"**: Prioritizes physical delivery challan dates over delayed tax invoice dates per Section 15 of MSMED Act.

### Category 2: Commercial Ledger Reconciliation
* **Edge Case 8: Multi-Invoice FIFO Running Account Allocation**: Chronologically matches unallocated buyer lump-sum payments to prevent double-recovery claims.
* **Edge Case 9: Deductions & Arbitrary Debit Notes**: Automatically deducts verified TDS (194C/194Q) while isolating unverified debit notes into actionable evidence gaps.
* **Edge Case 10: Retention Money & Defect Liability Period (DLP)**: Segregates mature overdue balances from legitimate contractual defect liability retention.
* **Edge Case 11: Job-Work Scrap Variance**: Evaluates raw material vs. finished goods yield with permissible loss tolerances.

### Categories 3, 4 & 5: Statutory Traps & Enforceability
* **Edge Case 12: Udyam Post-Supply Trap (*Silpi Industries v. KSRTC*, SC 2021)**: Validates that Udyam registration pre-dated invoice dispatch; dynamically falls back to Section 73 Contract Act if post-supply.
* **Edge Case 13: Wholesale & Retail Trader Exclusion**: Excludes NIC 45/46/47 traders from Chapter V and Section 43B(h) per MoMSME circulars, routing to Summary Suits / NI Act 138.
* **Edge Case 14: Latent vs. Patent Defects**: Enforces Section 2(b) 15-day deemed acceptance bar for visible surface defects while routing latent metallurgical defects to joint NABL laboratory testing.
* **Edge Case 15: Contractual 90-Day PO Terms Override**: Overrides forced 90-day credit clauses to 45 days citing Section 15 Proviso & Section 24 non-obstante supremacy.
* **Edge Case 16: Partial Payment Appropriation (*Gurpreet Singh v. UOI*, SC 2006)**: Allocates partial payments to accrued 16.50% penal interest first, legally overriding debtor remarks.
* **Edge Case 17: Section 43B(h) Fiscal Year Timing**: Distinguishes between in-year delays and March 31 corporate tax disallowance add-backs.
* **Edge Case 18: Presumptive Tax Exemption (Sec 44AD)**: Suppresses 43B(h) tax disallowances for non-audited presumptive filers while preserving 16.50% interest.
* **Edge Case 19: Supplier GSTR-1 Default Defense**: Validates GSTR-1 filing status to neutralize buyer's legitimate Input Tax Credit (ITC) withholding defense under CGST Act.
* **Edge Case 20: PSU / CPSE Treasury Fast-Track**: Implements Department of Expenditure IFMS clearance protocol for government department recoveries.
* **Edge Case 21: Relationship-Preserving Conciliatory Mode**: Generates collaborative fiscal planning notices to safeguard ongoing supplier contracts.
* **Edge Case 22: Legal Service of Notice Proof**: Generates official India Post Registered Post A.D. (RPAD) postal slips with tear-off acknowledgment cards per Section 27 General Clauses Act.
* **Edge Case 23: IBC Moratorium & Auto IBBI Form B Claim**: Detects NCLT CIRP, halts MSMED action under Section 238 IBC, and generates official IBBI Form B Operational Creditor Claim.
* **Edge Case 24: Bharatiya Sakshya Adhiniyam, 2023 (Section 63)**: Embeds cryptographic SHA-256 digital evidence certificates in Tier 3 Dossiers, replacing repealed Section 65B of the Indian Evidence Act.

---

## ☁️ AWS Serverless Architecture & Services Used

```
[MSME Supplier] ────> Next.js UI (Turbopack / Tailwind)
                           │
                           ├───> Amazon API Gateway (REST API)
                           │         │
                           │         ├───> AWS Lambda (Serverless Backend Engine)
                           │         │         │
                           │         │         ├───> Amazon Textract (AnalyzeExpense Document AI)
                           │         │         ├───> Amazon Bedrock (Claude 3 Haiku Legal AI)
                           │         │         ├───> Amazon DynamoDB (Tamper-Proof Audit State)
                           │         │         ├───> Amazon S3 (Statutory Dossiers & Evidence)
                           │         │         └───> Amazon SES (Dispute & Settlement Delivery)
                           │         │
                           │         └───> AWS Step Functions (Multi-Day Escalation Workflow)
                           │
[Live Telemetry] ─────────┴───> Amazon CloudWatch (Structured Sub-Second Logs)
```

| AWS Service | Production Role in DhanSetu | Latency |
|---|---|---|
| **Amazon Textract** | Multi-page invoice & Bilty extraction via `AnalyzeExpense` | ~380 ms |
| **Amazon Bedrock** | Claude 3 Haiku for debtor stalling excuse counter-reasoning | ~540 ms |
| **AWS Step Functions** | Multi-day automated notice escalation state machine | ~65 ms |
| **Amazon DynamoDB** | Immutable single-table design for claims, ledger & audit logs | ~12 ms |
| **Amazon S3** | Encrypted PDF storage for Tier 1–3 notices, RPAD slips & Deeds | ~90 ms |
| **Amazon SES** | Verified legal notice delivery and tracking | ~175 ms |
| **Amazon CloudWatch** | Live structured observability stream viewed via in-app HUD | Real-time |

---

## 🎨 Best UI Innovations

1. **Interactive Time-Decay Penalty Slider**: Users and buyers can drag overdue days from 1 to 365+ days to watch 16.50% compound monthly interest calculate dynamically in real-time.
2. **Debtor Magic-Link Resolution Portal**: Frictionless settlement interface offering **Option A: 5% Prompt Settlement Discount** vs **Option B: 3-Month Structured EMI Plan**.
3. **Section 18 Digital Settlement Deed & Confetti**: Instant binding legal settlement agreement generation with celebratory confetti explosion.
4. **Live In-App CloudWatch Telemetry Stream**: Transparent AWS observability modal displaying sub-second service latencies and execution ARNs.

---

## 🚀 Quickstart & Local Installation

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/Priyanshiag1/bharat_builds.git
cd bharat_builds
```

### 2. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python server.py
# Server active at http://localhost:8000 (API Docs: http://localhost:8000/docs)
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
# Next.js active at http://localhost:3000
```

### 4. Running the Automated Test Suites
```bash
# Run Category 2 Commercial Reconciliation Tests (5/5 tests)
python backend/test_category_2_edge_cases.py

# Run 13 Real-World Statutory Edge Cases (13/13 tests)
python backend/test_edge_cases.py

# Run Master Unified 10-Point Integration Suite
python backend/test_unified_api.py
```

---

## 👥 Team & Development Roles

* **Person A (Frontend & Ingestion UX)**: Best UI development, Category 1 physical ingestion inputs, Time-decay slider, WhatsApp bubbles, and Debtor Resolution Portal.
* **Person B (Commercial Reconciliation Engine)**: Category 2 running account FIFO reconciliation, TDS deductions, retention DLP, and job-work tracking.
* **Person C (Statutory Math & AWS Integration)**: AWS serverless backend, Amazon Bedrock & Textract integration, 13 real-world statutory edge cases, Section 63 BSA certificate, and master API integration.

---

## 📄 License & Hackathon Declaration
Built exclusively for the **AWS Bharat Builds Hackathon (First Commit Tour 2026)**.  
All commits, tests, and deployment artifacts were authored during the event window.

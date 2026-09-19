# VASULI (VASOOL AI) — UNIFIED FULL-STACK ARCHITECTURE & DEPLOYMENT GUIDE
### Bharat Builds Tour Hackathon 2026 | Unified Master (Person A + Person B + Person C)

This repository contains the complete, production-ready implementation of **Vasuli** — the autonomous statutory delayed-payment recovery platform for Indian MSMEs operating under the **Micro, Small and Medium Enterprises Development (MSMED) Act, 2006**.

---

## 1. The 4 Completed Platform Modules

| Module | Core Capabilities | Technologies & AWS Services |
|---|---|---|
| **Module 1: Claim Intake & MSMED Compliance Audit** | Ingests multi-format claim documents (Invoice PDF, PO, Delivery Challan). Extracts Buyer/Seller GSTINs, dates, itemized amounts. Audits Section 15 45-day statutory credit cap. Computes Section 16 3x RBI bank rate compounding interest ($3 \times 6.75\% = 20.25\%$ p.a.). Detects evidentiary gaps (missing signed POD/Challan). | **Amazon Textract** (`AnalyzeExpense`), **Amazon S3** (`vasuli-docs-*`), `pypdf` local fallback, MSMED Statutory Math Engine. |
| **Module 2: Stalling Detection & Claim Strength Engine** | Analyzes debtor communications (WhatsApp, email, letters). Detects Administrative Deflection, Phantom Disputes, and Liquidity Crises. Applies Section 15 15-day deemed acceptance bar. Computes an explainable 0–100 Claim Strength Score (40 pts Paperwork, 35 pts Time Decay, 25 pts Communication Signal). | **Amazon Bedrock** (`anthropic.claude-3-haiku-20240307-v1:0`), Local Rule-Based Legal Classifier, Explainable Scoring Engine. |
| **Module 3: Autonomous Multi-Tier Negotiation Agent** | Escalates communication strategy across 3 calibrated tiers: **Tier 1** (Amicable offer: 5% prompt discount or 3-month EMI plan), **Tier 2** (Statutory Demand Notice citing Section 15/16 and Section 19 75% pre-deposit bar), and **Tier 3** (1-Click MSEFC Samadhaan filing arbitration dossier PDF). | **ReportLab Legal Engine**, Automated Notice Drafter, PDF Dossier Compiler. |
| **Module 4: Interactive Buyer Settlement Portal** | Self-serve debtor resolution portal at `/resolve/[claimId]`. Allows debtor to choose between 5% prompt settlement or 3-month structured EMI plan. Triggers celebratory confetti and executes a binding Digital Settlement Agreement Deed PDF. | **Next.js 14 App Router**, `canvas-confetti`, ReportLab Agreement Generator, DynamoDB/Local Vault. |

---

## 2. System Architecture & End-to-End Flow

```
[MSME Supplier] 
       │ (Uploads Invoice, Challan, Udyam, Debtor Chat)
       ▼
[Person A: Next.js 14 Frontend] (localhost:3000)
       │  POST /api/audit (Multipart Form)
       ▼
[Person C: Unified FastAPI Server] (backend/server.py :8000)
   ├── OCR: Textract AnalyzeExpense (fallback to pypdf regex)
   ├── Math: MSMED Sec 15 (45-day cap) & Sec 16 (3x RBI compounding)
   ├── AI Classifier: Bedrock Claude 3 Haiku (fallback to rule engine)
   ├── Scoring: 40/35/25 Explainable Claim Strength Algorithm
   ├── Notice Engine: ReportLab compiles Tier 1, Tier 2, Tier 3 PDFs
   └── Vault: DynamoDB + S3 (in-memory + local vault fallback)
       │  Returns dual-contract payload: ClaimData + ClaimAssessment
       ▼
[Person A: Interactive Dispute Dashboard]
   ├── Circular Gauge (Score / 100)
   ├── Animated 3x Interest Counter
   ├── Multi-Tier Notice Viewer (Tier 1, 2, 3 Tabs + PDF Downloads)
   └── "Download MSEFC Samadhaan Filing Dossier (PDF)"
       │  Debtor receives magic link: /resolve/[claimId]
       ▼
[Person A: Debtor Resolution Portal]
   ├── Option A: 5% Prompt Discount (Waives 100% statutory interest)
   ├── Option B: 3-Month Structured EMI Plan
   ├── Confetti Celebration Trigger
   └── "Download Signed Settlement Agreement Deed (PDF)"
```

---

## 3. Person Integration Summary

1. **Person A (Frontend)**:
   - Built modern, responsive Next.js 14 application with Dark Mode `#0f172a`, Lucide icons, Framer Motion, and Tailwind CSS.
   - 3 interactive screens: `/intake` (drag-and-drop ingestion), `/dashboard` (claim audit and multi-tier notices), and `/resolve/[claimId]` (debtor portal).
   - Fully connected to backend APIs with seamless offline fallback mode.

2. **Person B (AI Assessment & Domain Models)**:
   - Implemented TypeScript domain models (`ClaimAssessment`, `NormalizedClaimData`, `EvidenceGaps`).
   - Built explainable 40/35/25 Claim Strength Scoring algorithm and stalling excuse classification.
   - Provided `PersonCApiAdapter` with offline determinism and CLI runner.

3. **Person C (AWS Backend & Infrastructure)**:
   - Built master FastAPI server (`backend/server.py`) and serverless AWS Lambda handler (`backend/lambda/api_handler.py`).
   - Integrated AWS Textract, Amazon S3, AWS Bedrock Claude 3 Haiku, Amazon DynamoDB, and AWS Step Functions.
   - Built 100% non-blocking offline fallbacks (`DEMO_MODE=true`) for infallible hackathon presentations.
   - Implemented 4 ReportLab legal document generators (Tier 1 Amicable, Tier 2 Statutory, Tier 3 MSEFC Dossier, Settlement Agreement Deed).

---

## 4. How to Run Locally

### Step 1: Start the Backend Server (Python 3.12+)
```powershell
# In the repository root
python -u backend/server.py
```
* The server starts at `http://127.0.0.1:8000`.
* Check health: `http://127.0.0.1:8000/` returns `{"status": "online", "service": "Vasuli AWS Statutory Recovery Engine"}`.
* Automatic Swagger API Documentation: `http://127.0.0.1:8000/docs`.

### Step 2: Run the Master Integration Test Suite
```powershell
python -u backend/test_unified_api.py
```
* Verifies all 7 integration steps (Health, Master Audit, Person B Adapter, Notice PDFs, MSEFC Dossier PDF, Settlement Resolution, Agreement Deed PDF).

### Step 3: Launch the Frontend (Node.js 18+)
```powershell
cd frontend
npm run dev
```
* Open `http://localhost:3000` in your browser.

---

## 5. Production AWS Cloud Deployment

To deploy the entire serverless infrastructure stack to your AWS account:

```powershell
cd backend
npx cdk bootstrap
npx cdk deploy --all
```

**AWS CDK Stack Resources Created**:
* **S3 Bucket**: `vasuli-docs-{account}-{region}` (SSE-S3 encrypted trade vault).
* **DynamoDB Tables**: `vasuli_claims`, `vasuli_buyer_sessions` (14-day TTL), `vasuli_config`, `vasuli_audit_logs`.
* **Lambda Function**: `VasuliApiHandler` (Python 3.12).
* **Step Functions**: `vasuli-recovery-workflow-demo` (Escalation state machine).
* **API Gateway**: `VasuliRestApi` (REST API with CORS enabled).


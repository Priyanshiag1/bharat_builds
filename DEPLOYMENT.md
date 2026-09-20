# DHANSETU (formerly Vasuli) — UNIFIED FULL-STACK ARCHITECTURE & DEPLOYMENT GUIDE
### Bharat Builds Tour Hackathon 2026 | Unified Master (Person A + Person B + Person C)

This repository contains the complete, production-ready implementation of **DhanSetu** — the autonomous statutory delayed-payment recovery platform for Indian MSMEs operating under the **Micro, Small and Medium Enterprises Development (MSMED) Act, 2006**.

---

## 1. The 4 Completed Platform Modules

| Module | Core Capabilities | Technologies & AWS Services |
|---|---|---|
| **Module 1: Claim Intake & MSMED Compliance Audit** | Ingests multi-format claim documents. Extracts Buyer/Seller GSTINs. Audits Section 15 (45-day cap). Computes Section 16 (16.5% p.a. compounding interest). Maps commercial reconciliation (FIFO, job-work). | **Amazon Textract**, **Amazon S3**, Statutory Math Engine, Commercial Reconciliation Engine. |
| **Module 2: Stalling Detection & Claim Strength Engine** | Analyzes debtor communications. Detects Administrative Deflection, Phantom Disputes, Latent vs Patent defects. Computes an explainable 0–100 Claim Strength Score. | **Amazon Bedrock (Claude 3 Haiku)**, Explainable Scoring Engine. |
| **Module 3: Autonomous Multi-Tier Negotiation Agent** | Escalates communication strategy across 3 calibrated tiers: Tier 1 (Amicable), Tier 2 (Statutory Demand), Tier 3 (MSEFC Samadhaan Arbitration Dossier). | **AWS Step Functions**, **Amazon SES**, ReportLab Notice Drafter. |
| **Module 4: Interactive Buyer Settlement Portal** | Self-serve debtor resolution portal. Allows debtor to choose between 5% prompt settlement or 3-month structured EMI plan. | **Next.js 14 App Router**, DynamoDB Sessions, ReportLab Agreement Generator. |

---

## 2. System Architecture & End-to-End Flow

```
[MSME Supplier] 
       │ (Uploads Invoice, Challan, Udyam, Debtor Chat)
       ▼
[DhanSetu Next.js 14 Frontend] (localhost:3000)
       │  POST /api/audit
       ▼
[Unified FastAPI Server / AWS Lambda] (backend/server.py :8000)
   ├── OCR: Textract AnalyzeExpense (fallback to pypdf regex)
   ├── Math: MSMED Sec 15, Sec 16, Sec 43B(h), Silpi Precedent
   ├── Recon: FIFO, Job-Work variances, Retention Money
   ├── AI Classifier: Bedrock Claude 3 Haiku
   ├── Notice Engine: ReportLab compiles Tier 1, Tier 2, Tier 3 PDFs
   └── Vault: DynamoDB + S3
       │  Returns dual-contract payload: ClaimData + ClaimAssessment
       ▼
[Interactive Dispute Dashboard]
   ├── Circular Gauge (Score / 100)
   ├── Animated 3x Interest Counter
   ├── Multi-Tier Notice Viewer + Telemetry Monitor
       │  Debtor receives magic link: /resolve/[claimId]
       ▼
[Debtor Resolution Portal]
   ├── Option A: 5% Prompt Discount
   ├── Option B: 3-Month Structured EMI Plan
   └── Confetti Celebration Trigger -> Generates Signed Settlement PDF
```

---

## 3. How to Run Locally

### Step 1: Start the Backend Server (Python 3.12+)
DhanSetu operates on a unified Python backend. The `src/person-b` node code is deprecated for production.
```powershell
# In the repository root
cd backend
pip install -r requirements.txt
python -u server.py
```
* The server starts at `http://127.0.0.1:8000`.
* Check health: `http://127.0.0.1:8000/`
* Automatic Swagger API Documentation: `http://127.0.0.1:8000/docs`.

### Step 2: Run the Master Integration Test Suite
Test the legal accuracy, edge cases, and API integration offline via DEMO_MODE:
```powershell
# Inside backend folder
python -u -m unittest test_unified_api.py test_api_flow.py test_audit_steps.py test_category_2_edge_cases.py test_edge_cases.py
```
* Verifies all 30 test assertions covering Health, Master Audit, 24 Edge Cases (e.g. FIFO, Sec 43B(h)), Classifier logic, Notice PDFs, and MSEFC Dossier PDF.

### Step 3: Launch the Frontend (Node.js 18+)
```powershell
cd frontend
npm install
npm run dev
```
* Open `http://localhost:3000` in your browser.

---

## 4. Production AWS Cloud Deployment

To deploy the entire serverless infrastructure stack to your AWS account:

```powershell
cd backend
npx aws-cdk bootstrap
npx aws-cdk deploy --all
```

**AWS CDK Stack Resources Created**:
* **S3 Bucket**: `vasuli-docs-{account}-{region}` (SSE-S3 encrypted trade vault).
* **DynamoDB Tables**: `vasuli_claims`, `vasuli_buyer_sessions`, `vasuli_config`, `vasuli_audit_logs`.
* **Lambda Function**: `VasuliApiHandler` (Python 3.12 logic processor).
* **Step Functions**: `vasuli-recovery-workflow` (Escalation state machine).
* **API Gateway**: `VasuliRestApi` (REST API mapped directly to `api_handler.py`).

# DhanSetu (formerly Vasuli) — AWS-Deployed MSME Delayed-Payment Recovery Platform

DhanSetu helps Indian MSMEs document delayed payments, assess claim strength, initiate structured recovery, and track settlement under the MSMED Act, 2006. It is designed for the AWS Hackathon **Ship It** track, prioritizing robust AWS architecture, clear cost awareness, and a fast, reliable deployment model.

## Unified AWS Architecture

The solution uses a clean, production-ready, AWS-first serverless stack powered by Python:
- **Frontend Layer**: Next.js 14 App Router hosted on AWS Amplify Hosting (separate distributions for the MSME App and Buyer Settlement Portal).
- **Edge & API**: Amazon API Gateway (REST APIs) protecting the core serverless architecture.
- **Compute**: AWS Lambda (Python 3.12) running the unified core logic (`backend/lambda/api_handler.py`). *Note: The older `src/person-b` directory exists only as a Node.js test reference implementation.*
- **AI & Processing**: 
  - **Amazon Textract** (OCR and forms extraction for invoices).
  - **Amazon Bedrock (Claude 3 Haiku)** for entity structuring, claim assessment, classification of stalling tactics (e.g. latent vs patent defects), and automated legal drafting.
- **Data & Storage**:
  - **Amazon DynamoDB** for core operational state (`vasuli_claims`, `vasuli_buyer_sessions`, `vasuli_config`, `vasuli_audit_logs`).
  - **Amazon S3** for secure document storage (raw uploads and generated PDFs).
- **Orchestration & Messaging**: 
  - **AWS Step Functions** for escalation workflows (e.g., Tier 1 → Wait → Tier 2) utilizing built-in Wait states (includes a local demo-mode override).
  - **Amazon SES** for email notification dispatch and magic link delivery.

## Local Setup Instructions

1. **Install Prerequisites**: Ensure you have Python 3.12+, Node.js (LTS), Git, and the AWS CLI installed on your machine.
2. **Clone the Repository**:
   ```bash
   git clone https://github.com/Priyanshiag1/bharat_builds.git
   cd bharat_builds
   ```
3. **Environment Setup**:
   Copy `.env.example` to `.env` and fill in necessary details (do not commit `.env`!).
   ```bash
   cp .env.example .env
   ```
4. **Backend Setup & Run**:
   ```bash
   cd backend
   pip install -r requirements.txt
   # Start the unified local FastAPI wrapper server
   python -u server.py
   ```
   The backend runs on `http://127.0.0.1:8000` mirroring the AWS Lambda environment.
5. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The frontend runs on `http://localhost:3000`.

## Full-Stack Feature Summary

DhanSetu provides a full end-to-end recovery pipeline:
1. **Intake & Commercial Reconciliation**: Upload invoices/POs. Automatically handles FIFO payment mapping, verified deductions, active retention (DLP), and job-work variance checks.
2. **Statutory Math Engine**: Accurately computes Section 16 penal interest (16.5% p.a., compounding monthly rests) natively mapped to the RBI Bank Rate (5.5%). Handles complex edge cases like Section 43B(h) Corporate Tax penalties, Presumptive Taxation, and Udyam Pre-Supply verifications.
3. **AI Stalling Detection**: Employs Claude 3 via Bedrock to classify buyer responses and calculate an explainable Claim Strength Score.
4. **Autonomous Negotiation**: Multi-Tier Notice drafting (Tier 1 Amicable, Tier 2 Statutory, Tier 3 MSEFC Dossier).
5. **Buyer Portal**: Direct magic-link portal allowing buyers to accept 5% discounts or EMI plans, executing a binding digital Settlement Deed.

## Deployment Plan

1. **Test Locally**: Run `python -u test_unified_api.py` to verify the full flow using local AWS/demo configurations.
2. **Deploy Infrastructure**:
   Execute the deployment to the AWS Account using CDK:
   ```bash
   cd backend
   npx aws-cdk deploy --all
   ```
3. **Frontend Hosting**: The Next.js builds are pushed to AWS Amplify Hosting connected to the GitHub repository's main branch.
4. **Validation**: Validate the public URL, verify database permissions, test Document AI extraction, and trigger the Step Function workflow via the dispatch endpoint.

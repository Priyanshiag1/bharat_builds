# Vasuli — AWS-Deployed MSME Delayed-Payment Recovery Platform

Vasuli helps Indian MSMEs document delayed payments, assess claim strength, initiate structured recovery, and track settlement. It is designed for the AWS Hackathon **Ship It** track, prioritizing robust AWS architecture, clear cost awareness, and a fast, reliable deployment model.

## AWS Architecture

The solution uses the simplest and most robust AWS-first stack possible for a reliable build sprint:
- **Frontend Layer**: Next.js hosted on AWS Amplify Hosting (separate distributions for the MSME App and Buyer Settlement Portal).
- **Edge & API**: Amazon API Gateway (REST APIs) protected by Cognito User Pools (MSME users) and signed JWTs (Buyers).
- **Compute**: AWS Lambda (Node.js/Python) for fast, zero-administration business logic.
- **AI & Processing**: 
  - Amazon Textract (OCR and forms extraction for invoices).
  - Amazon Bedrock (Claude) for entity structuring, claim assessment, classification of responses, and automated legal drafting.
- **Data & Storage**:
  - Amazon DynamoDB for core operational state (claims, communications, negotiation events, settlements) and session configuration.
  - Amazon S3 for secure document storage (raw uploads and generated PDFs).
- **Orchestration & Messaging**: AWS Step Functions for delayed escalations (e.g., Tier 1 → Wait 5 days → Tier 2) with an integrated demo-mode override, and Amazon SES for email notification delivery.

## Local Setup Instructions

1. **Install Prerequisites**: Ensure you have Node.js (LTS), Git, and the AWS CLI installed on your machine.
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
4. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
5. **Backend Setup**:
   ```bash
   cd backend
   npm install
   # Configure AWS CLI first using `aws configure`
   ```

## Branch Responsibilities

The work is split across three feature branches to allow parallel development without merge conflicts during the 60-hour sprint:
- `feature/person-a-frontend`: MSME dashboard, claim intake UX, buyer portal UI, responsive design, and integration with the backend APIs.
- `feature/person-b-ai-assessment`: AI processing, S3 document handling, Textract extraction, Bedrock prompts, claim strength scoring, and AI classifications.
- `feature/person-c-aws-integration`: AWS CDK/SAM infrastructure, API Gateway configuration, Step Functions orchestration, DynamoDB schemas, and final deployment.

## Deployment Plan

1. **Test Locally**: Verify all integrations using local stubs and AWS credentials matching your sandbox account.
2. **Deploy Infrastructure**:
   Person C will execute the deployment to the shared AWS Account in `ap-south-1`:
   ```bash
   cd backend
   npx aws-cdk deploy --all
   ```
3. **Frontend Hosting**: The Next.js builds are pushed to AWS Amplify Hosting connected to the GitHub repository's main branch.
4. **Validation**: Validate the public URL, verify the database permissions, run a test document through Textract, and execute the Step Function in "demo mode".

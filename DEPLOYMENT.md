# VASULI (VASOOL AI) — AWS INFRASTRUCTURE & DEPLOYMENT GUIDE
### Track: Ship It (AWS Hackathon 2026) | Owned by Person C (AWS Integration)

This document provides complete instructions for deploying, testing, and verifying the AWS cloud architecture for **Vasuli** — the statutory delayed-payment recovery platform for Indian MSMEs under the MSMED Act, 2006.

---

## 1. Architecture Summary

| AWS Service | Resource Name / Pattern | Role in Vasuli Platform |
|---|---|---|
| **Amazon S3** | `vasuli-docs-{account}-{region}` | Stores raw uploaded invoices, signed Proof of Delivery (POD) challans, and generated legal notice PDFs. |
| **Amazon DynamoDB** | `vasuli_claims` | Primary operational state table storing MSME claims, audit calculations, and status transitions. |
| **Amazon DynamoDB** | `vasuli_buyer_sessions` | Ephemeral state for buyer magic links with automatic TTL expiration (14 days). |
| **Amazon DynamoDB** | `vasuli_config` | Dynamic configuration store for `RBI_BANK_RATE` (6.75%), statutory multipliers, and grace periods. |
| **Amazon DynamoDB** | `vasuli_audit_logs` | Structured CloudWatch/DynamoDB audit trails (Bible Rule 3). |
| **AWS Lambda** | `VasuliApiHandler` (Python 3.12) | Central serverless API router handling statutory calculations, OCR, dispute classification, and notices. |
| **AWS Step Functions**| `vasuli-recovery-workflow-demo` | Timed escalation state machine (Tier 1 Notice → Wait Period → Status Check → Tier 2 Demand Notice → MSEFC Dossier). |
| **Amazon API Gateway** | `VasuliRestApi` | REST API with preflight CORS enabled for Next.js frontend (`localhost:3000` & Amplify Hosting). |

---

## 2. API Endpoints Reference

Base URL (Local Lambda / Mock / API Gateway): `http://localhost:8000` or API Gateway URL.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check, engine status, and statutory rate confirmation. |
| `GET` | `/claims` | List all active MSME claims from DynamoDB. |
| `POST` | `/claims` | Create or register a new MSME debt recovery claim. |
| `GET` | `/claims/{claim_id}` | Fetch detailed claim record, interest metrics, and notices. |
| `POST` | `/claims/{claim_id}/audit` | Execute Section 15 45-day cap & Section 16 20.25% monthly compounding calculation. |
| `POST` | `/claims/{claim_id}/classify-excuse` | AI excuse classifier detecting late quality disputes and liquidity stalling. |
| `POST` | `/claims/{claim_id}/generate-notice` | Generates official ReportLab legal notice PDF (Tier 1, 2, or 3) and stores in S3. |
| `POST` | `/claims/{claim_id}/start-recovery` | Generates tamper-proof magic link token for the debtor settlement portal. |
| `GET` | `/buyer/portal/{token}` | Serves debtor settlement view (running interest clock, 100% waiver offer). |
| `POST` | `/buyer/portal/{token}/respond` | Debtor action: Accept 100% interest waiver, propose 3-part EMI, or upload payment UTR. |

---

## 3. Statutory Legal Math Specifications

* **Section 15 MSMED Act 2006**: Maximum agreed credit period is statutorily capped at **45 days** from delivery / deemed acceptance.
* **Section 16 MSMED Act 2006**: Penal compound interest with **monthly rests** at **3x RBI Bank Rate**.
* **Current RBI Bank Rate**: **6.75%** per annum.
* **Statutory Compounding Rate**: $3 \times 6.75\% = \mathbf{20.25\%}$ per annum.

---

## 4. Local Testing & Verification

To verify that the AWS DynamoDB tables, calculation engine, and API routes are functioning correctly without deploying:

```bash
cd backend
python test_api_flow.py
```

Expected output:
* `[TEST 1]` Health check returns `200 OK`.
* `[TEST 2]` Creates claim in AWS DynamoDB table `vasuli_claims`.
* `[TEST 3]` Computes Section 15 & 16 interest schedule.
* `[TEST 4]` Classifies buyer excuse under Section 15 Proviso (15-day defect rule).
* `[TEST 5]` Generates debtor magic link token and saves session.

---

## 5. One-Command AWS CDK Cloud Deployment

When ready to deploy infrastructure directly to AWS:

```bash
cd backend
npx cdk bootstrap
npx cdk deploy --all
```

The deployment will output:
* `ApiGatewayUrl`: Public HTTPS URL for Person A (Frontend) to configure in `.env.local` as `NEXT_PUBLIC_API_URL`.
* `DocumentBucketOutput`: S3 Bucket name for document storage.
* `ClaimsTableOutput`: DynamoDB claims table name.

# Person B: Phase 2 Integration Handoff

## 1. What was completed in Phase 2
- **Module 2 (AWS Bedrock Classifier):** Migrated the deterministic buyer reply classifier to an AWS Bedrock-backed LLM classifier (`anthropic.claude-3-haiku-20240307-v1:0`), with strict fallback to local determinism if AWS is unavailable.
- **Module 1 (AWS Textract/S3 Intake Adapter):** Extended the Intake Service to parse live AWS Textract `AnalyzeExpense` responses instead of relying solely on local mocked JSON payloads.

## 2. Important Files & Modules
- `adapters/bedrock-classifier.ts`: Implementation of the `BuyerClassifierEngine` backed by Bedrock.
- `adapters/document-provider-adapter.ts`: Defines `DocumentExtractionProvider`, containing `TextractS3Adapter` and `LocalFixtureProvider`, alongside the Textract parser logic.
- `core/module1-intake.ts`: Intake logic strictly decoupled from AWS infrastructure.
- `core/module2-scoring.ts`: Strength scoring logic strictly decoupled from Bedrock specifics.

## 3. Stable Interfaces & Contracts
**For Person A (Frontend):**
Person A only needs to consume the final `ClaimAssessment` JSON object. No changes are required from Phase 1. The object remains structurally identical but now includes a `classificationMode` attribute (either `'bedrock'` or `'offline_fallback'`) inside the `buyerReplyClassification` object. Person A does not need to know about Bedrock, Textract, S3, or any AWS SDK implementation.

**For Person C (AWS Backend):**
Person B’s core intake logic is decoupled from direct AWS infrastructure. To feed documents into Person B’s pipeline, Person C simply needs to invoke the `extractDocument` method on the `DocumentExtractionProvider` implementation (e.g. `TextractS3Adapter`) by supplying:
- `documentId`
- `s3Bucket`
- `s3Key`

The existing offline Person C API interest adapter boundary remains strictly unchanged.

## 4. Fallback Behavior
The entire Person B module guarantees a **100% offline fallback capability**:
- **Textract/S3 Unavailable:** Falls back cleanly to `LocalFixtureProvider` fetching mocked document payloads.
- **Bedrock Unavailable (or JSON parse failure):** Falls back cleanly to `LocalBuyerClassifier` for deterministic keyword mapping.
- **Person C API Unavailable:** Falls back cleanly to local offline interest math.

## 5. Configuration Requirements
To run the AWS-powered versions of the adapters:
- Ensure `AWS_REGION` is set (defaults to `ap-south-1`).
- Ensure the running environment has valid AWS credentials capable of invoking `bedrock:InvokeModel` and `textract:AnalyzeExpense`.
- No hardcoded keys exist in the codebase.

## 6. Test Commands
```bash
npx tsc --noEmit
npx tsx src/person-b/test-textract.ts
npx tsx src/person-b/test-bedrock-classifier.ts
npx tsx src/person-b/test-module1.ts
npx tsx src/person-b/test-module2.ts
npx tsx src/person-b/test-cli.ts
```

## 7. Known Limitations
- The `TextractS3Adapter` assumes Person C’s infrastructure uses standard Textract `AnalyzeExpense` outputs. If standard `AnalyzeDocument` (Key-Value) is used instead, the `TextractParser` will need minor adjustments to parse Key-Value block relationships instead of `SummaryFields`.
- Live integration with Person C's FastAPI backend requires `http://127.0.0.1:8000` to be actively running.

## 8. Integration Steps (A + B + C)
1. Merge Person C's infrastructure and API into a shared staging branch.
2. Verify Person B's CLI runner can hit Person C's live local API without falling back to local interest calculation.
3. Wire Person C's S3/Dynamo triggers to pass `s3Bucket` and `s3Key` to Person B's `TextractS3Adapter`.
4. Expose Person B's `cli.ts` end-to-end output over an API route for Person A's frontend to consume the `ClaimAssessment`.

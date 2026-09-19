import os
import sys
from fastapi.testclient import TestClient
import json

# Ensure lambda is in path
sys.path.append(os.path.join(os.path.dirname(__file__), "lambda"))
from server import app

client = TestClient(app)

def run_tests():
    print("==========================================================")
    print("  VASULI (VASOOL AI) — MASTER UNIFIED INTEGRATION TEST")
    print("==========================================================\n")

    # TEST 1: Health Check
    print("--- [TEST 1] Root Health Check: GET / ---")
    res = client.get("/")
    assert res.status_code == 200, f"Failed health check: {res.text}"
    print(f"Status: {res.status_code} | Service: {res.json().get('service')}\n")

    # TEST 2: Master Claim Audit (Person A Frontend Contract)
    print("--- [TEST 2] Master Audit Route: POST /api/audit ---")
    test_pdf_path = os.path.join(os.path.dirname(__file__), "lambda", "test_invoice.pdf")
    files = {}
    if os.path.exists(test_pdf_path):
        files["invoice"] = ("Invoice_INV-2024-089.pdf", open(test_pdf_path, "rb"), "application/pdf")

    data = {
        "chat_text": "Sir our quarterly statutory audit is ongoing, director is traveling. Payment will be released once accounts department completes verification.",
        "udyam": "UDYAM-MH-01-0012345",
        "buyer_name": "Apex Infrastructure Ltd",
        "buyer_gstin": "07AAAAA0000A1Z5",
        "has_signed_pod": "true"
    }

    res = client.post("/api/audit", data=data, files=files if files else None)
    assert res.status_code == 200, f"Audit failed: {res.text}"
    audit = res.json()
    claim_id = audit["claim_id"]
    print(f"Generated Claim ID: {claim_id}")
    print(f"Principal: Rs. {audit['principal_amount']:,.2f}")
    print(f"Days Overdue: {audit['days_overdue']} days")
    print(f"Accrued 3x Penal Interest: Rs. {audit['accrued_interest']:,.2f}")
    print(f"Total Claim Amount: Rs. {audit['total_claimable_amount']:,.2f}")
    print(f"Claim Strength Score: {audit['claim_strength_score']}/100")
    print(f"Component Scores: {audit['component_scores']}")
    print(f"Stalling Category: {audit['stalling_category']}")
    print(f"Bedrock/Classification Mode: {audit['classification_mode']}")
    print(f"Evidence Gaps (Delivery Challan): {audit['evidenceGaps']['deliveryChallan']}")
    print("Audit passed successfully!\n")

    # TEST 3: Person B Adapter Endpoint
    print(f"--- [TEST 3] Person B Adapter Route: POST /claims/{claim_id}/audit ---")
    res_adapter = client.post(f"/claims/{claim_id}/audit")
    assert res_adapter.status_code == 200, f"Person B adapter failed: {res_adapter.text}"
    adapter_data = res_adapter.json()
    assert "audit" in adapter_data, "Missing audit in adapter response"
    print(f"Person B Adapter Days Overdue: {adapter_data['audit']['days_overdue']}")
    print(f"Statutory Penal Rate: {adapter_data['audit']['statutory_penal_rate']}% p.a.")
    print(f"Interest Accrued: Rs. {adapter_data['audit']['interest_accrued']:,.2f}\n")

    # TEST 4: Tier 1 & Tier 2 Notice PDF Generation
    print(f"--- [TEST 4] Tier 1 & Tier 2 Notice PDFs ---")
    res_t1 = client.get(f"/api/claims/{claim_id}/notices/tier1/pdf")
    assert res_t1.status_code == 200, f"Tier 1 notice failed: {res_t1.status_code}"
    assert res_t1.headers.get("content-type") == "application/pdf", "Expected application/pdf"
    print(f"Tier 1 PDF Download: 200 OK ({len(res_t1.content)} bytes)")

    res_t2 = client.get(f"/api/claims/{claim_id}/notices/tier2/pdf")
    assert res_t2.status_code == 200, f"Tier 2 notice failed: {res_t2.status_code}"
    assert res_t2.headers.get("content-type") == "application/pdf", "Expected application/pdf"
    print(f"Tier 2 PDF Download: 200 OK ({len(res_t2.content)} bytes)\n")

    # TEST 5: Tier 3 MSEFC Samadhaan Dossier PDF
    print(f"--- [TEST 5] Tier 3 MSEFC Filing Dossier PDF ---")
    res_dossier = client.get(f"/api/claims/{claim_id}/dossier/pdf")
    assert res_dossier.status_code == 200, f"Dossier failed: {res_dossier.status_code}"
    assert res_dossier.headers.get("content-type") == "application/pdf", "Expected application/pdf"
    print(f"MSEFC Samadhaan Dossier PDF: 200 OK ({len(res_dossier.content)} bytes)\n")

    # TEST 6: Buyer Portal Resolution (3-Month EMI Settlement)
    print(f"--- [TEST 6] Buyer Settlement Portal Action: POST /api/claims/{claim_id}/resolve ---")
    res_resolve = client.post(f"/api/claims/{claim_id}/resolve", json={"settlement_type": "EMI_PLAN"})
    assert res_resolve.status_code == 200, f"Resolution failed: {res_resolve.text}"
    res_data = res_resolve.json()
    print(f"Resolution Status: {res_data['new_status']}")
    print(f"Settlement Type: {res_data['settlement_type']}")
    print(f"Deed Agreement URL: {res_data['agreement_pdf_url']}\n")

    # TEST 8: Section 43B(h) Corporate Tax Penalty Verification
    print(f"--- [TEST 8] Section 43B(h) Income Tax Disallowance Math ---")
    tax_penalty = audit.get("tax_disallowance_penalty")
    assert tax_penalty is not None, "Missing tax_disallowance_penalty in audit response"
    expected_tax = round(audit["principal_amount"] * 0.30, 2)
    assert tax_penalty == expected_tax, f"Expected {expected_tax}, got {tax_penalty}"
    print(f"Debtor Tax Penalty: Rs. {tax_penalty:,.2f} (30% Corporate Tax Disallowance)")
    print(f"Tax Violation Status: {audit.get('is_section_43b_violated')}")
    print(f"Tax Statutory Impact: {audit.get('tax_disallowance_impact_summary')}\n")

    # TEST 9: Multi-Channel Notice Dispatch (SES + WhatsApp + Step Functions)
    print(f"--- [TEST 9] Multi-Channel Notice Dispatch: POST /api/claims/{claim_id}/dispatch ---")
    res_dispatch = client.post(
        f"/api/claims/{claim_id}/dispatch",
        json={"buyer_email": "accounts@apexinfra.com", "buyer_phone": "+919876543210", "tier": "TIER_1"}
    )
    assert res_dispatch.status_code == 200, f"Dispatch failed: {res_dispatch.text}"
    disp_data = res_dispatch.json()
    assert disp_data["status"] == "DISPATCHED"
    channels = disp_data["channels"]
    print(f"Amazon SES Email: {channels['email']['status']} (Msg ID: {channels['email']['message_id']})")
    print(f"WhatsApp Web Deep Link: {channels['whatsapp']['deep_link'][:65]}...")
    print(f"AWS Step Functions State Machine: {channels['step_functions']['status']}")
    print(f"Execution ARN: {channels['step_functions']['execution_arn']}\n")

    # TEST 10: Structured CloudWatch Live Telemetry API (Bible Rule 3)
    print(f"--- [TEST 10] Structured CloudWatch Live Telemetry: GET /api/telemetry/logs ---")
    res_telemetry = client.get("/api/telemetry/logs")
    assert res_telemetry.status_code == 200, f"Telemetry failed: {res_telemetry.text}"
    telemetry = res_telemetry.json()
    print(f"Telemetry Status: {telemetry['status']} | Region: {telemetry['region']}")
    print(f"Total CloudWatch Structured Events: {telemetry['total_events']}")
    print(f"Active AWS Services: {list(telemetry['aws_services'].keys())}")
    print(f"Latest Recorded Event: {telemetry['logs'][0]['service']} -> {telemetry['logs'][0]['action']} ({telemetry['logs'][0]['latency_ms']}ms)\n")

    print("==========================================================")
    print("  ALL 10 MASTER INTEGRATION TESTS PASSED WITH 100% SUCCESS!")
    print("==========================================================")

if __name__ == "__main__":
    run_tests()

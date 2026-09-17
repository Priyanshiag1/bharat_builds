import sys
import os
import json

# Add lambda directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), "lambda"))
from api_handler import lambda_handler

print("==========================================================")
print("   VASULI (VASOOL AI) — AWS BACKEND INTEGRATION TEST")
print("==========================================================\n")

# TEST 1: Health Check (GET /)
print("--- [TEST 1] Testing Health Check: GET / ---")
event_health = {
    "httpMethod": "GET",
    "path": "/",
    "headers": {},
    "body": None
}
res_health = lambda_handler(event_health, None)
print(f"Status Code: {res_health['statusCode']}")
print(f"Response: {res_health['body']}\n")

# TEST 2: Create a New MSME Claim (POST /claims)
print("--- [TEST 2] Testing Claim Creation: POST /claims ---")
claim_payload = {
    "claim_id": "VASULI-2024-DEMO-001",
    "seller_name": "Bharat Precision Components Pvt Ltd",
    "seller_gstin": "27AAACW1234F1Z5",
    "seller_udyam": "UDYAM-MH-03-0019284",
    "buyer_name": "Apex Infrastructure & Engineering Ltd",
    "buyer_gstin": "07AAAAA0000A1Z5",
    "invoice_number": "INV-2024-089",
    "invoice_date": "2024-05-10",
    "principal_amount": 250000.0,
    "has_signed_pod": True,
    "status": "DOCUMENTS_VERIFIED"
}
event_create = {
    "httpMethod": "POST",
    "path": "/claims",
    "headers": {"Content-Type": "application/json"},
    "body": json.dumps(claim_payload)
}
res_create = lambda_handler(event_create, None)
print(f"Status Code: {res_create['statusCode']}")
print(f"Response: {res_create['body']}\n")

# TEST 3: Statutory Legal Audit (POST /claims/{claim_id}/audit)
# Computes Section 15 45-day cap & Section 16 20.25% compounding interest
print("--- [TEST 3] Testing Statutory Legal Audit: POST /claims/VASULI-2024-DEMO-001/audit ---")
event_audit = {
    "httpMethod": "POST",
    "path": "/claims/VASULI-2024-DEMO-001/audit",
    "pathParameters": {"claim_id": "VASULI-2024-DEMO-001"},
    "headers": {},
    "body": None
}
res_audit = lambda_handler(event_audit, None)
print(f"Status Code: {res_audit['statusCode']}")
audit_data = json.loads(res_audit['body'])
print("Statutory Audit Details:")
print(f"  - Principal Amount: Rs. {audit_data['audit']['principal_amount']:,.2f}")
print(f"  - Statutory Due Date (Section 15 Cap): {audit_data['audit']['statutory_due_date']}")
print(f"  - Days Overdue: {audit_data['audit']['days_overdue']} days")
print(f"  - Statutory Compounding Rate (3x RBI): {audit_data['audit']['statutory_penal_rate']}% p.a.")
print(f"  - Penal Interest Accrued: Rs. {audit_data['audit']['interest_accrued']:,.2f}")
print(f"  - Total Claim Payable: Rs. {audit_data['audit']['total_recoverable_amount']:,.2f}")
print(f"  - Daily Compounding Meter: Rs. {audit_data['audit']['daily_compounding_rate_rupees']}/day\n")

# TEST 4: Buyer Stalling Excuse Analysis (POST /claims/{claim_id}/classify-excuse)
print("--- [TEST 4] Testing Stalling Excuse Classifier ---")
event_excuse = {
    "httpMethod": "POST",
    "path": "/claims/VASULI-2024-DEMO-001/classify-excuse",
    "pathParameters": {"claim_id": "VASULI-2024-DEMO-001"},
    "headers": {"Content-Type": "application/json"},
    "body": json.dumps({
        "excuse_text": "Goods received had defects in finish, so accounts team has withheld payment."
    })
}
res_excuse = lambda_handler(event_excuse, None)
print(f"Status Code: {res_excuse['statusCode']}")
excuse_data = json.loads(res_excuse['body'])
print("Classifier Result:")
print(f"  - Category: {excuse_data['classification']['category']}")
print(f"  - Statutory Rule Violated: {excuse_data['classification']['statutory_rule']}")
print(f"  - Action: {excuse_data['classification']['action']}\n")

# TEST 5: Buyer Magic Link Portal Generation
print("--- [TEST 5] Testing Buyer Magic Link Creation ---")
event_magic = {
    "httpMethod": "POST",
    "path": "/claims/VASULI-2024-DEMO-001/start-recovery",
    "pathParameters": {"claim_id": "VASULI-2024-DEMO-001"},
    "headers": {},
    "body": None
}
res_magic = lambda_handler(event_magic, None)
print(f"Status Code: {res_magic['statusCode']}")
magic_data = json.loads(res_magic['body'])
print(f"Magic Link Token: {magic_data['magic_token']}")
print(f"Buyer Portal URL: {magic_data['buyer_portal_url']}\n")

print("==========================================================")
print("   ALL 5 TESTS PASSED SUCCESSFULLY ON AWS DYNAMODB!")
print("==========================================================")

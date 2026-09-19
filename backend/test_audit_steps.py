import os
import sys
import time

sys.path.append(os.path.join(os.path.dirname(__file__), "lambda"))

print("Testing Step 1: Textract...")
from textract_service import extract_invoice_data
t0 = time.time()
p = os.path.join(os.path.dirname(__file__), "lambda", "test_invoice.pdf")
with open(p, "rb") as f:
    raw = f.read()
res1 = extract_invoice_data(raw)
print(f"Step 1 Textract took {time.time()-t0:.2f}s, inv: {res1.get('invoice_number')}")

print("Testing Step 2: Legal Math...")
from legal_math import calculate_msme_penal_interest
t0 = time.time()
res2 = calculate_msme_penal_interest(250000.0, "2024-05-10")
print(f"Step 2 Math took {time.time()-t0:.2f}s, days: {res2.get('days_overdue')}")

print("Testing Step 3: Classifier...")
from classifier_service import analyze_buyer_excuse
t0 = time.time()
res3 = analyze_buyer_excuse("Sir audit ongoing")
print(f"Step 3 Classifier took {time.time()-t0:.2f}s, cat: {res3.get('tactic_category')}")

print("Testing Step 4: Notice Generator...")
from notice_generator import generate_legal_notice
t0 = time.time()
res4 = generate_legal_notice({"claim_id": "CLM-TEST"}, res2, notice_tier="TIER_1")
print(f"Step 4 Notice took {time.time()-t0:.2f}s, url: {res4.get('presigned_url')[:40]}")

print("Testing Step 5: DB Save...")
from api_handler import put_claim_record
t0 = time.time()
put_claim_record({"claim_id": "CLM-TEST", "principal": 250000})
print(f"Step 5 DB Save took {time.time()-t0:.2f}s")
print("ALL STEPS FINISHED!")

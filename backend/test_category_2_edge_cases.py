import sys
import os
import json
import unittest

sys.path.append(os.path.join(os.path.dirname(__file__), "lambda"))
from reconciliation import apply_commercial_reconciliation
from api_handler import calculate_interest

class TestCategory2EdgeCases(unittest.TestCase):
    
    def test_case_8_fifo(self):
        claim = {
            "principal_amount": 900000.0,
            "invoice_number": "C",
            "invoices": [
                {"invoice_number": "A", "amount": 200000},
                {"invoice_number": "B", "amount": 300000},
                {"invoice_number": "C", "amount": 400000}
            ],
            "payments": [
                {"amount": 500000}
            ]
        }
        res = apply_commercial_reconciliation(claim)
        
        # FIFO allocation:
        # A: 200k fully paid -> 0
        # B: 300k fully paid -> 0
        # C: 400k unpaid -> 400k. But wait!
        # The payments amount is 500k. A takes 200k. Remaining 300k. B takes 300k. Remaining 0. C remains 400k!
        self.assertEqual(res["adjusted_principal_amount"], 400000.0)
        
        # Test partial payment on C
        claim["payments"] = [{"amount": 700000}]
        res = apply_commercial_reconciliation(claim)
        # A (200) + B (300) = 500. Rem 200 for C. C outstanding = 400 - 200 = 200k.
        self.assertEqual(res["adjusted_principal_amount"], 200000.0)

    def test_case_9_deductions(self):
        claim = {
            "principal_amount": 1000000.0,
            "deductions": [
                {"type": "TDS", "amount": 10000, "verified": True},
                {"type": "Debit Note", "amount": 25000, "verified": True},
                {"type": "Disputed deduction", "amount": 50000, "verified": False} # Unverified
            ]
        }
        res = apply_commercial_reconciliation(claim)
        # Net payable = 1,000,000 - 10,000 - 25,000 = 965,000
        self.assertEqual(res["adjusted_principal_amount"], 965000.0)
        self.assertEqual(len(res["new_evidence_gaps"]), 1)
        self.assertEqual(res["new_evidence_gaps"][0]["amount"], 50000)
        
    def test_case_10_retention(self):
        claim = {
            "principal_amount": 1000000.0,
            "retention_terms": [
                {"type": "percentage", "value": 10, "condition_met": False}, # DLP
                {"type": "percentage", "value": 10, "condition_met": True}   # Delivery met
            ]
        }
        res = apply_commercial_reconciliation(claim)
        # Retained amount = 10% of 1000000 = 100000
        # Adjusted amount = 1000000 - 100000 = 900000
        self.assertEqual(res["adjusted_principal_amount"], 900000.0)
        self.assertEqual(res["reconciliation_details"]["amount_retained"], 100000.0)
        
    def test_case_11_job_work(self):
        claim = {
            "principal_amount": 500000.0,
            "job_work_details": {
                "received": 1000,
                "finished": 850,
                "scrap": 100,
                "permissible_loss_pct": 5
            }
        }
        res = apply_commercial_reconciliation(claim)
        # Expected output = 1000 * 0.95 = 950
        # Actual output = 850 + 100 = 950
        # Variance = 0, reconciled = True
        self.assertTrue(res["reconciliation_details"]["job_work"]["reconciled"])
        self.assertEqual(len(res["new_evidence_gaps"]), 0)
        
        # Test failed reconciliation
        claim["job_work_details"]["finished"] = 800
        res = apply_commercial_reconciliation(claim)
        self.assertFalse(res["reconciliation_details"]["job_work"]["reconciled"])
        self.assertEqual(len(res["new_evidence_gaps"]), 1)

    def test_combined_scenario(self):
        claim = {
            "principal_amount": 1000000.0,
            "invoice_number": "INV1",
            "invoices": [
                {"invoice_number": "INV1", "amount": 1000000.0}
            ],
            "payments": [
                {"amount": 100000.0}
            ],
            "deductions": [
                {"type": "TDS", "amount": 10000, "verified": True}
            ],
            "retention_terms": [
                {"type": "percentage", "value": 10, "condition_met": False}
            ]
        }
        res = apply_commercial_reconciliation(claim)
        # Base: 1000000
        # FIFO: Payment 100k -> 900000
        # Deductions: TDS 10k -> 890000
        # Retention: 10% of 890000 = 89000. Adjusted = 890000 - 89000 = 801000
        
        adj_amount = res["adjusted_principal_amount"]
        self.assertEqual(adj_amount, 801000.0)
        
        # Statutory Interest Engine
        interest_res = calculate_interest(adj_amount, "2024-05-10")
        
        # Just check it ran correctly
        self.assertEqual(interest_res["principal_amount"], adj_amount)
        self.assertEqual(interest_res["statutory_penal_rate"], 16.5)

if __name__ == "__main__":
    unittest.main()

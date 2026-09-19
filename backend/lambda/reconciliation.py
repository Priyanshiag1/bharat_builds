import logging
from typing import List, Dict, Any, Tuple

def reconcile_fifo(invoices: List[Dict], payments: List[Dict]) -> List[Dict]:
    """
    Case 8: Running Account / FIFO Allocation.
    Allocates payments to invoices in FIFO order.
    Returns the invoices with an 'outstanding_amount' field.
    """
    # Sort invoices by date or just assume they are ordered
    # Standardize to have outstanding_amount
    for inv in invoices:
        inv['outstanding_amount'] = float(inv.get('amount', 0.0))
        
    for payment in payments:
        unallocated_payment = float(payment.get('amount', 0.0))
        for inv in invoices:
            if unallocated_payment <= 0:
                break
            if inv['outstanding_amount'] > 0:
                if unallocated_payment >= inv['outstanding_amount']:
                    unallocated_payment -= inv['outstanding_amount']
                    inv['outstanding_amount'] = 0.0
                else:
                    inv['outstanding_amount'] -= unallocated_payment
                    unallocated_payment = 0.0
                    
    return invoices

def reconcile_deductions(gross_amount: float, deductions: List[Dict]) -> Tuple[float, List[Dict]]:
    """
    Case 9: TDS / Debit Notes / Liquidated Damages.
    Deducts verified deductions from gross amount. Unverified deductions are flagged as warnings.
    Returns (net_payable, evidence_gaps).
    """
    net_payable = gross_amount
    evidence_gaps = []
    
    for ded in deductions:
        amount = float(ded.get('amount', 0.0))
        if ded.get('verified', False):
            net_payable -= amount
        else:
            evidence_gaps.append({
                "type": "unverified_deduction",
                "description": f"Unverified {ded.get('type', 'deduction')} of {amount} rejected.",
                "amount": amount
            })
            
    # Ensure net_payable doesn't drop below 0 if deductions exceed invoice
    return max(0.0, net_payable), evidence_gaps

def reconcile_retention(invoice_amount: float, retention_terms: List[Dict]) -> Tuple[float, float]:
    """
    Case 10: Retention Money / Defect Liability Period (DLP).
    Calculates retained amount that is not yet due based on conditions.
    Returns (amount_due_now, amount_retained).
    """
    amount_retained = 0.0
    for term in retention_terms:
        if not term.get('condition_met', True):
            # If condition not met, money is legitimately retained
            if term.get('type') == 'percentage':
                amount_retained += invoice_amount * (float(term.get('value', 0.0)) / 100.0)
            elif term.get('type') == 'fixed':
                amount_retained += float(term.get('value', 0.0))
                
    amount_due_now = max(0.0, invoice_amount - amount_retained)
    return amount_due_now, amount_retained

def reconcile_job_work(received: float, finished: float, scrap: float, permissible_loss_pct: float) -> Dict:
    """
    Case 11: Job-Work Material & Scrap Reconciliation.
    Evaluates variance in material tracking.
    """
    expected_output = received * (1 - (permissible_loss_pct / 100.0))
    actual_output = finished + scrap
    variance = expected_output - actual_output
    
    reconciled = variance <= 0 or abs(variance) < 0.01
    
    return {
        "reconciled": reconciled,
        "variance": variance,
        "warning": f"Unexplained material shortage of {variance:.2f} units." if not reconciled else None
    }

def apply_commercial_reconciliation(claim: Dict) -> Dict:
    """
    Applies Cases 8-11 reconciliation logic on a claim object.
    Updates 'adjusted_principal_amount' and 'reconciliation_details'.
    """
    reconciliation_details = {}
    evidence_gaps = []
    
    # 1. Base amount
    principal = float(claim.get('principal_amount', 0.0))
    adjusted_principal = principal
    
    # 2. Case 8: FIFO (if multiple invoices provided in claim)
    invoices = claim.get('invoices')
    payments = claim.get('payments')
    
    if invoices and payments is not None:
        allocated_invoices = reconcile_fifo(invoices, payments)
        # Find the specific invoice for this claim to get its outstanding
        target_inv_num = claim.get('invoice_number')
        for inv in allocated_invoices:
            if inv.get('invoice_number') == target_inv_num:
                adjusted_principal = inv.get('outstanding_amount', 0.0)
                break
        reconciliation_details['fifo_allocation'] = allocated_invoices
    
    # 3. Case 9: Deductions
    deductions = claim.get('deductions', [])
    if deductions:
        adjusted_principal, ded_gaps = reconcile_deductions(adjusted_principal, deductions)
        evidence_gaps.extend(ded_gaps)
        reconciliation_details['deductions_applied'] = len([d for d in deductions if d.get('verified')])
        
    # 4. Case 10: Retention
    retention_terms = claim.get('retention_terms', [])
    if retention_terms:
        adjusted_principal, amount_retained = reconcile_retention(adjusted_principal, retention_terms)
        reconciliation_details['amount_retained'] = amount_retained
        if amount_retained > 0:
            reconciliation_details['retention_status'] = "Active"
            
    # 5. Case 11: Job-Work
    job_work = claim.get('job_work_details')
    if job_work:
        jw_res = reconcile_job_work(
            received=float(job_work.get('received', 0)),
            finished=float(job_work.get('finished', 0)),
            scrap=float(job_work.get('scrap', 0)),
            permissible_loss_pct=float(job_work.get('permissible_loss_pct', 0))
        )
        reconciliation_details['job_work'] = jw_res
        if not jw_res['reconciled']:
            evidence_gaps.append({
                "type": "job_work_variance",
                "description": jw_res['warning']
            })

    # 6. Case 1: OCR Math Checksum
    if claim.get("subtotal") is not None and claim.get("tax_amount") is not None:
        ocr_check = validate_ocr_math_checksum(
            claim.get("subtotal"),
            claim.get("tax_amount"),
            claim.get("principal_amount", principal)
        )
        reconciliation_details["ocr_math_checksum"] = ocr_check
        if ocr_check.get("requires_human_verification"):
            evidence_gaps.append({
                "type": "ocr_digit_hallucination_risk",
                "description": ocr_check.get("warning")
            })

    # 7. Case 5: Vernacular UOM Conversion
    if claim.get("uom_unit") and claim.get("quantity"):
        uom_res = convert_vernacular_uom(float(claim.get("quantity")), claim.get("uom_unit"))
        reconciliation_details["vernacular_uom_normalization"] = uom_res

    # 8. Case 6: Staggered Batch Deliveries
    if claim.get("staggered_batches"):
        batch_res = calculate_staggered_batch_interest(
            claim.get("staggered_batches"),
            agreed_credit_days=int(claim.get("agreed_credit_days", 30))
        )
        reconciliation_details["staggered_batches"] = batch_res

    # Return results
    return {
        "adjusted_principal_amount": round(adjusted_principal, 2),
        "reconciliation_details": reconciliation_details,
        "new_evidence_gaps": evidence_gaps
    }

# --------------------------------------------------------------------------
# Category 1: Physical Documents & Ground-Level Ingestion Helpers
# --------------------------------------------------------------------------

def validate_ocr_math_checksum(subtotal: float, tax_amount: float, grand_total: float, tolerance: float = 2.0) -> Dict[str, Any]:
    """
    Case 1: Faded Carbon Copies & OCR Digit Hallucinations Check.
    Validates arithmetic checksum: (Subtotal + Tax == Grand Total).
    Detects if OCR hallucinated or dropped digits (e.g. Rs 4,50,000 read as Rs 45,000).
    """
    calculated_total = round(float(subtotal) + float(tax_amount), 2)
    difference = abs(calculated_total - float(grand_total))
    is_valid = difference <= tolerance
    
    return {
        "is_valid": is_valid,
        "calculated_total": calculated_total,
        "extracted_grand_total": float(grand_total),
        "difference": round(difference, 2),
        "requires_human_verification": not is_valid,
        "warning": (
            f"OCR Digit Hallucination Alert: Subtotal (Rs. {subtotal:,.2f}) + Tax (Rs. {tax_amount:,.2f}) = Rs. {calculated_total:,.2f}, "
            f"which deviates by Rs. {difference:,.2f} from Grand Total (Rs. {grand_total:,.2f}). Please verify paper bill manually."
            if not is_valid else None
        )
    }

VERNACULAR_UOM_MAPPINGS = {
    "thaan": {"standard_unit": "meter", "conversion_factor": 100.0, "category": "Textile"},
    "than": {"standard_unit": "meter", "conversion_factor": 100.0, "category": "Textile"},
    "bora": {"standard_unit": "kg", "conversion_factor": 50.0, "category": "Agri/Commodity"},
    "bori": {"standard_unit": "kg", "conversion_factor": 50.0, "category": "Agri/Commodity"},
    "sack": {"standard_unit": "kg", "conversion_factor": 50.0, "category": "Agri/Commodity"},
    "peti": {"standard_unit": "pieces", "conversion_factor": 24.0, "category": "Packaging"},
    "carton": {"standard_unit": "pieces", "conversion_factor": 24.0, "category": "Packaging"},
    "nag": {"standard_unit": "pieces", "conversion_factor": 1.0, "category": "Count"},
    "piece": {"standard_unit": "pieces", "conversion_factor": 1.0, "category": "Count"},
    "gatta": {"standard_unit": "bundles", "conversion_factor": 10.0, "category": "Hardware/Yarn"},
    "quintal": {"standard_unit": "kg", "conversion_factor": 100.0, "category": "Weight"},
    "tonne": {"standard_unit": "kg", "conversion_factor": 1000.0, "category": "Weight"}
}

def convert_vernacular_uom(quantity: float, from_uom: str, to_uom: str = None) -> Dict[str, Any]:
    """
    Case 5: Vernacular & Local Units of Measurement (UOM Mismatch).
    Converts local trade units (Thaan, Bora, Peti, Nag, Gatta) into standardized metric SI units.
    """
    clean_uom = str(from_uom).strip().lower()
    mapping = VERNACULAR_UOM_MAPPINGS.get(clean_uom)
    
    if not mapping:
        return {
            "original_quantity": quantity,
            "original_uom": from_uom,
            "standardized_quantity": quantity,
            "standardized_uom": from_uom,
            "conversion_applied": False,
            "matched_category": "Standard/Direct"
        }
        
    std_qty = round(quantity * mapping["conversion_factor"], 2)
    return {
        "original_quantity": quantity,
        "original_uom": from_uom,
        "standardized_quantity": std_qty,
        "standardized_uom": mapping["standard_unit"],
        "conversion_applied": True,
        "conversion_factor": mapping["conversion_factor"],
        "matched_category": mapping["category"]
    }

def calculate_staggered_batch_interest(
    batches: List[Dict[str, Any]],
    agreed_credit_days: int = 30,
    calculation_date_str: str = None
) -> Dict[str, Any]:
    """
    Case 6: Staggered Batch Deliveries on Single Consolidated Invoice.
    Under Section 15 of MSMED Act, the 45-day timer starts on the delivery date of EACH batch,
    not the later consolidated tax invoice date!
    """
    from datetime import datetime, date, timedelta
    calc_date = datetime.strptime(calculation_date_str, "%Y-%m-%d").date() if calculation_date_str else date.today()
    capped_credit_days = min(agreed_credit_days, 45)
    
    total_principal = 0.0
    total_accrued_interest = 0.0
    batch_results = []
    
    # Section 16 penal compounding rate: 16.50% p.a.
    penal_rate = 16.50
    monthly_rate = (penal_rate / 100.0) / 12.0
    
    for b in batches:
        amount = float(b.get("amount", 0.0))
        del_date_str = b.get("delivery_date", calc_date.isoformat())
        del_date = datetime.strptime(del_date_str, "%Y-%m-%d").date()
        statutory_due_date = del_date + timedelta(days=capped_credit_days)
        
        days_overdue = max(0, (calc_date - statutory_due_date).days)
        
        # Monthly compounding
        months_overdue = days_overdue / 30.4375
        if days_overdue > 0:
            compound_factor = ((1 + monthly_rate) ** months_overdue) - 1
            batch_interest = round(amount * compound_factor, 2)
        else:
            batch_interest = 0.0
            
        total_principal += amount
        total_accrued_interest += batch_interest
        
        batch_results.append({
            "batch_id": b.get("batch_id", f"Batch-{len(batch_results)+1}"),
            "delivery_date": del_date_str,
            "statutory_due_date": statutory_due_date.isoformat(),
            "batch_amount": amount,
            "days_overdue": days_overdue,
            "batch_interest": batch_interest,
            "challan_number": b.get("challan_number", "DC-TRUCK-LR")
        })
        
    return {
        "total_principal": round(total_principal, 2),
        "total_accrued_interest": round(total_accrued_interest, 2),
        "total_claimable": round(total_principal + total_accrued_interest, 2),
        "batches": batch_results,
        "statutory_basis": "Section 15 & 16 MSMED Act: Independent appointed day clocks per physical dispatch."
    }

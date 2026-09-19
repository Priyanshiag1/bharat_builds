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

    # Return results
    return {
        "adjusted_principal_amount": round(adjusted_principal, 2),
        "reconciliation_details": reconciliation_details,
        "new_evidence_gaps": evidence_gaps
    }

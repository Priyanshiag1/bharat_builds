import os
from datetime import datetime, date, timedelta
from decimal import Decimal

# RBI Bank Rate (Sept 2026). Per Project Bible Non-Negotiable 4:
# Configurable, defaulting to 5.50% (Sept 2026).
RBI_BANK_RATE = float(os.getenv("RBI_BANK_RATE", "5.50"))
PENAL_RATE_MULTIPLIER = 3.0  # Mandated by Section 16 MSMED Act 2006
STATUTORY_PENAL_RATE = RBI_BANK_RATE * PENAL_RATE_MULTIPLIER # 16.50% p.a.
MAX_CREDIT_PERIOD_DAYS = 45  # Mandated by Section 15 MSMED Act 2006

def calculate_msme_penal_interest(
    principal_amount: float,
    invoice_date_str: str,
    delivery_date_str: str = None,
    agreed_credit_days: int = 30,
    calculation_date_str: str = None
) -> dict:
    """
    Computes statutory penal interest under Section 15 and 16 of the MSMED Act, 2006.
    
    Rules:
    - Section 15 caps agreed credit period to maximum 45 days from delivery/acceptance.
    - If no delivery date is supplied, invoice date is used as deemed acceptance date.
    - Section 16 mandates compound interest with monthly rests at 3x RBI Bank Rate.
    """
    inv_date = datetime.strptime(invoice_date_str, "%Y-%m-%d").date()
    del_date = datetime.strptime(delivery_date_str, "%Y-%m-%d").date() if delivery_date_str else inv_date
    
    # Cap credit period at 45 days
    capped_credit_days = min(agreed_credit_days, MAX_CREDIT_PERIOD_DAYS)
    statutory_due_date = del_date + timedelta(days=capped_credit_days)
    
    calc_date = datetime.strptime(calculation_date_str, "%Y-%m-%d").date() if calculation_date_str else date.today()
    
    if calc_date <= statutory_due_date:
        return {
            "principal_amount": principal_amount,
            "statutory_due_date": statutory_due_date.isoformat(),
            "calculation_date": calc_date.isoformat(),
            "days_overdue": 0,
            "interest_accrued": 0.0,
            "total_recoverable_amount": principal_amount,
            "is_overdue": False,
            "rbi_bank_rate": RBI_BANK_RATE,
            "statutory_penal_rate": STATUTORY_PENAL_RATE,
            "daily_compounding_rate_rupees": 0.0,
            "monthly_schedule": []
        }
        
    days_overdue = (calc_date - statutory_due_date).days
    
    # Monthly compounding calculation
    # Section 16: Compound interest with monthly rests
    monthly_rate = (STATUTORY_PENAL_RATE / 100.0) / 12.0
    
    current_balance = principal_amount
    schedule = []
    month_cursor = statutory_due_date
    month_num = 1
    
    while month_cursor < calc_date:
        # Compute end of this monthly rest (approx 30 days or next month date)
        # Advance by 1 month
        year = month_cursor.year + (month_cursor.month // 12)
        month = (month_cursor.month % 12) + 1
        day = min(month_cursor.day, 28)
        next_month_cursor = date(year, month, day)
        
        if next_month_cursor <= calc_date:
            interest_this_month = round(current_balance * monthly_rate, 2)
            closing_balance = round(current_balance + interest_this_month, 2)
            schedule.append({
                "month": month_num,
                "period_start": month_cursor.isoformat(),
                "period_end": next_month_cursor.isoformat(),
                "opening_balance": round(current_balance, 2),
                "interest_added": interest_this_month,
                "closing_balance": closing_balance
            })
            current_balance = closing_balance
            month_cursor = next_month_cursor
            month_num += 1
        else:
            # Partial month
            partial_days = (calc_date - month_cursor).days
            days_in_current_month = (next_month_cursor - month_cursor).days or 30
            partial_rate = monthly_rate * (partial_days / days_in_current_month)
            partial_interest = round(current_balance * partial_rate, 2)
            closing_balance = round(current_balance + partial_interest, 2)
            schedule.append({
                "month": month_num,
                "period_start": month_cursor.isoformat(),
                "period_end": calc_date.isoformat(),
                "opening_balance": round(current_balance, 2),
                "interest_added": partial_interest,
                "closing_balance": closing_balance,
                "is_partial": True
            })
            current_balance = closing_balance
            break
            
    interest_accrued = round(current_balance - principal_amount, 2)
    daily_rate_rupees = round((current_balance * (STATUTORY_PENAL_RATE / 100.0)) / 365.0, 2)
    
    return {
        "principal_amount": round(principal_amount, 2),
        "statutory_due_date": statutory_due_date.isoformat(),
        "calculation_date": calc_date.isoformat(),
        "days_overdue": days_overdue,
        "interest_accrued": interest_accrued,
        "total_recoverable_amount": round(current_balance, 2),
        "is_overdue": True,
        "rbi_bank_rate": RBI_BANK_RATE,
        "statutory_penal_rate": STATUTORY_PENAL_RATE,
        "daily_compounding_rate_rupees": daily_rate_rupees,
        "capped_credit_days": capped_credit_days,
        "monthly_schedule": schedule
    }


# ==============================================================================
# STATUTORY & LEGAL REAL-WORLD EDGE CASE ENGINES (Categories 3, 4, 5)
# ==============================================================================

def check_udyam_eligibility(invoice_date_str: str, udyam_registration_date_str: str = None) -> dict:
    """
    Edge Case 12: The Udyam Post-Supply Trap.
    Precedent: Supreme Court in Silpi Industries v. KSRTC (2021) and Gujarat State Civil Supplies (2022).
    Rule: Supplier must be registered under MSMED on the date of contract/supply.
    """
    if not udyam_registration_date_str:
        return {
            "is_udyam_verified": True,
            "has_precedent_defect": False,
            "status": "UDYAM_DATE_UNSPECIFIED",
            "message": "Udyam registration date assumed valid prior to supply."
        }
    
    inv_date = datetime.strptime(invoice_date_str, "%Y-%m-%d").date()
    udyam_date = datetime.strptime(udyam_registration_date_str, "%Y-%m-%d").date()
    
    if inv_date < udyam_date:
        return {
            "is_udyam_verified": False,
            "has_precedent_defect": True,
            "status": "JURISDICTIONAL_DEFECT_SILPI_INDUSTRIES",
            "precedent": "Silpi Industries v. Kerala State Road Transport Corp (Supreme Court 2021)",
            "message": f"Invoice date ({inv_date}) precedes Udyam registration date ({udyam_date}). Chapter V MSMED benefits (16.50% penal interest and MSEFC Samadhaan jurisdiction) are legally barred.",
            "recommended_legal_route": "INDIAN_CONTRACT_ACT_SEC_73_COMMERCIAL_SUIT",
            "statutory_remedy_available": False
        }
        
    return {
        "is_udyam_verified": True,
        "has_precedent_defect": False,
        "status": "UDYAM_PRE_SUPPLY_VERIFIED",
        "message": f"Udyam registration ({udyam_date}) valid prior to invoice supply date ({inv_date}). Chapter V fully enforceable.",
        "statutory_remedy_available": True
    }


def check_trader_exclusion(nic_code: str) -> dict:
    """
    Edge Case 13: Wholesale & Retail Trader Exclusion.
    Rule: MoMSME OM No. 5/2(2)/2021-E/P & G/Policy dt 02-07-2021.
    Traders (NIC 45, 46, 47) qualify for Priority Sector Lending, but are EXCLUDED from Chapter V & Sec 43B(h).
    """
    if not nic_code:
        return {"is_trader_excluded": False, "category": "MANUFACTURING_OR_SERVICE"}
        
    nic_prefix = str(nic_code).strip()[:2]
    if nic_prefix in ["45", "46", "47"]:
        return {
            "is_trader_excluded": True,
            "nic_prefix": nic_prefix,
            "status": "TRADER_STATUTORY_EXCLUSION",
            "circular": "Ministry of MSME OM No. 5/2(2)/2021 dt 02-07-2021",
            "message": f"NIC Code {nic_code} belongs to Wholesale/Retail Trade. Excluded from Chapter V Delayed Payment provisions & Section 43B(h).",
            "recommended_legal_route": "NEGOTIABLE_INSTRUMENTS_ACT_SEC_138_OR_SUMMARY_SUIT",
            "sec_43bh_applicable": False,
            "msefc_samadhaan_applicable": False
        }
        
    return {
        "is_trader_excluded": False,
        "nic_prefix": nic_prefix,
        "status": "MANUFACTURER_OR_SERVICE_ELIGIBLE",
        "message": f"NIC Code {nic_code} qualifies as Manufacturer or Service Provider. Full statutory protections apply.",
        "sec_43bh_applicable": True,
        "msefc_samadhaan_applicable": True
    }


def check_contractual_terms_override(agreed_credit_days: int) -> dict:
    """
    Edge Case 15: Contractual 90-Day Payment Terms Override.
    Statute: Section 15 Proviso & Section 24 non-obstante clause of MSMED Act 2006.
    Rule: Even if signed in PO, payment terms cannot exceed 45 days. Contract clause is void ultra vires.
    """
    if agreed_credit_days > MAX_CREDIT_PERIOD_DAYS:
        return {
            "is_contract_overridden": True,
            "contractual_days": agreed_credit_days,
            "statutory_effective_days": MAX_CREDIT_PERIOD_DAYS,
            "citation": "Section 15 Proviso read with Section 24 of MSMED Act, 2006",
            "legal_finding": f"Signed PO term of {agreed_credit_days} days is void ultra vires. Overridden to statutory ceiling of {MAX_CREDIT_PERIOD_DAYS} days by operation of law."
        }
    return {
        "is_contract_overridden": False,
        "contractual_days": agreed_credit_days,
        "statutory_effective_days": agreed_credit_days,
        "legal_finding": f"Agreed term of {agreed_credit_days} days conforms to statutory ceiling of {MAX_CREDIT_PERIOD_DAYS} days."
    }


def apply_statutory_appropriation(
    principal_amount: float,
    accrued_interest: float,
    payment_received: float,
    debtor_remark: str = ""
) -> dict:
    """
    Edge Case 16: Partial Payment Interest Appropriation.
    Precedent: Supreme Court in Gurpreet Singh v. Union of India (2006) & Section 60 Indian Contract Act, 1872.
    Rule: Debtor cannot earmark payment 'towards principal only' to suppress future compounding.
    Statutory rule: Allocation order is: (1) Costs, (2) Accrued Penal Interest, (3) Principal.
    """
    # Interest cleared first
    interest_cleared = round(min(accrued_interest, payment_received), 2)
    surplus_after_interest = round(payment_received - interest_cleared, 2)
    
    # Principal cleared from surplus
    principal_cleared = round(min(principal_amount, surplus_after_interest), 2)
    
    remaining_principal = round(principal_amount - principal_cleared, 2)
    remaining_interest = round(accrued_interest - interest_cleared, 2)
    total_remaining_balance = round(remaining_principal + remaining_interest, 2)
    
    # New future daily compounding rate on adjusted principal
    new_daily_compounding_rate = round((remaining_principal * (STATUTORY_PENAL_RATE / 100.0)) / 365.0, 2) if remaining_principal > 0 else 0.0
    
    has_remark_conflict = False
    remark_warning = ""
    if debtor_remark and "principal" in debtor_remark.lower() and accrued_interest > 0:
        has_remark_conflict = True
        remark_warning = "Debtor instruction 'towards principal only' is legally overridden by Section 60 Contract Act and Gurpreet Singh v. UOI precedent. Payment allocated to accrued interest first."

    return {
        "payment_received": round(payment_received, 2),
        "allocated_to_accrued_interest": interest_cleared,
        "allocated_to_principal": principal_cleared,
        "remaining_interest": remaining_interest,
        "remaining_principal": remaining_principal,
        "total_remaining_balance": total_remaining_balance,
        "new_daily_compounding_rate_rupees": new_daily_compounding_rate,
        "has_remark_conflict": has_remark_conflict,
        "remark_advisory": remark_warning,
        "statutory_precedent": "Gurpreet Singh v. Union of India (2006) 8 SCC 457 & Sec 60 Indian Contract Act 1872"
    }


def calculate_section_43bh_tax_status(
    principal_amount: float,
    statutory_due_date_str: str,
    calculation_date_str: str = None
) -> dict:
    """
    Edge Case 17: Section 43B(h) Fiscal Year-End vs In-Year Delays.
    Tax Statute: Section 43B(h) Income Tax Act, 1961 (inserted by Finance Act 2023).
    Rule: Deduction is disallowed ONLY if amount remains unpaid on March 31 of the financial year.
    If paid before March 31, Section 16 penal interest is owed, but tax deduction is NOT disallowed!
    """
    due_date = datetime.strptime(statutory_due_date_str, "%Y-%m-%d").date()
    calc_date = datetime.strptime(calculation_date_str, "%Y-%m-%d").date() if calculation_date_str else date.today()
    
    # Determine the Fiscal Year (April 1 to March 31)
    if due_date.month >= 4:
        fy_start_year = due_date.year
        fy_end_year = due_date.year + 1
    else:
        fy_start_year = due_date.year - 1
        fy_end_year = due_date.year
        
    march_31_cutoff = date(fy_end_year, 3, 31)
    tax_disallowance_amount = round(principal_amount * 0.3120, 2)  # 30% corporate tax + 4% cess = 31.20%
    
    if calc_date <= due_date:
        return {
            "status": "NOT_OVERDUE",
            "fiscal_year": f"FY {fy_start_year}-{str(fy_end_year)[-2:]}",
            "march_31_cutoff": march_31_cutoff.isoformat(),
            "is_disallowed_now": False,
            "disallowance_risk": "NONE",
            "corporate_tax_disallowance_rupees": 0.0,
            "advisory": "Within statutory credit period. No Section 43B(h) liability."
        }
        
    if calc_date <= march_31_cutoff:
        return {
            "status": "OVERDUE_IN_YEAR",
            "fiscal_year": f"FY {fy_start_year}-{str(fy_end_year)[-2:]}",
            "march_31_cutoff": march_31_cutoff.isoformat(),
            "is_disallowed_now": False,
            "disallowance_risk": "IMMINENT_AT_YEAR_END",
            "corporate_tax_disallowance_rupees": tax_disallowance_amount,
            "advisory": f"Invoice overdue. Section 16 penal interest active. Section 43B(h) deduction disallowance (Rs. {tax_disallowance_amount:,.2f}) will trigger on {march_31_cutoff} if unpaid before fiscal year close."
        }
        
    # Crossed March 31!
    return {
        "status": "DISALLOWED_AT_YEAR_END",
        "fiscal_year": f"FY {fy_start_year}-{str(fy_end_year)[-2:]}",
        "march_31_cutoff": march_31_cutoff.isoformat(),
        "is_disallowed_now": True,
        "disallowance_risk": "ACTIVE_DISALLOWANCE",
        "corporate_tax_disallowance_rupees": tax_disallowance_amount,
        "advisory": f"Crossed fiscal year cutoff ({march_31_cutoff}). Rs. {tax_disallowance_amount:,.2f} corporate tax deduction is legally disallowed in debtor's ITR. Add-back to taxable income mandatory."
    }


def check_presumptive_tax_status(buyer_entity_type: str = "COMPANY", is_presumptive_44ad: bool = False) -> dict:
    """
    Edge Case 18: Buyers Under Presumptive Taxation (Section 44AD / 44ADA).
    Rule: If buyer pays tax under presumptive scheme, they don't maintain books under Section 44AA.
    Result: Section 43B(h) does not apply to presumptive taxpayers. Section 16 interest still applies 100%!
    """
    if is_presumptive_44ad or (buyer_entity_type and buyer_entity_type.upper() in ["PRESUMPTIVE_44AD", "INDIVIDUAL_44AD"]):
        return {
            "is_presumptive": True,
            "sec_43bh_applicable": False,
            "sec_16_interest_applicable": True,
            "legal_finding": "Buyer is assessed under Section 44AD/44ADA presumptive taxation. Section 43B(h) tax disallowance inapplicable (books not audited under Sec 44AA). Section 16 penal interest (16.50%) remains fully enforceable."
        }
    return {
        "is_presumptive": False,
        "sec_43bh_applicable": True,
        "sec_16_interest_applicable": True,
        "legal_finding": "Buyer is an audited corporate/commercial entity. Both Section 43B(h) tax disallowance and Section 16 compound interest apply with full statutory force."
    }


def check_ibc_moratorium_status(buyer_nclt_status: str = "ACTIVE") -> dict:
    """
    Edge Case 23: The Insolvency & Bankruptcy Code (IBC) Moratorium Trap.
    Statute: Section 14 read with Section 238 of the IBC, 2016.
    Rule: IBC overrides the MSMED Act. If debtor is in CIRP (Corporate Insolvency Resolution Process),
    all MSMED notices/claims are stayed. Creditor must submit IBBI Form B to the Resolution Professional (RP).
    """
    status_upper = str(buyer_nclt_status).strip().upper()
    if status_upper in ["CIRP", "MORATORIUM", "NCLT_ADMITTED", "LIQUIDATION"]:
        return {
            "is_under_moratorium": True,
            "nclt_status": status_upper,
            "action": "HALT_MSMED_ESCALATION",
            "statutory_override": "Section 238 of Insolvency and Bankruptcy Code (IBC) 2016 overrides MSMED Act 2006",
            "required_remedy": "FILE_IBBI_FORM_B_OPERATIONAL_CREDITOR",
            "message": "Debtor is under NCLT Section 14 moratorium. Section 16 notices/MSEFC Samadhaan actions are stayed by operation of law. Platform automatically generates IBBI Form B for submission to the Interim Resolution Professional (IRP)."
        }
    return {
        "is_under_moratorium": False,
        "nclt_status": "ACTIVE_SOLVENT",
        "action": "PROCEED_MSMED_RECOVERY",
        "statutory_override": None,
        "required_remedy": "MSMED_CHAPTER_V",
        "message": "Debtor is active and solvent. Full statutory recovery and MSEFC Samadhaan proceedings operational."
    }


if __name__ == "__main__":
    print(f"--- DhanSetu.AI Statutory Legal Math & Edge Case Engine ---")
    print(f"Current RBI Bank Rate: {RBI_BANK_RATE}%")
    print(f"Section 16 Statutory Compounding Rate: {STATUTORY_PENAL_RATE}% p.a.\n")
    
    # Test standard ₹2,50,000 invoice
    result = calculate_msme_penal_interest(
        principal_amount=250000.0,
        invoice_date_str="2024-05-10",
        agreed_credit_days=90,  # Deliberately test 90-day PO override!
        calculation_date_str="2024-10-15"
    )
    print(f"Principal: Rs. {result['principal_amount']:,.2f}")
    print(f"Statutory Due Date (Section 15 capped): {result['statutory_due_date']}")
    print(f"Days Overdue: {result['days_overdue']} days")
    print(f"Accrued Interest (16.50% p.a.): Rs. {result['interest_accrued']:,.2f}\n")
    
    # Test Edge Case 12: Silpi Industries
    silpi_test = check_udyam_eligibility("2024-01-10", "2024-02-15")
    print(f"Edge Case 12 (Silpi Industries): {silpi_test['status']} -> {silpi_test['message']}\n")
    
    # Test Edge Case 13: Trader Exclusion
    trader_test = check_trader_exclusion("46900")
    print(f"Edge Case 13 (Trader NIC 46): {trader_test['status']} -> {trader_test['message']}\n")
    
    # Test Edge Case 16: Appropriation
    approp_test = apply_statutory_appropriation(250000.0, 18234.50, 50000.0, "Towards principal only")
    print(f"Edge Case 16 (Appropriation): Interest Cleared: Rs. {approp_test['allocated_to_accrued_interest']}, Principal Cleared: Rs. {approp_test['allocated_to_principal']}")
    print(f"Remark Conflict: {approp_test['remark_advisory']}\n")
    
    # Test Edge Case 17: 43B(h) Fiscal Year
    tax_test = calculate_section_43bh_tax_status(250000.0, "2024-06-24", "2024-09-15")
    print(f"Edge Case 17 (43B(h) Timing): Status: {tax_test['status']}, Advisory: {tax_test['advisory']}\n")
    
    # Test Edge Case 23: IBC Moratorium
    ibc_test = check_ibc_moratorium_status("CIRP")
    print(f"Edge Case 23 (IBC Moratorium): {ibc_test['action']} -> {ibc_test['required_remedy']}\n")


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

if __name__ == "__main__":
    print(f"--- Vasool AI Statutory Legal Math Engine ---")
    print(f"Current RBI Bank Rate: {RBI_BANK_RATE}%")
    print(f"Section 16 Statutory Compounding Rate: {STATUTORY_PENAL_RATE}% p.a.\n")
    
    # Test with standard ₹2,50,000 invoice dated 2024-05-10
    result = calculate_msme_penal_interest(
        principal_amount=250000.0,
        invoice_date_str="2024-05-10",
        agreed_credit_days=30,
        calculation_date_str="2024-10-15"
    )
    print(f"Principal Amount: Rs. {result['principal_amount']:,.2f}")
    print(f"Statutory Due Date (Section 15): {result['statutory_due_date']}")
    print(f"Days Overdue: {result['days_overdue']} days")
    print(f"Statutory Interest Accrued (Section 16): Rs. {result['interest_accrued']:,.2f}")
    print(f"Total Claim Amount: Rs. {result['total_recoverable_amount']:,.2f}")
    print(f"Daily Compounding Ticker: Rs. {result['daily_compounding_rate_rupees']} / day\n")
    print(f"Monthly Compounding Schedule ({len(result['monthly_schedule'])} periods):")
    for s in result['monthly_schedule']:
        print(f"  Month {s['month']} ({s['period_start']} to {s['period_end']}): Opening Rs. {s['opening_balance']:,.2f} + Interest Rs. {s['interest_added']:,.2f} = Closing Rs. {s['closing_balance']:,.2f}")

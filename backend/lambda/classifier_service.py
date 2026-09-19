import os
import json
import re
import boto3
from dotenv import load_dotenv

load_dotenv()

REGION = os.getenv("AWS_DEFAULT_REGION", "us-east-1")

from botocore.config import Config

FAST_CFG = Config(connect_timeout=1, read_timeout=1, retries={'max_attempts': 0})

def get_bedrock_client():
    return boto3.client(
        "bedrock-runtime",
        region_name=REGION,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        config=FAST_CFG
    )

def analyze_buyer_excuse(
    excuse_text: str,
    days_since_delivery: int = 45,
    has_signed_pod: bool = True,
    principal_amount: float = 250000.0,
    daily_interest_rate: float = 138.70
) -> dict:
    """
    Analyzes buyer excuse / communication text using Bedrock (Claude 3 Haiku)
    with seamless local legal heuristic engine fallback.
    
    Evaluates:
    - Stalling Category (Late Quality, Liquidity Crunch, Administrative Delay, Wilful Evasion)
    - MSMED Act 2006 Section 15/16 statutory counter-arguments
    - Credibility score (0-100)
    - Suggested escalation action (Tier 1 Amicable Offer, Tier 2 Formal Legal Notice, Tier 3 Samadhaan Filing)
    """
    # 1. Attempt AWS Bedrock Claude 3 Haiku
    prompt = f"""
You are an expert MSME Debt Recovery & Statutory Legal Auditor specializing in India's MSMED Act, 2006.
Analyze the following buyer communication/excuse regarding an unpaid invoice:

Buyer Message: "{excuse_text}"
Days Since Delivery: {days_since_delivery}
Signed Proof of Delivery (POD) on file: {has_signed_pod}
Principal Amount: Rs. {principal_amount:,.2f}
Daily Statutory Penal Compounding: Rs. {daily_interest_rate:,.2f} / day

Analyze this excuse and return ONLY a valid JSON object with the following keys:
- "tactic_category": one of ["LATE_QUALITY_DISPUTE", "LIQUIDITY_STALLING", "ADMINISTRATIVE_DELAY", "WILFUL_EVASION", "GENUINE_RECONCILIATION"]
- "tactic_label": Human readable title
- "statutory_vulnerability": Specific violation of MSMED Act (Section 15 15-day objection rule, Section 16 non-obstante clause, etc.)
- "credibility_score": integer 0-100 (how legally tenable is buyer's claim)
- "statutory_counter_argument": 2-3 sentence legal rebuttal quoting MSMED Act 2006
- "recommended_action": "TIER_1_AMICABLE" or "TIER_2_STATUTORY_NOTICE" or "TIER_3_SAMADHAAN_FILING"
- "action_summary": What the MSME owner should do right now.
"""
    import concurrent.futures
    try:
        def _call_bedrock():
            client = get_bedrock_client()
            b = json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 600,
                "messages": [{"role": "user", "content": prompt}]
            })
            resp = client.invoke_model(
                modelId="anthropic.claude-3-haiku-20240307-v1:0",
                body=b
            )
            res_body = json.loads(resp["body"].read().decode("utf-8"))
            return res_body["content"][0]["text"]

        executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
        try:
            future = executor.submit(_call_bedrock)
            text_content = future.result(timeout=1.5)
        finally:
            try:
                executor.shutdown(wait=False, cancel_futures=True)
            except Exception:
                pass

        # Extract JSON
        json_match = re.search(r"\{.*\}", text_content, re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group(0))
            parsed["engine"] = "AWS_BEDROCK_CLAUDE_HAIKU"
            return parsed
    except Exception as e:
        # Fallback to local statutory heuristic engine
        pass

    # Local Statutory Reasoning Heuristic Engine
    lower = excuse_text.lower()
    
    # 1. Check Quality / Defect dispute
    if any(k in lower for k in ["defect", "quality", "damaged", "rejection", "sample", "finish", "broken", "specs", "wrong item"]):
        category = "LATE_QUALITY_DISPUTE"
        label = "Belated Quality Dispute (Statutorily Barred)"
        if days_since_delivery > 15:
            vuln = f"Section 15 MSMED Act Proviso: Objection raised after {days_since_delivery} days. Under Indian statutory law, buyer has only 15 days from delivery to lodge defect objections. Deemed acceptance applies."
            counter = f"Pursuant to the Proviso to Section 15 of MSMED Act 2006, any dispute regarding quality or specifications was required to be communicated within 15 days of delivery. Goods were delivered {days_since_delivery} days ago with signed POD. This belated objection is legally void and barred before the MSEFC Council."
            score = 15
            rec = "TIER_2_STATUTORY_NOTICE"
            summary = "Reject late defect claim citing Section 15 15-day deemed acceptance rule. Issue Tier-2 Statutory Notice."
        else:
            vuln = "Section 15 MSMED Act: Defect raised within 15 days. Joint inspection required."
            counter = "Immediate joint inspection requested within 48 hours. If buyer fails to produce defective samples, full invoice amount remains due under Section 15."
            score = 65
            rec = "TIER_1_AMICABLE"
            summary = "Offer 48-hour joint inspection. If rejected, demand full settlement."
            
    # 2. Check Liquidity / Client payment stalling
    elif any(k in lower for k in ["client", "funds", "cash flow", "budget", "cleared", "payment from government", "waiting for release", "next month", "financial"]):
        category = "LIQUIDITY_STALLING"
        label = "Third-Party Liquidity Stalling"
        vuln = "Section 16 MSMED Act Non-Obstante Clause: Third-party client delays or back-to-back payment dependencies are statutorily invalid against MSME suppliers."
        counter = f"Section 16 of MSMED Act 2006 explicitly overrides any third-party payment dependency. The buyer is personally liable for compounding interest at 16.50% p.a. (currently accruing at Rs. {daily_interest_rate:,.2f}/day) regardless of when their client clears payment."
        score = 25
        rec = "TIER_1_AMICABLE" if days_since_delivery < 60 else "TIER_2_STATUTORY_NOTICE"
        summary = f"Send Tier-1 Amicable Offer with 5-day grace to waive interest of Rs. {daily_interest_rate*15:,.0f}. Inform them that waiting adds Rs. {daily_interest_rate*7:,.0f}/week."
        
    # 3. Check Administrative / Approval / Billing loop
    elif any(k in lower for k in ["audit", "director", "approval", "signature", "traveling", "out of office", "gst credit", "bill missing", "portal error", "re-send"]):
        category = "ADMINISTRATIVE_DELAY"
        label = "Administrative / Approval Stalling Loop"
        vuln = "Section 15 MSMED Act 45-Day Statutory Cap: Internal corporate approvals cannot extend the statutory 45-day payment ceiling."
        counter = f"Internal accounting procedures cannot override the mandatory 45-day limit of Section 15. The statutory due date has lapsed, and statutory penal interest under Section 16 is accumulating daily at Rs. {daily_interest_rate:,.2f} per day."
        score = 30
        rec = "TIER_1_AMICABLE"
        summary = "Provide re-sent invoice with official 5-day payment demand and running interest clock."
        
    # 4. Wilful Evasion / Ghosting / Default
    else:
        category = "WILFUL_EVASION"
        label = "Unsubstantiated Stalling / Wilful Default"
        vuln = "Section 16 & 17 MSMED Act: Wilful non-payment triggers mandatory monthly compounding interest and MSEFC recovery proceedings."
        counter = f"The buyer has failed to provide a valid statutory justification for non-payment. Full principal of Rs. {principal_amount:,.2f} plus statutory compound interest at 16.50% p.a. is immediately recoverable through the MSEFC Samadhaan portal."
        score = 10
        rec = "TIER_2_STATUTORY_NOTICE"
        summary = "Issue Formal Statutory Demand Notice immediately, giving 15 days before MSEFC Samadhaan arbitration filing."

    return {
        "tactic_category": category,
        "tactic_label": label,
        "statutory_vulnerability": vuln,
        "credibility_score": score,
        "statutory_counter_argument": counter,
        "recommended_action": rec,
        "action_summary": summary,
        "engine": "STATUTORY_HEURISTIC_REASONER"
    }

if __name__ == "__main__":
    test_excuse_1 = "Goods received had scratched paint and finish issues, we cannot clear the invoice until QC re-evaluates."
    print("--- Test 1: Late Quality Dispute ---")
    res1 = analyze_buyer_excuse(test_excuse_1, days_since_delivery=65)
    print(json.dumps(res1, indent=2))
    
    test_excuse_2 = "Our main contractor NHAI has delayed our milestone release. Once funds arrive in 2 months, we will clear your payment."
    print("\n--- Test 2: Liquidity Stalling ---")
    res2 = analyze_buyer_excuse(test_excuse_2, days_since_delivery=80)
    print(json.dumps(res2, indent=2))

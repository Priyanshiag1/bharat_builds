import os
import json
import time
import secrets
from datetime import datetime, date, timedelta
from decimal import Decimal
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

# Load local environment if present
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

# Environment Variables
AWS_REGION = os.environ.get("AWS_REGION", os.environ.get("AWS_DEFAULT_REGION", "us-east-1"))
DOCUMENT_BUCKET = os.environ.get("DOCUMENT_BUCKET", "vasool-ai-docs-755329540684")
CLAIMS_TABLE = os.environ.get("CLAIMS_TABLE", "vasuli_claims")
BUYER_SESSIONS_TABLE = os.environ.get("BUYER_SESSIONS_TABLE", "vasuli_buyer_sessions")
CONFIG_TABLE = os.environ.get("CONFIG_TABLE", "vasuli_config")
AUDIT_LOGS_TABLE = os.environ.get("AUDIT_LOGS_TABLE", "vasuli_audit_logs")
RBI_BANK_RATE = float(os.environ.get("RBI_BANK_RATE", "6.75"))
STATUTORY_PENAL_RATE = RBI_BANK_RATE * 3.0 # 20.25% p.a.
DEMO_MODE = os.environ.get("DEMO_MODE", "true").lower() == "true"

dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
s3_client = boto3.client("s3", region_name=AWS_REGION)

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def response(status_code: int, body: dict):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
        },
        "body": json.dumps(body, default=decimal_default),
    }

def to_decimal(obj):
    if isinstance(obj, float):
        return Decimal(str(round(obj, 2)))
    elif isinstance(obj, dict):
        return {k: to_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [to_decimal(v) for v in obj]
    return obj

def calculate_interest(principal: float, inv_date_str: str, calc_date_str: str = None, agreed_credit_days: int = 30):
    inv_date = datetime.strptime(inv_date_str, "%Y-%m-%d").date()
    capped_days = min(agreed_credit_days, 45) # Section 15 statutory cap
    due_date = inv_date + timedelta(days=capped_days)
    calc_date = datetime.strptime(calc_date_str, "%Y-%m-%d").date() if calc_date_str else date.today()
    
    if calc_date <= due_date:
        return {
            "principal_amount": principal,
            "statutory_due_date": due_date.isoformat(),
            "calculation_date": calc_date.isoformat(),
            "days_overdue": 0,
            "interest_accrued": 0.0,
            "total_recoverable_amount": principal,
            "is_overdue": False,
            "statutory_penal_rate": STATUTORY_PENAL_RATE,
            "daily_compounding_rate_rupees": 0.0
        }
        
    days_overdue = (calc_date - due_date).days
    monthly_rate = (STATUTORY_PENAL_RATE / 100.0) / 12.0
    
    current_balance = principal
    month_cursor = due_date
    schedule = []
    month_num = 1
    
    while month_cursor < calc_date:
        year = month_cursor.year + (month_cursor.month // 12)
        month = (month_cursor.month % 12) + 1
        day = min(month_cursor.day, 28)
        next_month_cursor = date(year, month, day)
        
        if next_month_cursor <= calc_date:
            interest = round(current_balance * monthly_rate, 2)
            current_balance = round(current_balance + interest, 2)
            schedule.append({
                "month": month_num,
                "period": f"{month_cursor} to {next_month_cursor}",
                "interest": interest,
                "closing": current_balance
            })
            month_cursor = next_month_cursor
            month_num += 1
        else:
            partial_days = (calc_date - month_cursor).days
            partial_rate = monthly_rate * (partial_days / 30.0)
            interest = round(current_balance * partial_rate, 2)
            current_balance = round(current_balance + interest, 2)
            schedule.append({
                "month": month_num,
                "period": f"{month_cursor} to {calc_date}",
                "interest": interest,
                "closing": current_balance,
                "is_partial": True
            })
            break
            
    interest_accrued = round(current_balance - principal, 2)
    daily_rate = round((current_balance * (STATUTORY_PENAL_RATE / 100.0)) / 365.0, 2)
    
    return {
        "principal_amount": principal,
        "statutory_due_date": due_date.isoformat(),
        "calculation_date": calc_date.isoformat(),
        "days_overdue": days_overdue,
        "interest_accrued": interest_accrued,
        "total_recoverable_amount": current_balance,
        "is_overdue": True,
        "statutory_penal_rate": STATUTORY_PENAL_RATE,
        "daily_compounding_rate_rupees": daily_rate,
        "monthly_schedule": schedule
    }

def lambda_handler(event, context):
    print(f"Incoming Event: {json.dumps(event, default=str)}")

    # 1. Direct invocation from Step Functions
    if "action" in event:
        action = event.get("action")
        claim_id = event.get("claim_id")
        table = dynamodb.Table(CLAIMS_TABLE)
        res = table.get_item(Key={"claim_id": claim_id})
        claim = res.get("Item", {})

        if action == "SEND_TIER1_NOTICE":
            claim["status"] = "TIER_1_NOTICE_SENT"
            claim["tier1_sent_at"] = int(time.time())
            table.put_item(Item=to_decimal(claim))
            return {"status": "TIER_1_SENT", "claim_id": claim_id}

        elif action == "CHECK_STATUS":
            current_status = claim.get("status", "TIER_1_NOTICE_SENT")
            is_settled = "SETTLED" in current_status
            return {"status": "SETTLED" if is_settled else "OVERDUE", "claim_id": claim_id}

        elif action == "SEND_TIER2_NOTICE":
            claim["status"] = "TIER_2_STATUTORY_DEMAND_SENT"
            claim["tier2_sent_at"] = int(time.time())
            table.put_item(Item=to_decimal(claim))
            return {"status": "TIER_2_SENT", "claim_id": claim_id}

        elif action == "GENERATE_TIER3_DOSSIER":
            claim["status"] = "MSEFC_SAMADHAAN_READY"
            claim["tier3_ready_at"] = int(time.time())
            table.put_item(Item=to_decimal(claim))
            return {"status": "TIER_3_READY", "claim_id": claim_id}

    # 2. HTTP API Gateway Handling
    http_method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    path_params = event.get("pathParameters") or {}
    body_str = event.get("body") or "{}"
    try:
        body = json.loads(body_str) if body_str else {}
    except Exception:
        body = {}

    # Health Check
    if path == "/" and http_method == "GET":
        return response(200, {
            "status": "online",
            "service": "Vasuli AWS Statutory Recovery Engine",
            "track": "Ship It (AWS Hackathon 2026)",
            "demo_mode": DEMO_MODE,
            "statutory_rate": f"{STATUTORY_PENAL_RATE}% p.a. (3x RBI {RBI_BANK_RATE}%)"
        })

    # Claims Collection: GET /claims, POST /claims
    claims_table = dynamodb.Table(CLAIMS_TABLE)
    if path == "/claims" or path == "/claims/":
        if http_method == "GET":
            scan_res = claims_table.scan()
            items = scan_res.get("Items", [])
            return response(200, {"claims": items, "count": len(items)})

        elif http_method == "POST":
            claim_id = body.get("claim_id") or f"CLAIM-{int(time.time()*1000)}"
            body["claim_id"] = claim_id
            body["created_at"] = int(time.time())
            body["status"] = body.get("status", "DRAFT")
            claims_table.put_item(Item=to_decimal(body))
            return response(201, {"message": "Claim created successfully", "claim": body})

    # Single Claim: /claims/{claim_id}
    if "claim_id" in path_params:
        claim_id = path_params["claim_id"]
        res = claims_table.get_item(Key={"claim_id": claim_id})
        claim = res.get("Item")
        if not claim and http_method != "PUT":
            return response(404, {"error": f"Claim {claim_id} not found"})

        if path.endswith(f"/claims/{claim_id}"):
            if http_method == "GET":
                return response(200, {"claim": claim})
            elif http_method == "PUT":
                body["claim_id"] = claim_id
                body["updated_at"] = int(time.time())
                claims_table.put_item(Item=to_decimal(body))
                return response(200, {"message": "Claim updated", "claim": body})

        # POST /claims/{claim_id}/audit
        if path.endswith("/audit") and http_method == "POST":
            principal = float(claim.get("principal_amount", 250000.0))
            inv_date = claim.get("invoice_date", "2024-05-10")
            calc_result = calculate_interest(principal, inv_date)
            claim["audit_result"] = calc_result
            claim["status"] = "AUDITED"
            claims_table.put_item(Item=to_decimal(claim))
            return response(200, {"claim_id": claim_id, "audit": calc_result})

        # POST /claims/{claim_id}/classify-excuse
        if path.endswith("/classify-excuse") and http_method == "POST":
            excuse = body.get("excuse_text", "")
            lower = excuse.lower()
            if any(k in lower for k in ["defect", "quality", "damaged", "specs"]):
                classification = {
                    "category": "LATE_QUALITY_DISPUTE",
                    "label": "Belated Quality Dispute (Statutorily Barred)",
                    "statutory_rule": "Section 15 MSMED Act Proviso: Defect objections must be notified within 15 days of delivery. Deemed acceptance applies.",
                    "leverage_score": 20,
                    "action": "TIER_2_STATUTORY_NOTICE"
                }
            elif any(k in lower for k in ["client", "funds", "budget", "cleared"]):
                classification = {
                    "category": "LIQUIDITY_STALLING",
                    "label": "Third-Party Liquidity Stalling",
                    "statutory_rule": "Section 16 Non-Obstante Clause: Third-party client dependencies are legally invalid against MSME recovery.",
                    "leverage_score": 30,
                    "action": "TIER_1_AMICABLE"
                }
            else:
                classification = {
                    "category": "WILFUL_EVASION",
                    "label": "Unsubstantiated Stalling",
                    "statutory_rule": "Section 16 & 17 MSMED Act: Failure to pay invokes mandatory 20.25% compounding interest.",
                    "leverage_score": 10,
                    "action": "TIER_2_STATUTORY_NOTICE"
                }
            claim["last_dispute_classification"] = classification
            claims_table.put_item(Item=to_decimal(claim))
            return response(200, {"claim_id": claim_id, "classification": classification})

        # POST /claims/{claim_id}/generate-notice
        if path.endswith("/generate-notice") and http_method == "POST":
            tier = body.get("tier", "TIER_1")
            s3_key = f"generated-letters/{claim_id}/{tier.lower()}.pdf"
            presigned_url = f"https://{DOCUMENT_BUCKET}.s3.amazonaws.com/{s3_key}"
            try:
                presigned_url = s3_client.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": DOCUMENT_BUCKET, "Key": s3_key},
                    ExpiresIn=86400
                )
            except Exception:
                pass

            notice_info = {
                "tier": tier,
                "s3_key": s3_key,
                "url": presigned_url,
                "generated_at": int(time.time())
            }
            if "notices" not in claim:
                claim["notices"] = []
            claim["notices"].append(notice_info)
            claims_table.put_item(Item=to_decimal(claim))
            return response(200, {"claim_id": claim_id, "notice": notice_info})

        # POST /claims/{claim_id}/start-recovery
        if path.endswith("/start-recovery") and http_method == "POST":
            token = secrets.token_urlsafe(20)
            sessions_table = dynamodb.Table(BUYER_SESSIONS_TABLE)
            session_data = {
                "claim_token": token,
                "claim_id": claim_id,
                "buyer_name": claim.get("buyer_name", "Buyer Company"),
                "principal_amount": claim.get("principal_amount", 250000.0),
                "status": "MAGIC_LINK_ACTIVE",
                "created_at": int(time.time()),
                "expires_at": int(time.time()) + (86400 * 14)
            }
            sessions_table.put_item(Item=to_decimal(session_data))
            claim["magic_token"] = token
            claim["status"] = "TIER_1_PENDING"
            claims_table.put_item(Item=to_decimal(claim))
            return response(200, {
                "claim_id": claim_id,
                "magic_token": token,
                "buyer_portal_url": f"/buyer-portal?token={token}"
            })

    # Buyer Portal Endpoints: /buyer/portal/{token}
    if "token" in path_params:
        token = path_params["token"]
        sessions_table = dynamodb.Table(BUYER_SESSIONS_TABLE)
        res = sessions_table.get_item(Key={"claim_token": token})
        session = res.get("Item")
        if not session:
            return response(404, {"error": "Invalid or expired settlement session link"})

        claim_id = session.get("claim_id")
        claim_res = claims_table.get_item(Key={"claim_id": claim_id})
        claim = claim_res.get("Item", {})

        if path.endswith(f"/buyer/portal/{token}") and http_method == "GET":
            return response(200, {
                "session": session,
                "claim": claim,
                "statutory_discount_available": True,
                "interest_waiver_savings": claim.get("audit_result", {}).get("interest_accrued", 18180.03)
            })

        if path.endswith("/respond") and http_method == "POST":
            action = body.get("action", "ACCEPT_AMICABLE")
            session["buyer_action"] = action
            session["response_details"] = body.get("details", {})
            session["status"] = "SETTLEMENT_ACCEPTED" if action == "ACCEPT_AMICABLE" else "COUNTER_OFFER"
            sessions_table.put_item(Item=to_decimal(session))

            claim["status"] = "SETTLED" if action == "ACCEPT_AMICABLE" else "BUYER_COUNTER_OFFER"
            claims_table.put_item(Item=to_decimal(claim))
            return response(200, {"message": "Response recorded successfully", "new_status": claim["status"]})

    return response(404, {"error": f"Route not found: {http_method} {path}"})

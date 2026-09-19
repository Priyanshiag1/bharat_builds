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
DOCUMENT_BUCKET = os.environ.get("DOCUMENT_BUCKET", os.environ.get("VASOOL_S3_BUCKET", "vasool-ai-docs-755329540684"))
CLAIMS_TABLE = os.environ.get("CLAIMS_TABLE", "vasuli_claims")
BUYER_SESSIONS_TABLE = os.environ.get("BUYER_SESSIONS_TABLE", "vasuli_buyer_sessions")
CONFIG_TABLE = os.environ.get("CONFIG_TABLE", "vasuli_config")
AUDIT_LOGS_TABLE = os.environ.get("AUDIT_LOGS_TABLE", "vasuli_audit_logs")
RBI_BANK_RATE = float(os.environ.get("RBI_BANK_RATE", "6.75"))
STATUTORY_PENAL_RATE = RBI_BANK_RATE * 3.0 # 20.25% p.a.
DEMO_MODE = os.environ.get("DEMO_MODE", "true").lower() == "true"

# Lazy boto3 client initialization with fast timeout config
_dynamodb = None
_s3_client = None

def get_dynamodb():
    global _dynamodb
    if _dynamodb is None:
        try:
            from botocore.config import Config
            cfg = Config(connect_timeout=1, read_timeout=1, retries={'max_attempts': 0})
            _dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION, config=cfg)
        except Exception:
            _dynamodb = False
    return _dynamodb if _dynamodb is not False else None

def get_s3_client():
    global _s3_client
    if _s3_client is None:
        try:
            from botocore.config import Config
            cfg = Config(connect_timeout=1, read_timeout=1, retries={'max_attempts': 0})
            _s3_client = boto3.client("s3", region_name=AWS_REGION, config=cfg)
        except Exception:
            _s3_client = False
    return _s3_client if _s3_client is not False else None

# Resilient in-memory database store (100% offline fallback)
LOCAL_CLAIMS_DB = {
    "VASULI-2024-DEMO-001": {
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
    },
    "CLM-9082": {
        "claim_id": "CLM-9082",
        "seller_name": "Bharat Precision Components Pvt Ltd",
        "seller_gstin": "27AAACW1234F1Z5",
        "seller_udyam": "UDYAM-MH-01-0012345",
        "buyer_name": "Apex Infrastructure Ltd",
        "buyer_gstin": "07AAAAA0000A1Z5",
        "invoice_number": "INV-2024-089",
        "invoice_date": "2024-05-10",
        "principal_amount": 250000.0,
        "has_signed_pod": True,
        "status": "AUDITED"
    }
}
LOCAL_SESSIONS_DB = {}

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

def from_decimal(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: from_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [from_decimal(v) for v in obj]
    return obj

import concurrent.futures

# Database Helpers with Graceful Fallback
def get_claim_record(claim_id: str) -> dict:
    if DEMO_MODE:
        return LOCAL_CLAIMS_DB.get(claim_id)

    db = get_dynamodb()
    if db:
        try:
            def _get():
                table = db.Table(CLAIMS_TABLE)
                return table.get_item(Key={"claim_id": claim_id})
            executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
            try:
                future = executor.submit(_get)
                res = future.result(timeout=0.8)
                item = res.get("Item")
                if item:
                    return from_decimal(item)
            finally:
                try:
                    executor.shutdown(wait=False, cancel_futures=True)
                except Exception:
                    pass
        except Exception:
            pass
    return LOCAL_CLAIMS_DB.get(claim_id)

def put_claim_record(claim: dict):
    LOCAL_CLAIMS_DB[claim["claim_id"]] = claim
    if DEMO_MODE:
        return

    db = get_dynamodb()
    if db:
        try:
            def _put():
                table = db.Table(CLAIMS_TABLE)
                return table.put_item(Item=to_decimal(claim))
            executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
            try:
                future = executor.submit(_put)
                future.result(timeout=0.8)
            finally:
                try:
                    executor.shutdown(wait=False, cancel_futures=True)
                except Exception:
                    pass
        except Exception:
            pass

def scan_claims_records() -> list:
    if DEMO_MODE:
        return list(LOCAL_CLAIMS_DB.values())

    db = get_dynamodb()
    if db:
        try:
            def _scan():
                table = db.Table(CLAIMS_TABLE)
                return table.scan()
            executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
            try:
                future = executor.submit(_scan)
                scan_res = future.result(timeout=0.8)
                items = scan_res.get("Items", [])
                if items:
                    return [from_decimal(item) for item in items]
            finally:
                try:
                    executor.shutdown(wait=False, cancel_futures=True)
                except Exception:
                    pass
        except Exception:
            pass
    return list(LOCAL_CLAIMS_DB.values())

def get_session_record(token: str) -> dict:
    if DEMO_MODE:
        return LOCAL_SESSIONS_DB.get(token)

    db = get_dynamodb()
    if db:
        try:
            def _get_sess():
                table = db.Table(BUYER_SESSIONS_TABLE)
                return table.get_item(Key={"claim_token": token})
            executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
            try:
                future = executor.submit(_get_sess)
                res = future.result(timeout=0.8)
                item = res.get("Item")
                if item:
                    return from_decimal(item)
            finally:
                try:
                    executor.shutdown(wait=False, cancel_futures=True)
                except Exception:
                    pass
        except Exception:
            pass
    return LOCAL_SESSIONS_DB.get(token)

def put_session_record(session: dict):
    LOCAL_SESSIONS_DB[session["claim_token"]] = session
    if DEMO_MODE:
        return

    db = get_dynamodb()
    if db:
        try:
            def _put_sess():
                table = db.Table(BUYER_SESSIONS_TABLE)
                return table.put_item(Item=to_decimal(session))
            executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
            try:
                future = executor.submit(_put_sess)
                future.result(timeout=0.8)
            finally:
                try:
                    executor.shutdown(wait=False, cancel_futures=True)
                except Exception:
                    pass
        except Exception:
            pass

def calculate_interest(principal: float, inv_date_str: str, calc_date_str: str = None, agreed_credit_days: int = 30):
    try:
        inv_date = datetime.strptime(inv_date_str, "%Y-%m-%d").date()
    except Exception:
        inv_date = date.today() - timedelta(days=72)

    capped_days = min(agreed_credit_days, 45) # Section 15 statutory cap
    due_date = inv_date + timedelta(days=capped_days)
    
    if calc_date_str:
        try:
            calc_date = datetime.strptime(calc_date_str, "%Y-%m-%d").date()
        except Exception:
            calc_date = date.today()
    else:
        calc_date = date.today()
    
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
            "daily_compounding_rate_rupees": 0.0,
            "monthly_schedule": []
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
        claim = get_claim_record(claim_id) or {"claim_id": claim_id}

        if action == "SEND_TIER1_NOTICE":
            claim["status"] = "TIER_1_NOTICE_SENT"
            claim["tier1_sent_at"] = int(time.time())
            put_claim_record(claim)
            return {"status": "TIER_1_SENT", "claim_id": claim_id}

        elif action == "CHECK_STATUS":
            current_status = claim.get("status", "TIER_1_NOTICE_SENT")
            is_settled = "SETTLED" in current_status
            return {"status": "SETTLED" if is_settled else "OVERDUE", "claim_id": claim_id}

        elif action == "SEND_TIER2_NOTICE":
            claim["status"] = "TIER_2_STATUTORY_DEMAND_SENT"
            claim["tier2_sent_at"] = int(time.time())
            put_claim_record(claim)
            return {"status": "TIER_2_SENT", "claim_id": claim_id}

        elif action == "GENERATE_TIER3_DOSSIER":
            claim["status"] = "MSEFC_SAMADHAAN_READY"
            claim["tier3_ready_at"] = int(time.time())
            put_claim_record(claim)
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
    if path == "/claims" or path == "/claims/":
        if http_method == "GET":
            items = scan_claims_records()
            return response(200, {"claims": items, "count": len(items)})

        elif http_method == "POST":
            claim_id = body.get("claim_id") or f"CLAIM-{int(time.time()*1000)}"
            body["claim_id"] = claim_id
            body["created_at"] = int(time.time())
            body["status"] = body.get("status", "DRAFT")
            put_claim_record(body)
            return response(201, {"message": "Claim created successfully", "claim": body})

    # Single Claim: /claims/{claim_id}
    if "claim_id" in path_params:
        claim_id = path_params["claim_id"]
        claim = get_claim_record(claim_id)

        # Allow creation or dynamic calculation if claim doesn't exist yet
        if not claim and http_method == "POST" and path.endswith("/audit"):
            # Auto-provision claim for Person B test adapter
            principal = float(body.get("principal_amount", 250000.0))
            inv_date = body.get("invoice_date", "2024-05-10")
            claim = {
                "claim_id": claim_id,
                "principal_amount": principal,
                "invoice_date": inv_date,
                "buyer_name": body.get("buyer_name", "Apex Infrastructure Ltd"),
                "status": "AUDITED"
            }
            put_claim_record(claim)
        elif not claim and http_method != "PUT":
            return response(404, {"error": f"Claim {claim_id} not found"})

        if path.endswith(f"/claims/{claim_id}"):
            if http_method == "GET":
                return response(200, {"claim": claim})
            elif http_method == "PUT":
                body["claim_id"] = claim_id
                body["updated_at"] = int(time.time())
                put_claim_record(body)
                return response(200, {"message": "Claim updated", "claim": body})

        # POST /claims/{claim_id}/audit
        if path.endswith("/audit") and http_method == "POST":
            principal = float(claim.get("principal_amount", 250000.0))
            inv_date = claim.get("invoice_date", "2024-05-10")
            calc_result = calculate_interest(principal, inv_date)
            claim["audit_result"] = calc_result
            claim["status"] = "AUDITED"
            put_claim_record(claim)
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
            put_claim_record(claim)
            return response(200, {"claim_id": claim_id, "classification": classification})

        # POST /claims/{claim_id}/start-recovery
        if path.endswith("/start-recovery") and http_method == "POST":
            token = secrets.token_urlsafe(20)
            session_data = {
                "claim_token": token,
                "claim_id": claim_id,
                "buyer_name": claim.get("buyer_name", "Buyer Company"),
                "principal_amount": claim.get("principal_amount", 250000.0),
                "status": "MAGIC_LINK_ACTIVE",
                "created_at": int(time.time()),
                "expires_at": int(time.time()) + (86400 * 14)
            }
            put_session_record(session_data)
            claim["magic_token"] = token
            claim["status"] = "TIER_1_PENDING"
            put_claim_record(claim)
            return response(200, {
                "claim_id": claim_id,
                "magic_token": token,
                "buyer_portal_url": f"/resolve/{claim_id}"
            })

    # Buyer Portal Endpoints: /buyer/portal/{token}
    if "token" in path_params:
        token = path_params["token"]
        session = get_session_record(token)
        if not session:
            return response(404, {"error": "Invalid or expired settlement session link"})

        claim_id = session.get("claim_id")
        claim = get_claim_record(claim_id) or {}

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
            session["status"] = "SETTLEMENT_ACCEPTED" if action in ["ACCEPT_AMICABLE", "ACCEPT_EMI", "EMI_PLAN"] else "COUNTER_OFFER"
            put_session_record(session)

            claim["status"] = "SETTLED"
            claim["settlement_type"] = "EMI_PLAN" if "EMI" in action else "LUMP_SUM_DISCOUNT"
            claim["settled_at"] = datetime.now().isoformat()
            put_claim_record(claim)
            return response(200, {"message": "Response recorded successfully", "new_status": claim["status"]})

    return response(404, {"error": f"Route not found: {http_method} {path}"})

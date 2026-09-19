import os
import boto3
from dotenv import load_dotenv
from botocore.exceptions import ClientError

load_dotenv()

from botocore.config import Config

BUCKET_NAME = os.getenv("VASOOL_S3_BUCKET", "vasool-ai-docs-755329540684")
REGION = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
FAST_CFG = Config(connect_timeout=1, read_timeout=1, retries={'max_attempts': 0})

def get_s3_client():
    return boto3.client(
        "s3",
        region_name=REGION,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        config=FAST_CFG
    )

def upload_file_bytes(file_bytes: bytes, s3_key: str, content_type: str = "application/pdf") -> str:
    """
    Uploads raw bytes to the S3 bucket and returns the S3 URI.
    Falls back gracefully to local disk storage if AWS S3 is offline or pending bucket creation.
    """
    # Always persist locally as robust fallback
    local_dir = os.path.join(os.path.dirname(__file__), "..", "storage", os.path.dirname(s3_key))
    os.makedirs(local_dir, exist_ok=True)
    local_file_path = os.path.join(os.path.dirname(__file__), "..", "storage", s3_key)
    try:
        with open(local_file_path, "wb") as f:
            f.write(file_bytes)
    except Exception as e:
        print(f"Local storage write error: {e}")

    import concurrent.futures
    try:
        def _put():
            s3 = get_s3_client()
            return s3.put_object(
                Bucket=BUCKET_NAME,
                Key=s3_key,
                Body=file_bytes,
                ContentType=content_type
            )
        executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
        try:
            future = executor.submit(_put)
            future.result(timeout=1.0)
        finally:
            try:
                executor.shutdown(wait=False, cancel_futures=True)
            except Exception:
                pass
        return f"s3://{BUCKET_NAME}/{s3_key}"
    except Exception as e:
        return f"file://{local_file_path}"

def generate_presigned_url(s3_key: str, expiration: int = 3600) -> str:
    """
    Generates a secure presigned URL to view/download the document.
    Falls back to local API download route if S3 is unavailable or in DEMO_MODE.
    """
    demo_mode = os.getenv("DEMO_MODE", "true").lower() == "true"
    if not demo_mode:
        try:
            def _presign():
                s3 = get_s3_client()
                return s3.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": BUCKET_NAME, "Key": s3_key},
                    ExpiresIn=expiration
                )
            executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
            try:
                future = executor.submit(_presign)
                url = future.result(timeout=1.0)
                if url:
                    return url
            finally:
                try:
                    executor.shutdown(wait=False, cancel_futures=True)
                except Exception:
                    pass
        except Exception:
            pass

    # High-reliability local server endpoint
    return f"http://localhost:8000/api/storage/{s3_key}"

if __name__ == "__main__":
    print(f"Checking S3 service with bucket: {BUCKET_NAME} in {REGION}...")
    sample_key = "test_run/s3_service_test.txt"
    uri = upload_file_bytes(b"S3 Service Verified for Vasool AI", sample_key, "text/plain")
    print("Uploaded:", uri)
    url = generate_presigned_url(sample_key)
    print("Presigned URL:", url[:80] + "...")

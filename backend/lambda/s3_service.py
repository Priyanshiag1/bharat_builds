import os
import boto3
from dotenv import load_dotenv
from botocore.exceptions import ClientError

load_dotenv()

BUCKET_NAME = os.getenv("VASOOL_S3_BUCKET", "vasool-ai-docs-755329540684")
REGION = os.getenv("AWS_DEFAULT_REGION", "us-east-1")

def get_s3_client():
    return boto3.client(
        "s3",
        region_name=REGION,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
    )

def upload_file_bytes(file_bytes: bytes, s3_key: str, content_type: str = "application/pdf") -> str:
    """
    Uploads raw bytes to the S3 bucket and returns the S3 URI.
    """
    s3 = get_s3_client()
    try:
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=file_bytes,
            ContentType=content_type
        )
        return f"s3://{BUCKET_NAME}/{s3_key}"
    except ClientError as e:
        print(f"S3 Upload Error for {s3_key}: {e}")
        raise e

def generate_presigned_url(s3_key: str, expiration: int = 3600) -> str:
    """
    Generates a secure presigned URL to view/download the document.
    """
    s3 = get_s3_client()
    try:
        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": BUCKET_NAME, "Key": s3_key},
            ExpiresIn=expiration
        )
        return url
    except ClientError as e:
        print(f"Error generating presigned URL for {s3_key}: {e}")
        return ""

if __name__ == "__main__":
    print(f"Checking S3 service with bucket: {BUCKET_NAME} in {REGION}...")
    sample_key = "test_run/s3_service_test.txt"
    uri = upload_file_bytes(b"S3 Service Verified for Vasool AI", sample_key, "text/plain")
    print("Uploaded:", uri)
    url = generate_presigned_url(sample_key)
    print("Presigned URL:", url[:80] + "...")

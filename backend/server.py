import os
import sys
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json

# Add lambda directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), "lambda"))
from api_handler import lambda_handler

app = FastAPI(
    title="Vasuli API — MSME Statutory Debt Recovery Engine",
    description="AWS Serverless Backend for MSMED Act 2006 Delayed Payment Recovery",
    version="1.0.0"
)

# Enable CORS for Next.js frontend (localhost:3000) and Amplify
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
async def proxy_to_lambda(path_name: str, request: Request):
    """
    Local developer bridge that routes HTTP requests to the AWS Lambda api_handler.
    This guarantees 100% parity between local testing and live AWS API Gateway!
    """
    body_bytes = await request.body()
    body_str = body_bytes.decode("utf-8") if body_bytes else None

    # Construct AWS API Gateway Proxy Event
    path = "/" + path_name if not path_name.startswith("/") else path_name
    query_params = dict(request.query_params)
    path_parts = [p for p in path_name.split("/") if p]
    
    path_parameters = {}
    if len(path_parts) >= 2 and path_parts[0] == "claims":
        path_parameters["claim_id"] = path_parts[1]
    elif len(path_parts) >= 3 and path_parts[0] == "buyer" and path_parts[1] == "portal":
        path_parameters["token"] = path_parts[2]

    event = {
        "httpMethod": request.method,
        "path": path,
        "queryStringParameters": query_params if query_params else None,
        "pathParameters": path_parameters if path_parameters else None,
        "headers": dict(request.headers),
        "body": body_str
    }

    lambda_res = lambda_handler(event, None)
    
    status_code = lambda_res.get("statusCode", 200)
    response_headers = lambda_res.get("headers", {})
    body = lambda_res.get("body", "{}")

    return Response(
        content=body,
        status_code=status_code,
        headers=response_headers,
        media_type="application/json"
    )

if __name__ == "__main__":
    print("==========================================================")
    print("  Vasuli Local API Gateway Server running on:")
    print("  http://localhost:8000")
    print("  API Docs: http://localhost:8000/docs")
    print("==========================================================")
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)

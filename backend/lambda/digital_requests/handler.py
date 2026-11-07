"""
CampusFlow AI - Digital Request & S3 Document Upload Lambda Handler
Generates secure S3 pre-signed URLs for supporting documents
and persists digital service requests into DynamoDB.
"""

import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

DIGITAL_REQ_TABLE = os.environ.get('DIGITAL_REQ_TABLE', 'CampusFlow_DigitalRequests')
DOCS_BUCKET_NAME = os.environ.get('DOCS_BUCKET_NAME', 'campusflow-student-documents')

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError

def lambda_handler(event, context):
    http_method = event.get('httpMethod', 'POST')
    path = event.get('path', '')
    
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization"
    }

    try:
        # POST /api/digital/presigned-url
        if path.endswith('/presigned-url') or 'presigned' in path:
            body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
            filename = body.get('filename', 'document.pdf')
            file_type = body.get('fileType', 'application/pdf')
            
            key = f"student_uploads/{int(datetime.utcnow().timestamp())}_{filename.replace(' ', '_')}"

            try:
                presigned_url = s3.generate_presigned_url(
                    'put_object',
                    Params={'Bucket': DOCS_BUCKET_NAME, 'Key': key, 'ContentType': file_type},
                    ExpiresIn=900
                )
            except Exception as e:
                # Fallback mock presigned url if bucket not provisioned locally
                presigned_url = f"https://{DOCS_BUCKET_NAME}.s3.amazonaws.com/{key}"

            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({
                    "uploadUrl": presigned_url,
                    "fileKey": key,
                    "expiresInSeconds": 900
                })
            }

        # POST /api/digital/submit
        elif http_method == 'POST':
            body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
            table = dynamodb.Table(DIGITAL_REQ_TABLE)

            request_id = f"DIG-{int(datetime.utcnow().timestamp())}"
            item = {
                "requestId": request_id,
                "serviceId": body.get('serviceId'),
                "studentName": body.get('studentName'),
                "studentId": body.get('studentId'),
                "email": body.get('email'),
                "details": body.get('details'),
                "uploadedFile": body.get('uploadedFile'),
                "status": "SUBMITTED",
                "submittedAt": datetime.utcnow().isoformat(),
                "estimatedTurnaround": "1-2 Business Days"
            }

            table.put_item(Item=item)

            return {
                "statusCode": 201,
                "headers": headers,
                "body": json.dumps(item, default=decimal_default)
            }

    except Exception as e:
        print(f"Error in digital requests lambda: {e}")
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }

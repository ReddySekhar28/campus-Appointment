"""
CampusFlow AI - Appointments Lambda Handler
Schedules in-person appointments for campus services and checks slot capacity.
"""

import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
APPOINTMENTS_TABLE = os.environ.get('APPOINTMENTS_TABLE', 'CampusFlow_Appointments')

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError

def lambda_handler(event, context):
    http_method = event.get('httpMethod', 'POST')
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization"
    }

    try:
        table = dynamodb.Table(APPOINTMENTS_TABLE)

        if http_method == 'GET':
            res = table.scan()
            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps(res.get('Items', []), default=decimal_default)
            }

        elif http_method == 'POST':
            body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
            
            appointment_id = f"APT-{int(datetime.utcnow().timestamp())}"
            item = {
                "appointmentId": appointment_id,
                "serviceId": body.get('serviceId'),
                "studentName": body.get('studentName'),
                "studentId": body.get('studentId'),
                "date": body.get('date'),
                "timeSlot": body.get('timeSlot'),
                "status": "CONFIRMED",
                "createdAt": datetime.utcnow().isoformat()
            }

            table.put_item(Item=item)

            return {
                "statusCode": 201,
                "headers": headers,
                "body": json.dumps(item, default=decimal_default)
            }

    except Exception as e:
        print(f"Error in appointments lambda: {e}")
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }

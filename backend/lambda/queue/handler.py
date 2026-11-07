"""
CampusFlow AI - Queue Management Lambda Handler
Handles ticket issuance, live position lookup, and transparent wait time calculation.
Formula: (Queue Length * Avg Service Duration) / Active Staff Counters
"""

import json
import os
import boto3
import random
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')

QUEUES_TABLE_NAME = os.environ.get('QUEUES_TABLE', 'CampusFlow_Queues')
SERVICES_TABLE_NAME = os.environ.get('SERVICES_TABLE', 'CampusFlow_Services')
STAFF_TABLE_NAME = os.environ.get('STAFF_TABLE', 'CampusFlow_Staff')

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError

def lambda_handler(event, context):
    http_method = event.get('httpMethod', 'GET')
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization"
    }

    try:
        queues_table = dynamodb.Table(QUEUES_TABLE_NAME)
        services_table = dynamodb.Table(SERVICES_TABLE_NAME)

        # GET /api/queue?serviceId=SRV-001
        if http_method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            service_id = query_params.get('serviceId')

            if service_id:
                res = queues_table.scan(
                    FilterExpression="serviceId = :sid",
                    ExpressionAttributeValues={":sid": service_id}
                )
            else:
                res = queues_table.scan()

            items = res.get('Items', [])
            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps(items, default=decimal_default)
            }

        # POST /api/queue (Join standard queue)
        elif http_method == 'POST':
            body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
            service_id = body.get('serviceId')
            student_name = body.get('studentName', 'Student')
            student_id = body.get('studentId', f"STU-{random.randint(1000, 9999)}")

            svc_res = services_table.get_item(Key={'serviceId': service_id})
            svc = svc_res.get('Item')
            if not svc:
                return {
                    "statusCode": 404,
                    "headers": headers,
                    "body": json.dumps({"error": "Service not found"})
                }

            prefix = svc.get('category', 'SVC')[:3].upper()
            ticket_id = f"{prefix}-{random.randint(100, 999)}"
            
            # Calculate wait
            q_len = int(svc.get('currentQueueLength', 0))
            duration = int(svc.get('avgDurationMinutes', 10))
            active_staff = max(1, int(svc.get('activeStaffCount', 1)))
            est_wait = (q_len * duration) // active_staff

            ticket = {
                "ticketId": ticket_id,
                "serviceId": service_id,
                "serviceName": svc.get('name'),
                "studentName": student_name,
                "studentId": student_id,
                "isEmergency": False,
                "status": "WAITING",
                "position": q_len + 1,
                "estimatedWaitMinutes": est_wait,
                "counter": svc.get('counter'),
                "office": svc.get('office'),
                "createdAt": datetime.utcnow().isoformat()
            }

            queues_table.put_item(Item=ticket)
            services_table.update_item(
                Key={'serviceId': service_id},
                UpdateExpression="SET currentQueueLength = currentQueueLength + :inc",
                ExpressionAttributeValues={':inc': 1}
            )

            return {
                "statusCode": 201,
                "headers": headers,
                "body": json.dumps(ticket, default=decimal_default)
            }

        # PATCH /api/queue/status (Call ticket or mark complete)
        elif http_method == 'PATCH':
            body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
            ticket_id = body.get('ticketId')
            status = body.get('status', 'IN_PROGRESS') # 'CALLED', 'IN_PROGRESS', 'COMPLETED'

            res = queues_table.update_item(
                Key={'ticketId': ticket_id},
                UpdateExpression="SET #st = :status",
                ExpressionAttributeNames={"#st": "status"},
                ExpressionAttributeValues={":status": status},
                ReturnValues="ALL_NEW"
            )

            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps(res.get('Attributes', {}), default=decimal_default)
            }

    except Exception as e:
        print(f"Error in queue lambda: {e}")
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }

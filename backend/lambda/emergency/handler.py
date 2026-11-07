"""
CampusFlow AI - Emergency Priority & Quota Lambda Handler
Enforces the strict 2-3 protected emergency slots per service per day rule.
AI flags urgency, but backend DynamoDB quota check and staff approval are authoritative.
"""

import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')

EMERGENCY_TABLE_NAME = os.environ.get('EMERGENCY_TABLE', 'CampusFlow_EmergencyRequests')
SERVICES_TABLE_NAME = os.environ.get('SERVICES_TABLE', 'CampusFlow_Services')
QUEUES_TABLE_NAME = os.environ.get('QUEUES_TABLE', 'CampusFlow_Queues')

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
        emergency_table = dynamodb.Table(EMERGENCY_TABLE_NAME)
        services_table = dynamodb.Table(SERVICES_TABLE_NAME)
        queues_table = dynamodb.Table(QUEUES_TABLE_NAME)

        # GET /api/emergency (List emergency requests)
        if http_method == 'GET':
            res = emergency_table.scan()
            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps(res.get('Items', []), default=decimal_default)
            }

        # POST /api/emergency (Request Emergency Priority Slot)
        elif http_method == 'POST':
            body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
            service_id = body.get('serviceId')
            student_name = body.get('studentName')
            student_id = body.get('studentId')
            email = body.get('email')
            deadline = body.get('deadline')
            reason = body.get('reason')
            supporting_doc_name = body.get('supportingDocName', '')
            supporting_doc_url = body.get('supportingDocUrl', '')

            if not all([service_id, student_name, student_id, deadline, reason]):
                return {
                    "statusCode": 400,
                    "headers": headers,
                    "body": json.dumps({"error": "Missing mandatory fields: serviceId, studentName, studentId, deadline, and reason are required."})
                }

            # 1. Fetch service record to check protected quota
            svc_res = services_table.get_item(Key={'serviceId': service_id})
            svc = svc_res.get('Item')
            if not svc:
                return {
                    "statusCode": 404,
                    "headers": headers,
                    "body": json.dumps({"error": "Service not found"})
                }

            quota_limit = int(svc.get('emergencyQuotaPerDay', 3))
            used_today = int(svc.get('emergencySlotsUsedToday', 0))

            # 2. Strict Quota Enforcement
            if used_today >= quota_limit:
                return {
                    "statusCode": 409,
                    "headers": headers,
                    "body": json.dumps({
                        "success": False,
                        "error": "QUOTA_EXHAUSTED",
                        "message": f"Daily protected emergency quota limit of {quota_limit} reached for {svc.get('name')}.",
                        "quota": { "used": used_today, "limit": quota_limit, "remaining": 0 },
                        "fallbackOptions": [
                            { "type": "BOOK_NEXT_APPOINTMENT", "label": "Book Priority Morning Appointment Tomorrow" },
                            { "type": "DIGITAL_SUBMISSION", "label": "Submit Expedited Digital Request with Supporting Documents" },
                            { "type": "STANDARD_QUEUE", "label": "Join Standard Campus Queue" }
                        ]
                    })
                }

            # 3. Reserve Emergency Slot atomically
            slot_number = used_today + 1
            cat_code = svc.get('category', 'GEN')[:3].upper()
            ticket_id = f"EMG-{cat_code}-00{slot_number}"
            emergency_id = f"EMG-REQ-{int(datetime.utcnow().timestamp())}"
            today_str = datetime.utcnow().strftime('%Y-%m-%d')
            service_date = f"{service_id}#{today_str}"

            emergency_record = {
                "emergencyId": emergency_id,
                "serviceId": service_id,
                "serviceId_date": service_date,
                "serviceName": svc.get('name'),
                "studentName": student_name,
                "studentId": student_id,
                "email": email,
                "deadline": deadline,
                "reason": reason,
                "supportingDocName": supporting_doc_name,
                "supportingDocUrl": supporting_doc_url,
                "status": "PENDING_STAFF_APPROVAL",
                "ticketId": ticket_id,
                "allocatedSlotIndex": slot_number,
                "createdAt": datetime.utcnow().isoformat()
            }

            queue_record = {
                "ticketId": ticket_id,
                "serviceId": service_id,
                "serviceName": svc.get('name'),
                "studentName": student_name,
                "studentId": student_id,
                "isEmergency": True,
                "reason": reason,
                "status": "PENDING_VERIFICATION",
                "position": 1,
                "estimatedWaitMinutes": int(svc.get('avgDurationMinutes', 10)),
                "counter": svc.get('counter'),
                "office": svc.get('office'),
                "createdAt": datetime.utcnow().isoformat()
            }

            # Save records & increment slot count
            emergency_table.put_item(Item=emergency_record)
            queues_table.put_item(Item=queue_record)

            services_table.update_item(
                Key={'serviceId': service_id},
                UpdateExpression="SET emergencySlotsUsedToday = emergencySlotsUsedToday + :inc",
                ExpressionAttributeValues={':inc': 1}
            )

            return {
                "statusCode": 201,
                "headers": headers,
                "body": json.dumps({
                    "success": True,
                    "message": f"Emergency Priority Slot {slot_number}/{quota_limit} reserved successfully!",
                    "ticket": queue_record,
                    "emergencyRecord": emergency_record,
                    "quota": {
                        "used": slot_number,
                        "limit": quota_limit,
                        "remaining": quota_limit - slot_number
                    }
                }, default=decimal_default)
            }

        # PUT /api/emergency/review (Staff Approve/Reject)
        elif http_method == 'PUT':
            body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
            emergency_id = body.get('emergencyId')
            is_approved = body.get('approved', True)

            new_status = "APPROVED" if is_approved else "REJECTED"

            res = emergency_table.update_item(
                Key={'emergencyId': emergency_id},
                UpdateExpression="SET #st = :status",
                ExpressionAttributeNames={"#st": "status"},
                ExpressionAttributeValues={":status": new_status},
                ReturnValues="ALL_NEW"
            )

            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps(res.get('Attributes', {}), default=decimal_default)
            }

    except Exception as e:
        print(f"Error in emergency lambda: {e}")
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }

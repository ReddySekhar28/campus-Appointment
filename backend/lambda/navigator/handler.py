"""
CampusFlow AI - Service Navigator Lambda Handler
Extracts natural language intent and urgency via Amazon Bedrock,
then retrieves verified authoritative operational data from DynamoDB.
"""

import json
import os
import boto3
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
bedrock = boto3.client('bedrock-runtime', region_name=os.environ.get('AWS_REGION', 'us-east-1'))

SERVICES_TABLE_NAME = os.environ.get('SERVICES_TABLE', 'CampusFlow_Services')
QUEUES_TABLE_NAME = os.environ.get('QUEUES_TABLE', 'CampusFlow_Queues')
STAFF_TABLE_NAME = os.environ.get('STAFF_TABLE', 'CampusFlow_Staff')

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError

def extract_intent_with_bedrock(user_query):
    """
    Invokes Amazon Bedrock (Anthropic Claude 3 Sonnet / Amazon Titan)
    to extract structured intent, keywords, and urgency flags.
    The LLM NEVER invents operational facts like offices or hours.
    """
    prompt = f"""You are the intent extractor for CampusFlow AI, a smart campus services system.
Analyze the student query below and return ONLY a valid JSON object with these exact keys:
- "detectedCategory": The broad category (one of: "International Students", "Academic Records", "Financial Aid", "Campus Security & Cards", "Health & Wellness", "Housing & Residential", "General Inquiries")
- "isUrgent": boolean (true ONLY if there is an impending deadline, flight/visa appointment, medical emergency, or urgent financial cutoff)
- "urgencyReason": brief explanation of why this was marked urgent or non-urgent
- "extractedDeadline": any deadline date mentioned or null
- "keywords": list of 3-5 relevant lowercase search terms

Student Query: "{user_query}"

Respond with ONLY the JSON object. Do not include markdown codeblocks or extra text.
"""

    try:
        # Try Claude 3 Sonnet on Bedrock
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 500,
            "messages": [
                {"role": "user", "content": prompt}
            ]
        })
        
        response = bedrock.invoke_model(
            modelId="anthropic.claude-3-sonnet-20240229-v1:0",
            contentType="application/json",
            accept="application/json",
            body=body
        )
        
        response_body = json.loads(response['body'].read())
        content_text = response_body['content'][0]['text']
        return json.loads(content_text.strip())
    except Exception as e:
        print(f"Bedrock invocation fallback: {e}")
        # Rule-based fallback if Bedrock runtime is unreachable
        lower = user_query.lower()
        urgent_keywords = ['urgent', 'emergency', 'tomorrow', 'today', 'asap', 'deadline', 'critical', 'immediately']
        is_urgent = any(kw in lower for kw in urgent_keywords)
        
        cat = "General Inquiries"
        if any(w in lower for w in ['visa', 'passport', 'i-20', 'travel', 'embassy', 'international']):
            cat = "International Students"
        elif any(w in lower for w in ['transcript', 'degree', 'grade', 'marksheet', 'registrar']):
            cat = "Academic Records"
        elif any(w in lower for w in ['scholarship', 'financial aid', 'bursar', 'fees', 'loan']):
            cat = "Financial Aid"
        elif any(w in lower for w in ['id card', 'lost card', 'badge', 'access', 'security']):
            cat = "Campus Security & Cards"
        elif any(w in lower for w in ['health', 'doctor', 'medical', 'sick', 'prescription']):
            cat = "Health & Wellness"
        elif any(w in lower for w in ['housing', 'dorm', 'room', 'roommate', 'lockout']):
            cat = "Housing & Residential"

        return {
            "detectedCategory": cat,
            "isUrgent": is_urgent,
            "urgencyReason": "Detected impending deadline keywords" if is_urgent else "Standard inquiry",
            "extractedDeadline": None,
            "keywords": [cat.lower()]
        }

def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
        query = body.get('query', '').strip()

        if not query:
            return {
                "statusCode": 400,
                "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                "body": json.dumps({"error": "Missing 'query' parameter"})
            }

        # 1. Extract structured intent via Bedrock
        intent = extract_intent_with_bedrock(query)

        # 2. Query DynamoDB for authoritative verified campus services
        services_table = dynamodb.Table(SERVICES_TABLE_NAME)
        scan_res = services_table.scan()
        all_services = scan_res.get('Items', [])

        # 3. Match and score against verified services
        matches = []
        for svc in all_services:
            score = 0
            cat = svc.get('category', '')
            tags = svc.get('tags', [])
            svc_name = svc.get('name', '').lower()
            query_lower = query.lower()

            if cat == intent.get('detectedCategory'):
                score += 5
            for tag in tags:
                if tag in query_lower:
                    score += 3
            if svc_name in query_lower:
                score += 6

            if score > 0 or not matches:
                # Transparent wait time formula: (queue_length * avg_duration) / active_staff
                q_len = int(svc.get('currentQueueLength', 0))
                duration = int(svc.get('avgDurationMinutes', 10))
                staff_count = max(1, int(svc.get('activeStaffCount', 1)))
                est_wait = (q_len * duration) // staff_count

                svc_copy = dict(svc)
                svc_copy['score'] = score
                svc_copy['estimatedWaitTime'] = est_wait
                matches.append(svc_copy)

        matches.sort(key=lambda x: x['score'], reverse=True)

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization"
            },
            "body": json.dumps({
                "intent": intent,
                "matches": matches
            }, default=decimal_default)
        }

    except Exception as e:
        print(f"Error in navigator lambda: {e}")
        return {
            "statusCode": 500,
            "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            "body": json.dumps({"error": str(e)})
        }

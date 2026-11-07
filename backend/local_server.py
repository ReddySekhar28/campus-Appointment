"""
CampusFlow AI - Local Server & API Gateway Simulator
Runs a standalone HTTP server implementing the complete AWS Serverless API.
Can run 100% locally with seeded memory/disk storage or connect with AWS Bedrock.
"""

import http.server
import json
import os
import urllib.parse
from datetime import datetime

PORT = int(os.environ.get('PORT', 8000))
SEED_FILE = os.path.join(os.path.dirname(__file__), 'dynamodb', 'seed_data.json')

# Load Seed Data
with open(SEED_FILE, 'r') as f:
    DB_STATE = json.load(f)

if 'problems' not in DB_STATE:
    DB_STATE['problems'] = [
        {
            "problemId": "PRB-2026-001",
            "studentName": "Aisha Fatima",
            "studentId": "STU-8842",
            "email": "aisha.fatima@campus.edu",
            "serviceId": "SRV-INT-001",
            "serviceName": "International Visa Letter & Travel Signature",
            "category": "International Students",
            "title": "Urgent I-20 Travel Endorsement for Embassy Interview Tomorrow",
            "description": "My visa renewal appointment at the consulate is scheduled for tomorrow at 8:30 AM. I need an in-person physical stamp on page 2 of my I-20 before 4 PM today.",
            "isUrgent": True,
            "urgencyReason": "24-hour impending official visa interview deadline",
            "status": "IN_PROGRESS",
            "assignedCounter": "Counter 4 (Visa & Immigration Desk)",
            "assignedStaff": "Priya Sharma",
            "staffNotes": "Student notified. Original I-20 document ready for physical seal inspection at Desk 4.",
            "createdAt": datetime.utcnow().isoformat()
        }
    ]

class CampusFlowHandler(http.server.BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(204)

    def _read_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length == 0:
            return {}
        raw = self.rfile.read(content_length).decode('utf-8')
        try:
            return json.loads(raw)
        except:
            return {}

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == '/api/health':
            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "healthy", "engine": "CampusFlow AI Core"}).encode())
            return

        elif path == '/api/services':
            self._set_headers(200)
            self.wfile.write(json.dumps(DB_STATE.get('services', [])).encode())
            return

        elif path == '/api/staff':
            self._set_headers(200)
            self.wfile.write(json.dumps(DB_STATE.get('staff', [])).encode())
            return

        elif path == '/api/queues':
            self._set_headers(200)
            self.wfile.write(json.dumps(DB_STATE.get('activeQueues', [])).encode())
            return

        elif path == '/api/emergency':
            self._set_headers(200)
            self.wfile.write(json.dumps(DB_STATE.get('emergencyRequests', [])).encode())
            return

        elif path == '/api/problems':
            self._set_headers(200)
            self.wfile.write(json.dumps(DB_STATE.get('problems', [])).encode())
            return

        elif path == '/api/admin/metrics':
            services = DB_STATE.get('services', [])
            queues = DB_STATE.get('activeQueues', [])
            emergencies = DB_STATE.get('emergencyRequests', [])
            staff = DB_STATE.get('staff', [])
            problems = DB_STATE.get('problems', [])
            
            total_waiting = len([q for q in queues if q.get('status') in ['WAITING', 'APPROVED']])
            
            metrics = {
                "totalWaiting": total_waiting,
                "totalEmergencyToday": len(emergencies),
                "activeStaffTotal": len([s for s in staff if s.get('status') == 'AVAILABLE']),
                "servicesCount": len(services),
                "digitalRequestsCount": 3,
                "totalProblemsCount": len(problems),
                "pendingProblemsCount": len([p for p in problems if p.get('status') == 'PENDING'])
            }
            self._set_headers(200)
            self.wfile.write(json.dumps(metrics).encode())
            return

        self._set_headers(404)
        self.wfile.write(json.dumps({"error": "Not Found"}).encode())

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self._read_body()

        # 1. Student Problem Submission
        if path == '/api/problems':
            problem_id = f"PRB-{datetime.utcnow().year}-{datetime.utcnow().microsecond % 900 + 100}"
            new_prob = {
                "problemId": problem_id,
                "studentName": body.get('studentName', 'Student'),
                "studentId": body.get('studentId', 'STU-0000'),
                "email": body.get('email', 'student@campus.edu'),
                "serviceId": body.get('serviceId', 'SRV-INT-001'),
                "serviceName": body.get('serviceName', 'Campus Service Desk'),
                "category": body.get('category', 'General'),
                "title": body.get('title', 'Inquiry'),
                "description": body.get('description', ''),
                "isUrgent": body.get('isUrgent', False),
                "urgencyReason": body.get('urgencyReason', 'Student operational request'),
                "status": "PENDING",
                "assignedCounter": body.get('assignedCounter', 'Counter 4'),
                "assignedStaff": body.get('assignedStaff', 'Duty Desk Officer'),
                "staffNotes": None,
                "createdAt": datetime.utcnow().isoformat()
            }
            DB_STATE['problems'].insert(0, new_prob)
            self._set_headers(201)
            self.wfile.write(json.dumps(new_prob).encode())
            return

        # 2. AI Service Navigator (Bedrock / Local intent parser)
        elif path == '/api/navigator':
            query = body.get('query', '')
            lower = query.lower()

            urgent_keywords = ['urgent', 'emergency', 'tomorrow', 'today', 'asap', 'deadline', 'critical', 'immediately']
            is_urgent = any(kw in lower for kw in urgent_keywords)

            cat = "General Inquiries"
            if any(w in lower for w in ['visa', 'passport', 'i-20', 'travel', 'embassy', 'international']):
                cat = "International Students"
            elif any(w in lower for w in ['transcript', 'degree', 'grade', 'attestation', 'registrar']):
                cat = "Academic Records"
            elif any(w in lower for w in ['scholarship', 'financial aid', 'bursar', 'fees', 'loan']):
                cat = "Financial Aid"
            elif any(w in lower for w in ['id card', 'lost card', 'badge', 'access', 'security']):
                cat = "Campus Security & Cards"
            elif any(w in lower for w in ['health', 'doctor', 'medical', 'sick', 'prescription']):
                cat = "Health & Wellness"
            elif any(w in lower for w in ['housing', 'dorm', 'room', 'roommate', 'lockout']):
                cat = "Housing & Residential"

            intent = {
                "detectedCategory": cat,
                "isUrgent": is_urgent,
                "urgencyReason": "Impending visa interview / application deadline identified" if is_urgent else "Standard inquiry",
                "recommendedAction": "EMERGENCY_PRIORITY_OR_APPOINTMENT" if is_urgent else "JOIN_QUEUE_OR_DIGITAL"
            }

            services = DB_STATE.get('services', [])
            matches = []
            for svc in services:
                score = 0
                if svc.get('category') == cat:
                    score += 5
                for t in svc.get('tags', []):
                    if t in lower:
                        score += 3
                if svc.get('name', '').lower() in lower:
                    score += 6

                if score > 0 or not matches:
                    q_len = int(svc.get('currentQueueLength', 0))
                    duration = int(svc.get('avgDurationMinutes', 10))
                    staff_count = max(1, int(svc.get('activeStaffCount', 1)))
                    est_wait = (q_len * duration) // staff_count

                    c = dict(svc)
                    c['score'] = score
                    c['estimatedWaitTime'] = est_wait
                    matches.append(c)

            matches.sort(key=lambda x: x['score'], reverse=True)

            self._set_headers(200)
            self.wfile.write(json.dumps({"intent": intent, "matches": matches}).encode())
            return

        # 3. Emergency Priority
        elif path == '/api/emergency':
            service_id = body.get('serviceId')
            services = DB_STATE.get('services', [])
            svc = next((s for s in services if s['serviceId'] == service_id), None)

            if not svc:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "Service not found"}).encode())
                return

            quota_limit = int(svc.get('emergencyQuotaPerDay', 3))
            used = int(svc.get('emergencySlotsUsedToday', 0))

            if used >= quota_limit:
                self._set_headers(409)
                self.wfile.write(json.dumps({
                    "success": False,
                    "error": "QUOTA_EXHAUSTED",
                    "message": f"Emergency capacity limit of {quota_limit} reached for today."
                }).encode())
                return

            slot_number = used + 1
            cat_code = svc.get('category', 'GEN')[:3].upper()
            ticket_id = f"EMG-{cat_code}-00{slot_number}"
            emergency_id = f"EMG-REQ-{int(datetime.utcnow().timestamp())}"

            emg_record = {
                "emergencyId": emergency_id,
                "serviceId": service_id,
                "serviceName": svc.get('name'),
                "studentName": body.get('studentName'),
                "studentId": body.get('studentId'),
                "email": body.get('email'),
                "deadline": body.get('deadline'),
                "reason": body.get('reason'),
                "status": "PENDING_STAFF_APPROVAL",
                "ticketId": ticket_id,
                "allocatedSlotIndex": slot_number,
                "createdAt": datetime.utcnow().isoformat()
            }

            queue_record = {
                "ticketId": ticket_id,
                "serviceId": service_id,
                "serviceName": svc.get('name'),
                "studentName": body.get('studentName'),
                "studentId": body.get('studentId'),
                "isEmergency": True,
                "reason": body.get('reason'),
                "status": "PENDING_VERIFICATION",
                "position": 1,
                "estimatedWaitMinutes": int(svc.get('avgDurationMinutes', 10)),
                "counter": svc.get('counter'),
                "office": svc.get('office'),
                "createdAt": datetime.utcnow().isoformat()
            }

            svc['emergencySlotsUsedToday'] += 1
            DB_STATE['emergencyRequests'].insert(0, emg_record)
            DB_STATE['activeQueues'].insert(0, queue_record)

            self._set_headers(201)
            self.wfile.write(json.dumps({
                "success": True,
                "ticket": queue_record,
                "emergencyRecord": emg_record,
                "quota": {
                    "used": slot_number,
                    "limit": quota_limit,
                    "remaining": quota_limit - slot_number
                }
            }).encode())
            return

        # 4. Join Normal Queue
        elif path == '/api/queue':
            service_id = body.get('serviceId')
            services = DB_STATE.get('services', [])
            svc = next((s for s in services if s['serviceId'] == service_id), None)
            
            if not svc:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "Service not found"}).encode())
                return

            prefix = svc.get('category', 'SVC')[:3].upper()
            ticket_id = f"{prefix}-{datetime.utcnow().microsecond % 900 + 100}"

            ticket = {
                "ticketId": ticket_id,
                "serviceId": service_id,
                "serviceName": svc.get('name'),
                "studentName": body.get('studentName', 'Student'),
                "studentId": body.get('studentId', 'STU-1234'),
                "isEmergency": False,
                "status": "WAITING",
                "position": int(svc.get('currentQueueLength', 1)) + 1,
                "estimatedWaitMinutes": int(svc.get('avgDurationMinutes', 8)),
                "counter": svc.get('counter'),
                "office": svc.get('office'),
                "createdAt": datetime.utcnow().isoformat()
            }

            svc['currentQueueLength'] += 1
            DB_STATE['activeQueues'].append(ticket)

            self._set_headers(201)
            self.wfile.write(json.dumps(ticket).encode())
            return

        # 5. S3 Presigned URL Mock
        elif path == '/api/digital/presigned-url':
            filename = body.get('filename', 'doc.pdf')
            self._set_headers(200)
            self.wfile.write(json.dumps({
                "uploadUrl": f"https://campusflow-student-documents.s3.amazonaws.com/uploads/{filename}",
                "fileKey": f"uploads/{filename}",
                "expiresInSeconds": 900
            }).encode())
            return

        self._set_headers(404)
        self.wfile.write(json.dumps({"error": "Not Found"}).encode())

    def do_PATCH(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self._read_body()

        if path == '/api/problems/status':
            problem_id = body.get('problemId')
            status = body.get('status')
            notes = body.get('staffNotes')
            probs = DB_STATE.get('problems', [])
            p = next((pr for pr in probs if pr['problemId'] == problem_id), None)
            if p:
                p['status'] = status
                if notes:
                    p['staffNotes'] = notes
                self._set_headers(200)
                self.wfile.write(json.dumps(p).encode())
                return

        self._set_headers(404)
        self.wfile.write(json.dumps({"error": "Not Found"}).encode())

def run():
    server_address = ('', PORT)
    httpd = http.server.HTTPServer(server_address, CampusFlowHandler)
    print(f"==================================================")
    print(f"🚀 CampusFlow AI Local Server running on port {PORT}")
    print(f"👉 API Endpoints: http://localhost:{PORT}/api")
    print(f"==================================================")
    httpd.serve_forever()

if __name__ == '__main__':
    run()

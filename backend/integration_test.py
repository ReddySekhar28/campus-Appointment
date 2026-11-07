import urllib.request
import urllib.parse
import json
import time

BASE_URL = "http://localhost:8000/api"

def http_req(path, method="GET", data=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"error": err_body}
    except Exception as e:
        return 0, {"error": str(e)}

def run_tests():
    print("========================================")
    print("CAMPUSFLOW AI - FULL INTEGRATION TEST")
    print("========================================")
    
    passed = 0
    total = 0

    def assert_test(name, condition, extra=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f"[PASS] {name} {extra}")
        else:
            print(f"[FAIL] {name} - {extra}")

    # 1. Health Check
    status, res = http_req("/health")
    assert_test("1. Health Check", status == 200 and res.get("status") == "healthy", str(res))

    # 2. Activity Logs API
    test_act_text = f"Integration Test Activity Log {int(time.time())}"
    status, res = http_req("/activity/log", method="POST", data={
        "text": test_act_text,
        "type": "TEST",
        "student_id": "TEST-001",
        "student_name": "Test Runner"
    })
    assert_test("2a. Log Activity", status == 200 and res.get("status") == "success")

    status, res = http_req("/activity/")
    activities = res.get("activities", [])
    found_act = any(a.get("text") == test_act_text for a in activities)
    assert_test("2b. Retrieve Activity Logs from Supabase", status == 200 and found_act, f"Count: {len(activities)}")

    # 3. Emergency Quota API
    
    # 3. Emergency Quota API
    status, res = http_req("/emergency/quota")
    quotas = res.get("quotas", [])

    assert_test(
        "3a. Get All Emergency Quotas",
        status == 200 and len(quotas) == 5,
        f"Quotas: {len(quotas)}"
    )

    
    expected_limits = [3, 2, 3, 3, 4]

    actual_limits = [
        q.get("dailyLimit", q.get("limit"))
        for q in quotas
    ]

    quotas_are_valid = (
        len(quotas) == 5
        and actual_limits == expected_limits
    )

    assert_test(
        "3b. Verify All Emergency Quotas",
        status == 200 and quotas_are_valid,
        f"Limits: {actual_limits}"
    )



    # 4. Emergency Request Flow
    status, res = http_req("/emergency/request", method="POST", data={
        "service": "Visa & Travel Signature",
        "service_id": "srv-visa-01",
        "student_name": "Test Student",
        "student_id": "STU-999",
        "email": "test@campus.edu",
        "reason": "Flight deadline tomorrow morning",
        "deadline": "Tomorrow",
        "supporting_document": "Visa_Document.pdf"
    })
    emg_id = res.get("emergency", {}).get("emergencyId")
    assert_test("4a. Create Emergency Request with DB Quota Check", status == 200 and bool(emg_id), f"ID: {emg_id}")

    if emg_id:
        status, res = http_req(f"/emergency/{emg_id}/review", method="PATCH", data={"approved": True})
        assert_test("4b. Staff Review Emergency Request", status == 200 and res.get("emergency", {}).get("status") == "APPROVED")

    # 5. Digital Requests API
    status, res = http_req("/digital-request", method="POST", data={
        "service": "Academic Records & Transcript",
        "student_id": "STU-999",
        "student_name": "Test Student",
        "email": "test@campus.edu",
        "details": "Official digital transcript needed"
    })
    dig_id = res.get("request", {}).get("requestId")
    assert_test("5a. Create Digital Request", status == 200 and bool(dig_id), f"ID: {dig_id}")

    status, res = http_req("/digital-request")
    dig_list = res.get("requests", [])
    assert_test("5b. Get All Digital Requests for Admin", status == 200 and len(dig_list) > 0, f"Count: {len(dig_list)}")

    if dig_id:
        status, res = http_req(f"/digital-request/{dig_id}/status", method="PATCH", data={
            "status": "APPROVED",
            "staff_notes": "Transcript verified and digitally signed."
        })
        assert_test("5c. Admin Update Digital Request Status", status == 200 and res.get("request", {}).get("status") == "APPROVED")

    # 6. Student Problems API
    status, res = http_req("/problems", method="POST", data={
        "student_name": "Test Student",
        "student_id": "STU-999",
        "email": "test@campus.edu",
        "service_id": "srv-fina-03",
        "service_name": "Financial Aid & Scholarships",
        "category": "Financial Services",
        "title": "Scholarship disbursement delay",
        "description": "Tuition deadline is approaching and scholarship is pending",
        "is_urgent": True,
        "urgency_reason": "Tuition holds class registration",
        "assigned_counter": "Counter 3",
        "assigned_staff": "Elena Rostova"
    })
    prb_id = res.get("problem", {}).get("problemId")
    assert_test("6a. Submit Student Problem", status == 200 and bool(prb_id), f"ID: {prb_id}")

    if prb_id:
        status, res = http_req(f"/problems/{prb_id}", method="PUT", data={
            "status": "IN_PROGRESS",
            "staff_notes": "Reviewed with financial aid officer."
        })
        assert_test("6b. Update Student Problem Status", status == 200 and res.get("problem", {}).get("status") == "IN_PROGRESS")

    # 7. Queue Flow
    status, res = http_req("/queue/join", method="POST", data={
        "service": "Visa & Travel Signature",
        "user_id": "STU-999"
    })
    ticket_id = res.get("queue", {}).get("ticket_id")
    assert_test("7a. Join Service Queue", status == 200 and bool(ticket_id), f"Ticket: {ticket_id}")

    status, res = http_req("/queue/tickets/Visa%20%26%20Travel%20Signature")
    t_list = res.get("tickets", [])
    assert_test("7b. Fetch Service Queue Tickets", status == 200 and len(t_list) > 0, f"Tickets: {len(t_list)}")

    # 8. Appointments API
    status, res = http_req("/appointments/book", method="POST", data={
        "service_id": "srv-visa-01",
        "service_name": "Visa & Travel Signature",
        "student_name": "Test Student",
        "student_id": "STU-999",
        "date": "2026-10-15",
        "time_slot": "10:30 AM",
        "office": "International Student Center",
        "counter": "Counter 1"
    })
    apt_id = res.get("appointment", {}).get("appointment_id")
    assert_test("8a. Book Appointment", status == 200 and bool(apt_id), f"Apt ID: {apt_id}")

    status, res = http_req("/appointments/")
    apt_list = res.get("appointments", [])
    assert_test("8b. Fetch Appointments", status == 200 and len(apt_list) > 0, f"Appointments: {len(apt_list)}")

    print("========================================")
    print(f"RESULTS: {passed}/{total} TESTS PASSED")
    print("========================================")
    return passed == total

if __name__ == "__main__":
    success = run_tests()
    if not success:
        exit(1)

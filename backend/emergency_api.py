from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import Optional, List
from database import get_connection
import time
import traceback



router = APIRouter(
    prefix="/api/emergency",
    tags=["Emergency"]
)


# --------------------------------------------------
# REQUEST MODELS
# --------------------------------------------------

class EmergencyRequest(BaseModel):
    service: str
    service_id: Optional[str] = None
    user_id: Optional[str] = "guest"
    student_name: Optional[str] = "Student"
    student_id: Optional[str] = None
    email: Optional[str] = None
    reason: str
    deadline: Optional[str] = None
    supporting_document: Optional[str] = None


class QuotaUpdateRequest(BaseModel):
    daily_limit: int


# --------------------------------------------------
# HELPER: FETCH QUOTA FROM DATABASE
# --------------------------------------------------

def get_service_quota_info(cursor, service_identifier: str):
    cursor.execute("""
        SELECT service_id, service_name, daily_limit
        FROM emergency_quotas
        WHERE service_id = %s OR service_name ILIKE %s OR %s ILIKE ('%%' || service_name || '%%')
        LIMIT 1;
    """, (service_identifier, f"%{service_identifier}%", service_identifier))
    row = cursor.fetchone()

    if row:
        s_id, s_name, limit = row[0], row[1], row[2]
    else:
        s_id = service_identifier
        s_name = service_identifier
        limit = 3

    # Count today's approved or pending requests
    cursor.execute("""
        SELECT COUNT(*)
        FROM emergency_requests
        WHERE (service_id = %s OR service_name ILIKE %s)
          AND status != 'REJECTED'
          AND created_at >= CURRENT_DATE;
    """, (s_id, f"%{s_name}%"))
    used_row = cursor.fetchone()
    used = used_row[0] if used_row else 0

    return {
        "service_id": s_id,
        "service_name": s_name,
        "service": s_name,
        "limit": limit,
        "used": used,
        "remaining": max(0, limit - used)
    }


# --------------------------------------------------
# REQUEST EMERGENCY SLOT
# --------------------------------------------------

@router.post("/request")
def request_emergency(request: EmergencyRequest):
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        # Check quota in live DB
        service_ident = request.service_id or request.service
        quota_info = get_service_quota_info(cursor, service_ident)

        limit = quota_info["limit"]
        used = quota_info["used"]
        





        


        

        if used >= limit:
            return {
                "success": False,
                "status": "QUOTA_EXHAUSTED",
                "message": "Emergency capacity has been reached for today.",
                "quota": {
                    "used": used,
                    "limit": limit,
                    "remaining": 0
                },
                "fallbackOptions": [
                    "BOOK_APPOINTMENT",
                    "SUBMIT_DIGITAL_REQUEST",
                    "JOIN_STANDARD_QUEUE"
                ]
            }

        slot_number = used + 1
        timestamp = int(time.time())
        ticket_id = f"EMG-{slot_number:03d}"
        emergency_id = f"EMG-REQ-{timestamp}"
        status = "PENDING_STAFF_APPROVAL"

        query = """
            INSERT INTO emergency_requests (
                emergency_id,
                service_id,
                service_name,
                student_name,
                student_id,
                email,
                deadline,
                reason,
                supporting_doc_name,
                supporting_doc_url,
                status,
                ticket_id,
                allocated_slot_index,
                created_at
            )
            VALUES (
                %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, NOW()
            )
            RETURNING id, created_at;
        """

        cursor.execute(
            query,
            (
                emergency_id,
                request.service_id or quota_info["service_id"],
                request.service or quota_info["service_name"],
                request.student_name,
                request.student_id or "UNKNOWN",
                request.email,
                request.deadline,
                request.reason,
                request.supporting_document,
                None,
                status,
                ticket_id,
                slot_number
            )
        )

        row = cursor.fetchone()
        database_id = row[0]
        created_at = str(row[1])

        connection.commit()

        return {
            "success": True,
            "status": status,
            "message": "Emergency priority request created successfully.",
            "emergency": {
                "databaseId": database_id,
                "emergencyId": emergency_id,
                "ticketId": ticket_id,
                "serviceId": request.service_id or quota_info["service_id"],
                "service": request.service or quota_info["service_name"],
                "studentName": request.student_name,
                "studentId": request.student_id,
                "userId": request.user_id,
                "email": request.email,
                "reason": request.reason,
                "deadline": request.deadline,
                "supportingDocument": request.supporting_document,
                "supportingDocumentName": request.supporting_document,
                "slotNumber": slot_number,
                "status": status,
                "createdAt": created_at
            },
            "quota": {
                "used": slot_number,
                "limit": limit,
                "remaining": max(0, limit - slot_number)
            }
        }

    except Exception as e:
        if connection:
            connection.rollback()
        print("[ERROR] Emergency request database error:")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save emergency request: {str(e)}"
        )
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# --------------------------------------------------
# GET ALL EMERGENCY QUOTAS
# --------------------------------------------------

@router.get("/quota/all")
@router.get("/quota")
def get_all_emergency_quotas():
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT service_id, service_name, daily_limit
            FROM emergency_quotas
            ORDER BY id ASC;
        """)
        quotas = cursor.fetchall()

        results = []
        for s_id, s_name, limit in quotas:
            cursor.execute("""
                SELECT COUNT(*)
                FROM emergency_requests
                WHERE (service_id = %s OR service_name ILIKE %s)
                  AND status != 'REJECTED'
                  AND created_at >= CURRENT_DATE;
            """, (s_id, f"%{s_name}%"))
            used = cursor.fetchone()[0]

            results.append({
                "serviceId": s_id,
                "service_id": s_id,
                "serviceName": s_name,
                "service": s_name,
                "dailyLimit": limit,
                "limit": limit,
                "used": used,
                "remaining": max(0, limit - used)
            })

        return {
            "status": "success",
            "quotas": results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch quotas: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# --------------------------------------------------
# GET SINGLE EMERGENCY QUOTA
# --------------------------------------------------

@router.get("/quota/{service}")
def get_emergency_quota(service: str):
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        info = get_service_quota_info(cursor, service)

        return {
            "service": info["service_name"],
            "service_id": info["service_id"],
            "quota": {
                "used": info["used"],
                "limit": info["limit"],
                "remaining": info["remaining"]
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch emergency quota: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# --------------------------------------------------
# UPDATE EMERGENCY QUOTA LIMIT (ADMIN)
# --------------------------------------------------

@router.put("/quota/{service_id}")
@router.patch("/quota/{service_id}")
def update_emergency_quota(service_id: str, update: QuotaUpdateRequest):
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE emergency_quotas
            SET daily_limit = %s, updated_at = NOW()
            WHERE service_id = %s OR service_name ILIKE %s
            RETURNING service_id, service_name, daily_limit;
        """, (update.daily_limit, service_id, f"%{service_id}%"))

        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Service quota not found")

        connection.commit()

        return {
            "status": "success",
            "message": f"Daily quota limit updated to {update.daily_limit}",
            "quota": {
                "serviceId": row[0],
                "serviceName": row[1],
                "dailyLimit": row[2]
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        if connection:
            connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# --------------------------------------------------
# GET ALL EMERGENCY REQUESTS
# --------------------------------------------------

@router.get("/")
def get_emergency_requests():
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                id,
                emergency_id,
                service_id,
                service_name,
                student_name,
                student_id,
                email,
                deadline,
                reason,
                supporting_doc_name,
                supporting_doc_url,
                ticket_id,
                allocated_slot_index,
                status,
                created_at
            FROM emergency_requests
            ORDER BY created_at DESC;
        """)

        rows = cursor.fetchall()
        emergencies = []

        for row in rows:
            emergencies.append({
                "id": row[0],
                "databaseId": row[0],
                "emergencyId": row[1],
                "serviceId": row[2],
                "service": row[3],
                "serviceName": row[3],
                "studentName": row[4],
                "studentId": row[5],
                "email": row[6],
                "deadline": row[7],
                "reason": row[8],
                "supportingDocumentName": row[9],
                "supporting_doc_name": row[9],
                "supportingDocumentUrl": row[10],
                "ticketId": row[11],
                "slotNumber": row[12],
                "status": row[13],
                "createdAt": str(row[14])
            })

        return {
            "success": True,
            "emergencies": emergencies
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch emergency requests: {str(e)}"
        )
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# --------------------------------------------------
# REVIEW EMERGENCY REQUEST (APPROVE/REJECT)
# --------------------------------------------------

@router.patch("/{emergency_id}/review")
def review_emergency_request(
    emergency_id: str,
    approved: bool = Body(..., embed=True),
):
    connection = get_connection()
    cursor = connection.cursor()

    new_status = "APPROVED" if approved else "REJECTED"

    try:
        cursor.execute(
            """
            UPDATE emergency_requests
            SET status = %s
            WHERE emergency_id = %s
            RETURNING emergency_id, status, ticket_id
            """,
            (new_status, emergency_id)
        )

        row = cursor.fetchone()

        if not row:
            connection.rollback()
            raise HTTPException(
                status_code=404,
                detail="Emergency request not found"
            )

        connection.commit()

        return {
            "success": True,
            "emergency": {
                "emergencyId": row[0],
                "status": row[1],
                "ticketId": row[2],
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        connection.close()
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

from database import get_connection


router = APIRouter(
    prefix="/api/digital-request",
    tags=["Digital Request"]
)


# --------------------------------------------------
# REQUEST MODELS
# --------------------------------------------------

class DigitalRequest(BaseModel):
    service: str
    student_id: str
    student_name: str
    email: Optional[str] = None
    details: Optional[str] = None


class DigitalRequestStatusUpdate(BaseModel):
    status: str
    staff_notes: Optional[str] = None
    estimated_turnaround: Optional[str] = None


# --------------------------------------------------
# CREATE DIGITAL REQUEST
# --------------------------------------------------

@router.post("")
@router.post("/")
def create_digital_request(request: DigitalRequest):
    request_id = f"DIG-{uuid.uuid4().hex[:6].upper()}"
    status = "SUBMITTED"
    estimated_turnaround = "1-2 Business Days"

    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        query = """
            INSERT INTO digital_requests (
                request_id,
                service,
                student_id,
                student_name,
                email,
                details,
                status,
                estimated_turnaround,
                submitted_at,
                updated_at
            )
            VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
            )
            RETURNING id, submitted_at;
        """

        cursor.execute(
            query,
            (
                request_id,
                request.service,
                request.student_id,
                request.student_name,
                request.email,
                request.details,
                status,
                estimated_turnaround
            )
        )

        row = cursor.fetchone()
        database_id = row[0]
        submitted_at = str(row[1])

        connection.commit()

        return {
            "status": "success",
            "message": "Digital request submitted successfully",
            "request": {
                "database_id": database_id,
                "request_id": request_id,
                "requestId": request_id,
                "service": request.service,
                "student_id": request.student_id,
                "studentId": request.student_id,
                "student_name": request.student_name,
                "studentName": request.student_name,
                "email": request.email,
                "details": request.details,
                "status": status,
                "submitted_at": submitted_at,
                "submittedAt": submitted_at,
                "estimated_turnaround": estimated_turnaround,
                "estimatedTurnaround": estimated_turnaround
            }
        }

    except Exception as e:
        if connection:
            connection.rollback()
        print("[ERROR] Digital request database error:", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save digital request: {str(e)}"
        )
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# --------------------------------------------------
# GET ALL DIGITAL REQUESTS (ADMIN & STAFF)
# --------------------------------------------------

@router.get("")
@router.get("/")
def get_all_digital_requests(
    status: Optional[str] = None,
    service: Optional[str] = None
):
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        query = """
            SELECT
                id,
                request_id,
                service,
                student_id,
                student_name,
                email,
                details,
                status,
                submitted_at,
                estimated_turnaround,
                staff_notes,
                updated_at
            FROM digital_requests
            WHERE 1=1
        """
        params = []

        if status:
            query += " AND status = %s"
            params.append(status)

        if service:
            query += " AND service ILIKE %s"
            params.append(f"%{service}%")

        query += " ORDER BY submitted_at DESC;"

        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()

        requests = []
        for row in rows:
            requests.append({
                "databaseId": row[0],
                "requestId": row[1],
                "request_id": row[1],
                "service": row[2],
                "studentId": row[3],
                "student_id": row[3],
                "studentName": row[4],
                "student_name": row[4],
                "email": row[5],
                "details": row[6],
                "status": row[7],
                "submittedAt": str(row[8]) if row[8] else None,
                "submitted_at": str(row[8]) if row[8] else None,
                "estimatedTurnaround": row[9],
                "estimated_turnaround": row[9],
                "staffNotes": row[10],
                "staff_notes": row[10],
                "updatedAt": str(row[11]) if row[11] else None
            })

        return {
            "status": "success",
            "requests": requests
        }

    except Exception as e:
        print("[ERROR] Failed to fetch digital requests:", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch digital requests: {str(e)}"
        )
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# --------------------------------------------------
# UPDATE DIGITAL REQUEST STATUS
# --------------------------------------------------

@router.patch("/{request_id}/status")
@router.put("/{request_id}/status")
def update_digital_request_status(request_id: str, update: DigitalRequestStatusUpdate):
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        query = """
            UPDATE digital_requests
            SET status = %s,
                staff_notes = COALESCE(%s, staff_notes),
                estimated_turnaround = COALESCE(%s, estimated_turnaround),
                updated_at = NOW()
            WHERE request_id = %s OR id::text = %s
            RETURNING
                id,
                request_id,
                service,
                student_id,
                student_name,
                email,
                details,
                status,
                submitted_at,
                estimated_turnaround,
                staff_notes,
                updated_at;
        """

        cursor.execute(
            query,
            (
                update.status,
                update.staff_notes,
                update.estimated_turnaround,
                request_id,
                request_id
            )
        )

        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Digital request not found")

        connection.commit()

        updated_request = {
            "databaseId": row[0],
            "requestId": row[1],
            "request_id": row[1],
            "service": row[2],
            "studentId": row[3],
            "student_id": row[3],
            "studentName": row[4],
            "student_name": row[4],
            "email": row[5],
            "details": row[6],
            "status": row[7],
            "submittedAt": str(row[8]) if row[8] else None,
            "submitted_at": str(row[8]) if row[8] else None,
            "estimatedTurnaround": row[9],
            "estimated_turnaround": row[9],
            "staffNotes": row[10],
            "staff_notes": row[10],
            "updatedAt": str(row[11]) if row[11] else None
        }

        return {
            "status": "success",
            "message": f"Digital request {request_id} updated to {update.status}",
            "request": updated_request
        }

    except HTTPException:
        raise
    except Exception as e:
        if connection:
            connection.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update digital request: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# --------------------------------------------------
# GET DIGITAL REQUESTS BY STUDENT ID
# --------------------------------------------------

@router.get("/student/{student_id}")
@router.get("/{student_id}")
def get_student_digital_requests(student_id: str):
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        query = """
            SELECT
                id,
                request_id,
                service,
                student_id,
                student_name,
                email,
                details,
                status,
                submitted_at,
                estimated_turnaround,
                staff_notes,
                updated_at
            FROM digital_requests
            WHERE student_id = %s
            ORDER BY submitted_at DESC;
        """

        cursor.execute(query, (student_id,))
        rows = cursor.fetchall()

        requests = []
        for row in rows:
            requests.append({
                "databaseId": row[0],
                "requestId": row[1],
                "request_id": row[1],
                "service": row[2],
                "studentId": row[3],
                "student_id": row[3],
                "studentName": row[4],
                "student_name": row[4],
                "email": row[5],
                "details": row[6],
                "status": row[7],
                "submittedAt": str(row[8]) if row[8] else None,
                "submitted_at": str(row[8]) if row[8] else None,
                "estimatedTurnaround": row[9],
                "estimated_turnaround": row[9],
                "staffNotes": row[10],
                "staff_notes": row[10],
                "updatedAt": str(row[11]) if row[11] else None
            })

        return {
            "status": "success",
            "student_id": student_id,
            "requests": requests
        }

    except Exception as e:
        print("[ERROR] Failed to fetch digital requests:", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch digital requests: {str(e)}"
        )
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
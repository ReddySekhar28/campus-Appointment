import os
import time
from pathlib import Path
from datetime import datetime
import time
from typing import Optional

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from appointment_api import verify_klu_user

from database import get_connection

load_dotenv(Path(__file__).resolve().parent / ".env")

router = APIRouter(
    prefix="/api/problems",
    tags=["Student Problems"]
)



# ==========================================================
# REQUEST MODELS
# ==========================================================

class ProblemRequest(BaseModel):
    student_name: Optional[str] = "Student"
    student_id: Optional[str] = None
    email: Optional[str] = None

    service_id: Optional[str] = None
    service_name: Optional[str] = None
    category: Optional[str] = None

    title: str
    description: str

    is_urgent: bool = False
    urgency_reason: Optional[str] = None

    assigned_counter: Optional[str] = None
    assigned_staff: Optional[str] = None
    

    supporting_doc_name: Optional[str] = None


class ProblemStatusUpdate(BaseModel):
    status: str
    staff_notes: Optional[str] = None
    resolution_details: Optional[str] = None


# ==========================================================
# CREATE STUDENT PROBLEM
# ==========================================================
@router.post("")
def create_problem(
    request: ProblemRequest,
    authorization: Optional[str] = Header(default=None)
):
    user = verify_klu_user(authorization)

    # Only verified KLU students may submit campus complaints.
    if user.get("role") != "student":
        raise HTTPException(
            status_code=403,
            detail="Only KLU student accounts can submit campus complaints."
        )

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor()

        # Generate unique problem ID
        timestamp = int(time.time() * 1000)

        problem_id = f"PRB-{timestamp}"

        query = """
            INSERT INTO student_problems (
                problem_id,
                student_name,
                student_id,
                email,
                service_id,
                service_name,
                category,
                title,
                description,
                is_urgent,
                urgency_reason,
                status,
                assigned_counter,
                assigned_staff,
                supporting_doc_name,
                created_at
            )
            VALUES (
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s,
                %s, %s,
                %s,
                %s, %s,
                %s,
                NOW()
            )
            RETURNING id;
        """

        cursor.execute(
            query,
            (
                problem_id,
                user["name"],
user["student_id"],
user["email"],

                request.service_id,
                request.service_name,
                request.category,

                request.title,
                request.description,

                request.is_urgent,
                request.urgency_reason,

                "PENDING",

                request.assigned_counter,
                request.assigned_staff,

                request.supporting_doc_name
            )
        )

        database_id = cursor.fetchone()[0]

        connection.commit()

        return {
            "success": True,
            "message": "Student problem submitted successfully.",

            "problem": {
                "databaseId": database_id,
                "problemId": problem_id,

                "studentName": user["name"],
"studentId": user["student_id"],
"email": user["email"],

                "serviceId": request.service_id,
                "serviceName": request.service_name,
                "category": request.category,

                "title": request.title,
                "description": request.description,

                "isUrgent": request.is_urgent,
                "urgencyReason": request.urgency_reason,

                "status": "PENDING",

                "assignedCounter": request.assigned_counter,
                "assignedStaff": request.assigned_staff,

                "staffNotes": None,
                "resolutionDetails": None,

                "supportingDocName": request.supporting_doc_name
            }
        }

    except Exception as e:
        if connection:
            connection.rollback()
        print("[ERROR] Student problem database error:", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save student problem: {str(e)}"
        )

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==========================================================
# GET ALL STUDENT PROBLEMS
# ==========================================================

@router.get("")
def get_problems(
    student_id: Optional[str] = None,
    service_id: Optional[str] = None,
    status: Optional[str] = None
):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor()

        query = """
            SELECT
                id,
                problem_id,
                student_name,
                student_id,
                email,
                service_id,
                service_name,
                category,
                title,
                description,
                is_urgent,
                urgency_reason,
                status,
                assigned_counter,
                assigned_staff,
                staff_notes,
                resolution_details,
                supporting_doc_name,
                created_at,
                updated_at
            FROM student_problems
            WHERE 1=1
        """

        params = []

        if student_id:
            query += " AND student_id = %s"
            params.append(student_id)

        if service_id:
            query += " AND service_id = %s"
            params.append(service_id)

        if status:
            query += " AND status = %s"
            params.append(status)

        query += " ORDER BY created_at DESC"

        cursor.execute(query, tuple(params))

        rows = cursor.fetchall()

        problems = []

        for row in rows:

            problems.append({
                "databaseId": row[0],
                "problemId": row[1],

                "studentName": row[2],
                "studentId": row[3],
                "email": row[4],

                "serviceId": row[5],
                "serviceName": row[6],
                "category": row[7],

                "title": row[8],
                "description": row[9],

                "isUrgent": row[10],
                "urgencyReason": row[11],

                "status": row[12],

                "assignedCounter": row[13],
                "assignedStaff": row[14],

                "staffNotes": row[15],
                "resolutionDetails": row[16],

                "supportingDocName": row[17],

                "createdAt": str(row[18]) if row[18] else None,
                "updatedAt": str(row[19]) if row[19] else None
            })

        return {
            "success": True,
            "count": len(problems),
            "problems": problems
        }

    except Exception as e:
        print("[ERROR] Failed to fetch student problems:", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch student problems: {str(e)}"
        )

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==========================================================
# GET SINGLE PROBLEM
# ==========================================================

@router.get("/{problem_id}")
def get_problem(problem_id: str):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                id,
                problem_id,
                student_name,
                student_id,
                email,
                service_id,
                service_name,
                category,
                title,
                description,
                is_urgent,
                urgency_reason,
                status,
                assigned_counter,
                assigned_staff,
                staff_notes,
                resolution_details,
                supporting_doc_name,
                created_at,
                updated_at
            FROM student_problems
            WHERE problem_id = %s
            """,
            (problem_id,)
        )

        row = cursor.fetchone()

        if not row:

            raise HTTPException(
                status_code=404,
                detail="Student problem not found"
            )

        problem = {
            "databaseId": row[0],
            "problemId": row[1],

            "studentName": row[2],
            "studentId": row[3],
            "email": row[4],

            "serviceId": row[5],
            "serviceName": row[6],
            "category": row[7],

            "title": row[8],
            "description": row[9],

            "isUrgent": row[10],
            "urgencyReason": row[11],

            "status": row[12],

            "assignedCounter": row[13],
            "assignedStaff": row[14],

            "staffNotes": row[15],
            "resolutionDetails": row[16],

            "supportingDocName": row[17],

            "createdAt": str(row[18]) if row[18] else None,
            "updatedAt": str(row[19]) if row[19] else None
        }

        return {
            "success": True,
            "problem": problem
        }

    except HTTPException:
        raise

    except Exception as e:
        print("[ERROR] Failed to fetch student problem:", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch student problem: {str(e)}"
        )

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==========================================================
# UPDATE PROBLEM STATUS
# ==========================================================

@router.put("/{problem_id}")
def update_problem_status(
    problem_id: str,
    request: ProblemStatusUpdate
):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE student_problems
            SET
                status = %s,
                staff_notes = COALESCE(%s, staff_notes),
                resolution_details = COALESCE(%s, resolution_details),
                updated_at = NOW()
            WHERE problem_id = %s
            RETURNING
                id,
                problem_id,
                status,
                staff_notes,
                resolution_details,
                updated_at;
            """,
            (
                request.status,
                request.staff_notes,
                request.resolution_details,
                problem_id
            )
        )

        row = cursor.fetchone()

        if not row:

            raise HTTPException(
                status_code=404,
                detail="Student problem not found"
            )

        connection.commit()

        return {
            "success": True,
            "message": "Student problem updated successfully.",

            "problem": {
                "databaseId": row[0],
                "problemId": row[1],
                "status": row[2],
                "staffNotes": row[3],
                "resolutionDetails": row[4],
                "updatedAt": str(row[5]) if row[5] else None
            }
        }

    except HTTPException:
        if connection:
            connection.rollback()
        raise

    except Exception as e:
        if connection:
            connection.rollback()
        print("[ERROR] Failed to update student problem:", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update student problem: {str(e)}"
        )

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()
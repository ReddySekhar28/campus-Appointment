
import os
import time
from pathlib import Path
from datetime import date
from typing import Optional

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from database import get_connection

load_dotenv(Path(__file__).resolve().parent / ".env")

router = APIRouter(
    prefix="/api/appointments",
    tags=["Appointments"]
)


class AppointmentRequest(BaseModel):
    service_id: str
    service_name: Optional[str] = None
    student_name: Optional[str] = None
    student_id: Optional[str] = None
    date: date
    time_slot: str
    office: Optional[str] = None
    counter: Optional[str] = None


def verify_klu_user(authorization: Optional[str]):
    """Verify the Supabase session and authorize KLU students/teachers."""

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Please sign in with your KLU account."
        )

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY")

    if not supabase_url or not supabase_key:
        raise HTTPException(
            status_code=503,
            detail="Supabase authentication is not configured on the server."
        )

    access_token = authorization.split(" ", 1)[1].strip()

    if not access_token:
        raise HTTPException(status_code=401, detail="Missing access token.")

    try:
        response = requests.get(
            f"{supabase_url.rstrip('/')}/auth/v1/user",
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {access_token}"
            },
            timeout=10
        )
    except requests.RequestException:
        raise HTTPException(
            status_code=503,
            detail="Unable to verify your Supabase session. Try again."
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=401,
            detail="Your session is invalid or expired. Please sign in again."
        )

    user = response.json()
    email = (user.get("email") or "").strip().lower()

    if not email.endswith("@klu.ac.in"):
        raise HTTPException(
            status_code=403,
            detail="Only KLU student and staff accounts can book appointments."
        )

    app_metadata = user.get("app_metadata") or {}
    role = app_metadata.get("role")

    if role not in ("student", "teacher"):
        raise HTTPException(
            status_code=403,
            detail="Your account is not authorized to book appointments."
        )

    user_metadata = user.get("user_metadata") or {}

    name = (
        user_metadata.get("full_name")
        or user_metadata.get("name")
        or email.split("@")[0]
    )

    # Use the numeric identifier from the verified KLU email.
    klu_id = email.split("@")[0]

    if not klu_id.isdigit():
        raise HTTPException(
            status_code=403,
            detail="Your KLU email does not contain a valid numeric ID."
        )

    return {
        "email": email,
        "name": name,
        "student_id": klu_id,
        "role": role
    }


@router.post("/book")
def book_appointment(
    request: AppointmentRequest,
    authorization: Optional[str] = Header(default=None)
):
    # Never trust identity information supplied by the browser.
    user = verify_klu_user(
    authorization,
    allowed_roles=("student",)
)

    appointment_id = (
        f"APT-{user['student_id']}-{int(time.time())}"
    )

    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        query = """
        INSERT INTO appointments (
            appointment_id,
            service_id,
            service_name,
            student_name,
            student_id,
            date,
            time_slot,
            office,
            counter,
            status
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, appointment_id;
        """

        cursor.execute(query, (
            appointment_id,
            request.service_id,
            request.service_name,
            user["name"],
            user["student_id"],
            request.date,
            request.time_slot,
            request.office,
            request.counter,
            "CONFIRMED"
        ))

        result = cursor.fetchone()
        connection.commit()

        return {
            "status": "success",
            "message": "Appointment booked successfully",
            "appointment": {
                "id": result[0],
                "appointment_id": result[1],
                "service_id": request.service_id,
                "service_name": request.service_name,
                "student_name": user["name"],
                "student_id": user["student_id"],
                "date": str(request.date),
                "time_slot": request.time_slot,
                "office": request.office,
                "counter": request.counter,
                "status": "CONFIRMED"
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        if connection:
            connection.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to save appointment. Please try again."
        )
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@router.get("/")
def get_appointments():
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                id,
                appointment_id,
                service_id,
                service_name,
                student_name,
                student_id,
                date,
                time_slot,
                office,
                counter,
                status,
                created_at
            FROM appointments
            ORDER BY created_at DESC;
        """)

        rows = cursor.fetchall()

        appointments = []

        for row in rows:
            appointments.append({
                "id": row[0],
                "appointment_id": row[1],
                "service_id": row[2],
                "service_name": row[3],
                "student_name": row[4],
                "student_id": row[5],
                "date": str(row[6]),
                "time_slot": row[7],
                "office": row[8],
                "counter": row[9],
                "status": row[10],
                "created_at": str(row[11])
            })

        return {
            "status": "success",
            "appointments": appointments
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve appointments."
        )
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

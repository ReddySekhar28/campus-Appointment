from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import uuid

from database import get_connection
from appointment_api import verify_klu_user

router = APIRouter(prefix="/api/queue", tags=["Queue"])


class QueueRequest(BaseModel):
    service: str
    user_id: Optional[str] = None


@router.post("/join")
def join_queue(
    request: QueueRequest,
    authorization: Optional[str] = Header(default=None)
):
    # Only verified KLU students can join the queue
    user = verify_klu_user(
        authorization,
        allowed_roles=("student",)
    )

    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM queue_tickets
            WHERE service = %s
              AND status = 'WAITING'
            """,
            (request.service,)
        )

        waiting_count = cursor.fetchone()[0]

        queue_number = waiting_count + 1
        people_ahead = waiting_count
        estimated_wait = people_ahead * 5

        service_prefix = "".join(
            character
            for character in request.service.upper()
            if character.isalnum()
        )[:3]

        ticket_id = f"{service_prefix}-{uuid.uuid4().hex[:8].upper()}"

        # Use the verified student's ID, never the browser-supplied ID
        student_id = user["student_id"]

        cursor.execute(
            """
            INSERT INTO queue_tickets (
                ticket_id,
                service,
                user_id,
                status,
                queue_number,
                people_ahead,
                estimated_wait_minutes,
                is_emergency
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, ticket_id, queue_number
            """,
            (
                ticket_id,
                request.service,
                student_id,
                "WAITING",
                queue_number,
                people_ahead,
                estimated_wait,
                False
            )
        )

        result = cursor.fetchone()
        connection.commit()

        return {
            "status": "success",
            "message": "Successfully joined the queue",
            "queue": {
                "id": result[0],
                "ticket_id": result[1],
                "service": request.service,
                "user_id": student_id,
                "queue_number": result[2],
                "people_ahead": people_ahead,
                "estimated_wait_minutes": estimated_wait
            }
        }

    except Exception as e:
        if connection:
            connection.rollback()

        print("[ERROR] Queue join failed:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Unable to join the queue."
        )

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@router.get("/tickets/{service}")
def get_queue_tickets(service: str):
    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            SELECT
                id,
                ticket_id,
                service,
                user_id,
                status,
                queue_number,
                people_ahead,
                estimated_wait_minutes,
                is_emergency
            FROM queue_tickets
            WHERE service = %s
              AND status = 'WAITING'
            ORDER BY queue_number ASC
            """,
            (service,)
        )

        rows = cursor.fetchall()

        tickets = [
            {
                "id": row[0],
                "ticket_id": row[1],
                "service": row[2],
                "user_id": row[3],
                "status": row[4],
                "queue_number": row[5],
                "people_ahead": row[6],
                "estimated_wait_minutes": row[7],
                "is_emergency": row[8]
            }
            for row in rows
        ]

        return {
            "status": "success",
            "service": service,
            "waiting_count": len(tickets),
            "tickets": tickets
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        cursor.close()
        connection.close()

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
class QueueStatusRequest(BaseModel):
    status: str



@router.post("/join")
def join_queue(
    request: QueueRequest,
    authorization: Optional[str] = Header(default=None)
):
    # Only verified students can join the queue
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

        # Use identity details verified by Supabase
        student_id = user["student_id"]
        student_name = user["name"]

        cursor.execute(
            """
            INSERT INTO queue_tickets (
                ticket_id,
                service,
                user_id,
                student_name,
                status,
                queue_number,
                people_ahead,
                estimated_wait_minutes,
                is_emergency
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, ticket_id, queue_number
            """,
            (
                ticket_id,
                request.service,
                student_id,
                student_name,
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
                "student_name": student_name,
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
def get_queue_tickets(
    service: str,
    authorization: Optional[str] = Header(default=None)
):
    # Only authenticated teachers and admins can view department queues.
    verify_klu_user(
        authorization,
        allowed_roles=("teacher", "admin")
    )

    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                id,
                ticket_id,
                service,
                user_id,
                student_name,
                status,
                queue_number,
                people_ahead,
                estimated_wait_minutes,
                is_emergency
            FROM queue_tickets
            WHERE service = %s
              AND status NOT IN ('COMPLETED', 'CANCELLED')
            ORDER BY queue_number ASC
        """, (service,))

        rows = cursor.fetchall()

        tickets = [
            {
                "id": row[0],
                "ticket_id": row[1],
                "service": row[2],
                "user_id": row[3],
                "student_name": row[4] or "Student",
                "status": row[5],
                "queue_number": row[6],
                "people_ahead": row[7],
                "estimated_wait_minutes": row[8],
                "is_emergency": row[9]
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
        print("[ERROR] Queue retrieval failed:", str(e))
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve department queue."
        )

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@router.patch("/tickets/{ticket_id}/status")
def update_queue_ticket_status(
    ticket_id: str,
    request: QueueStatusRequest,
    authorization: Optional[str] = Header(default=None)
):
    verify_klu_user(
        authorization,
        allowed_roles=("teacher", "admin")
    )

    new_status = request.status.upper()

    if new_status not in ("IN_PROGRESS", "COMPLETED", "CANCELLED"):
        raise HTTPException(
            status_code=400,
            detail="Invalid queue ticket status."
        )

    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE queue_tickets
            SET status = %s
            WHERE ticket_id = %s
            RETURNING id, ticket_id, service, user_id,
                      student_name, status, queue_number,
                      people_ahead, estimated_wait_minutes,
                      is_emergency
            """,
            (new_status, ticket_id)
        )

        row = cursor.fetchone()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="Queue ticket not found."
            )

        # Recalculate waiting positions after completion or cancellation.
        if new_status in ("COMPLETED", "CANCELLED"):
            cursor.execute(
                """
                WITH waiting AS (
                    SELECT
                        id,
                        ROW_NUMBER() OVER (
                            ORDER BY queue_number ASC
                        ) - 1 AS ahead
                    FROM queue_tickets
                    WHERE service = %s
                      AND status = 'WAITING'
                )
                UPDATE queue_tickets AS q
                SET
                    people_ahead = waiting.ahead,
                    estimated_wait_minutes = waiting.ahead * 5
                FROM waiting
                WHERE q.id = waiting.id
                """,
                (row[2],)
            )

        connection.commit()

        return {
            "status": "success",
            "ticket": {
                "id": row[0],
                "ticket_id": row[1],
                "service": row[2],
                "user_id": row[3],
                "student_name": row[4] or "Student",
                "status": row[5],
                "queue_number": row[6],
                "people_ahead": row[7],
                "estimated_wait_minutes": row[8],
                "is_emergency": row[9]
            }
        }

    except HTTPException:
        if connection:
            connection.rollback()
        raise

    except Exception as e:
        if connection:
            connection.rollback()

        print("[ERROR] Queue status update failed:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Unable to update queue ticket."
        )

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

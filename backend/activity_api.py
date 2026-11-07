from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from database import get_connection
import time

router = APIRouter(
    prefix="/api/activity",
    tags=["Activity Logs"]
)


class ActivityLogRequest(BaseModel):
    text: str
    type: Optional[str] = "GENERAL"
    student_id: Optional[str] = None
    student_name: Optional[str] = None


@router.post("/log")
@router.post("")
def log_activity(request: ActivityLogRequest):
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor()

        activity_id = f"ACT-{int(time.time() * 1000)}"

        query = """
            INSERT INTO activity_logs (
                activity_id,
                text,
                type,
                student_id,
                student_name,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s, NOW())
            RETURNING id, created_at;
        """
        cursor.execute(
            query,
            (
                activity_id,
                request.text,
                request.type,
                request.student_id,
                request.student_name
            )
        )
        row = cursor.fetchone()
        connection.commit()

        return {
            "status": "success",
            "activity": {
                "id": row[0],
                "activityId": activity_id,
                "text": request.text,
                "type": request.type,
                "studentId": request.student_id,
                "studentName": request.student_name,
                "createdAt": str(row[1]),
                "time": "Just now"
            }
        }
    except Exception as e:
        if connection:
            connection.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to log activity: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@router.get("")
@router.get("/")
def get_activities(limit: int = Query(50, ge=1, le=200)):
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor()

        query = """
            SELECT
                id,
                activity_id,
                text,
                type,
                student_id,
                student_name,
                created_at
            FROM activity_logs
            ORDER BY created_at DESC
            LIMIT %s;
        """
        cursor.execute(query, (limit,))
        rows = cursor.fetchall()

        activities = []
        for row in rows:
            activities.append({
                "id": row[0],
                "activityId": row[1],
                "text": row[2],
                "type": row[3],
                "studentId": row[4],
                "studentName": row[5],
                "createdAt": str(row[6]),
                "time": "Just now"
            })

        return {
            "status": "success",
            "activities": activities
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch activities: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

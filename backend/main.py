from fastapi import FastAPI
from pydantic import BaseModel
from problem_api import router as problem_router
from fastapi.middleware.cors import CORSMiddleware

from appointment_api import router as appointment_router
from queue_api import router as queue_router
from emergency_api import router as emergency_router
from digital_request_api import router as digital_request_router
from activity_api import router as activity_router
# --------------------------------------------------
# APP
# --------------------------------------------------

app = FastAPI(
    title="CampusFlow AI",
    description="Campus Appointment and Queue Management API",
    version="1.0.0"
)


# --------------------------------------------------
# REQUEST MODELS
# --------------------------------------------------

class NavigatorRequest(BaseModel):
    query: str


# --------------------------------------------------
# ROUTERS
# --------------------------------------------------

app.include_router(queue_router)
app.include_router(appointment_router)
app.include_router(emergency_router)
app.include_router(digital_request_router)
app.include_router(problem_router)
app.include_router(activity_router)


# --------------------------------------------------
# CORS 
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://campus-appointment-dfqe.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# ROOT
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "CampusFlow AI API is running",
        "status": "success"
    }


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/api/health")
def health():
    return {
        "status": "healthy"
    }


# --------------------------------------------------
# NATURAL LANGUAGE NAVIGATOR
# --------------------------------------------------

@app.post("/api/navigator")
def navigator(request: NavigatorRequest):

    query = request.query.lower()

    urgency_keywords = [
        "urgent",
        "emergency",
        "tomorrow",
        "today",
        "immediately",
        "critical",
        "deadline",
        "asap",
        "expedite"
    ]

    is_urgent = any(
        word in query
        for word in urgency_keywords
    )

    # ----------------------------------------------
    # SERVICE CATEGORY DETECTION
    # ----------------------------------------------

    if "visa" in query or "passport" in query:
        category = "Visa & Travel"

    elif "transcript" in query or "certificate" in query:
        category = "Academic Records"

    elif "fee" in query or "payment" in query:
        category = "Financial Services"

    elif "hostel" in query or "room" in query:
        category = "Hostel Services"

    else:
        category = "General Inquiries"

    # ----------------------------------------------
    # RESPONSE
    # ----------------------------------------------

    return {
        "intent": {
            "rawQuery": request.query,
            "detectedCategory": category,
            "isUrgent": is_urgent,
            "urgencyReason": (
                "Detected urgent keywords"
                if is_urgent
                else "Standard campus service request"
            ),
            "recommendedAction": (
                "EMERGENCY_PRIORITY_OR_APPOINTMENT"
                if is_urgent
                else "JOIN_QUEUE_OR_DIGITAL"
            )
        },
        "matches": []
    }
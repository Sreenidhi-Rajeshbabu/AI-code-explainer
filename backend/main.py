"""
AI Code Explainer — FastAPI Backend
This is your main server file. You'll build it up over the week.

Day 1: Just the skeleton (this file)
Day 3: Add the /api/explain endpoint
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI Code Explainer", version="1.0.0")

# CORS — this allows your React frontend to talk to this backend
# Without this, your browser will block all requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "AI Code Explainer API is running ✅"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


# You will add this on Day 3:
# @app.post("/api/explain")
# def explain_code(request: CodeRequest):
#     ...


# Run with: uvicorn main:app --reload
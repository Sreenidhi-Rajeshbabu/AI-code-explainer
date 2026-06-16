"""
AI Code Explainer — FastAPI Backend
Day 6: Production-ready CORS (works locally AND on Render)
"""

import os
import json
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Code Explainer", version="1.0.0")

# ============================================================
# CORS — allows local dev AND your deployed Vercel frontend
# ============================================================

# Add your Vercel URL here after you deploy the frontend (Step 2 below)
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    # "https://your-app-name.vercel.app",  <- uncomment and fill this in after frontend deploy
]

# Also allow an origin from an env var, so you can update it without code changes
extra_origin = os.getenv("FRONTEND_URL")
if extra_origin:
    ALLOWED_ORIGINS.append(extra_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# REQUEST MODEL
# ============================================================

class CodeRequest(BaseModel):
    code: str
    language: str


# ============================================================
# MASTER PROMPT
# ============================================================

def build_prompt(code: str, language: str) -> str:
    return f"""
You are an expert coding assistant and computer science teacher.
Analyze the {language} code below and return a JSON response with EXACTLY these 5 keys.

RULES:
- Return ONLY valid JSON. No markdown, no backticks, no explanation outside the JSON.
- Every key must always be present, even if the code is short or broken.
- Be clear and beginner-friendly in your explanations.

CODE TO ANALYZE:
```
{code}
```

Return this exact JSON structure:
{{
  "line_by_line": [
    {{"line": "the actual code line", "explanation": "what this line does in plain English"}}
  ],
  "time_complexity": {{
    "complexity": "e.g. O(n)",
    "explanation": "why it is this complexity in 2-3 sentences"
  }},
  "bugs": [
    {{"line": "the buggy line or none", "issue": "what the bug is", "fix": "how to fix it"}}
  ],
  "optimized_version": {{
    "code": "the improved version of the code",
    "changes": "what was improved and why"
  }},
  "interview_explanation": {{
    "summary": "2-3 sentence high level explanation you'd give in an interview",
    "approach": "how you'd explain your thinking process",
    "edge_cases": "what edge cases exist and how the code handles them"
  }}
}}

If there are no bugs, return bugs as: [{{"line": "none", "issue": "No bugs found", "fix": "none"}}]
"""


# ============================================================
# GEMINI API CALL
# ============================================================

def call_gemini(code: str, language: str) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

    payload = {
        "contents": [
            {"parts": [{"text": build_prompt(code, language)}]}
        ],
        "generationConfig": {"temperature": 0.2}
    }

    try:
        response = requests.post(url, json=payload, timeout=30)
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Gemini API timed out. Please try again.")
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="Could not connect to Gemini API.")

    if response.status_code == 429:
        raise HTTPException(status_code=429, detail="Rate limit hit. Please wait a moment and try again.")
    if response.status_code == 503:
        raise HTTPException(status_code=503, detail="Gemini is experiencing high demand. Please try again.")
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {response.status_code}")

    raw_text = response.json()["candidates"][0]["content"]["parts"][0]["text"]

    raw_text = raw_text.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.split("```")[1]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]
    if raw_text.endswith("```"):
        raw_text = raw_text[:-3]

    try:
        return json.loads(raw_text.strip())
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse Gemini response as JSON.")


# ============================================================
# ROUTES
# ============================================================

@app.get("/")
def root():
    return {"message": "AI Code Explainer API is running ✅"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/explain")
def explain_code(request: CodeRequest):
    if not request.code or not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty.")
    if len(request.code) > 5000:
        raise HTTPException(status_code=400, detail="Code too long. Please keep it under 5000 characters.")
    if not request.language or not request.language.strip():
        raise HTTPException(status_code=400, detail="Language cannot be empty.")

    result = call_gemini(request.code.strip(), request.language.strip())
    return result
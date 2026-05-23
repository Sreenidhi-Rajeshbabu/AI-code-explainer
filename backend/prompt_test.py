"""
Day 2 — Master Prompt Engineering
Tests the core AI prompt that powers all 5 sections of the app.

Usage:
    python prompt_test.py
"""

import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

# ============================================================
# THE MASTER PROMPT — this is the heart of your entire app
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
    {{"line": "the buggy line or 'none'", "issue": "what the bug is", "fix": "how to fix it"}}
  ],
  "optimized_version": {{
    "code": "the improved version of the code",
    "changes": "bullet points of what was improved and why"
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
# FUNCTION TO CALL GEMINI
# ============================================================

def explain_code(code: str, language: str) -> dict:
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": build_prompt(code, language)}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2  # low temperature = more consistent, structured output
        }
    }

    response = requests.post(GEMINI_URL, json=payload)

    if response.status_code != 200:
        raise Exception(f"API Error {response.status_code}: {response.json()}")

    raw_text = response.json()["candidates"][0]["content"]["parts"][0]["text"]

    # Clean up in case Gemini adds markdown backticks anyway
    raw_text = raw_text.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.split("```")[1]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]
    if raw_text.endswith("```"):
        raw_text = raw_text[:-3]

    return json.loads(raw_text.strip())

# ============================================================
# TEST ON 3 DIFFERENT CODE SNIPPETS
# ============================================================

test_cases = [
    {
        "label": "Test 1 — Simple loop",
        "language": "Python",
        "code": """
def find_max(arr):
    max_val = arr[0]
    for i in range(len(arr)):
        if arr[i] > max_val:
            max_val = arr[i]
    return max_val
"""
    },
    {
        "label": "Test 2 — Code with a bug",
        "language": "Python",
        "code": """
def divide(a, b):
    return a / b

print(divide(10, 0))
"""
    },
    {
        "label": "Test 3 — Nested loop (classic interview question)",
        "language": "Python",
        "code": """
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr
"""
    }
]

def print_result(label: str, result: dict):
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"{'='*60}")

    print("\n📝 LINE BY LINE:")
    for item in result["line_by_line"]:
        print(f"  {item['line']}")
        print(f"    → {item['explanation']}")

    print(f"\n⏱ TIME COMPLEXITY: {result['time_complexity']['complexity']}")
    print(f"  {result['time_complexity']['explanation']}")

    print("\n🐛 BUGS:")
    for bug in result["bugs"]:
        print(f"  Line: {bug['line']}")
        print(f"  Issue: {bug['issue']}")
        print(f"  Fix: {bug['fix']}")

    print("\n⚡ OPTIMIZED VERSION:")
    print(f"  {result['optimized_version']['code']}")
    print(f"  Changes: {result['optimized_version']['changes']}")

    print("\n🎤 INTERVIEW EXPLANATION:")
    print(f"  Summary: {result['interview_explanation']['summary']}")
    print(f"  Approach: {result['interview_explanation']['approach']}")
    print(f"  Edge Cases: {result['interview_explanation']['edge_cases']}")


# Run all tests
for test in test_cases:
    print(f"\n⏳ Running {test['label']}...")
    try:
        result = explain_code(test["code"], test["language"])
        print_result(test["label"], result)
        print(f"\n✅ {test['label']} passed!")
    except Exception as e:
        print(f"\n❌ {test['label']} failed: {e}")

print("\n\n Day 2 complete! Your master prompt works. Move on to Day 3.")
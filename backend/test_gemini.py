import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ ERROR: GEMINI_API_KEY not found.")
    print("   Make sure your .env file contains: GEMINI_API_KEY=your_key_here")
    exit(1)

test_code = """
def add_numbers(a, b):
    return a + b

result = add_numbers(3, 5)
print(result)
"""

print("🚀 Sending test code to Gemini...")
print("-" * 40)

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

payload = {
    "contents": [
        {
            "parts": [
                {
                    "text": f"Explain what this Python code does in 2-3 simple sentences:\n\n{test_code}"
                }
            ]
        }
    ]
}

response = requests.post(url, json=payload)

if response.status_code != 200:
    print(f"❌ API Error {response.status_code}:")
    print(response.json())
    exit(1)

data = response.json()
explanation = data["candidates"][0]["content"]["parts"][0]["text"]

print("✅ Gemini responded:\n")
print(explanation)
print("-" * 40)
print("\n🎉 Day 1 complete! Your API key works. Move on to Day 2.")
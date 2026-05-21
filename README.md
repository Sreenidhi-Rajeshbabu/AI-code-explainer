# AI Code Explainer

An AI-powered tool that explains code, finds bugs, suggests optimizations, and gives interview-style breakdowns.

## Tech Stack
- **Frontend:** React (coming Day 4)
- **Backend:** Python + FastAPI
- **AI:** Google Gemini API (free tier)
- **Deployed on:** Vercel (frontend) + Render (backend)

## Features
- Line-by-line explanation
- Time complexity analysis
- Bug detection
- Optimized version of the code
- Interview-style explanation

## Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # then add your Gemini API key inside .env
```

### Run the test (Day 1)
```bash
python test_gemini.py
```

### Run the server (Day 3+)
```bash
uvicorn main:app --reload
```

## Project Structure
```
ai-code-explainer/
├── backend/
│   ├── main.py              # FastAPI server
│   ├── test_gemini.py       # Day 1 API test
│   ├── requirements.txt
│   ├── .env                 # Your API key (never commit this)
│   └── .env.example         # Safe to commit
├── frontend/                # Coming Day 4
├── .gitignore
└── README.md
```

## Live Demo
Coming Day 6!
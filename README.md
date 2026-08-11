# AgentFlow — AI Agent & Workflow Platform

A full-stack SaaS platform for building AI agents and automated workflows with a visual drag-and-drop interface, similar to creao.ai and n8n.

## Features

- 🤖 **AI Agents** — Create agents with custom system prompts, LLM models (OpenAI + Ollama)
- 🎨 **Visual Workflow Builder** — Drag-and-drop canvas using React Flow
- 🔌 **Integrations** — Email (SMTP), Telegram Bot, HTTP APIs, Webhooks
- ⏰ **Scheduling** — Cron jobs for 24/7 automated execution
- 📚 **Local AI** — HuggingFace `sentence-transformers/all-MiniLM-L6-v2` for embeddings (no API cost)
- 🔐 **Security** — JWT auth, bcrypt passwords, Fernet-encrypted credentials, rate limiting

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 + TailwindCSS + React Flow |
| Backend | FastAPI (Python 3.11) + LangGraph |
| Database | PostgreSQL + SQLAlchemy |
| Cache/Queue | Redis + Celery |
| Local AI | sentence-transformers + ChromaDB |
| Deploy | Docker + Docker Compose |

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# 1. Copy and configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your settings

# 2. Start all services
docker-compose up -d

# 3. Open in browser
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/api/v1/docs
```

### Option 2: Local Development

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Linux/Mac
pip install -r requirements.txt
cp .env.example .env          # Edit with your config
uvicorn main:app --reload --port 8000
```

**Redis (required for Celery):**
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

**Celery Worker:**
```bash
cd backend
celery -A workers.celery_app worker --loglevel=info
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

## Project Structure

```
project/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── core/                # Config, DB, Security, Rate Limiting
│   ├── models/              # SQLAlchemy DB models
│   ├── schemas/             # Pydantic request/response schemas
│   ├── api/routes/          # REST API endpoints
│   ├── engine/              # LangGraph workflow executor
│   │   └── nodes/           # Node implementations (LLM, Email, Telegram...)
│   ├── integrations/        # Telegram, Email, Webhook tools
│   ├── ai/                  # Local HuggingFace embedder + ChromaDB
│   └── workers/             # Celery async task workers
└── frontend/
    ├── app/                 # Next.js App Router pages
    │   ├── page.tsx         # Landing page
    │   ├── login/           # Auth pages
    │   ├── register/
    │   ├── dashboard/       # Main dashboard + layout
    │   ├── agents/          # AI Agents management
    │   ├── workflows/       # Workflow list + canvas editor
    │   ├── connections/     # Integration management
    │   └── runs/            # Execution history & logs
    └── lib/api.ts           # Centralized API client
```

## Available Node Types

| Category | Node |
|---|---|
| Triggers | Manual, Cron Schedule, Webhook |
| AI | AI Agent (LLM), Text Input, Text Template |
| Actions | Send Email, Send Telegram, HTTP Request |
| Logic | Condition, Delay |

## API Documentation

After starting the backend, visit: `http://localhost:8000/api/v1/docs`

## Security Notes

- All API keys and credentials are **Fernet-encrypted** before database storage
- Passwords are hashed with **bcrypt**
- Rate limiting: 60 req/min general, 10 req/min for auth routes
- All user data is **isolated** — each query is scoped to the authenticated user

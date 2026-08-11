"""
AgentFlow — Main FastAPI Application Entry Point.
Configures CORS, rate limiting, all routers, and startup events.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded

from core.config import settings
from core.database import engine, Base
from core.rate_limiter import limiter, rate_limit_exceeded_handler
from api.routes import auth, agents, workflows, connections, runs
from api.routes.chat import router as chat_router
from integrations.webhook_tool import router as webhook_router
from fastapi.staticfiles import StaticFiles
import os

# ─── Create All DB Tables ─────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ─── App Instance ─────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    description="AI Agent & Workflow Automation Platform API",
    version="1.0.0",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# ─── Rate Limiter ────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# ─── CORS (Security: only allow frontend origin) ─────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# ─── Routers ─────────────────────────────────────────────────────
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(agents.router, prefix=settings.API_V1_STR)
app.include_router(workflows.router, prefix=settings.API_V1_STR)
app.include_router(connections.router, prefix=settings.API_V1_STR)
app.include_router(webhook_router, prefix=settings.API_V1_STR)
app.include_router(chat_router, prefix=settings.API_V1_STR)
app.include_router(runs.router, prefix=settings.API_V1_STR)

# Serve uploaded chat files (images, pdfs, etc.)
os.makedirs("./uploads/chat", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="./uploads"), name="uploads")


# ─── Health Check ─────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}


@app.get(f"{settings.API_V1_STR}/nodes/types")
def get_node_types():
    """Return all available workflow node types for the canvas."""
    from engine.node_registry import list_node_types
    return {"node_types": list_node_types()}


# ─── Startup Event ────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    """Pre-load the local embedding model on startup to avoid cold start."""
    import asyncio
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"🚀 {settings.APP_NAME} is starting up...")

    # Pre-warm the local embedding model in a thread pool
    try:
        import concurrent.futures
        loop = asyncio.get_event_loop()
        with concurrent.futures.ThreadPoolExecutor() as pool:
            await loop.run_in_executor(pool, _preload_embedding_model)
    except Exception as e:
        logger.warning(f"Could not pre-load embedding model: {e}")


def _preload_embedding_model():
    try:
        from ai.local_embedder import get_embedding_model
        get_embedding_model()
    except Exception:
        pass  # Fail silently — model will load on first use


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

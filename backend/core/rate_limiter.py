"""
Rate limiting middleware using SlowAPI.
Different limits for auth routes (strict) vs general API routes.
Uses in-memory storage by default (no Redis required for local dev).
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse
from limits.storage import MemoryStorage
from core.config import settings

# Global rate limiter (uses in-memory storage — works without Redis)
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"],
    storage_uri="memory://",
)

# Stricter limit string for auth routes
AUTH_LIMIT = f"{settings.AUTH_RATE_LIMIT_PER_MINUTE}/minute"


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Return a friendly JSON error when rate limit is exceeded."""
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "detail": "Too many requests. Please slow down and try again later.",
            "retry_after": "60 seconds",
        },
    )

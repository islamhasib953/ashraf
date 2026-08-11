"""
Rate limiting middleware using SlowAPI.
Different limits for auth routes (strict) vs general API routes.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse
from core.config import settings

# Global rate limiter (uses client IP address as key)
limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"])

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

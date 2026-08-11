"""
Security utilities:
- JWT token creation and verification
- Password hashing with bcrypt
- Fernet symmetric encryption for stored API keys/tokens
- Current user dependency for route protection
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
import base64

from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from core.config import settings
from core.database import get_db

# ─── Password Hashing ─────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ─── JWT Tokens ───────────────────────────────────────────────────
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT with expiry."""
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {"sub": subject, "exp": expire, "iat": datetime.now(timezone.utc)}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[str]:
    """Decode token and return user_id string, or None if invalid."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


# ─── Current User Dependency ──────────────────────────────────────
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """FastAPI dependency: validates JWT and returns the current DB user."""
    from models.user import User  # avoid circular import

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user_id = decode_token(token)
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id), User.is_active == True).first()
    if user is None:
        raise credentials_exception
    return user


# ─── Fernet Encryption for Stored Secrets ─────────────────────────
def _get_fernet() -> Fernet:
    """Get or auto-generate a Fernet cipher (key stored in settings)."""
    key = settings.FERNET_KEY
    if not key:
        # Auto-generate a key (not persistent across restarts without .env)
        key = Fernet.generate_key().decode()
    if isinstance(key, str):
        key = key.encode()
    return Fernet(key)


def encrypt_secret(value: str) -> str:
    """Encrypt a secret string (e.g., API key) before DB storage."""
    return _get_fernet().encrypt(value.encode()).decode()


def decrypt_secret(encrypted: str) -> str:
    """Decrypt an encrypted secret from the DB."""
    return _get_fernet().decrypt(encrypted.encode()).decode()

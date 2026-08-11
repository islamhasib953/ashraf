"""Connection model — stores user integrations (Telegram, Email, etc.)."""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from core.database import Base


class Connection(Base):
    __tablename__ = "connections"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    name = Column(String(200), nullable=False)           # e.g. "My Telegram Bot"
    connection_type = Column(String(50), nullable=False) # "telegram" | "email" | "webhook" | "http"

    # Encrypted credentials (Fernet encrypted JSON string)
    credentials_enc = Column(Text, nullable=False)

    # Extra config (not sensitive) — e.g. { "chat_id": 123456 }
    config = Column(JSON, default=dict)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # ─── Relationships ───────────────────────────────────
    owner = relationship("User", back_populates="connections")

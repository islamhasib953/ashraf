"""Agent SQLAlchemy model."""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from core.database import Base


class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    system_prompt = Column(Text, nullable=False)  # The AI's personality/instructions

    # LLM configuration (can be overridden per-agent)
    llm_provider = Column(String(50), default="openai")  # "openai", "local", "anthropic"
    llm_model = Column(String(100), default="gpt-4o-mini")
    llm_api_key_enc = Column(Text, nullable=True)   # Encrypted API key for this agent

    # Agent tools (list of enabled tool names)
    enabled_tools = Column(JSON, default=list)

    # Knowledge base ID (links to a ChromaDB collection)
    knowledge_base_id = Column(String(200), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # ─── Relationships ───────────────────────────────────
    owner = relationship("User", back_populates="agents")

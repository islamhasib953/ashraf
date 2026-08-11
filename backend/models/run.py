"""WorkflowRun model — tracks every execution with full logs."""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, Float
from sqlalchemy.orm import relationship
from core.database import Base


class WorkflowRun(Base):
    __tablename__ = "workflow_runs"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False, index=True)

    status = Column(String(20), default="pending")  # pending | running | success | failed
    trigger_type = Column(String(50), default="manual")  # manual | cron | webhook

    # Input data passed to the run (e.g. from webhook payload)
    input_data = Column(JSON, default=dict)

    # Step-by-step logs for the real-time log viewer
    # List of: { "step": "node_name", "status": "success", "output": "...", "timestamp": "..." }
    logs = Column(JSON, default=list)

    # Final output of the last node
    output = Column(Text, nullable=True)

    error_message = Column(Text, nullable=True)

    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # ─── Relationships ───────────────────────────────────
    owner = relationship("User", back_populates="runs")
    workflow = relationship("Workflow", back_populates="runs")

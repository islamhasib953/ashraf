"""Celery application configuration."""
from celery import Celery
from core.config import settings

celery_app = Celery(
    "agent_saas",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["workers.workflow_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Retry failed tasks up to 3 times with exponential backoff
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    # Task result expiry
    result_expires=86400,  # 24 hours
)

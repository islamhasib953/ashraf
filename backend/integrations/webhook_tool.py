"""Webhook handling utilities."""
from fastapi import APIRouter, Request
from core.database import SessionLocal
from models.workflow import Workflow
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/{webhook_token}")
async def receive_webhook(webhook_token: str, request: Request):
    """
    Receive an incoming webhook and trigger the associated workflow.
    The webhook_token is generated when a user enables webhook trigger on a workflow.
    """
    try:
        body = await request.json()
    except Exception:
        body = {}

    db = SessionLocal()
    try:
        # Find workflow by webhook token (stored in graph_json config)
        workflows = db.query(Workflow).filter(Workflow.is_active == True).all()
        target_wf = None
        for wf in workflows:
            graph = wf.graph_json or {}
            for node in graph.get("nodes", []):
                if node.get("type") == "webhook_trigger":
                    if node.get("data", {}).get("webhook_token") == webhook_token:
                        target_wf = wf
                        break

        if not target_wf:
            return {"status": "error", "message": "No workflow found for this webhook token"}

        # Create a run and execute
        from models.run import WorkflowRun
        run = WorkflowRun(
            owner_id=target_wf.owner_id,
            workflow_id=target_wf.id,
            status="pending",
            trigger_type="webhook",
            input_data=body,
            logs=[],
        )
        db.add(run)
        db.commit()
        db.refresh(run)

        # Dispatch to worker
        from workers.workflow_tasks import execute_workflow_task
        execute_workflow_task.delay(run.id, target_wf.graph_json, body, target_wf.owner_id)

        return {"status": "accepted", "run_id": run.id}

    finally:
        db.close()

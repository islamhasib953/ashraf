"""Background Celery tasks for workflow execution and scheduling."""
import logging
from workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    name="workers.workflow_tasks.execute_workflow_task",
)
def execute_workflow_task(self, run_id: int, graph_json: dict, input_data: dict, user_id: int):
    """
    Celery task: Execute a workflow run in the background.
    Retries up to 3 times on unexpected errors.
    """
    from core.database import SessionLocal
    from engine.executor import WorkflowExecutor

    db = SessionLocal()
    try:
        executor = WorkflowExecutor(db=db, user_id=user_id)
        run = executor.execute(run_id=run_id, graph_json=graph_json, input_data=input_data)
        logger.info(f"Run {run_id} completed with status: {run.status}")
        return {"run_id": run_id, "status": run.status}
    except Exception as exc:
        logger.error(f"Run {run_id} failed: {exc}")
        try:
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            # Update run as failed after all retries exhausted
            from models.run import WorkflowRun
            run = db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
            if run:
                run.status = "failed"
                run.error_message = f"Max retries exceeded: {exc}"
                db.commit()
            raise
    finally:
        db.close()


@celery_app.task(name="workers.workflow_tasks.run_scheduled_workflows")
def run_scheduled_workflows():
    """
    Periodic Celery task: Check for scheduled workflows and trigger due ones.
    Should be called by celery beat every minute.
    """
    from croniter import croniter
    from datetime import datetime, timezone
    from core.database import SessionLocal
    from models.workflow import Workflow
    from models.run import WorkflowRun

    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        scheduled = db.query(Workflow).filter(
            Workflow.is_scheduled == True,
            Workflow.is_active == True,
            Workflow.cron_expression != None,
        ).all()

        triggered = 0
        for wf in scheduled:
            try:
                cron = croniter(wf.cron_expression, now)
                prev_run = cron.get_prev(datetime)
                # If the previous scheduled time was within the last minute, run it
                diff = (now - prev_run).total_seconds()
                if diff <= 60:
                    run = WorkflowRun(
                        owner_id=wf.owner_id,
                        workflow_id=wf.id,
                        status="pending",
                        trigger_type="cron",
                        input_data={},
                        logs=[],
                    )
                    db.add(run)
                    db.commit()
                    db.refresh(run)
                    execute_workflow_task.delay(run.id, wf.graph_json, {}, wf.owner_id)
                    triggered += 1
            except Exception as e:
                logger.error(f"Cron check failed for workflow {wf.id}: {e}")

        logger.info(f"Scheduled check: triggered {triggered} workflows")
        return triggered
    finally:
        db.close()

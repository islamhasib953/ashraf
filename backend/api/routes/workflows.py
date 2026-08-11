"""Workflows CRUD + Execute routes."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.workflow import Workflow
from models.run import WorkflowRun
from models.user import User
from schemas.workflow import (
    WorkflowCreate, WorkflowUpdate, WorkflowResponse,
    WorkflowRunRequest, RunResponse
)

router = APIRouter(prefix="/workflows", tags=["Workflows"])


def _get_wf_or_404(wf_id: int, user_id: int, db: Session) -> Workflow:
    wf = db.query(Workflow).filter(Workflow.id == wf_id, Workflow.owner_id == user_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf


@router.get("", response_model=List[WorkflowResponse])
def list_workflows(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Workflow).filter(Workflow.owner_id == current_user.id).all()


@router.post("", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
def create_workflow(
    payload: WorkflowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wf = Workflow(
        owner_id=current_user.id,
        name=payload.name,
        description=payload.description,
        graph_json=payload.graph_json,
        cron_expression=payload.cron_expression,
        is_scheduled=payload.is_scheduled,
    )
    db.add(wf)
    db.commit()
    db.refresh(wf)
    return wf


@router.get("/{wf_id}", response_model=WorkflowResponse)
def get_workflow(wf_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _get_wf_or_404(wf_id, current_user.id, db)


@router.put("/{wf_id}", response_model=WorkflowResponse)
def update_workflow(
    wf_id: int,
    payload: WorkflowUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wf = _get_wf_or_404(wf_id, current_user.id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(wf, field, value)
    db.commit()
    db.refresh(wf)
    return wf


@router.delete("/{wf_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow(wf_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    wf = _get_wf_or_404(wf_id, current_user.id, db)
    db.delete(wf)
    db.commit()


@router.post("/{wf_id}/run", response_model=RunResponse, status_code=status.HTTP_202_ACCEPTED)
def run_workflow(
    wf_id: int,
    payload: WorkflowRunRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Trigger a workflow run (executes in background via Celery worker)."""
    wf = _get_wf_or_404(wf_id, current_user.id, db)

    # Create a pending run record immediately
    run = WorkflowRun(
        owner_id=current_user.id,
        workflow_id=wf.id,
        status="pending",
        trigger_type="manual",
        input_data=payload.input_data,
        logs=[],
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    # Dispatch to Celery background worker
    background_tasks.add_task(_dispatch_run, run.id, wf.graph_json, payload.input_data, current_user.id)

    return run


def _dispatch_run(run_id: int, graph_json: dict, input_data: dict, user_id: int):
    """Hand off the execution to the Celery task queue."""
    try:
        from workers.workflow_tasks import execute_workflow_task
        execute_workflow_task.delay(run_id, graph_json, input_data, user_id)
    except Exception as e:
        # Fallback: run synchronously if Celery is not available
        from engine.executor import WorkflowExecutor
        from core.database import SessionLocal
        db = SessionLocal()
        try:
            executor = WorkflowExecutor(db=db, user_id=user_id)
            executor.execute(run_id=run_id, graph_json=graph_json, input_data=input_data)
        finally:
            db.close()


@router.get("/{wf_id}/runs", response_model=List[RunResponse])
def list_runs(
    wf_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_wf_or_404(wf_id, current_user.id, db)
    return (
        db.query(WorkflowRun)
        .filter(WorkflowRun.workflow_id == wf_id, WorkflowRun.owner_id == current_user.id)
        .order_by(WorkflowRun.created_at.desc())
        .limit(50)
        .all()
    )


@router.get("/{wf_id}/runs/{run_id}", response_model=RunResponse)
def get_run(
    wf_id: int,
    run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    run = db.query(WorkflowRun).filter(
        WorkflowRun.id == run_id,
        WorkflowRun.workflow_id == wf_id,
        WorkflowRun.owner_id == current_user.id,
    ).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run

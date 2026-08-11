"""
Runs router — view all workflow execution history and logs.
"""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.run import WorkflowRun
from models.user import User
from schemas.workflow import RunResponse

router = APIRouter(prefix="/runs", tags=["Runs"])


@router.get("", response_model=List[RunResponse])
def list_all_runs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 50,
    status: str = None,
):
    """List all workflow runs for the current user (across all workflows)."""
    query = db.query(WorkflowRun).filter(WorkflowRun.owner_id == current_user.id)
    if status:
        query = query.filter(WorkflowRun.status == status)
    return query.order_by(WorkflowRun.created_at.desc()).limit(limit).all()


@router.get("/{run_id}", response_model=RunResponse)
def get_run_details(
    run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get detailed logs for a specific run."""
    from fastapi import HTTPException
    run = db.query(WorkflowRun).filter(
        WorkflowRun.id == run_id,
        WorkflowRun.owner_id == current_user.id,
    ).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run

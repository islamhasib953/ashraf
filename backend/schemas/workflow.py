"""Pydantic schemas for Workflows."""
from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel


class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    graph_json: Dict[str, Any] = {}   # { nodes: [...], edges: [...] }
    cron_expression: Optional[str] = None
    is_scheduled: bool = False


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    graph_json: Optional[Dict[str, Any]] = None
    cron_expression: Optional[str] = None
    is_scheduled: Optional[bool] = None
    is_active: Optional[bool] = None


class WorkflowResponse(BaseModel):
    id: int
    owner_id: int
    name: str
    description: Optional[str]
    is_active: bool
    graph_json: Dict[str, Any]
    cron_expression: Optional[str]
    is_scheduled: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkflowRunRequest(BaseModel):
    input_data: Dict[str, Any] = {}


class RunLogEntry(BaseModel):
    step: str
    node_id: str
    status: str  # "running" | "success" | "error"
    output: Optional[str]
    timestamp: str


class RunResponse(BaseModel):
    id: int
    workflow_id: int
    status: str
    trigger_type: str
    input_data: Dict[str, Any]
    logs: list
    output: Optional[str]
    error_message: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    duration_seconds: Optional[float]
    created_at: datetime

    model_config = {"from_attributes": True}

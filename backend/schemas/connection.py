"""Pydantic schemas for Connections."""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel
from typing import Literal


class ConnectionCreate(BaseModel):
    name: str
    connection_type: Literal["telegram", "email", "webhook", "http"]
    credentials: Dict[str, Any]   # Plain text — encrypted in route
    config: Dict[str, Any] = {}


class ConnectionUpdate(BaseModel):
    name: Optional[str] = None
    credentials: Optional[Dict[str, Any]] = None
    config: Optional[Dict[str, Any]] = None


class ConnectionResponse(BaseModel):
    id: int
    owner_id: int
    name: str
    connection_type: str
    config: Dict[str, Any]
    created_at: datetime

    model_config = {"from_attributes": True}


class ConnectionTestRequest(BaseModel):
    connection_type: str
    credentials: Dict[str, Any]

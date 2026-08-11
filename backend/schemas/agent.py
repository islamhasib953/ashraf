"""Pydantic schemas for Agents."""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel


class AgentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    system_prompt: str
    llm_provider: str = "openai"
    llm_model: str = "gpt-4o-mini"
    llm_api_key: Optional[str] = None  # plain text — will be encrypted in route
    enabled_tools: List[str] = []
    knowledge_base_id: Optional[str] = None


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    llm_api_key: Optional[str] = None
    enabled_tools: Optional[List[str]] = None
    knowledge_base_id: Optional[str] = None


class AgentResponse(BaseModel):
    id: int
    owner_id: int
    name: str
    description: Optional[str]
    system_prompt: str
    llm_provider: str
    llm_model: str
    enabled_tools: List[str]
    knowledge_base_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

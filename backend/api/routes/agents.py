"""Agents CRUD routes — fully scoped to current user."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user, encrypt_secret
from models.agent import Agent
from models.user import User
from schemas.agent import AgentCreate, AgentUpdate, AgentResponse

router = APIRouter(prefix="/agents", tags=["Agents"])


def _get_agent_or_404(agent_id: int, user_id: int, db: Session) -> Agent:
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.owner_id == user_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.get("", response_model=List[AgentResponse])
def list_agents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all agents belonging to the current user."""
    return db.query(Agent).filter(Agent.owner_id == current_user.id).all()


@router.post("", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
def create_agent(
    payload: AgentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new AI agent."""
    agent = Agent(
        owner_id=current_user.id,
        name=payload.name,
        description=payload.description,
        system_prompt=payload.system_prompt,
        llm_provider=payload.llm_provider,
        llm_model=payload.llm_model,
        enabled_tools=payload.enabled_tools,
        knowledge_base_id=payload.knowledge_base_id,
        llm_api_key_enc=encrypt_secret(payload.llm_api_key) if payload.llm_api_key else None,
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_agent_or_404(agent_id, current_user.id, db)


@router.put("/{agent_id}", response_model=AgentResponse)
def update_agent(
    agent_id: int,
    payload: AgentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    agent = _get_agent_or_404(agent_id, current_user.id, db)
    update_data = payload.model_dump(exclude_unset=True)
    # Encrypt API key if being updated
    if "llm_api_key" in update_data:
        key = update_data.pop("llm_api_key")
        update_data["llm_api_key_enc"] = encrypt_secret(key) if key else None
    for field, value in update_data.items():
        setattr(agent, field, value)
    db.commit()
    db.refresh(agent)
    return agent


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    agent = _get_agent_or_404(agent_id, current_user.id, db)
    db.delete(agent)
    db.commit()

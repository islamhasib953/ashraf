"""
Chat API Routes — Full chat interface with an AI agent.
Supports: text, image uploads, file uploads, streaming.
"""
import os
import uuid
import base64
from typing import List, Optional
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from core.database import get_db
from core.security import get_current_user, decrypt_secret
from models.user import User
from models.agent import Agent
from models.chat import ChatSession, ChatMessage

router = APIRouter(prefix="/chat", tags=["Chat"])

# ─── File storage directory ───────────────────────────────────────
UPLOAD_DIR = Path("./uploads/chat")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_FILE_TYPES = {
    "application/pdf", "text/plain", "text/csv",
    "application/json", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_FILE_SIZE_MB = 10


# ─── Schemas ──────────────────────────────────────────────────────
class SessionCreate(BaseModel):
    agent_id: int
    title: str = "New Chat"


class SessionResponse(BaseModel):
    id: int
    agent_id: int
    title: str
    created_at: str
    message_count: int = 0
    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    id: int
    session_id: int
    role: str
    content: Optional[str]
    attachments: list
    tokens_used: int
    created_at: str
    model_config = {"from_attributes": True}


# ─── Helper: Build LLM messages with vision support ──────────────
def _build_llm_messages(history: List[ChatMessage], new_text: str, new_attachments: list, system_prompt: str):
    """Build the messages list for the LLM, including images if available."""
    from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

    messages = [SystemMessage(content=system_prompt)]

    # Add history
    for msg in history[-20:]:  # Keep last 20 messages for context
        if msg.role == "user":
            if msg.attachments:
                # Build multimodal content
                content = []
                if msg.content:
                    content.append({"type": "text", "text": msg.content})
                for att in msg.attachments:
                    if att.get("type") == "image":
                        try:
                            with open(att["path"], "rb") as f:
                                img_b64 = base64.b64encode(f.read()).decode()
                            content.append({
                                "type": "image_url",
                                "image_url": {"url": f"data:{att['mime_type']};base64,{img_b64}"},
                            })
                        except Exception:
                            pass
                    elif att.get("type") == "file":
                        try:
                            with open(att["path"], "r", errors="replace") as f:
                                file_text = f.read(3000)
                            content.append({"type": "text", "text": f"\n[File: {att['filename']}]\n{file_text}"})
                        except Exception:
                            pass
                messages.append(HumanMessage(content=content))
            else:
                messages.append(HumanMessage(content=msg.content or ""))
        elif msg.role == "assistant":
            messages.append(AIMessage(content=msg.content or ""))

    # Add new message
    if new_attachments:
        content = []
        if new_text:
            content.append({"type": "text", "text": new_text})
        for att in new_attachments:
            if att.get("type") == "image":
                try:
                    with open(att["path"], "rb") as f:
                        img_b64 = base64.b64encode(f.read()).decode()
                    content.append({
                        "type": "image_url",
                        "image_url": {"url": f"data:{att['mime_type']};base64,{img_b64}"},
                    })
                except Exception:
                    pass
            elif att.get("type") == "file":
                try:
                    with open(att["path"], "r", errors="replace") as f:
                        file_text = f.read(3000)
                    content.append({"type": "text", "text": f"\n[File: {att['filename']}]\n{file_text}"})
                except Exception:
                    pass
        messages.append(HumanMessage(content=content))
    else:
        messages.append(HumanMessage(content=new_text or "Hello"))

    return messages


# ─── Sessions ─────────────────────────────────────────────────────
@router.get("/sessions", response_model=List[SessionResponse])
def list_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sessions = db.query(ChatSession).filter(ChatSession.owner_id == current_user.id).order_by(ChatSession.updated_at.desc()).all()
    result = []
    for s in sessions:
        msg_count = db.query(ChatMessage).filter(ChatMessage.session_id == s.id).count()
        result.append(SessionResponse(
            id=s.id, agent_id=s.agent_id, title=s.title,
            created_at=s.created_at.isoformat(), message_count=msg_count
        ))
    return result


@router.post("/sessions", response_model=SessionResponse, status_code=201)
def create_session(payload: SessionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify agent belongs to user
    agent = db.query(Agent).filter(Agent.id == payload.agent_id, Agent.owner_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    session = ChatSession(owner_id=current_user.id, agent_id=payload.agent_id, title=payload.title)
    db.add(session)
    db.commit()
    db.refresh(session)
    return SessionResponse(id=session.id, agent_id=session.agent_id, title=session.title, created_at=session.created_at.isoformat())


@router.delete("/sessions/{session_id}", status_code=204)
def delete_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.owner_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()


# ─── Messages ─────────────────────────────────────────────────────
@router.get("/sessions/{session_id}/messages", response_model=List[MessageResponse])
def get_messages(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.owner_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    msgs = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at).all()
    return [MessageResponse(
        id=m.id, session_id=m.session_id, role=m.role, content=m.content,
        attachments=m.attachments or [], tokens_used=m.tokens_used or 0,
        created_at=m.created_at.isoformat()
    ) for m in msgs]


@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: int,
    text: Optional[str] = Form(None),
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send a message to the agent (with optional file/image attachments).
    Returns a streaming SSE response so the UI can display tokens as they arrive.
    """
    # Validate session and get agent
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.owner_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    agent = db.query(Agent).filter(Agent.id == session.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # ── Process uploaded files ──────────────────────────────────
    saved_attachments = []
    for upload in files:
        if not upload.filename:
            continue
        file_size = 0
        content = await upload.read()
        file_size = len(content)

        if file_size > MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(status_code=413, detail=f"File {upload.filename} exceeds {MAX_FILE_SIZE_MB}MB limit")

        mime_type = upload.content_type or "application/octet-stream"
        is_image = mime_type in ALLOWED_IMAGE_TYPES
        is_file = mime_type in ALLOWED_FILE_TYPES

        if not is_image and not is_file:
            raise HTTPException(status_code=415, detail=f"Unsupported file type: {mime_type}")

        # Save file to disk
        unique_name = f"{uuid.uuid4().hex}_{upload.filename}"
        file_path = UPLOAD_DIR / str(current_user.id) / unique_name
        file_path.parent.mkdir(parents=True, exist_ok=True)

        with open(file_path, "wb") as f:
            f.write(content)

        saved_attachments.append({
            "type": "image" if is_image else "file",
            "filename": upload.filename,
            "path": str(file_path),
            "mime_type": mime_type,
            "size_bytes": file_size,
        })

    # ── Save user message ───────────────────────────────────────
    user_msg = ChatMessage(
        session_id=session_id,
        owner_id=current_user.id,
        role="user",
        content=text or "",
        attachments=saved_attachments,
    )
    db.add(user_msg)
    db.commit()

    # ── Get message history for context ────────────────────────
    history = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id,
        ChatMessage.id != user_msg.id,
    ).order_by(ChatMessage.created_at).all()

    # ── Build LLM and stream response ──────────────────────────
    from core.config import settings

    api_key = None
    if agent.llm_api_key_enc:
        try:
            api_key = decrypt_secret(agent.llm_api_key_enc)
        except Exception:
            pass

    llm_messages = _build_llm_messages(history, text, saved_attachments, agent.system_prompt)

    async def stream_response():
        """Stream the LLM response token by token using SSE format."""
        full_response = ""
        tokens = 0

        try:
            if agent.llm_provider == "ollama":
                from langchain_community.chat_models import ChatOllama
                llm = ChatOllama(model=agent.llm_model, base_url="http://host.docker.internal:11434")
            else:
                from langchain_openai import ChatOpenAI
                llm = ChatOpenAI(
                    model=agent.llm_model,
                    api_key=api_key or settings.OPENAI_API_KEY,
                    streaming=True,
                    temperature=0.7,
                )

            # Stream tokens
            async for chunk in llm.astream(llm_messages):
                token = chunk.content
                if token:
                    full_response += token
                    tokens += 1
                    yield f"data: {token}\n\n"

            # Save assistant reply to DB
            assistant_msg = ChatMessage(
                session_id=session_id,
                owner_id=current_user.id,
                role="assistant",
                content=full_response,
                attachments=[],
                tokens_used=tokens,
            )
            db.add(assistant_msg)
            # Update session timestamp
            session.updated_at = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
            db.commit()

            yield "data: [DONE]\n\n"

        except Exception as e:
            error_msg = f"Error: {str(e)}"
            # Save error as assistant message
            err_chat = ChatMessage(
                session_id=session_id, owner_id=current_user.id,
                role="assistant", content=error_msg, attachments=[],
            )
            db.add(err_chat)
            db.commit()
            yield f"data: {error_msg}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        stream_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )


# ─── Serve uploaded files ─────────────────────────────────────────
from fastapi.staticfiles import StaticFiles

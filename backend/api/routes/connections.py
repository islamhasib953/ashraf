"""Connections CRUD routes — stores encrypted credentials."""
import json
from typing import List

ALL_CONNECTION_TYPES = [
    "telegram", "email", "webhook", "http",
    "google_sheets", "slack", "discord", "whatsapp", "gmail_imap"
]
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user, encrypt_secret, decrypt_secret
from models.connection import Connection
from models.user import User
from schemas.connection import ConnectionCreate, ConnectionUpdate, ConnectionResponse, ConnectionTestRequest

router = APIRouter(prefix="/connections", tags=["Connections"])


def _get_conn_or_404(conn_id: int, user_id: int, db: Session) -> Connection:
    conn = db.query(Connection).filter(Connection.id == conn_id, Connection.owner_id == user_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    return conn


@router.get("", response_model=List[ConnectionResponse])
def list_connections(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Connection).filter(Connection.owner_id == current_user.id).all()


@router.post("", response_model=ConnectionResponse, status_code=status.HTTP_201_CREATED)
def create_connection(
    payload: ConnectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Encrypt the credentials JSON
    creds_str = json.dumps(payload.credentials)
    conn = Connection(
        owner_id=current_user.id,
        name=payload.name,
        connection_type=payload.connection_type,
        credentials_enc=encrypt_secret(creds_str),
        config=payload.config,
    )
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return conn


@router.get("/{conn_id}", response_model=ConnectionResponse)
def get_connection(conn_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _get_conn_or_404(conn_id, current_user.id, db)


@router.put("/{conn_id}", response_model=ConnectionResponse)
def update_connection(
    conn_id: int,
    payload: ConnectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conn = _get_conn_or_404(conn_id, current_user.id, db)
    if payload.name is not None:
        conn.name = payload.name
    if payload.config is not None:
        conn.config = payload.config
    if payload.credentials is not None:
        conn.credentials_enc = encrypt_secret(json.dumps(payload.credentials))
    db.commit()
    db.refresh(conn)
    return conn


@router.delete("/{conn_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_connection(conn_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conn = _get_conn_or_404(conn_id, current_user.id, db)
    db.delete(conn)
    db.commit()


@router.post("/test")
async def test_connection(payload: ConnectionTestRequest, current_user: User = Depends(get_current_user)):
    """Test connection credentials without saving them."""
    ctype = payload.connection_type
    creds = payload.credentials

    if ctype == "telegram":
        from integrations.telegram_tool import test_telegram
        ok, msg = await test_telegram(creds)
    elif ctype == "email":
        from integrations.email_tool import test_email
        ok, msg = test_email(creds)
    elif ctype == "slack":
        from integrations.slack_tool import test_slack
        ok, msg = test_slack(creds)
    elif ctype == "discord":
        from integrations.discord_tool import test_discord
        ok, msg = test_discord(creds)
    elif ctype == "whatsapp":
        from integrations.whatsapp_tool import test_whatsapp
        ok, msg = test_whatsapp(creds)
    elif ctype == "google_sheets":
        from integrations.google_sheets_tool import test_google_sheets
        ok, msg = test_google_sheets(creds)
    elif ctype == "gmail_imap":
        from integrations.gmail_imap_tool import test_gmail_imap
        ok, msg = test_gmail_imap(creds)
    else:
        ok, msg = True, f"Connection type '{ctype}' saved (no live test available)"

    return {"success": ok, "message": msg}

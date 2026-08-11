"""
Action Nodes — Send Email, Send Telegram, HTTP Request.
All use the Connection model to load encrypted credentials.
"""
import json
from engine.node_registry import register_node
from core.security import decrypt_secret
import logging

logger = logging.getLogger(__name__)


def _get_connection_creds(connection_id: int, user_id: int, db) -> dict:
    """Load and decrypt credentials for a saved connection."""
    from models.connection import Connection
    conn = db.query(Connection).filter(
        Connection.id == connection_id,
        Connection.owner_id == user_id,
    ).first()
    if not conn:
        raise ValueError(f"Connection {connection_id} not found")
    return json.loads(decrypt_secret(conn.credentials_enc))


@register_node("send_telegram")
def send_telegram_node(node_data: dict, state: dict, db, user_id: int) -> str:
    """
    Send a Telegram message.
    node_data keys:
      - connection_id: int (ID of a saved Telegram connection)
      - chat_id: str
      - message_template: str (can use {output}, {input})
    """
    import asyncio
    from integrations.telegram_tool import send_telegram_message

    connection_id = node_data.get("connection_id")
    chat_id = node_data.get("chat_id", "")
    message_template = node_data.get("message_template", "{output}")

    message = message_template.format(
        input=state.get("input", ""),
        output=state.get("output", ""),
        **state.get("context", {}),
    )

    if connection_id:
        creds = _get_connection_creds(int(connection_id), user_id, db)
        bot_token = creds.get("bot_token", "")
    else:
        bot_token = node_data.get("bot_token", "")

    asyncio.run(send_telegram_message(bot_token=bot_token, chat_id=chat_id, text=message))
    return f"Telegram message sent to {chat_id}: {message[:100]}"


@register_node("send_email")
def send_email_node(node_data: dict, state: dict, db, user_id: int) -> str:
    """
    Send an Email via SMTP.
    node_data keys:
      - connection_id: int
      - to_email: str
      - subject_template: str
      - body_template: str
    """
    from integrations.email_tool import send_email

    connection_id = node_data.get("connection_id")
    to_email = node_data.get("to_email", "")
    subject = node_data.get("subject_template", "Agent Notification").format(
        input=state.get("input", ""), output=state.get("output", "")
    )
    body = node_data.get("body_template", "{output}").format(
        input=state.get("input", ""),
        output=state.get("output", ""),
        **state.get("context", {}),
    )

    if connection_id:
        creds = _get_connection_creds(int(connection_id), user_id, db)
    else:
        creds = {
            "smtp_host": node_data.get("smtp_host", "smtp.gmail.com"),
            "smtp_port": node_data.get("smtp_port", 587),
            "email": node_data.get("from_email", ""),
            "password": node_data.get("email_password", ""),
        }

    send_email(creds=creds, to_email=to_email, subject=subject, body=body)
    return f"Email sent to {to_email}: {subject}"


@register_node("http_request")
def http_request_node(node_data: dict, state: dict, db, user_id: int) -> str:
    """
    Make an HTTP API request.
    node_data keys:
      - url: str
      - method: "GET" | "POST" | "PUT" | "DELETE"
      - headers: dict
      - body_template: str (JSON string, can use {output})
    """
    import httpx

    url = node_data.get("url", "")
    method = node_data.get("method", "GET").upper()
    headers = node_data.get("headers", {})
    body_template = node_data.get("body_template", "")

    body_str = body_template.format(
        input=state.get("input", ""),
        output=state.get("output", ""),
    )

    body = json.loads(body_str) if body_str else None

    with httpx.Client(timeout=30.0) as client:
        response = client.request(method=method, url=url, headers=headers, json=body)
        response.raise_for_status()
        return response.text[:1000]  # Return first 1000 chars


@register_node("condition")
def condition_node(node_data: dict, state: dict, db, user_id: int) -> str:
    """
    Simple condition node — evaluates a Python expression on the current output.
    node_data keys:
      - condition: str (e.g. "'error' in output")
    """
    condition = node_data.get("condition", "True")
    output = state.get("output", "")
    try:
        result = eval(condition, {"output": output, "input": state.get("input", "")})
        return str(result)
    except Exception as e:
        return f"Condition error: {e}"

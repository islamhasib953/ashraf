"""Email integration tool (SMTP send + IMAP receive)."""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)


def send_email(creds: dict, to_email: str, subject: str, body: str) -> bool:
    """Send an email via SMTP."""
    smtp_host = creds.get("smtp_host", "smtp.gmail.com")
    smtp_port = int(creds.get("smtp_port", 587))
    from_email = creds.get("email", "")
    password = creds.get("password", "")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = to_email
    msg.attach(MIMEText(body, "plain"))
    msg.attach(MIMEText(f"<p>{body}</p>", "html"))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.ehlo()
        server.starttls()
        server.login(from_email, password)
        server.sendmail(from_email, to_email, msg.as_string())

    logger.info(f"Email sent to {to_email}")
    return True


def test_email(credentials: dict) -> tuple[bool, str]:
    """Test SMTP credentials by attempting to login."""
    try:
        smtp_host = credentials.get("smtp_host", "smtp.gmail.com")
        smtp_port = int(credentials.get("smtp_port", 587))
        email = credentials.get("email", "")
        password = credentials.get("password", "")

        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(email, password)

        return True, f"SMTP connected successfully as {email}"
    except Exception as e:
        return False, str(e)

"""Telegram integration tool."""
import asyncio
import logging

logger = logging.getLogger(__name__)


async def send_telegram_message(bot_token: str, chat_id: str, text: str) -> bool:
    """Send a message via Telegram Bot API."""
    try:
        from telegram import Bot
        async with Bot(token=bot_token) as bot:
            await bot.send_message(chat_id=int(chat_id), text=text)
        return True
    except Exception as e:
        logger.error(f"Telegram send failed: {e}")
        raise RuntimeError(f"Telegram error: {e}")


async def test_telegram(credentials: dict) -> tuple[bool, str]:
    """Test Telegram credentials by calling getMe."""
    try:
        from telegram import Bot
        async with Bot(token=credentials.get("bot_token", "")) as bot:
            me = await bot.get_me()
        return True, f"Connected as @{me.username}"
    except Exception as e:
        return False, str(e)

"""
Trigger Nodes — starting points for workflows.
Manual trigger simply passes the input through.
Webhook and Cron triggers are handled externally; these nodes just log the event.
"""
from engine.node_registry import register_node


@register_node("manual_trigger")
def manual_trigger_node(node_data: dict, state: dict, db, user_id: int) -> str:
    """Manual trigger — passes the input data through as-is."""
    return state.get("input", "Manual trigger activated")


@register_node("webhook_trigger")
def webhook_trigger_node(node_data: dict, state: dict, db, user_id: int) -> str:
    """Webhook trigger — the input data comes from the webhook payload."""
    return state.get("input", "Webhook trigger received")


@register_node("cron_trigger")
def cron_trigger_node(node_data: dict, state: dict, db, user_id: int) -> str:
    """Cron trigger — activated by the scheduler; passes through."""
    cron = node_data.get("cron_expression", "* * * * *")
    return f"Cron trigger fired (schedule: {cron})"


@register_node("delay")
def delay_node(node_data: dict, state: dict, db, user_id: int) -> str:
    """Delay node — waits N seconds before passing through."""
    import time
    seconds = float(node_data.get("seconds", 1))
    seconds = min(seconds, 300)  # Max 5 minutes
    time.sleep(seconds)
    return state.get("output", "")

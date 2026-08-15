"""
LLM Node — runs an AI agent using the configured LLM.
Supports OpenAI and local Ollama models.
"""
from engine.node_registry import register_node
from core.security import decrypt_secret
import logging

logger = logging.getLogger(__name__)


@register_node("llm_agent")
def llm_agent_node(node_data: dict, state: dict, db, user_id: int) -> str:
    """
    AI Agent node — sends a prompt to the LLM and returns the response.
    node_data keys:
      - system_prompt: str
      - user_prompt_template: str (can use {output} and {input} placeholders)
      - provider: "openai" | "ollama"
      - model: str
      - api_key_enc: str (optional encrypted key override)
    """
    from langchain_core.messages import SystemMessage, HumanMessage
    from langchain_openai import ChatOpenAI
    from models.agent import Agent

    agent_id = node_data.get("agent_id")
    if agent_id:
        agent = db.query(Agent).filter(Agent.id == agent_id, Agent.owner_id == user_id).first()
        if agent:
            system_prompt = agent.system_prompt
            provider = agent.llm_provider
            model = agent.llm_model
            api_key_enc = agent.llm_api_key_enc
        else:
            raise ValueError(f"Agent {agent_id} not found")
    else:
        system_prompt = node_data.get("system_prompt", "You are a helpful assistant.")
        provider = node_data.get("provider", "openai")
        model = node_data.get("model", "gpt-4o-mini")
        api_key_enc = node_data.get("api_key_enc", "")

    prompt_template = node_data.get("user_prompt_template", "{output}")

    # Resolve user prompt from template
    user_prompt = prompt_template.format(
        input=state.get("input", ""),
        output=state.get("output", ""),
        **state.get("context", {}),
    )

    if provider == "ollama":
        from langchain_community.chat_models import ChatOllama
        from core.config import settings
        llm = ChatOllama(model=model, base_url=settings.OLLAMA_BASE_URL)
    else:
        # OpenAI
        api_key = None
        if api_key_enc:
            try:
                api_key = decrypt_secret(api_key_enc)
            except Exception:
                pass
        from core.config import settings
        llm = ChatOpenAI(
            model=model,
            api_key=api_key or settings.OPENAI_API_KEY,
            temperature=0.7,
        )

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]

    response = llm.invoke(messages)
    return response.content


@register_node("text_input")
def text_input_node(node_data: dict, state: dict, db, user_id: int) -> str:
    """Static text input node — outputs a fixed text string."""
    return node_data.get("text", state.get("input", ""))


@register_node("text_template")
def text_template_node(node_data: dict, state: dict, db, user_id: int) -> str:
    """Formats a template string using current state values."""
    template = node_data.get("template", "{output}")
    return template.format(
        input=state.get("input", ""),
        output=state.get("output", ""),
        **state.get("context", {}),
    )

"""
Node Registry — maps node type strings (from React Flow) to executor functions.

Each executor receives:
  - node_data: dict (the node's configuration from the canvas)
  - state: WorkflowState (current state to read/write)
  - db: Session (for DB access if needed)
  - user_id: int (for scoped queries and credential decryption)

Returns: str (the output of this node, passed to next nodes as 'output')
"""
from typing import Callable, Dict, Any
from sqlalchemy.orm import Session

# ─── Type alias ──────────────────────────────────────────────────
NodeExecutor = Callable[[dict, dict, Session, int], str]

_REGISTRY: Dict[str, NodeExecutor] = {}


def register_node(node_type: str):
    """Decorator to register a node executor function."""
    def decorator(fn: NodeExecutor) -> NodeExecutor:
        _REGISTRY[node_type] = fn
        return fn
    return decorator


def get_node_executor(node_type: str) -> NodeExecutor:
    """Get the executor for a node type, or raise if not found."""
    if node_type not in _REGISTRY:
        raise ValueError(f"Unknown node type: '{node_type}'. Available: {list(_REGISTRY.keys())}")
    return _REGISTRY[node_type]


def list_node_types() -> list:
    """Return all registered node types (exposed via API)."""
    return list(_REGISTRY.keys())


# ─── Import and auto-register all nodes ──────────────────────────
from engine.nodes import llm_node, action_nodes, trigger_nodes  # noqa: F401

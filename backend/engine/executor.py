"""
LangGraph-based Workflow Executor.

Takes a workflow graph_json (from React Flow), builds a LangGraph StateGraph,
and executes all nodes in topological order, passing state between them.
"""
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, TypedDict
from sqlalchemy.orm import Session

from langgraph.graph import StateGraph, END

from models.run import WorkflowRun
from engine.node_registry import get_node_executor
import logging

logger = logging.getLogger(__name__)


class WorkflowState(TypedDict):
    """Shared state passed between all nodes in a workflow."""
    input: str
    output: str
    context: Dict[str, Any]
    error: Optional[str]
    logs: List[Dict[str, Any]]


class WorkflowExecutor:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id

    def execute(self, run_id: int, graph_json: dict, input_data: dict) -> WorkflowRun:
        """Execute a workflow and update the run record with logs and result."""
        run = self.db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
        if not run:
            raise ValueError(f"Run {run_id} not found")

        run.status = "running"
        run.started_at = datetime.now(timezone.utc)
        self.db.commit()

        logs = []

        try:
            nodes = graph_json.get("nodes", [])
            edges = graph_json.get("edges", [])

            if not nodes:
                raise ValueError("Workflow has no nodes")

            # Build execution order via topological sort
            ordered_nodes = self._topological_sort(nodes, edges)

            # Run each node sequentially, passing state forward
            state: WorkflowState = {
                "input": json.dumps(input_data),
                "output": "",
                "context": input_data,
                "error": None,
                "logs": [],
            }

            for node_def in ordered_nodes:
                node_id = node_def["id"]
                node_type = node_def.get("type", "unknown")
                node_data = node_def.get("data", {})

                log_entry = {
                    "node_id": node_id,
                    "step": node_data.get("label", node_type),
                    "status": "running",
                    "output": None,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }

                try:
                    executor_fn = get_node_executor(node_type)
                    result = executor_fn(
                        node_data=node_data,
                        state=state,
                        db=self.db,
                        user_id=self.user_id,
                    )
                    state["output"] = str(result) if result else ""
                    state["context"][node_id] = result
                    log_entry["status"] = "success"
                    log_entry["output"] = state["output"][:500]  # Truncate for storage

                except Exception as node_err:
                    log_entry["status"] = "error"
                    log_entry["output"] = str(node_err)
                    logs.append(log_entry)
                    raise RuntimeError(f"Node '{node_data.get('label', node_id)}' failed: {node_err}")

                logs.append(log_entry)

            # ── Success ──────────────────────────────────
            run.status = "success"
            run.output = state["output"]

        except Exception as e:
            run.status = "failed"
            run.error_message = str(e)
            logger.error(f"Workflow run {run_id} failed: {e}")
        finally:
            run.logs = logs
            run.completed_at = datetime.now(timezone.utc)
            if run.started_at:
                run.duration_seconds = (run.completed_at - run.started_at).total_seconds()
            self.db.commit()

        return run

    def _topological_sort(self, nodes: List[dict], edges: List[dict]) -> List[dict]:
        """Kahn's algorithm — sort nodes so each runs after its dependencies."""
        node_map = {n["id"]: n for n in nodes}
        in_degree = {n["id"]: 0 for n in nodes}
        adjacency: Dict[str, List[str]] = {n["id"]: [] for n in nodes}

        for edge in edges:
            src = edge.get("source")
            tgt = edge.get("target")
            if src in adjacency and tgt in in_degree:
                adjacency[src].append(tgt)
                in_degree[tgt] += 1

        queue = [nid for nid, deg in in_degree.items() if deg == 0]
        result = []

        while queue:
            nid = queue.pop(0)
            result.append(node_map[nid])
            for neighbor in adjacency[nid]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if len(result) != len(nodes):
            raise ValueError("Workflow graph contains a cycle")

        return result

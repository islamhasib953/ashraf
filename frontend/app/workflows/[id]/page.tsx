"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ReactFlow, {
  Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState,
  type Node, type Edge, type Connection, BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { Play, Save, ArrowLeft, Plus, Trash2, Bot, Mail, MessageCircle, Globe, Clock, Zap, FileText, GitBranch } from "lucide-react";
import Link from "next/link";
import { workflowsApi, agentsApi, connectionsApi } from "@/lib/api";

// ─── Available Node Types for the Palette ──────────────────
const NODE_PALETTE = [
  { type: "manual_trigger", label: "Manual Trigger", icon: <Zap size={14} />, color: "#7c3aed", category: "Triggers" },
  { type: "cron_trigger",   label: "Cron Schedule",  icon: <Clock size={14} />, color: "#7c3aed", category: "Triggers" },
  { type: "webhook_trigger",label: "Webhook",         icon: <Globe size={14} />, color: "#7c3aed", category: "Triggers" },
  { type: "llm_agent",     label: "AI Agent",         icon: <Bot size={14} />,  color: "#4f46e5", category: "AI" },
  { type: "text_input",    label: "Text Input",        icon: <FileText size={14} />, color: "#0891b2", category: "Data" },
  { type: "text_template", label: "Text Template",     icon: <FileText size={14} />, color: "#0891b2", category: "Data" },
  { type: "send_email",    label: "Send Email",         icon: <Mail size={14} />, color: "#059669", category: "Actions" },
  { type: "send_telegram", label: "Send Telegram",     icon: <MessageCircle size={14} />, color: "#059669", category: "Actions" },
  { type: "http_request",  label: "HTTP Request",      icon: <Globe size={14} />, color: "#059669", category: "Actions" },
  { type: "condition",     label: "Condition",          icon: <GitBranch size={14} />, color: "#d97706", category: "Logic" },
];

const NODE_COLORS: Record<string, string> = {
  manual_trigger: "#7c3aed", cron_trigger: "#7c3aed", webhook_trigger: "#7c3aed",
  llm_agent: "#4f46e5", text_input: "#0891b2", text_template: "#0891b2",
  send_email: "#059669", send_telegram: "#059669", http_request: "#059669",
  condition: "#d97706",
};

// ─── Custom Node Component ──────────────────────────────────
function CustomNode({ data, selected }: { data: any; selected: boolean }) {
  const palette = NODE_PALETTE.find(n => n.type === data.nodeType);
  const color = NODE_COLORS[data.nodeType] || "#4f46e5";
  return (
    <div className={`workflow-node ${selected ? "selected" : ""}`}
         style={{ borderColor: selected ? color : undefined, minWidth: 180 }}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded flex items-center justify-center text-white" style={{background: color}}>
          {palette?.icon}
        </div>
        <span className="font-semibold text-sm text-white">{data.label}</span>
      </div>
      {data.description && <p className="text-xs text-[var(--text-muted)] mt-1">{data.description}</p>}
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

// ─── Node Config Panel ──────────────────────────────────────
function NodeConfigPanel({ node, agents, connections, onUpdate, onDelete }: { node: Node; agents: any[]; connections: any[]; onUpdate: (id: string, data: any) => void; onDelete: (id: string) => void }) {
  const [data, setData] = useState(node.data || {});
  const update = (k: string, v: string) => { const d = { ...data, [k]: v }; setData(d); onUpdate(node.id, d); };

  return (
    <div className="absolute right-0 top-0 h-full w-80 glass border-l border-white/10 p-5 z-10 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Configure Node</h3>
        <button onClick={() => onDelete(node.id)} className="p-1 hover:bg-red-500/10 rounded text-red-400"><Trash2 size={14} /></button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">Label</label>
          <input value={data.label || ""} onChange={e => update("label", e.target.value)} className="input-field text-sm py-2" />
        </div>

        {/* Type-specific fields */}
        {data.nodeType === "llm_agent" && <>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Select Agent</label>
            <select value={data.agent_id || ""} onChange={e => update("agent_id", e.target.value)} className="input-field text-sm py-2">
              <option value="">-- Custom Agent --</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          
          {!data.agent_id && (
            <div className="mt-3 space-y-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">System Prompt</label>
                <textarea value={data.system_prompt || ""} onChange={e => update("system_prompt", e.target.value)}
                          className="input-field text-sm py-2 resize-none" rows={3} placeholder="You are a helpful assistant." />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Model</label>
                <select value={data.model || "gpt-4o-mini"} onChange={e => update("model", e.target.value)} className="input-field text-sm py-2">
                  <option>gpt-4o-mini</option><option>gpt-4o</option><option>ollama/llama3.2</option>
                </select>
              </div>
            </div>
          )}
          
          <div className="mt-3">
            <label className="block text-xs text-[var(--text-muted)] mb-1">User Prompt Template</label>
            <textarea value={data.user_prompt_template || "{output}"} onChange={e => update("user_prompt_template", e.target.value)}
                      className="input-field text-sm py-2 resize-none mono" rows={2} />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Variables: {"{input}"}, {"{output}"}</p>
          </div>
        </>}

        {data.nodeType === "send_telegram" && <>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Connection</label>
            <select value={data.connection_id || ""} onChange={e => update("connection_id", e.target.value)} className="input-field text-sm py-2">
              <option value="">-- Manual Token --</option>
              {connections.filter(c => c.connection_type === "telegram").map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {!data.connection_id && (
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1 mt-3">Bot Token</label>
              <input value={data.bot_token || ""} onChange={e => update("bot_token", e.target.value)} className="input-field text-sm py-2" type="password" />
            </div>
          )}
          <div className="mt-3">
            <label className="block text-xs text-[var(--text-muted)] mb-1">Chat ID</label>
            <input value={data.chat_id || ""} onChange={e => update("chat_id", e.target.value)} className="input-field text-sm py-2" placeholder="123456789" />
          </div>
          <div className="mt-3">
            <label className="block text-xs text-[var(--text-muted)] mb-1">Message Template</label>
            <textarea value={data.message_template || "{output}"} onChange={e => update("message_template", e.target.value)}
                      className="input-field text-sm py-2 resize-none mono" rows={2} />
          </div>
        </>}

        {data.nodeType === "send_email" && <>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Connection</label>
            <select value={data.connection_id || ""} onChange={e => update("connection_id", e.target.value)} className="input-field text-sm py-2">
              <option value="">-- Manual SMTP --</option>
              {connections.filter(c => c.connection_type === "email").map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {!data.connection_id && (
            <div className="mt-3 space-y-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">SMTP Host</label>
                <input value={data.smtp_host || ""} onChange={e => update("smtp_host", e.target.value)} className="input-field text-sm py-2" />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Email</label>
                <input value={data.from_email || ""} onChange={e => update("from_email", e.target.value)} className="input-field text-sm py-2" />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Password</label>
                <input value={data.email_password || ""} onChange={e => update("email_password", e.target.value)} className="input-field text-sm py-2" type="password" />
              </div>
            </div>
          )}
          <div className="mt-3">
            <label className="block text-xs text-[var(--text-muted)] mb-1">To Email</label>
            <input value={data.to_email || ""} onChange={e => update("to_email", e.target.value)} className="input-field text-sm py-2" type="email" />
          </div>
          <div className="mt-3">
            <label className="block text-xs text-[var(--text-muted)] mb-1">Subject</label>
            <input value={data.subject_template || "Agent Notification"} onChange={e => update("subject_template", e.target.value)} className="input-field text-sm py-2" />
          </div>
          <div className="mt-3">
            <label className="block text-xs text-[var(--text-muted)] mb-1">Body Template</label>
            <textarea value={data.body_template || "{output}"} onChange={e => update("body_template", e.target.value)}
                      className="input-field text-sm py-2 resize-none mono" rows={3} />
          </div>
        </>}

        {data.nodeType === "cron_trigger" && (
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Cron Expression</label>
            <input value={data.cron_expression || "0 9 * * *"} onChange={e => update("cron_expression", e.target.value)}
                   className="input-field text-sm py-2 mono" placeholder="0 9 * * *" />
            <p className="text-xs text-[var(--text-muted)] mt-1">e.g. "0 9 * * *" = daily at 9am</p>
          </div>
        )}

        {data.nodeType === "text_input" && (
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Text</label>
            <textarea value={data.text || ""} onChange={e => update("text", e.target.value)}
                      className="input-field text-sm py-2 resize-none" rows={3} />
          </div>
        )}

        {data.nodeType === "http_request" && <>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">URL</label>
            <input value={data.url || ""} onChange={e => update("url", e.target.value)} className="input-field text-sm py-2" placeholder="https://api.example.com" />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Method</label>
            <select value={data.method || "GET"} onChange={e => update("method", e.target.value)} className="input-field text-sm py-2">
              <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
            </select>
          </div>
        </>}
      </div>
    </div>
  );
}

// ─── Main Canvas Page ───────────────────────────────────────
export default function WorkflowCanvasPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [workflow, setWorkflow] = useState<any>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [showPalette, setShowPalette] = useState(true);
  const [agents, setAgents] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);

  useEffect(() => {
    workflowsApi.get(id).then(r => {
      setWorkflow(r.data);
      const g = r.data.graph_json || { nodes: [], edges: [] };
      setNodes(g.nodes.map((n: any) => ({ ...n, type: "custom" })));
      setEdges(g.edges || []);
    }).catch(() => router.push("/workflows"));
    
    // Fetch agents and connections for dynamic dropdowns
    agentsApi.list().then(r => setAgents(r.data)).catch(() => {});
    connectionsApi.list().then(r => setConnections(r.data)).catch(() => {});
  }, [id]);

  const onConnect = useCallback((p: Connection) => setEdges(eds => addEdge({ ...p, animated: true, style: { stroke: "#7c3aed" } }, eds)), []);

  const addNode = (palNode: typeof NODE_PALETTE[0]) => {
    const newNode: Node = {
      id: `${palNode.type}_${Date.now()}`,
      type: "custom",
      position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data: { label: palNode.label, nodeType: palNode.type, description: palNode.category },
    };
    setNodes(ns => [...ns, newNode]);
  };

  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes(ns => ns.map(n => n.id === nodeId ? { ...n, data: newData } : n));
  };

  const deleteNode = (nodeId: string) => {
    setNodes(ns => ns.filter(n => n.id !== nodeId));
    setEdges(es => es.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      await workflowsApi.update(id, {
        graph_json: {
          nodes: nodes.map(n => ({ id: n.id, type: n.data.nodeType, position: n.position, data: n.data })),
          edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
        }
      });
      toast.success("Workflow saved!");
    } catch { toast.error("Save failed"); } finally { setSaving(false); }
  };

  const run = async () => {
    await save();
    setRunning(true);
    try {
      await workflowsApi.run(id);
      toast.success("Workflow is running! Check Run History for logs.");
    } catch (e: any) { toast.error(e.response?.data?.detail || "Run failed"); } finally { setRunning(false); }
  };

  const categories = [...new Set(NODE_PALETTE.map(n => n.category))];

  return (
    <div className="h-screen flex flex-col" style={{background: "#09090f"}}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 flex-shrink-0"
           style={{background: "rgba(13,13,20,0.95)", backdropFilter: "blur(12px)"}}>
        <Link href="/workflows" className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-secondary)]">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-semibold text-sm">{workflow?.name || "Loading..."}</h1>
          <p className="text-xs text-[var(--text-muted)]">{nodes.length} nodes · {edges.length} connections</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setShowPalette(s => !s)} className="btn-ghost text-xs px-3 py-2">
            {showPalette ? "Hide" : "Show"} Palette
          </button>
          <button id="save-workflow-btn" onClick={save} disabled={saving} className="btn-ghost flex items-center gap-1 text-sm">
            {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
            Save
          </button>
          <button id="run-workflow-btn" onClick={run} disabled={running} className="btn-primary flex items-center gap-1 text-sm">
            {running ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Play size={15} />}
            Run
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Node Palette */}
        {showPalette && (
          <div className="w-56 flex-shrink-0 border-r border-white/5 overflow-y-auto py-3 px-3"
               style={{background: "#0d0d14"}}>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3 px-1">Add Nodes</p>
            {categories.map(cat => (
              <div key={cat} className="mb-4">
                <p className="text-xs text-[var(--text-muted)] px-1 mb-2">{cat}</p>
                <div className="space-y-1">
                  {NODE_PALETTE.filter(n => n.category === cat).map(palNode => (
                    <button key={palNode.type} onClick={() => addNode(palNode)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-white/5 hover:text-white transition-colors group">
                      <span className="text-white" style={{color: palNode.color}}>{palNode.icon}</span>
                      <span className="truncate">{palNode.label}</span>
                      <Plus size={12} className="ml-auto opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* React Flow Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNode(node)}
            onPaneClick={() => setSelectedNode(null)}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} color="#ffffff08" gap={24} size={1} />
            <Controls style={{ button: { background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" } } as any} />
            <MiniMap style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)" }}
                     nodeColor={(n) => NODE_COLORS[n.data?.nodeType] || "#4f46e5"} />
          </ReactFlow>

          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <Zap size={48} className="mx-auto mb-3 text-[var(--text-muted)] opacity-20" />
                <p className="text-[var(--text-muted)] text-sm">Click a node type from the left panel to get started</p>
              </div>
            </div>
          )}
        </div>

        {/* Selected Node Panel */}
        {selectedNode && (
          <NodeConfigPanel node={selectedNode} agents={agents} connections={connections} onUpdate={updateNodeData} onDelete={deleteNode} />
        )}
      </div>
    </div>
  );
}

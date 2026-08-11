"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Bot, Plus, Trash2, Edit2, Cpu, X, Save, MessageSquare } from "lucide-react";
import { agentsApi } from "@/lib/api";

const LLM_MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo", "ollama/llama3.2", "ollama/mistral"];

function AgentModal({ agent, onClose, onSaved }: { agent?: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: agent?.name || "",
    description: agent?.description || "",
    system_prompt: agent?.system_prompt || "You are a helpful assistant.",
    llm_provider: agent?.llm_provider || "openai",
    llm_model: agent?.llm_model || "gpt-4o-mini",
    llm_api_key: "",
    enabled_tools: agent?.enabled_tools || [],
  });
  const [loading, setLoading] = useState(false);
  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim() || !form.system_prompt.trim()) { toast.error("Name and system prompt are required"); return; }
    setLoading(true);
    try {
      if (agent) { await agentsApi.update(agent.id, form); toast.success("Agent updated!"); }
      else       { await agentsApi.create(form); toast.success("Agent created! 🤖"); }
      onSaved();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to save agent");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="glass rounded-2xl p-6 w-full max-w-lg z-10 fade-in" style={{border: "1px solid rgba(124,58,237,0.3)"}}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{agent ? "Edit Agent" : "New Agent"}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Name *</label>
            <input value={form.name} onChange={e => update("name", e.target.value)}
                   className="input-field" placeholder="e.g. Job Hunter Agent" />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Description</label>
            <input value={form.description} onChange={e => update("description", e.target.value)}
                   className="input-field" placeholder="What does this agent do?" />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">System Prompt *</label>
            <textarea value={form.system_prompt} onChange={e => update("system_prompt", e.target.value)}
                      className="input-field resize-none" rows={4}
                      placeholder="You are an expert at..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Provider</label>
              <select value={form.llm_provider} onChange={e => update("llm_provider", e.target.value)}
                      className="input-field">
                <option value="openai">OpenAI</option>
                <option value="ollama">Ollama (Local)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Model</label>
              <select value={form.llm_model} onChange={e => update("llm_model", e.target.value)}
                      className="input-field">
                {LLM_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          {form.llm_provider === "openai" && (
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">API Key (optional override)</label>
              <input type="password" value={form.llm_api_key} onChange={e => update("llm_api_key", e.target.value)}
                     className="input-field" placeholder="sk-... (leave blank to use default)" />
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={save} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     : <><Save size={15} />{agent ? "Save Changes" : "Create Agent"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; agent?: any }>({ open: false });

  const load = () => { agentsApi.list().then(r => setAgents(r.data)).finally(() => setLoading(false)); };

  useEffect(() => { load(); }, []);

  const deleteAgent = async (id: number) => {
    if (!confirm("Delete this agent?")) return;
    await agentsApi.delete(id);
    toast.success("Agent deleted");
    load();
  };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Agents</h1>
          <p className="text-[var(--text-secondary)] mt-1">Create and manage your AI agents</p>
        </div>
        <button id="new-agent-btn" onClick={() => setModal({ open: true })} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Agent
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 glass rounded-2xl shimmer" />)}
        </div>
      ) : agents.length === 0 ? (
        <div className="glass rounded-2xl py-20 text-center">
          <Bot size={48} className="mx-auto mb-4 text-[var(--text-muted)] opacity-40" />
          <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
          <p className="text-[var(--text-secondary)] text-sm mb-6">Create your first AI agent to get started</p>
          <button onClick={() => setModal({ open: true })} className="btn-primary mx-auto flex items-center gap-2 w-fit">
            <Plus size={16} /> Create Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(agent => (
            <div key={agent.id} className="glass glass-hover rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                       style={{background: "linear-gradient(135deg, #7c3aed22, #4f46e522)", border: "1px solid rgba(124,58,237,0.3)"}}>
                    <Bot size={20} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{agent.name}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{agent.llm_model}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Link href={`/chat/${agent.id}`}
                        className="p-1.5 rounded-lg hover:bg-purple-500/10 text-[var(--text-muted)] hover:text-purple-400"
                        title="Chat with Agent">
                    <MessageSquare size={15} />
                  </Link>
                  <button onClick={() => setModal({ open: true, agent })}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-white"
                          title="Edit Agent">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => deleteAgent(agent.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400"
                          title="Delete Agent">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              {agent.description && <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{agent.description}</p>}
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/5">
                <Cpu size={13} className="text-[var(--text-muted)]" />
                <span className="text-xs text-[var(--text-muted)]">{agent.llm_provider}</span>
                <span className="ml-auto text-xs text-[var(--text-muted)]">{agent.enabled_tools?.length || 0} tools</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <AgentModal agent={modal.agent} onClose={() => setModal({ open: false })} onSaved={() => { setModal({ open: false }); load(); }} />
      )}
    </div>
  );
}

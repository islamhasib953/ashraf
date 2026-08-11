"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Zap, Plus, Trash2, Play, Clock, CheckCircle, XCircle, Loader, ExternalLink } from "lucide-react";
import { workflowsApi } from "@/lib/api";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = () => { workflowsApi.list().then(r => setWorkflows(r.data)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const createNew = async () => {
    setCreating(true);
    try {
      const res = await workflowsApi.create({ name: "New Workflow", graph_json: { nodes: [], edges: [] } });
      toast.success("Workflow created!");
      window.location.href = `/workflows/${res.data.id}`;
    } catch { toast.error("Failed to create workflow"); } finally { setCreating(false); }
  };

  const deleteWf = async (id: number) => {
    if (!confirm("Delete this workflow?")) return;
    await workflowsApi.delete(id);
    toast.success("Workflow deleted");
    load();
  };

  const runWf = async (id: number) => {
    try {
      await workflowsApi.run(id);
      toast.success("Workflow triggered! Check Run History.");
    } catch (e: any) { toast.error(e.response?.data?.detail || "Failed to run"); }
  };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-[var(--text-secondary)] mt-1">Design and automate your AI pipelines</p>
        </div>
        <button id="new-workflow-btn" onClick={createNew} disabled={creating} className="btn-primary flex items-center gap-2">
          {creating ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Plus size={16} />}
          New Workflow
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-44 glass rounded-2xl shimmer" />)}
        </div>
      ) : workflows.length === 0 ? (
        <div className="glass rounded-2xl py-20 text-center">
          <Zap size={48} className="mx-auto mb-4 text-[var(--text-muted)] opacity-40" />
          <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
          <p className="text-[var(--text-secondary)] text-sm mb-6">Create your first workflow using the visual canvas</p>
          <button onClick={createNew} className="btn-primary mx-auto flex items-center gap-2 w-fit">
            <Plus size={16} /> Create Workflow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map(wf => {
            const nodeCount = wf.graph_json?.nodes?.length || 0;
            return (
              <div key={wf.id} className="glass glass-hover rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {wf.is_active
                        ? <div className="relative w-2 h-2"><div className="absolute inset-0 rounded-full bg-green-500 pulse-dot" /><div className="w-2 h-2 rounded-full bg-green-500" /></div>
                        : <div className="w-2 h-2 rounded-full bg-gray-600" />}
                      <h3 className="font-semibold">{wf.name}</h3>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">{nodeCount} nodes</p>
                  </div>
                  <button onClick={() => deleteWf(wf.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400">
                    <Trash2 size={15} />
                  </button>
                </div>

                {wf.description && <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{wf.description}</p>}

                {wf.is_scheduled && (
                  <div className="flex items-center gap-1.5 text-xs text-yellow-400">
                    <Clock size={12} /><span>Scheduled: {wf.cron_expression}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-white/5 mt-auto">
                  <Link href={`/workflows/${wf.id}`}
                        className="btn-ghost flex-1 flex items-center justify-center gap-1 text-xs py-2">
                    <ExternalLink size={13} /> Open Canvas
                  </Link>
                  <button onClick={() => runWf(wf.id)}
                          className="btn-primary flex-1 flex items-center justify-center gap-1 text-xs py-2">
                    <Play size={13} /> Run
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { Play, CheckCircle, XCircle, Loader, Clock, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { runsApi } from "@/lib/api";

import StatusBadge from "@/components/StatusBadge";

function RunRow({ run }: { run: any }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(run.created_at);

  return (
    <div className="border-b border-white/5 last:border-none">
      <button onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors text-left">
        <StatusBadge status={run.status} />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium">Run #{run.id}</span>
          <span className="mx-2 text-[var(--text-muted)]">·</span>
          <span className="text-sm text-[var(--text-secondary)] capitalize">{run.trigger_type}</span>
        </div>
        <span className="text-xs text-[var(--text-muted)]">Workflow #{run.workflow_id}</span>
        <span className="text-xs text-[var(--text-muted)]">{run.duration_seconds ? `${run.duration_seconds.toFixed(1)}s` : "—"}</span>
        <span className="text-xs text-[var(--text-muted)]">{date.toLocaleString()}</span>
        {expanded ? <ChevronDown size={14} className="text-[var(--text-muted)]" /> : <ChevronRight size={14} className="text-[var(--text-muted)]" />}
      </button>

      {expanded && (
        <div className="px-5 pb-4">
          {/* Step logs */}
          {run.logs && run.logs.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Execution Steps</p>
              {run.logs.map((log: any, i: number) => (
                <div key={i} className={`flex items-start gap-3 px-3 py-2.5 rounded-lg text-sm
                  ${log.status === "success" ? "bg-green-500/5 border border-green-500/15"
                  : log.status === "error" ? "bg-red-500/5 border border-red-500/15"
                  : "bg-white/3 border border-white/5"}`}>
                  <div className={`mt-0.5 flex-shrink-0 ${log.status === "success" ? "text-green-400" : log.status === "error" ? "text-red-400" : "text-[var(--text-muted)]"}`}>
                    {log.status === "success" ? <CheckCircle size={13} /> : log.status === "error" ? <XCircle size={13} /> : <Loader size={13} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{log.step}</span>
                    {log.output && <p className="text-xs text-[var(--text-secondary)] mt-1 mono break-all">{log.output}</p>}
                  </div>
                  <span className="text-xs text-[var(--text-muted)] flex-shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No detailed logs available.</p>
          )}

          {/* Final output */}
          {run.output && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Final Output</p>
              <div className="bg-white/3 rounded-lg p-3 text-sm mono text-[var(--text-secondary)] break-all whitespace-pre-wrap">
                {run.output}
              </div>
            </div>
          )}

          {/* Error */}
          {run.error_message && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-400 mb-1">Error</p>
              <p className="text-sm text-red-300 mono">{run.error_message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RunsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = () => {
    setLoading(true);
    runsApi.list(filter === "all" ? undefined : filter)
      .then(r => setRuns(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Run History</h1>
          <p className="text-[var(--text-secondary)] mt-1">View step-by-step execution logs for all workflow runs</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="input-field py-2 text-sm w-auto">
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="running">Running</option>
            <option value="pending">Pending</option>
          </select>
          <button onClick={load} className="btn-ghost p-2" title="Refresh"><RefreshCw size={16} /></button>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <Loader size={32} className="mx-auto animate-spin text-[var(--text-muted)] opacity-40" />
            <p className="text-[var(--text-secondary)] mt-3 text-sm">Loading runs...</p>
          </div>
        ) : runs.length === 0 ? (
          <div className="py-20 text-center">
            <Play size={48} className="mx-auto mb-4 text-[var(--text-muted)] opacity-30" />
            <h3 className="text-lg font-semibold mb-2">No runs found</h3>
            <p className="text-[var(--text-secondary)] text-sm">Run a workflow to see execution logs here</p>
          </div>
        ) : (
          <div>
            {runs.map(run => <RunRow key={run.id} run={run} />)}
          </div>
        )}
      </div>
    </div>
  );
}

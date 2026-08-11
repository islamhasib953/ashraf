"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, Zap, Plug, Play, Plus, TrendingUp, Clock, CheckCircle, XCircle, Loader } from "lucide-react";
import { agentsApi, workflowsApi, runsApi } from "@/lib/api";

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="glass glass-hover rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-[var(--text-secondary)]">{label}</p>
      </div>
    </div>
  );
}

function statusBadge(status: string) {
  const map: any = {
    success: <span className="badge badge-success"><CheckCircle size={10} />Success</span>,
    failed: <span className="badge badge-error"><XCircle size={10} />Failed</span>,
    running: <span className="badge badge-running"><Loader size={10} className="animate-spin" />Running</span>,
    pending: <span className="badge badge-pending"><Clock size={10} />Pending</span>,
  };
  return map[status] || <span className="badge badge-pending">{status}</span>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));

    Promise.all([agentsApi.list(), workflowsApi.list(), runsApi.list()])
      .then(([a, w, r]) => {
        setAgents(a.data);
        setWorkflows(w.data);
        setRuns(r.data.slice(0, 8));
      })
      .catch(() => router.push("/login"));
  }, []);

  const successRuns = runs.filter(r => r.status === "success").length;

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Welcome back{user ? `, ${user.username}` : ""}! Here's what's happening.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Bot size={22} className="text-purple-400" />} label="Total Agents" value={agents.length} color="bg-purple-500/10" />
        <StatCard icon={<Zap size={22} className="text-blue-400" />} label="Workflows" value={workflows.length} color="bg-blue-500/10" />
        <StatCard icon={<Play size={22} className="text-green-400" />} label="Total Runs" value={runs.length} color="bg-green-500/10" />
        <StatCard icon={<TrendingUp size={22} className="text-yellow-400" />} label="Success Rate" value={runs.length ? `${Math.round((successRuns / runs.length) * 100)}%` : "—"} color="bg-yellow-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Runs */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Runs</h2>
            <Link href="/runs" className="text-sm text-[var(--accent-light)] hover:underline">View all →</Link>
          </div>
          <div className="glass rounded-2xl overflow-hidden">
            {runs.length === 0 ? (
              <div className="py-16 text-center text-[var(--text-muted)]">
                <Play size={32} className="mx-auto mb-3 opacity-30" />
                <p>No runs yet. Run a workflow to see results here.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[var(--text-muted)]">
                    <th className="px-4 py-3 text-left font-medium">Workflow</th>
                    <th className="px-4 py-3 text-left font-medium">Trigger</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run, i) => (
                    <tr key={run.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${i === runs.length - 1 ? "border-none" : ""}`}>
                      <td className="px-4 py-3 font-medium">#{run.workflow_id}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] capitalize">{run.trigger_type}</td>
                      <td className="px-4 py-3">{statusBadge(run.status)}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {run.duration_seconds ? `${run.duration_seconds.toFixed(1)}s` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { href: "/agents", icon: <Bot size={18} />, label: "New Agent", sub: "Create an AI agent", color: "text-purple-400" },
              { href: "/workflows", icon: <Zap size={18} />, label: "New Workflow", sub: "Build a workflow", color: "text-blue-400" },
              { href: "/connections", icon: <Plug size={18} />, label: "Add Connection", sub: "Email, Telegram...", color: "text-green-400" },
            ].map(a => (
              <Link key={a.href} href={a.href}
                    className="glass glass-hover rounded-xl p-4 flex items-center gap-3 group">
                <div className={`w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center ${a.color} group-hover:scale-110 transition-transform`}>
                  {a.icon}
                </div>
                <div>
                  <p className="font-medium text-sm">{a.label}</p>
                  <p className="text-xs text-[var(--text-muted)]">{a.sub}</p>
                </div>
                <Plus size={16} className="ml-auto text-[var(--text-muted)]" />
              </Link>
            ))}
          </div>

          {/* Active Workflows */}
          {workflows.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Active Workflows</h3>
              <div className="space-y-2">
                {workflows.slice(0, 4).map((wf: any) => (
                  <Link key={wf.id} href={`/workflows/${wf.id}`}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="relative w-2 h-2">
                      <div className="absolute inset-0 rounded-full bg-green-500 pulse-dot" />
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                    <span className="text-sm truncate">{wf.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

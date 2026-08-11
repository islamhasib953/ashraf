"use client";
import Link from "next/link";
import { Bot, Zap, Shield, Plug, Clock, ArrowRight, CheckCircle, Star } from "lucide-react";

const features = [
  {
    icon: <Bot size={22} />,
    title: "AI Agents",
    desc: "Create intelligent agents with custom system prompts, tools, and knowledge bases.",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: <Zap size={22} />,
    title: "Visual Workflows",
    desc: "Drag-and-drop canvas to connect agents into powerful automated pipelines.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: <Plug size={22} />,
    title: "Integrations",
    desc: "Connect to Email, Telegram, webhooks, HTTP APIs, and Google Sheets.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: <Clock size={22} />,
    title: "24/7 Scheduling",
    desc: "Schedule workflows with cron expressions or trigger them via webhooks.",
    color: "from-orange-500 to-yellow-500",
  },
  {
    icon: <Shield size={22} />,
    title: "Secure by Default",
    desc: "All credentials are encrypted at rest. JWT auth, rate limiting, and isolation.",
    color: "from-red-500 to-pink-500",
  },
  {
    icon: <Star size={22} />,
    title: "Local AI Models",
    desc: "Use HuggingFace models locally — no cloud API costs for embeddings & search.",
    color: "from-yellow-500 to-amber-500",
  },
];

const nodeTypes = [
  { label: "🤖 AI Agent", type: "trigger" },
  { label: "📧 Send Email", type: "action" },
  { label: "📨 Telegram", type: "action" },
  { label: "⏰ Cron Schedule", type: "trigger" },
  { label: "🔗 HTTP Request", type: "action" },
  { label: "⚡ Webhook", type: "trigger" },
  { label: "📝 Text Template", type: "util" },
  { label: "🔀 Condition", type: "util" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen hero-gradient text-white">
      {/* ── Navbar ───────────────────────────────────── */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background: "linear-gradient(135deg, #7c3aed, #4f46e5)"}}>
              <Bot size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">AgentFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm">Sign In</Link>
            <Link href="/register" className="btn-primary text-sm flex items-center gap-1">
              Get Started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6"
             style={{background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#a855f7"}}>
          <Zap size={12} /> Powered by Local HuggingFace Models
        </div>
        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
          Build AI Agents that<br />
          <span className="gradient-text">work for you 24/7</span>
        </h1>
        <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
          Create intelligent workflows using a visual drag-and-drop canvas.
          Connect your agents to Email, Telegram, and any API — then let them run automatically.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register" className="btn-primary text-base px-6 py-3 flex items-center gap-2 glow">
            Start Building for Free <ArrowRight size={16} />
          </Link>
          <Link href="/login" className="btn-ghost text-base px-6 py-3">
            View Demo →
          </Link>
        </div>

        {/* Social proof */}
        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
          {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#f59e0b" className="text-yellow-500" />)}
          <span className="ml-1">Trusted by developers worldwide</span>
        </div>
      </section>

      {/* ── Node Types Preview ────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-wrap justify-center gap-3">
          {nodeTypes.map((n) => (
            <div key={n.label} className="glass rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] glass-hover cursor-default">
              {n.label}
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to automate</h2>
          <p className="text-[var(--text-secondary)]">From simple notifications to complex multi-agent pipelines</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="glass glass-hover rounded-2xl p-6">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 text-white`}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-14">Get running in 3 steps</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Create an Agent", desc: "Define its personality, system prompt, and the LLM to use." },
            { step: "02", title: "Build a Workflow", desc: "Connect nodes visually — Trigger → Agent → Action." },
            { step: "03", title: "Run & Monitor", desc: "Execute manually or schedule it. Watch real-time logs." },
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center">
              <div className="text-5xl font-black gradient-text mb-4">{s.step}</div>
              <h3 className="font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-[var(--text-secondary)]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="glass rounded-3xl p-12 text-center" style={{border: "1px solid rgba(124,58,237,0.3)"}}>
          <h2 className="text-3xl font-bold mb-4">Ready to build your first agent?</h2>
          <p className="text-[var(--text-secondary)] mb-8">Free to start. No credit card required.</p>
          <Link href="/register" className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2 glow">
            Create Free Account <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 text-center text-sm text-[var(--text-muted)]">
        <p>© 2026 AgentFlow. Built with FastAPI, LangGraph, Next.js & ❤️</p>
      </footer>
    </main>
  );
}

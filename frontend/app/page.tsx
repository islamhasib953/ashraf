"use client";
import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2, Clock, Plug, Shield, Sparkles, Star, Zap } from "lucide-react";

const features = [
  { icon: <Bot size={21} />, title: "AI Agents", text: "Create capable agents with clear instructions, tools, and knowledge.", color: "from-cyan-500 to-teal-400" },
  { icon: <Zap size={21} />, title: "Visual Workflows", text: "Connect triggers, agents, and actions in a focused visual canvas.", color: "from-sky-500 to-indigo-400" },
  { icon: <Plug size={21} />, title: "Integrations", text: "Bring Email, Telegram, webhooks, APIs, and Sheets together.", color: "from-emerald-500 to-green-400" },
  { icon: <Clock size={21} />, title: "Always on", text: "Schedule reliable workflows or start them instantly from a webhook.", color: "from-amber-500 to-orange-400" },
  { icon: <Shield size={21} />, title: "Secure by design", text: "Built-in authentication, rate limits, and encrypted credentials.", color: "from-rose-500 to-pink-400" },
  { icon: <Sparkles size={21} />, title: "Flexible AI stack", text: "Choose the models and providers that match your team’s workflow.", color: "from-violet-500 to-fuchsia-400" },
];
const nodes = ["AI Agent", "Send Email", "Telegram", "Schedule", "HTTP Request", "Webhook", "Text Template", "Condition"];

export default function LandingPage() {
  return <main className="min-h-screen hero-gradient text-white">
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#07121f]/75 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2"><span className="brand-mark w-9 h-9 rounded-xl grid place-items-center"><Bot size={18} /></span><span className="text-xl font-bold gradient-text">AgentFlow</span></Link>
        <div className="flex items-center gap-2 sm:gap-3"><Link href="/login" className="btn-ghost text-sm">Sign in</Link><Link href="/register" className="btn-primary text-sm">Get started <ArrowRight size={14} className="ml-1" /></Link></div>
      </div>
    </nav>
    <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-14 sm:pb-20 text-center fade-in">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border border-cyan-300/20 bg-cyan-300/10 text-cyan-200"><Sparkles size={12} /> One calm workspace for automation</div>
      <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.06] mb-6">Build AI workflows that <span className="gradient-text">move work forward.</span></h1>
      <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-9 leading-relaxed">Design, launch, and monitor dependable automations. Connect your agents to the tools your team already uses—without the clutter.</p>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3"><Link href="/register" className="btn-primary text-base px-6 py-3 glow">Start building free <ArrowRight size={16} className="ml-2" /></Link><Link href="/login" className="btn-ghost text-base px-6 py-3">Explore workspace</Link></div>
      <div className="mt-9 flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]"><span className="flex gap-0.5">{[0,1,2,3,4].map(i => <Star key={i} size={14} fill="currentColor" className="text-amber-300" />)}</span><span>Designed for productive teams</span></div>
    </section>
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-8 sm:pb-12"><div className="glass rounded-2xl p-4 sm:p-6 flex flex-wrap justify-center gap-2 sm:gap-3">{nodes.map(node => <span key={node} className="rounded-xl border border-white/10 bg-white/[.035] px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-[var(--text-secondary)]">{node}</span>)}</div></section>
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20"><div className="text-center mb-10 sm:mb-14"><p className="text-cyan-200 text-sm font-bold uppercase tracking-[.18em] mb-3">Everything in one place</p><h2 className="text-3xl sm:text-4xl font-bold">A clearer path from idea to action.</h2></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">{features.map(feature => <article key={feature.title} className="glass glass-hover rounded-2xl p-6"><div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.color} grid place-items-center mb-5 text-white`}>{feature.icon}</div><h3 className="font-bold text-lg mb-2">{feature.title}</h3><p className="text-sm leading-relaxed text-[var(--text-secondary)]">{feature.text}</p></article>)}</div></section>
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center"><h2 className="text-3xl font-bold mb-10">Go from plan to production in three steps.</h2><div className="grid grid-cols-1 sm:grid-cols-3 gap-8">{[["01","Create an agent","Give it a role, a prompt, and the tools it needs."],["02","Map the workflow","Visually connect triggers, decisions, and actions."],["03","Run with confidence","Monitor activity and refine your automations."]].map(([n,title,text]) => <div key={n}><p className="text-4xl font-black gradient-text mb-3">{n}</p><h3 className="font-bold mb-2">{title}</h3><p className="text-sm text-[var(--text-secondary)]">{text}</p></div>)}</div></section>
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20"><div className="glass rounded-3xl border border-cyan-300/20 p-7 sm:p-12 text-center"><CheckCircle2 size={26} className="mx-auto mb-4 text-teal-300"/><h2 className="text-3xl font-bold mb-3">Ready to build your first workflow?</h2><p className="text-[var(--text-secondary)] mb-7">Start with the essentials and scale at your own pace.</p><Link href="/register" className="btn-primary text-base px-7 py-3">Create free account <ArrowRight size={16} className="ml-2" /></Link></div></section>
    <footer className="border-t border-white/5 py-8 text-center text-sm text-[var(--text-muted)]">© 2026 AgentFlow. Built for focused automation teams.</footer>
  </main>;
}

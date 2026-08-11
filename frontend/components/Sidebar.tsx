"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Zap, Plug, Play, LayoutDashboard, LogOut, ChevronRight } from "lucide-react";

const NAV = [
  { href: "/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { href: "/agents", icon: <Bot size={18} />, label: "Agents" },
  { href: "/workflows", icon: <Zap size={18} />, label: "Workflows" },
  { href: "/connections", icon: <Plug size={18} />, label: "Connections" },
  { href: "/runs", icon: <Play size={18} />, label: "Run History" },
];

export default function Sidebar({ user, onLogout, onClose }: { user: any; onLogout: () => void; onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full sidebar">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{background: "linear-gradient(135deg, #7c3aed, #4f46e5)"}}>
            <Bot size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">AgentFlow</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                    ${active
                      ? "bg-purple-600/20 text-white border border-purple-500/30"
                      : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-white"}`}>
              <span className={active ? "text-purple-400" : ""}>{item.icon}</span>
              {item.label}
              {active && <ChevronRight size={14} className="ml-auto text-purple-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      {user && (
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                 style={{background: "linear-gradient(135deg, #7c3aed, #4f46e5)"}}>
              {user.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.username}</p>
              <p className="text-xs text-[var(--text-muted)]">Free Plan</p>
            </div>
            <button onClick={onLogout} title="Logout"
                    className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-white transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

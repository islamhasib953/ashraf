"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Bot, Zap, Plug, Play, LayoutDashboard, LogOut, Menu, X, ChevronRight } from "lucide-react";

const NAV = [
  { href: "/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { href: "/agents", icon: <Bot size={18} />, label: "Agents" },
  { href: "/workflows", icon: <Zap size={18} />, label: "Workflows" },
  { href: "/connections", icon: <Plug size={18} />, label: "Connections" },
  { href: "/runs", icon: <Play size={18} />, label: "Run History" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-2">
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
                  onClick={() => setSidebarOpen(false)}
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
            <button onClick={logout} title="Logout"
                    className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-white transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{background: "var(--bg-primary)"}}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-col sidebar flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-60 sidebar z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-white/5">
            <Menu size={20} />
          </button>
          <span className="font-semibold gradient-text">AgentFlow</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

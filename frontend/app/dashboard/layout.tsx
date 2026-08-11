"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Bot, Zap, Plug, Play, LayoutDashboard, LogOut, Menu, X, ChevronRight } from "lucide-react";

import Sidebar from "@/components/Sidebar";

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



  return (
    <div className="flex h-screen overflow-hidden" style={{background: "var(--bg-primary)"}}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-col flex-shrink-0">
        <Sidebar user={user} onLogout={logout} />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-60 z-10">
            <Sidebar user={user} onLogout={logout} onClose={() => setSidebarOpen(false)} />
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

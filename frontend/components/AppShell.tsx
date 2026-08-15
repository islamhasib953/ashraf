"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, [router]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
  };

  return (
    <div className="app-shell">
      <aside className="app-sidebar desktop-sidebar"><Sidebar user={user} onLogout={logout} /></aside>
      {menuOpen && (
        <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button className="mobile-menu-backdrop" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />
          <aside className="app-sidebar mobile-sidebar">
            <button className="close-menu" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={18} /></button>
            <Sidebar user={user} onLogout={logout} onClose={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}
      <section className="app-content">
        <header className="mobile-topbar">
          <button onClick={() => setMenuOpen(true)} className="icon-button" aria-label="Open navigation"><Menu size={20} /></button>
          <span className="brand-wordmark">AgentFlow</span>
          <span className="online-indicator"><i /> Live</span>
        </header>
        <main className="page-content">{children}</main>
      </section>
    </div>
  );
}

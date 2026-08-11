"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Bot, Mail, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import { authApi } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", username: "", password: "", full_name: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const res = await authApi.register(form);
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify({ id: res.data.user_id, username: res.data.username }));
      toast.success("Account created! Welcome to AgentFlow 🎉");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{background: "linear-gradient(135deg, #7c3aed, #4f46e5)"}}>
              <Bot size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">AgentFlow</span>
          </div>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Start building AI workflows today</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input type="text" value={form.full_name} onChange={e => update("full_name", e.target.value)}
                       placeholder="John Doe" className="input-field pl-10" />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Username <span className="text-[var(--danger)]">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">@</span>
                <input type="text" value={form.username} onChange={e => update("username", e.target.value)}
                       placeholder="yourhandle" className="input-field pl-8" required />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email <span className="text-[var(--danger)]">*</span></label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input type="email" value={form.email} onChange={e => update("email", e.target.value)}
                       placeholder="you@example.com" className="input-field pl-10" required autoComplete="email" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Password <span className="text-[var(--danger)]">*</span></label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input type={showPass ? "text" : "password"} value={form.password} onChange={e => update("password", e.target.value)}
                       placeholder="Min. 8 characters" className="input-field pl-10 pr-10" required autoComplete="new-password" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button id="register-submit" type="submit" disabled={loading}
                    className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2">
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       : <><span>Create Account</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text-secondary)] mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--accent-light)] hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

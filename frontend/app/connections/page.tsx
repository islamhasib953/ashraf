"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plug, Plus, Trash2, Mail, MessageCircle, Globe, Webhook, X, Check, Loader } from "lucide-react";
import { connectionsApi } from "@/lib/api";

const CONN_TYPES = [
  { type: "telegram", label: "Telegram Bot", icon: <MessageCircle size={20} />, color: "text-blue-400", bg: "bg-blue-500/10",
    fields: [{ key: "bot_token", label: "Bot Token", type: "password", placeholder: "123456:ABCdef..." }] },
  { type: "email", label: "Email (SMTP)", icon: <Mail size={20} />, color: "text-green-400", bg: "bg-green-500/10",
    fields: [
      { key: "email", label: "Email Address", type: "email", placeholder: "you@gmail.com" },
      { key: "password", label: "App Password", type: "password", placeholder: "16-char app password" },
      { key: "smtp_host", label: "SMTP Host", type: "text", placeholder: "smtp.gmail.com" },
      { key: "smtp_port", label: "SMTP Port", type: "number", placeholder: "587" },
    ] },
  { type: "webhook", label: "Webhook", icon: <Webhook size={20} />, color: "text-purple-400", bg: "bg-purple-500/10",
    fields: [{ key: "url", label: "Webhook URL", type: "url", placeholder: "https://..." }] },
  { type: "http", label: "HTTP API", icon: <Globe size={20} />, color: "text-orange-400", bg: "bg-orange-500/10",
    fields: [
      { key: "base_url", label: "Base URL", type: "url", placeholder: "https://api.example.com" },
      { key: "api_key", label: "API Key", type: "password", placeholder: "your-api-key" },
    ] },
  { type: "slack", label: "Slack", icon: <MessageCircle size={20} />, color: "text-red-400", bg: "bg-red-500/10",
    fields: [{ key: "bot_token", label: "Bot Token (xoxb-...)", type: "password", placeholder: "xoxb-..." }] },
  { type: "discord", label: "Discord", icon: <MessageCircle size={20} />, color: "text-indigo-400", bg: "bg-indigo-500/10",
    fields: [{ key: "webhook_url", label: "Webhook URL", type: "url", placeholder: "https://discord.com/api/webhooks/..." }] },
  { type: "whatsapp", label: "WhatsApp (Twilio)", icon: <MessageCircle size={20} />, color: "text-emerald-400", bg: "bg-emerald-500/10",
    fields: [
      { key: "account_sid", label: "Account SID", type: "text", placeholder: "AC..." },
      { key: "auth_token", label: "Auth Token", type: "password", placeholder: "..." },
      { key: "from_number", label: "From Number", type: "text", placeholder: "+1234567890" },
    ] },
  { type: "google_sheets", label: "Google Sheets", icon: <Globe size={20} />, color: "text-green-500", bg: "bg-green-500/10",
    fields: [{ key: "service_account_json", label: "Service Account JSON", type: "text", placeholder: '{"type": "service_account", ...}' }] },
  { type: "gmail_imap", label: "Gmail (IMAP)", icon: <Mail size={20} />, color: "text-red-500", bg: "bg-red-500/10",
    fields: [
      { key: "email", label: "Email Address", type: "email", placeholder: "you@gmail.com" },
      { key: "password", label: "App Password", type: "password", placeholder: "16-char app password" },
      { key: "imap_host", label: "IMAP Host", type: "text", placeholder: "imap.gmail.com" },
    ] },
];

function AddConnectionModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [step, setStep] = useState<"type" | "config">("type");
  const [selectedType, setSelectedType] = useState<any>(null);
  const [name, setName] = useState("");
  const [creds, setCreds] = useState<any>({});
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const updateCred = (k: string, v: string) => setCreds((c: any) => ({ ...c, [k]: v }));

  const testConn = async () => {
    setTesting(true); setTestResult(null);
    try {
      const res = await connectionsApi.test({ connection_type: selectedType.type, credentials: creds });
      setTestResult({ ok: res.data.success, msg: res.data.message });
    } catch (e: any) {
      setTestResult({ ok: false, msg: e.response?.data?.detail || "Test failed" });
    } finally { setTesting(false); }
  };

  const save = async () => {
    if (!name.trim()) { toast.error("Please enter a connection name"); return; }
    setSaving(true);
    try {
      await connectionsApi.create({ name, connection_type: selectedType.type, credentials: creds });
      toast.success("Connection saved! 🔌");
      onSaved();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to save");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="glass rounded-2xl p-6 w-full max-w-md z-10 fade-in" style={{border: "1px solid rgba(124,58,237,0.3)"}}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{step === "type" ? "Choose Connection Type" : `Configure ${selectedType?.label}`}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg"><X size={18} /></button>
        </div>

        {step === "type" ? (
          <div className="grid grid-cols-2 gap-3">
            {CONN_TYPES.map(ct => (
              <button key={ct.type} onClick={() => { setSelectedType(ct); setStep("config"); }}
                      className="glass glass-hover rounded-xl p-4 flex flex-col items-center gap-2 text-center">
                <div className={`w-10 h-10 rounded-xl ${ct.bg} flex items-center justify-center ${ct.color}`}>{ct.icon}</div>
                <span className="text-sm font-medium">{ct.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Connection Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} className="input-field"
                     placeholder={`My ${selectedType.label}`} />
            </div>
            {selectedType.fields.map((f: any) => (
              <div key={f.key}>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">{f.label}</label>
                <input type={f.type} value={creds[f.key] || ""} onChange={e => updateCred(f.key, e.target.value)}
                       className="input-field" placeholder={f.placeholder} />
              </div>
            ))}

            {testResult && (
              <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${testResult.ok ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                {testResult.ok ? <Check size={16} /> : <X size={16} />}{testResult.msg}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={testConn} disabled={testing} className="btn-ghost flex-1 flex items-center justify-center gap-1 text-sm">
                {testing ? <Loader size={14} className="animate-spin" /> : <Check size={14} />} Test
              </button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-1 text-sm">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={14} />}
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  const load = () => { connectionsApi.list().then(r => setConnections(r.data)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const del = async (id: number) => {
    if (!confirm("Delete this connection?")) return;
    await connectionsApi.delete(id);
    toast.success("Connection deleted");
    load();
  };

  const typeInfo = (type: string) => CONN_TYPES.find(t => t.type === type);

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Connections</h1>
          <p className="text-[var(--text-secondary)] mt-1">Manage your integrations (Email, Telegram, Webhooks)</p>
        </div>
        <button id="add-connection-btn" onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Connection
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(2)].map((_, i) => <div key={i} className="h-32 glass rounded-2xl shimmer" />)}
        </div>
      ) : connections.length === 0 ? (
        <div className="glass rounded-2xl py-20 text-center">
          <Plug size={48} className="mx-auto mb-4 text-[var(--text-muted)] opacity-40" />
          <h3 className="text-lg font-semibold mb-2">No connections yet</h3>
          <p className="text-[var(--text-secondary)] text-sm mb-6">Connect your workflows to external services</p>
          <button onClick={() => setModal(true)} className="btn-primary mx-auto flex items-center gap-2 w-fit">
            <Plus size={16} /> Add Connection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map(conn => {
            const info = typeInfo(conn.connection_type);
            return (
              <div key={conn.id} className="glass glass-hover rounded-2xl p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${info?.bg} ${info?.color}`}>
                  {info?.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{conn.name}</p>
                  <p className="text-sm text-[var(--text-secondary)] capitalize">{conn.connection_type}</p>
                </div>
                <button onClick={() => del(conn.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 flex-shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {modal && <AddConnectionModal onClose={() => setModal(false)} onSaved={() => { setModal(false); load(); }} />}
    </div>
  );
}

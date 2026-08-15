"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Bot, Send, Paperclip, X, Image as ImageIcon, FileText,
  ChevronLeft, Trash2, Plus, MessageSquare, Loader, Download,
  Sparkles, User
} from "lucide-react";
import { agentsApi } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
const BASE_URL = API_URL.replace("/api/v1", "");

// ─── Types ─────────────────────────────────────────────────────────
interface Message {
  id?: number;
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: Attachment[];
  created_at?: string;
  streaming?: boolean;
}

interface Attachment {
  type: "image" | "file";
  filename: string;
  path?: string;
  mime_type?: string;
  size_bytes?: number;
  localUrl?: string; // For preview before upload
}

interface Session {
  id: number;
  agent_id: number;
  title: string;
  message_count: number;
  created_at: string;
}

// ─── Message Bubble ────────────────────────────────────────────────
function MessageBubble({ msg, agentName }: { msg: Message; agentName: string }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} mb-5`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold
        ${isUser ? "bg-gradient-to-br from-blue-500 to-cyan-500" : "bg-gradient-to-br from-purple-600 to-indigo-600"}`}>
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
      </div>

      <div className={`max-w-[75%] flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
        {/* Name */}
        <span className="text-xs text-[var(--text-muted)] px-1">
          {isUser ? "You" : agentName}
        </span>

        {/* Attachments */}
        {msg.attachments && msg.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {msg.attachments.map((att, i) => (
              <div key={i}>
                {att.type === "image" ? (
                  <div className="rounded-xl overflow-hidden border border-white/10 max-w-[280px]">
                    <img
                      src={att.localUrl || `${BASE_URL}/${att.path?.replace(/^\.\//, "")}`}
                      alt={att.filename}
                      className="max-w-full max-h-60 object-cover"
                    />
                    <div className="px-2 py-1 text-xs text-[var(--text-muted)] bg-black/30">{att.filename}</div>
                  </div>
                ) : (
                  <a
                    href={att.localUrl || `${BASE_URL}/${att.path?.replace(/^\.\//, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 glass rounded-xl text-sm hover:bg-white/10 transition-colors"
                  >
                    <FileText size={16} className="text-blue-400" />
                    <span className="truncate max-w-[150px]">{att.filename}</span>
                    <Download size={13} className="text-[var(--text-muted)]" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Text Bubble */}
        {(msg.content || msg.streaming) && (
          <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words
            ${isUser
              ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-sm"
              : "glass text-[var(--text-primary)] rounded-tl-sm border border-white/8"
            }`}>
            {msg.content || ""}
            {msg.streaming && (
              <span className="inline-flex gap-0.5 ml-1 align-middle">
                <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            )}
          </div>
        )}

        {/* Timestamp */}
        {msg.created_at && !msg.streaming && (
          <span className="text-xs text-[var(--text-muted)] px-1">
            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── File Preview Chip ─────────────────────────────────────────────
function FileChip({ att, onRemove }: { att: Attachment & { localUrl?: string }; onRemove: () => void }) {
  return (
    <div className="relative flex items-center gap-2 px-2 py-1.5 glass rounded-xl text-xs group">
      {att.type === "image" && att.localUrl ? (
        <img src={att.localUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
      ) : (
        <FileText size={18} className="text-blue-400 flex-shrink-0" />
      )}
      <span className="max-w-[100px] truncate text-[var(--text-secondary)]">{att.filename}</span>
      <button onClick={onRemove}
              className="ml-1 p-0.5 rounded-full hover:bg-white/20 text-[var(--text-muted)] hover:text-white">
        <X size={12} />
      </button>
    </div>
  );
}

// ─── Sessions Sidebar ──────────────────────────────────────────────
function SessionSidebar({
  sessions, currentId, agentId, agentName, onSelect, onNew, onDelete
}: {
  sessions: Session[];
  currentId?: number;
  agentId: number;
  agentName: string;
  onSelect: (id: number) => void;
  onNew: () => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="w-60 flex-shrink-0 flex flex-col border-r border-white/5 h-full overflow-hidden" style={{ background: "#0d0d14" }}>
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
            <Bot size={14} className="text-white" />
          </div>
          <span className="font-semibold text-sm truncate">{agentName}</span>
        </div>
        <button onClick={onNew} className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-1">
          <Plus size={13} /> New Chat
        </button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto py-2">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-xs text-[var(--text-muted)]">
            <MessageSquare size={24} className="mx-auto mb-2 opacity-30" />
            No conversations yet
          </div>
        ) : (
          sessions.map(s => (
            <div key={s.id}
                 className={`group flex items-center gap-2 px-3 py-2.5 mx-2 rounded-xl cursor-pointer transition-all mb-1
                   ${s.id === currentId ? "bg-purple-600/20 border border-purple-500/30" : "hover:bg-white/5"}`}
                 onClick={() => onSelect(s.id)}>
              <MessageSquare size={13} className="flex-shrink-0 text-[var(--text-muted)]" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{s.title}</p>
                <p className="text-xs text-[var(--text-muted)]">{s.message_count} messages</p>
              </div>
              <button onClick={e => { e.stopPropagation(); onDelete(s.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-[var(--text-muted)] hover:text-red-400">
                <Trash2 size={11} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Chat Page ────────────────────────────────────────────────
export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = Number(params.agentId);

  const [agent, setAgent] = useState<any>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<(File & { localUrl?: string; attType?: string })[]>([]);
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    agentsApi.get(agentId).then(r => setAgent(r.data)).catch(() => router.push("/agents"));
    loadSessions();
  }, [agentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const agentSessions = data.filter((s: Session) => s.agent_id === agentId);
      setSessions(agentSessions);
      if (agentSessions.length > 0 && !currentSessionId) {
        selectSession(agentSessions[0].id);
      }
    } catch { /* silent */ }
  };

  const selectSession = async (sessionId: number) => {
    setCurrentSessionId(sessionId);
    setLoadingMsgs(true);
    try {
      const res = await fetch(`${API_URL}/chat/sessions/${sessionId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessages(data);
    } catch { toast.error("Failed to load messages"); }
    finally { setLoadingMsgs(false); }
  };

  const createSession = async () => {
    const res = await fetch(`${API_URL}/chat/sessions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: agentId, title: "New Chat" }),
    });
    const data = await res.json();
    setSessions(prev => [{ ...data, message_count: 0 }, ...prev]);
    setCurrentSessionId(data.id);
    setMessages([]);
    return data.id;
  };

  const deleteSession = async (sessionId: number) => {
    await fetch(`${API_URL}/chat/sessions/${sessionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
      setMessages([]);
    }
    toast.success("Chat deleted");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const annotated = selected.map(f => {
      const obj = f as File & { localUrl?: string; attType?: string };
      obj.localUrl = f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined;
      obj.attType = f.type.startsWith("image/") ? "image" : "file";
      return obj;
    });
    setFiles(prev => [...prev, ...annotated]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const f = prev[index];
      if (f.localUrl) URL.revokeObjectURL(f.localUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const sendMessage = useCallback(async () => {
    if (!text.trim() && files.length === 0) return;
    if (sending) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = await createSession();
    }

    setSending(true);
    const userMsg: Message = {
      role: "user",
      content: text,
      attachments: files.map(f => ({
        type: f.attType as "image" | "file",
        filename: f.name,
        localUrl: f.localUrl,
        mime_type: f.type,
        size_bytes: f.size,
      })),
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    const sentText = text;
    const sentFiles = [...files];
    setText("");
    setFiles([]);

    // Streaming assistant message placeholder
    const streamingMsg: Message = { role: "assistant", content: "", streaming: true };
    setMessages(prev => [...prev, streamingMsg]);

    try {
      const formData = new FormData();
      if (sentText) formData.append("text", sentText);
      sentFiles.forEach(f => formData.append("files", f));

      const response = await fetch(`${API_URL}/chat/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error("Server error");

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const token = line.slice(6);
            if (token === "[DONE]") {
              setMessages(prev => prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, streaming: false, created_at: new Date().toISOString() } : m
              ));
              break;
            }
            fullText += token;
            setMessages(prev => prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: fullText } : m
            ));
          }
        }
      }

      // Update session title after first message
      setSessions(prev => prev.map(s =>
        s.id === sessionId ? { ...s, message_count: s.message_count + 2 } : s
      ));

    } catch (err: any) {
      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1 ? { ...m, content: "⚠️ Failed to get response. Check your API key.", streaming: false } : m
      ));
    } finally {
      setSending(false);
    }
  }, [text, files, currentSessionId, sending, token]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [text]);

  if (!agent) return (
    <div className="h-screen flex items-center justify-center">
      <Loader size={32} className="animate-spin text-purple-500" />
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: "#09090f" }}>
      {/* Sessions Sidebar */}
      <SessionSidebar
        sessions={sessions}
        currentId={currentSessionId ?? undefined}
        agentId={agentId}
        agentName={agent.name}
        onSelect={selectSession}
        onNew={createSession}
        onDelete={deleteSession}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5 flex-shrink-0"
             style={{ background: "rgba(13,13,20,0.95)", backdropFilter: "blur(12px)" }}>
          <button onClick={() => router.push("/agents")}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-secondary)]">
            <ChevronLeft size={18} />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-semibold">{agent.name}</h1>
            <p className="text-xs text-[var(--text-muted)]">{agent.llm_model} · {agent.llm_provider}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="relative w-2 h-2">
              <div className="absolute inset-0 rounded-full bg-green-500 pulse-dot" />
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            <span className="text-xs text-green-400">Online</span>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {!currentSessionId ? (
            /* Welcome state */
            <div className="h-full flex flex-col items-center justify-center text-center fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mb-4 glow">
                <Sparkles size={28} className="text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2">Chat with {agent.name}</h2>
              <p className="text-[var(--text-secondary)] text-sm max-w-sm mb-6">
                {agent.description || `${agent.name} is ready to help. Start a conversation!`}
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                {["Tell me about yourself", "What can you help me with?", "Let's get started!"].map(q => (
                  <button key={q} onClick={() => { setText(q); textareaRef.current?.focus(); }}
                          className="px-3 py-1.5 glass rounded-full text-sm text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-all">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : loadingMsgs ? (
            <div className="h-full flex items-center justify-center">
              <Loader size={24} className="animate-spin text-purple-400" />
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} agentName={agent.name} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="px-5 pb-5 flex-shrink-0">
          {/* File previews */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {files.map((f, i) => (
                <FileChip
                  key={i}
                  att={{ type: f.attType as "image" | "file", filename: f.name, localUrl: f.localUrl }}
                  onRemove={() => removeFile(i)}
                />
              ))}
            </div>
          )}

          {/* Input box */}
          <div className="glass rounded-2xl border border-white/10 focus-within:border-purple-500/50 transition-all"
               style={{ boxShadow: "0 0 0 0 rgba(124,58,237,0)" }}>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message the agent... (Shift+Enter for new line)"
              rows={1}
              className="w-full bg-transparent px-4 pt-4 pb-2 text-sm resize-none outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              style={{ maxHeight: "160px" }}
            />
            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-1">
                {/* File attachment button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.txt,.csv,.json,.doc,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button id="attach-file-btn"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-xl hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors"
                        title="Attach image or file">
                  <Paperclip size={17} />
                </button>
                <button
                  onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = "image/*"; fileInputRef.current.click(); setTimeout(() => { if (fileInputRef.current) fileInputRef.current.accept = "image/*,.pdf,.txt,.csv,.json,.doc,.docx"; }, 100); } }}
                  className="p-2 rounded-xl hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors"
                  title="Attach image">
                  <ImageIcon size={17} />
                </button>
                <span className="text-xs text-[var(--text-muted)] ml-1">
                  {files.length > 0 ? `${files.length} file${files.length > 1 ? "s" : ""} attached` : "Images, PDF, TXT, CSV, JSON"}
                </span>
              </div>

              <button
                id="send-message-btn"
                onClick={sendMessage}
                disabled={sending || (!text.trim() && files.length === 0)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all
                  ${(text.trim() || files.length > 0) && !sending
                    ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105"
                    : "bg-white/5 text-[var(--text-muted)] cursor-not-allowed"
                  }`}>
                {sending
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Send size={15} />}
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-[var(--text-muted)] mt-2">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}

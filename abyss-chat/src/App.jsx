import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Plus,
  Search,
  Trash2,
  MoreHorizontal,
  Sparkles,
  User,
  ChevronRight,
  MessageSquare,
  Settings,
  Zap,
  Moon,
  X,
  Menu,
  Copy,
  Check,
  Paperclip,
} from "lucide-react";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";

// ─── Markdown Setup ───────────────────────────────────────────────────────────

marked.setOptions({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelative(date) {
  const diff = Date.now() - new Date(date);
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return mins + "m ago";
  if (hours < 24) return hours + "h ago";
  return days + "d ago";
}

function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ─── Components ───────────────────────────────────────────────────────────────

function AbyssAvatar({ size }) {
  const s = size || "md";
  const sizes = { sm: "w-7 h-7", md: "w-9 h-9", lg: "w-12 h-12" };
  const icon = { sm: 14, md: 16, lg: 20 };
  return (
    <div
      className={
        sizes[s] +
        " rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0"
      }
    >
      <Sparkles size={icon[s]} className="text-white" />
    </div>
  );
}

function UserAvatar({ size }) {
  const s = size || "md";
  const sizes = { sm: "w-7 h-7", md: "w-9 h-9", lg: "w-12 h-12" };
  const icon = { sm: 13, md: 15, lg: 18 };
  return (
    <div
      className={
        sizes[s] +
        " rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0"
      }
    >
      <User size={icon[s]} className="text-slate-300" />
    </div>
  );
}

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="relative my-2 rounded-lg overflow-hidden border border-white/10 bg-black/40">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10">
        <span className="text-xs text-slate-400 font-mono">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-3 text-xs font-mono overflow-x-auto leading-relaxed">
        <code
          dangerouslySetInnerHTML={{ __html: hljs.highlightAuto(code).value }}
        />
      </pre>
    </div>
  );
}

function MessageContent({ content }) {
  const html = marked.parse(content || "");
  return (
    <div
      className="prose prose-invert prose-sm max-w-none leading-relaxed [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_pre]:my-1 [&_code]:text-indigo-300 [&_strong]:text-white [&_a]:text-indigo-400"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function MessageBubble({ message, isLatest }) {
  const isUser = message.role === "user";
  return (
    <div
      className={
        "flex items-end gap-3 " +
        (isUser ? "flex-row-reverse" : "flex-row") +
        (isLatest ? " animate-fade-in" : "")
      }
    >
      {isUser ? <UserAvatar /> : <AbyssAvatar />}
      <div className="max-w-[75%]">
        <div
          className={
            "px-4 py-3 rounded-2xl text-sm " +
            (isUser
              ? "bg-indigo-600 text-white rounded-br-sm"
              : "bg-white/5 text-slate-200 rounded-bl-sm border border-white/10")
          }
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MessageContent content={message.content} />
          )}
        </div>
        <div
          className={
            "text-[10px] text-slate-500 mt-1 px-1 flex items-center gap-2 " +
            (isUser ? "justify-end" : "justify-start")
          }
        >
          <span>{formatTime(message.timestamp)}</span>
          {message.category && (
            <span className="px-1.5 py-0.5 rounded bg-indigo-900/40 text-indigo-300 border border-indigo-700/30">
              {message.category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 animate-fade-in">
      <AbyssAvatar />
      <div className="bg-white/5 rounded-2xl rounded-bl-sm px-4 py-3 border border-white/10 flex items-center gap-1.5">
        {[0, 150, 300].map((delay, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
            style={{ animationDelay: delay + "ms" }}
          />
        ))}
      </div>
    </div>
  );
}

function ChatArea({ conversation, isTyping, isStreaming }) {
  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages, isTyping, isStreaming]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
          <Sparkles size={32} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome to Abyss AI
          </h2>
          <p className="text-slate-400 text-sm max-w-sm">
            An intelligence born from the deep. Ask me anything — from code and
            math to philosophy.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full max-w-md">
          {[
            { icon: Zap, label: "Explain quantum computing" },
            { icon: MessageSquare, label: "Write a Python script" },
            { icon: Sparkles, label: "Analyze a concept" },
            { icon: Moon, label: "Help me brainstorm" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className="bg-white/5 hover:bg-white/10 rounded-xl px-4 py-3 text-left text-sm text-slate-300 hover:text-white transition-all border border-white/5"
              >
                <Icon size={14} className="mb-2 text-indigo-400" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
      {conversation.messages.map((msg, idx) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isLatest={idx === conversation.messages.length - 1}
        />
      ))}
      {isTyping && !isStreaming && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}

function InputBar({ onSend, onStop, disabled, isStreaming, disabledStop }) {
  const [value, setValue] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  function handleSend() {
    const text = value.trim();
    if ((!text && !attachedFile) || disabled) return;
    onSend(text, attachedFile);
    setValue("");
    setAttachedFile(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput(e) {
    setValue(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Max 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const isPdf = file.name.toLowerCase().endsWith(".pdf");
      setAttachedFile({
        name: file.name,
        type: isPdf ? "pdf" : "text",
        content: ev.target.result,
        size: file.size,
      });
    };
    if (file.name.toLowerCase().endsWith(".pdf")) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  }

  const canSend = (value.trim() || attachedFile) && !disabled;

  return (
    <div className="px-6 pb-6 pt-2">
      {attachedFile && (
        <div className="mb-2 flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 text-xs border border-white/10">
          <Paperclip size={12} className="text-slate-400" />
          <span className="text-slate-300 flex-1 truncate">
            {attachedFile.name}
          </span>
          <span className="text-slate-500">
            {(attachedFile.size / 1024).toFixed(1)}KB
          </span>
          <button
            onClick={() => setAttachedFile(null)}
            className="text-slate-400 hover:text-red-400 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}
      <div
        className={
          "bg-white/5 rounded-2xl flex items-end gap-2 px-4 py-3 border transition-all " +
          (canSend ? "border-indigo-500/30" : "border-white/10")
        }
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.py,.js,.jsx,.ts,.tsx,.json,.md,.html,.css"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
        >
          <Paperclip size={15} />
        </button>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={
            attachedFile ? "Ask about this file..." : "Message Abyss..."
          }
          rows={1}
          className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 resize-none outline-none max-h-40 leading-6"
        />
        {isStreaming ? (
          <button
            onClick={onStop}
            className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center justify-center transition-all"
            title="Stop generation"
          >
            <X size={15} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all " +
              (canSend
                ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                : "bg-white/5 text-slate-600")
            }
          >
            <Send size={15} />
          </button>
        )}
      </div>
      <p className="text-center text-[10px] text-slate-600 mt-2">
        Abyss can make mistakes. Use your judgment.
      </p>
    </div>
  );
}

function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onClearAll,
  isOpen,
  onClose,
}) {
  const [search, setSearch] = useState("");
  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={
          "fixed top-0 left-0 h-full z-30 w-72 flex flex-col bg-[#0a0d18] border-r border-white/5 transition-transform lg:relative lg:translate-x-0 " +
          (isOpen ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="px-4 pt-5 pb-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Sparkles size={13} className="text-white" />
            </div>
            <span className="font-bold text-white">Abyss</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 lg:hidden"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-4 py-3">
          <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
            <Search size={13} className="text-slate-500" />
            <input
              type="text"
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none"
            />
          </div>
        </div>

        <div className="px-4 mb-3 space-y-2">
          <button
            onClick={onNew}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 text-sm font-medium transition-all"
          >
            <Plus size={14} />
            New conversation
          </button>
          {conversations.length > 0 && (
            <button
              onClick={onClearAll}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all"
            >
              <Trash2 size={12} />
              Clear all chats
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-slate-600 py-8">
              No conversations
            </p>
          ) : (
            filtered.map((conv) => (
              <div
                key={conv.id}
                className={
                  "group rounded-xl px-3 py-2.5 cursor-pointer transition-all " +
                  (conv.id === activeId
                    ? "bg-indigo-500/15 border border-indigo-500/30"
                    : "hover:bg-white/5 border border-transparent")
                }
                onClick={() => {
                  onSelect(conv.id);
                  onClose();
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p
                      className={
                        "text-sm font-medium truncate " +
                        (conv.id === activeId ? "text-white" : "text-slate-300")
                      }
                    >
                      {conv.title}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {conv.preview}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-[10px] text-slate-600">
                      {formatRelative(conv.timestamp)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(conv.id);
                      }}
                      className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/5">
            <UserAvatar size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-300 truncate">You</p>
              <p className="text-[10px] text-slate-600">Local user</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function Header({ conversation, onMenuToggle, onNewChat }) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 lg:hidden"
        >
          <Menu size={16} />
        </button>
        <div className="flex items-center gap-2.5">
          <AbyssAvatar size="sm" />
          <div>
            <h1 className="font-bold text-white text-sm">Abyss AI</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-slate-500">Online</span>
            </div>
          </div>
        </div>
        {conversation && (
          <>
            <ChevronRight
              size={13}
              className="text-slate-700 hidden sm:block"
            />
            <span className="text-sm text-slate-400 truncate max-w-[200px] hidden sm:block">
              {conversation.title}
            </span>
          </>
        )}
      </div>
      <button
        onClick={onNewChat}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-all"
      >
        <Plus size={13} />
        <span className="hidden sm:inline">New chat</span>
      </button>
    </header>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "abyss_conversations";
const ACTIVE_KEY = "abyss_active_id";

export default function App() {
  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeId, setActiveId] = useState(() => {
    try {
      return localStorage.getItem(ACTIVE_KEY);
    } catch {
      return null;
    }
  });
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (e) {
      console.error("Save failed", e);
    }
  }, [conversations]);

  useEffect(() => {
    try {
      if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
    } catch (e) {
      console.error("Save failed", e);
    }
  }, [activeId]);

  const activeConversation =
    conversations.find((c) => c.id === activeId) || null;

  function handleNewChat() {
    const id = generateId();
    const newConv = {
      id,
      title: "New conversation",
      preview: "Start a new conversation...",
      timestamp: new Date().toISOString(),
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(id);
    setSidebarOpen(false);
  }

  function handleDelete(id) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setActiveId(remaining[0]?.id || null);
    }
  }

  function handleClearAll() {
    if (confirm("Delete all conversations? This cannot be undone.")) {
      setConversations([]);
      setActiveId(null);
    }
  }

  function handleStop() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsStreaming(false);
    setIsTyping(false);
  }

  async function handleSend(text, attachedFile) {
    if (!activeId) {
      handleNewChat();
      return;
    }

    // ── File upload path ──────────────────────────────────────────────────
    if (attachedFile) {
      const userMsg = {
        id: generateId(),
        role: "user",
        content: text || `📎 ${attachedFile.name}`,
        timestamp: new Date().toISOString(),
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                title:
                  c.messages.length === 0 ? `📎 ${attachedFile.name}` : c.title,
                preview: `Analyzed ${attachedFile.name}`,
                timestamp: new Date().toISOString(),
                messages: [...c.messages, userMsg],
              }
            : c,
        ),
      );
      setIsTyping(true);

      try {
        let content = attachedFile.content;
        if (attachedFile.type === "pdf" && content.includes(",")) {
          content = content.split(",")[1];
        }
        const response = await fetch("http://localhost:5000/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            filename: attachedFile.name,
            type: attachedFile.type,
            question: text || "Analyze this file and provide a summary",
          }),
        });
        const data = await response.json();
        const abyssMsg = {
          id: generateId(),
          role: "abyss",
          content: data.reply,
          category: "analysis",
          timestamp: new Date().toISOString(),
        };
        setIsTyping(false);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? {
                  ...c,
                  messages: [...c.messages, abyssMsg],
                }
              : c,
          ),
        );
      } catch (error) {
        setIsTyping(false);
        const errorMsg = {
          id: generateId(),
          role: "abyss",
          content: `Error uploading file: ${error.message}`,
          timestamp: new Date().toISOString(),
        };
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? {
                  ...c,
                  messages: [...c.messages, errorMsg],
                }
              : c,
          ),
        );
      }
      return;
    }

    // ── Regular text message ──────────────────────────────────────────────
    const userMsg = {
      id: generateId(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    const placeholderMsg = {
      id: generateId(),
      role: "abyss",
      content: "",
      category: "thinking",
      timestamp: new Date().toISOString(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              title:
                c.messages.length === 0
                  ? text.slice(0, 40) + (text.length > 40 ? "..." : "")
                  : c.title,
              preview: text.slice(0, 60),
              timestamp: new Date().toISOString(),
              messages: [...c.messages, userMsg, placeholderMsg],
            }
          : c,
      ),
    );

    setIsTyping(true);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: [] }),
        signal: controller.signal,
      });

      const data = await response.json();
      setIsTyping(false);

      // Simulate streaming by chunking the response
      const fullText = data.reply;
      const category = data.category;
      let currentText = "";
      const chunkSize = 3;

      for (let i = 0; i < fullText.length; i += chunkSize) {
        if (controller.signal.aborted) break;
        currentText = fullText.slice(0, i + chunkSize);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === placeholderMsg.id
                      ? {
                          ...m,
                          content: currentText,
                          category: i === 0 ? category : m.category,
                        }
                      : m,
                  ),
                }
              : c,
          ),
        );
        await new Promise((r) => setTimeout(r, 15));
      }

      setIsStreaming(false);
    } catch (error) {
      if (error.name === "AbortError") {
        // User stopped — keep partial content
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === placeholderMsg.id
                      ? {
                          ...m,
                          content: `Error: ${error.message}`,
                          category: "error",
                        }
                      : m,
                  ),
                }
              : c,
          ),
        );
      }
      setIsTyping(false);
      setIsStreaming(false);
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[#080b14] text-slate-200">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={handleNewChat}
        onDelete={handleDelete}
        onClearAll={handleClearAll}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <Header
          conversation={activeConversation}
          onMenuToggle={() => setSidebarOpen((p) => !p)}
          onNewChat={handleNewChat}
        />
        <ChatArea
          conversation={activeConversation}
          isTyping={isTyping}
          isStreaming={isStreaming}
        />
        <InputBar
          onSend={handleSend}
          onStop={handleStop}
          disabled={isTyping || isStreaming}
          isStreaming={isStreaming}
        />
      </main>
    </div>
  );
}

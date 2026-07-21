import { useState, useRef, useEffect } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import {
  ArrowUp,
  Square,
  Code2,
  Brain,
  FileText,
  Orbit,
  Paperclip,
  X,
  ChevronDown,
  Check,
  Globe,
  ExternalLink,
  Menu,
  RefreshCw,
  Pencil,
  Copy,
  Download,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

marked.setOptions({ breaks: true });

const getDomain = (url) => {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
};

export default function ChatArea({
  messages,
  onSend,
  isStreaming,
  onStop,
  attachedFile,
  setAttachedFile,
  fileInputRef,
  selectedModel,
  setSelectedModel,
  activeModelName,
  webSearchEnabled,
  setWebSearchEnabled,
  toggleSidebar,
  isDesktopCollapsed,
  onRegenerate,
  onEditMessage,
  onExport,
}) {
  const [input, setInput] = useState("");
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [panelSources, setPanelSources] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [editingMsgIndex, setEditingMsgIndex] = useState(null);
  const [editText, setEditText] = useState("");
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    msg: null,
    index: -1,
  });

  const scrollRef = useRef(null);
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);

  const models = [
    {
      id: "abyss-auto",
      name: "ABYSS AUTO",
      desc: "AI Router (Picks best model)",
    },
    {
      id: "qwen2.5-coder-32b-instruct",
      name: "QWEN 2.5 CODER 32B",
      desc: "Best for Coding",
    },
    {
      id: "llama-3.3-70b-versatile",
      name: "LLAMA 3.3 70B",
      desc: "Most capable general",
    },
    { id: "qwen-2.5-32b", name: "QWEN 2.5 32B", desc: "Strong multilingual" },
    { id: "llama3-70b-8192", name: "LLAMA 3 70B", desc: "Stable legacy model" },
    {
      id: "mixtral-8x7b-32768",
      name: "MIXTRAL 8x7B",
      desc: "32k context window",
    },
    {
      id: "llama-3.1-8b-instant",
      name: "LLAMA 3.1 8B",
      desc: "Ultra-fast responses",
    },
    { id: "gemma2-9b-it", name: "GEMMA 2 9B", desc: "Google lightweight" },
    { id: "llama3-8b-8192", name: "LLAMA 3 8B", desc: "Legacy fast model" },
    {
      id: "llama-3.2-3b-preview",
      name: "LLAMA 3.2 3B",
      desc: "Minimal footprint",
    },
    {
      id: "llama-3.2-1b-preview",
      name: "LLAMA 3.2 1B",
      desc: "Smallest/Edge model",
    },
  ];

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight > 300)
      setShowScrollButton(true);
    else setShowScrollButton(false);
  };

  const scrollToBottom = () => {
    if (scrollRef.current)
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
  };

  useEffect(() => {
    const closeMenu = () =>
      setContextMenu((prev) => ({ ...prev, visible: false }));
    if (contextMenu.visible) {
      window.addEventListener("click", closeMenu);
      window.addEventListener("scroll", closeMenu, true);
    }
    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [contextMenu.visible]);

  const handleContextMenu = (e, msg, index) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, msg, index });
  };

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const codeBlocks = container.querySelectorAll("pre code");
    codeBlocks.forEach((block) => {
      if (!block.dataset.highlighted) {
        hljs.highlightElement(block);
        block.dataset.highlighted = "yes";
      }
      const pre = block.parentElement;
      if (!pre.querySelector(".code-header")) {
        const langClass = block.className.match(/language-(\w+)/);
        const lang = langClass ? langClass[1] : "code";
        const header = document.createElement("div");
        header.className = "code-header";
        const langLabel = document.createElement("span");
        langLabel.textContent = lang.toUpperCase();
        const copyBtn = document.createElement("button");
        copyBtn.className = "copy-btn";
        copyBtn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg> COPY';
        copyBtn.onclick = () => {
          navigator.clipboard.writeText(block.innerText);
          copyBtn.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> COPIED';
          setTimeout(() => {
            copyBtn.innerHTML =
              '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg> COPY';
          }, 2000);
        };
        header.appendChild(langLabel);
        header.appendChild(copyBtn);
        pre.insertBefore(header, block);
      }
    });
  }, [messages, isStreaming]);

  const handleSubmit = () => {
    if ((!input.trim() && !attachedFile) || isStreaming) return;
    onSend(input || "Analyze this file.");
    setInput("");
    setEditingMsgIndex(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestion = (text) => {
    if (isStreaming) return;
    onSend(text);
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setAttachedFile(file);
  };
  const removeFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const startEditing = (index, content) => {
    setEditingMsgIndex(index);
    setEditText(content);
  };
  const saveEdit = () => {
    if (!editText.trim()) return;
    onEditMessage(editingMsgIndex, editText);
    setEditingMsgIndex(null);
    setEditText("");
  };

  const displayedModel =
    models.find((m) => m.id === activeModelName) ||
    models.find((m) => m.id === selectedModel) ||
    models[0];

  const renderUserContent = (content) => {
    const fileMatch = content.match(/📎 (.*?)\n([\s\S]*)/);
    if (fileMatch) {
      return (
        <p className="text-gray-200 text-sm whitespace-pre-wrap text-left">
          {fileMatch[2]}
        </p>
      );
    }
    return (
      <p className="text-gray-200 text-sm whitespace-pre-wrap text-left">
        {content}
      </p>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative">
      {/* Header */}
      <div className="py-3 px-4 md:px-6 border-b border-purple-900/30 flex items-center justify-between glass relative z-20">
        <div className="flex items-center gap-3">
          {/* Dynamic Sidebar Toggle */}
          <button
            onClick={toggleSidebar}
            className="p-2 text-gray-400 hover:text-white transition-colors hidden md:block"
            title={isDesktopCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isDesktopCollapsed ? (
              <PanelLeftOpen size={20} />
            ) : (
              <PanelLeftClose size={20} />
            )}
          </button>
          <button
            onClick={toggleSidebar}
            className="p-2 text-gray-400 hover:text-white transition-colors md:hidden"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-cosmic tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
            ABYSS AI
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {messages.length > 0 && (
            <button
              onClick={onExport}
              className="p-2 text-gray-400 hover:text-purple-400 transition-colors rounded-full hover:bg-purple-900/20"
              title="Export as Markdown"
            >
              <Download size={18} />
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
              className="flex items-center gap-2 text-xs text-gray-300 glass px-3 py-1.5 rounded-full hover:border-purple-500 transition-colors font-cosmic tracking-wider"
            >
              {selectedModel === "abyss-auto" &&
                activeModelName !== "abyss-auto" && (
                  <Zap
                    size={12}
                    className="text-amber-400 animate-pulse"
                    fill="currentColor"
                  />
                )}
              <span className="hidden sm:inline">{displayedModel.name}</span>
              <span className="sm:hidden">MODEL</span>
              <ChevronDown
                size={14}
                className={`text-purple-400 transition-transform ${isModelMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isModelMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsModelMenuOpen(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-72 glass rounded-xl p-2 z-20 shadow-2xl border-purple-900/50 origin-top-right animate-[fadeIn_0.1s_ease-out] max-h-[400px] overflow-y-auto">
                  {models.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedModel(m.id);
                        setIsModelMenuOpen(false);
                      }}
                      className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-purple-900/40 transition-colors text-left"
                    >
                      <div className="flex-1">
                        <p className="text-xs font-cosmic text-gray-200 tracking-wider flex items-center gap-1">
                          {m.id === "abyss-auto" && (
                            <Zap size={10} className="text-amber-400" />
                          )}
                          {m.name}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {m.desc}
                        </p>
                      </div>
                      {selectedModel === m.id && (
                        <Check
                          size={14}
                          className="text-purple-400 mt-1 shrink-0"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages or Empty State */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto relative"
      >
        <div ref={chatContainerRef} className="h-full">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 relative">
              <div className="absolute w-96 h-96 rounded-full border border-purple-500/20 animate-pulse"></div>
              <div className="absolute w-64 h-64 rounded-full border border-indigo-500/20 animate-ping [animation-duration:4s]"></div>

              <div className="relative z-10 mb-8">
                <Orbit size={64} className="text-purple-500 mx-auto" />
              </div>

              <h2 className="text-4xl font-cosmic font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 mb-3 tracking-wider">
                ENTER THE ABYSS
              </h2>
              <p className="text-gray-400 mb-10 max-w-md font-light">
                Initializing deep space comms. What knowledge do you seek from
                the void?
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full">
                <div
                  className="glass rounded-xl p-4 text-left hover:border-purple-500 transition-all cursor-pointer group"
                  onClick={() =>
                    handleSuggestion(
                      "Write a Python script to reverse a linked list.",
                    )
                  }
                >
                  <Code2
                    className="text-emerald-400 mb-2 group-hover:scale-110 transition-transform"
                    size={24}
                  />
                  <h3 className="text-sm font-medium text-gray-200 font-cosmic">
                    DATA STRUCTURES
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Reverse a linked list in Python
                  </p>
                </div>
                <div
                  className="glass rounded-xl p-4 text-left hover:border-purple-500 transition-all cursor-pointer group"
                  onClick={() =>
                    handleSuggestion(
                      "Explain the math behind RSA encryption and why it works.",
                    )
                  }
                >
                  <Brain
                    className="text-amber-400 mb-2 group-hover:scale-110 transition-transform"
                    size={24}
                  />
                  <h3 className="text-sm font-medium text-gray-200 font-cosmic">
                    DEEP REASONING
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    The mathematics of RSA encryption
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-6 px-4 md:px-6 space-y-6">
              {messages.map((msg, i) => {
                const visibleContent = msg.content
                  .split("[SOURCES_JSON]")[0]
                  .replace("[MODEL_ROUTED]", "")
                  .replace("[/MODEL_ROUTED]", "");
                const isLastMessage = i === messages.length - 1;
                const isThinking =
                  isStreaming &&
                  isLastMessage &&
                  msg.role === "assistant" &&
                  visibleContent.trim() === "";

                return (
                  <div
                    key={i}
                    className={`${msg.role === "user" ? "text-right" : "text-left"}`}
                  >
                    <div
                      onContextMenu={(e) => handleContextMenu(e, msg, i)}
                      className={`group relative inline-block max-w-full ${msg.role === "user" ? "bg-purple-900/30 border border-purple-700/30 rounded-2xl rounded-tr-sm py-2 px-4" : "w-full glass rounded-2xl rounded-tl-sm py-3 px-4"}`}
                    >
                      {msg.role === "user" ? (
                        editingMsgIndex === i ? (
                          <div className="flex flex-col gap-2 min-w-[200px] text-left">
                            <textarea
                              className="bg-black/40 border border-purple-700/50 rounded p-2 text-sm text-gray-200 focus:outline-none focus:border-purple-500 w-full"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows={3}
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingMsgIndex(null)}
                                className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={saveEdit}
                                className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded flex items-center gap-1"
                              >
                                <Check size={12} /> Send
                              </button>
                            </div>
                          </div>
                        ) : (
                          renderUserContent(msg.content)
                        )
                      ) : (
                        <>
                          {isThinking ? (
                            <div className="flex items-center gap-1.5 h-6">
                              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                              <span className="text-xs text-purple-400/70 ml-2 font-cosmic tracking-widest">
                                TRANSMITTING...
                              </span>
                            </div>
                          ) : (
                            <div
                              className="prose text-gray-300 text-sm text-left"
                              dangerouslySetInnerHTML={{
                                __html: marked.parse(visibleContent || "..."),
                              }}
                            />
                          )}

                          {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-purple-900/30">
                              <div className="flex items-center gap-2 flex-wrap">
                                {msg.sources.slice(0, 4).map((src, i) => (
                                  <a
                                    key={i}
                                    href={src.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-8 h-8 rounded-full bg-black/50 border border-purple-900/30 flex items-center justify-center hover:border-purple-500 hover:scale-110 transition-all relative group"
                                    title={getDomain(src.url)}
                                  >
                                    <img
                                      src={`https://www.google.com/s2/favicons?domain=${getDomain(src.url)}&sz=32`}
                                      className="w-4 h-4"
                                      alt=""
                                    />
                                  </a>
                                ))}
                                {msg.sources.length > 4 && (
                                  <button
                                    onClick={() => setPanelSources(msg.sources)}
                                    className="h-8 px-3 rounded-full bg-black/50 border border-purple-900/30 flex items-center justify-center text-[10px] text-purple-400 hover:border-purple-500 hover:scale-105 transition-all font-cosmic tracking-wider"
                                  >
                                    +{msg.sources.length - 4}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {msg.role === "assistant" &&
                      isLastMessage &&
                      !isStreaming &&
                      visibleContent.trim() !== "" && (
                        <div className="flex justify-start mt-2">
                          <button
                            onClick={() => onRegenerate()}
                            className="flex items-center gap-2 text-xs text-gray-400 hover:text-purple-400 transition-colors font-cosmic tracking-wider"
                          >
                            <RefreshCw size={12} /> Regenerate Response
                          </button>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 p-2 glass rounded-full border border-purple-900/50 text-purple-400 hover:text-white transition-all z-10 animate-[fadeIn_0.2s_ease-out] shadow-xl"
          title="Scroll to bottom"
        >
          <ChevronDown size={20} />
        </button>
      )}

      <div className="p-3 md:p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
        <div className="max-w-3xl mx-auto">
          {attachedFile && (
            <div className="flex items-center gap-2 mb-2 glass rounded-xl px-3 py-2 w-fit">
              <Paperclip size={14} className="text-purple-400" />
              <span className="text-xs text-gray-300 truncate max-w-[200px]">
                {attachedFile.name}
              </span>
              <button
                type="button"
                onClick={removeFile}
                className="text-gray-500 hover:text-red-400"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2 glass rounded-2xl p-2 focus-within:border-purple-500 focus-within:glow-accent transition-all">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.txt,.js,.py,.jsx,.ts,.tsx,.java,.cpp,.c,.cs,.html,.css,.json"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-purple-400 transition-colors rounded-xl hover:bg-purple-900/20 mb-[2px]"
              title="Attach File"
            >
              <Paperclip size={18} />
            </button>
            <button
              type="button"
              onClick={() => setWebSearchEnabled(!webSearchEnabled)}
              className={`p-2 transition-colors rounded-xl mb-[2px] ${webSearchEnabled ? "text-purple-400 bg-purple-900/30 glow-accent" : "text-gray-500 hover:text-purple-400 hover:bg-purple-900/20"}`}
              title="Search the Web"
            >
              <Globe size={18} />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                attachedFile
                  ? "Ask about this file..."
                  : "Transmit message to Abyss..."
              }
              rows={1}
              className="flex-1 bg-transparent px-2 py-2 text-sm focus:outline-none text-gray-200 placeholder-gray-600 font-light resize-none max-h-[200px] overflow-y-auto"
            />
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="p-2 bg-red-900/40 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-900/60 transition-colors mb-[2px]"
              >
                <Square size={18} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!input.trim() && !attachedFile}
                className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors disabled:opacity-20 disabled:cursor-not-allowed glow-accent mb-[2px]"
              >
                <ArrowUp size={18} />
              </button>
            )}
          </div>
          <p className="text-center text-[10px] md:text-xs text-gray-700 mt-2 font-cosmic tracking-wider">
            {webSearchEnabled
              ? "GALAXY MODE ACTIVATED - FETCHING REAL-TIME DATA"
              : "ENTER TO SEND, SHIFT+ENTER FOR NEW LINE"}
          </p>
        </div>
      </div>

      {contextMenu.visible && (
        <div
          className="fixed z-50 w-44 glass rounded-lg p-1.5 shadow-2xl border border-purple-900/50 animate-[fadeIn_0.1s_ease-out]"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.msg?.role === "user" && (
            <button
              onClick={() => {
                startEditing(contextMenu.index, contextMenu.msg.content);
                setContextMenu((prev) => ({ ...prev, visible: false }));
              }}
              className="w-full flex items-center gap-2 text-left text-xs text-gray-300 hover:bg-purple-900/40 rounded-md px-2 py-1.5 transition-colors font-cosmic tracking-wider"
            >
              <Pencil size={12} /> EDIT MESSAGE
            </button>
          )}
          <button
            onClick={() => {
              onRegenerate(contextMenu.index);
              setContextMenu((prev) => ({ ...prev, visible: false }));
            }}
            disabled={isStreaming}
            className="w-full flex items-center gap-2 text-left text-xs text-gray-300 hover:bg-purple-900/40 rounded-md px-2 py-1.5 transition-colors font-cosmic tracking-wider disabled:opacity-30"
          >
            <RefreshCw size={12} /> REGENERATE
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                contextMenu.msg.content.split("[SOURCES_JSON]")[0],
              );
              setContextMenu((prev) => ({ ...prev, visible: false }));
            }}
            className="w-full flex items-center gap-2 text-left text-xs text-gray-300 hover:bg-purple-900/40 rounded-md px-2 py-1.5 transition-colors font-cosmic tracking-wider"
          >
            <Copy size={12} /> COPY TEXT
          </button>
        </div>
      )}

      {panelSources && (
        <div
          className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-sm animate-[fadeIn_0.1s_ease-out]"
          onClick={() => setPanelSources(null)}
        >
          <div
            className="w-full max-w-md h-full glass border-l border-purple-900/50 p-6 overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-cosmic text-purple-300 tracking-widest text-lg">
                ALL SOURCES
              </h3>
              <button
                onClick={() => setPanelSources(null)}
                className="text-gray-400 hover:text-white p-2 hover:bg-purple-900/30 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              {panelSources.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-xl bg-black/40 hover:bg-purple-900/20 border border-purple-900/40 transition-colors group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${getDomain(src.url)}&sz=32`}
                      className="w-5 h-5 rounded-full"
                      alt=""
                    />
                    <span className="text-sm text-gray-200 font-medium truncate group-hover:text-purple-300 flex-1">
                      {src.title}
                    </span>
                    <ExternalLink
                      size={14}
                      className="text-gray-600 group-hover:text-purple-400 shrink-0"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-3">
                    {src.snippet}
                  </p>
                  <span className="text-[11px] text-purple-400/60 truncate block font-mono">
                    {src.url}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

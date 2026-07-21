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
} from "lucide-react";

marked.setOptions({ breaks: true });

export default function ChatArea({
  messages,
  onSend,
  isStreaming,
  onStop,
  category,
  attachedFile,
  setAttachedFile,
  fileInputRef,
  selectedModel,
  setSelectedModel,
}) {
  const [input, setInput] = useState("");
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const scrollRef = useRef(null);
  const chatContainerRef = useRef(null);

  const models = [
    {
      id: "llama-3.3-70b-versatile",
      name: "LLAMA 3.3 70B",
      desc: "Default - Most capable",
    },
    {
      id: "llama-3.1-8b-instant",
      name: "LLAMA 3.1 8B",
      desc: "Ultra-fast responses",
    },
    { id: "llama3-70b-8192", name: "LLAMA 3 70B", desc: "Stable legacy model" },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Syntax Highlighting & Copy Button Injection
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const codeBlocks = container.querySelectorAll("pre code");
    codeBlocks.forEach((block) => {
      // Highlight
      if (!block.dataset.highlighted) {
        hljs.highlightElement(block);
        block.dataset.highlighted = "yes";
      }

      const pre = block.parentElement;
      // Add header if not already added
      if (!pre.querySelector(".code-header")) {
        // Detect language
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((!input.trim() && !attachedFile) || isStreaming) return;
    onSend(input || "Analyze this file.");
    setInput("");
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

  const getCategoryIcon = () => {
    if (category === "coding")
      return <Code2 size={12} className="text-emerald-400" />;
    if (category === "reasoning")
      return <Brain size={12} className="text-amber-400" />;
    return <FileText size={12} className="text-blue-400" />;
  };

  const activeModel = models.find((m) => m.id === selectedModel) || models[0];

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="py-3 px-6 border-b border-purple-900/30 flex items-center justify-between glass relative z-20">
        <h1 className="text-lg font-cosmic tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
          ABYSS AI
        </h1>

        <div className="flex items-center gap-3">
          {/* Custom Model Selector */}
          <div className="relative">
            <button
              onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
              className="flex items-center gap-2 text-xs text-gray-300 glass px-3 py-1.5 rounded-full hover:border-purple-500 transition-colors font-cosmic tracking-wider"
            >
              <span>{activeModel.name}</span>
              <ChevronDown
                size={14}
                className={`text-purple-400 transition-transform ${isModelMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isModelMenuOpen && (
              <>
                {/* Invisible backdrop to close menu when clicking outside */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsModelMenuOpen(false)}
                ></div>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-64 glass rounded-xl p-2 z-20 shadow-2xl border-purple-900/50 origin-top-right animate-[fadeIn_0.1s_ease-out]">
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
                        <p className="text-xs font-cosmic text-gray-200 tracking-wider">
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

          {/* Category Badge */}
          <div className="flex items-center gap-2 text-xs text-gray-400 capitalize glass px-3 py-1.5 rounded-full">
            {getCategoryIcon()}{" "}
            <span className="font-cosmic tracking-wider">
              {category} module
            </span>
          </div>
        </div>
      </div>

      {/* Messages or Empty State */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div ref={chatContainerRef} className="h-full">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 relative">
              {/* Cosmic Ring Decoration */}
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
            <div className="max-w-3xl mx-auto py-6 px-6 space-y-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`${msg.role === "user" ? "text-right" : "text-left"}`}
                >
                  <div
                    className={`inline-block max-w-full ${msg.role === "user" ? "bg-purple-900/30 border border-purple-700/30 rounded-2xl rounded-tr-sm py-2 px-4" : "w-full glass rounded-2xl rounded-tl-sm py-3 px-4"}`}
                  >
                    {msg.role === "user" ? (
                      <p className="text-gray-200 text-sm whitespace-pre-wrap text-left">
                        {msg.content}
                      </p>
                    ) : (
                      <div
                        className="prose text-gray-300 text-sm text-left"
                        dangerouslySetInnerHTML={{
                          __html: marked.parse(msg.content || "..."),
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          {/* File Preview Chip */}
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

          <div className="flex items-center gap-2 glass rounded-2xl p-2 focus-within:border-purple-500 focus-within:glow-accent transition-all">
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
              className="p-2 text-gray-500 hover:text-purple-400 transition-colors rounded-xl hover:bg-purple-900/20"
              title="Attach File"
            >
              <Paperclip size={18} />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                attachedFile
                  ? "Ask about this file..."
                  : "Transmit message to Abyss..."
              }
              className="flex-1 bg-transparent px-2 py-2 text-sm focus:outline-none text-gray-200 placeholder-gray-600 font-light"
            />
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="p-2 bg-red-900/40 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-900/60 transition-colors"
              >
                <Square size={18} fill="currentColor" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() && !attachedFile}
                className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors disabled:opacity-20 disabled:cursor-not-allowed glow-accent"
              >
                <ArrowUp size={18} />
              </button>
            )}
          </div>
          <p className="text-center text-xs text-gray-700 mt-2 font-cosmic tracking-wider">
            ABYSS HAS CROSS-CHAT MEMORY AND CAN PROCESS FILES
          </p>
        </form>
      </div>
    </div>
  );
}

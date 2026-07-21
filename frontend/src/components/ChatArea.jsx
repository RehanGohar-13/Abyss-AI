import { useState, useRef, useEffect } from "react";
import { marked } from "marked";
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
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((!input.trim() && !attachedFile) || isStreaming) return;
    onSend(input || "Analyze this file.");
    setInput("");
  };

  // Allow clicking suggestions even while typing, but not while streaming
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

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="py-3 px-6 border-b border-purple-900/30 flex items-center justify-between glass">
        <h1 className="text-lg font-cosmic tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
          ABYSS AI
        </h1>

        <div className="flex items-center gap-3">
          {/* Model Selector */}
          <div className="relative flex items-center">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="appearance-none bg-black/40 border border-purple-900/30 rounded-full pl-3 pr-8 py-1 text-xs text-gray-300 focus:outline-none focus:border-purple-500 transition-colors cursor-pointer font-cosmic tracking-wider"
            >
              <option value="llama-3.3-70b-versatile">LLAMA 3.3 70B</option>
              <option value="llama-3.1-8b-instant">LLAMA 3.1 8B</option>
              <option value="gemma2-9b-it">GEMMA 2 9B</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none"
            />
          </div>

          {/* Category Badge */}
          <div className="flex items-center gap-2 text-xs text-gray-400 capitalize glass px-3 py-1 rounded-full">
            {getCategoryIcon()}{" "}
            <span className="font-cosmic tracking-wider">
              {category} module
            </span>
          </div>
        </div>
      </div>

      {/* Messages or Empty State */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
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
              Initializing deep space comms. What knowledge do you seek from the
              void?
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

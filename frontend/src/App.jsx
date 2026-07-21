import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import Starfield from "./components/Starfield";
import { streamChat } from "./utils/api";

function App() {
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem("abyss-conversations");
    return saved ? JSON.parse(saved) : [];
  });
  const [activeId, setActiveId] = useState(() => conversations[0]?.id || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeCategory, setActiveCategory] = useState("general");
  const abortControllerRef = useRef(null);

  // Ref to hold latest conversations so stream callback doesn't get stale state
  const conversationsRef = useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem("abyss-conversations", JSON.stringify(conversations));
  }, [conversations]);

  const activeConv = conversations.find((c) => c.id === activeId);

  const handleSend = useCallback(
    async (text) => {
      let currentId = activeId;
      let history = [];

      // Create new conversation if none active
      if (!currentId) {
        currentId = Date.now().toString();
        const newConv = {
          id: currentId,
          title: text.slice(0, 30),
          messages: [],
        };
        setConversations((prev) => [newConv, ...prev]);
        conversationsRef.current = [newConv, ...conversationsRef.current];
      } else {
        const currentConv = conversationsRef.current.find(
          (c) => c.id === currentId,
        );
        history = currentConv
          ? currentConv.messages
              .filter((m) => m.content !== "")
              .map((m) => ({ role: m.role, content: m.content }))
          : [];
      }

      setActiveId(currentId);

      const userMsg = { role: "user", content: text };
      const aiMsg = { role: "assistant", content: "" };

      // Update state with user message + empty AI message
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === currentId
            ? { ...c, messages: [...c.messages, userMsg, aiMsg] }
            : c,
        );
        conversationsRef.current = updated; // Keep ref in sync immediately
        return updated;
      });

      setIsStreaming(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        await streamChat(
          text,
          history,
          (chunk) => {
            // Use functional update to safely append the chunk
            setConversations((prev) => {
              const updated = prev.map((c) => {
                if (c.id !== currentId) return c;
                const msgs = [...c.messages];
                const lastMsgIdx = msgs.length - 1;
                if (msgs[lastMsgIdx].role === "assistant") {
                  // Append chunk directly to the existing string
                  msgs[lastMsgIdx] = {
                    ...msgs[lastMsgIdx],
                    content: msgs[lastMsgIdx].content + chunk,
                  };
                }
                return { ...c, messages: msgs };
              });
              conversationsRef.current = updated;
              return updated;
            });
          },
          controller.signal,
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Streaming error:", err);
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [activeId],
  );

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleNewChat = () => {
    setActiveId(null);
    setActiveCategory("general");
  };

  const handleDelete = (id) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  };

  return (
    <div className="flex h-screen overflow-hidden relative z-10">
      <Starfield />
      <div className="flex w-full h-full relative z-10">
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={(id) => {
            setActiveId(id);
            const c = conversations.find((c) => c.id === id);
            setActiveCategory(c?.category || "general");
          }}
          onNew={handleNewChat}
          onDelete={handleDelete}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        <main className="flex-1 h-full">
          <ChatArea
            messages={activeConv?.messages || []}
            onSend={handleSend}
            isStreaming={isStreaming}
            onStop={handleStop}
            category={activeCategory}
          />
        </main>
      </div>
    </div>
  );
}

export default App;

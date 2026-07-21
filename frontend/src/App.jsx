import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import Starfield from "./components/Starfield";
import { streamChat, uploadFile, generateTitle } from "./utils/api";

function App() {
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem("abyss-conversations");
    return saved ? JSON.parse(saved) : [];
  });
  const [activeId, setActiveId] = useState(() => conversations[0]?.id || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeCategory, setActiveCategory] = useState("general");
  const [attachedFile, setAttachedFile] = useState(null);
  const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile");
  const abortControllerRef = useRef(null);
  const fileInputRef = useRef(null);

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
      let isNewChat = false;

      // Create new conversation if none active
      if (!currentId) {
        isNewChat = true;
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

      // Include file name in user message if attached
      const displayText = attachedFile
        ? `📎 ${attachedFile.name}\n${text}`
        : text;
      const userMsg = { role: "user", content: displayText };
      const aiMsg = { role: "assistant", content: "" };

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
      const currentFile = attachedFile;
      setAttachedFile(null); // Clear file from UI immediately

      // Build Global Context (Cross-chat memory)
      const globalContext = conversationsRef.current
        .filter((c) => c.id !== currentId)
        .slice(0, 5) // Limit to 5 most recent chats to save tokens
        .map((c) => ({
          title: c.title,
          last_msg:
            c.messages.filter((m) => m.role === "user").pop()?.content || "",
        }));

      try {
        if (currentFile) {
          // Non-streaming file upload route
          await uploadFile(
            currentFile,
            text,
            (chunk) => {
              setConversations((prev) => {
                const updated = prev.map((c) => {
                  if (c.id !== currentId) return c;
                  const msgs = [...c.messages];
                  msgs[msgs.length - 1] = {
                    ...msgs[msgs.length - 1],
                    content: msgs[msgs.length - 1].content + chunk,
                  };
                  return { ...c, messages: msgs };
                });
                conversationsRef.current = updated;
                return updated;
              });
            },
            controller.signal,
          );
        } else {
          // Standard streaming chat
          await streamChat(
            text,
            history,
            (chunk) => {
              setConversations((prev) => {
                const updated = prev.map((c) => {
                  if (c.id !== currentId) return c;
                  const msgs = [...c.messages];
                  msgs[msgs.length - 1] = {
                    ...msgs[msgs.length - 1],
                    content: msgs[msgs.length - 1].content + chunk,
                  };
                  return { ...c, messages: msgs };
                });
                conversationsRef.current = updated;
                return updated;
              });
            },
            controller.signal,
            selectedModel,
            globalContext,
          );
        }

        // Generate AI Title if it's a new chat
        if (isNewChat) {
          const newTitle = await generateTitle(text);
          setConversations((prev) =>
            prev.map((c) =>
              c.id === currentId ? { ...c, title: newTitle } : c,
            ),
          );
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Streaming error:", err);
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [activeId, attachedFile, selectedModel],
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
            attachedFile={attachedFile}
            setAttachedFile={setAttachedFile}
            fileInputRef={fileInputRef}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />
        </main>
      </div>
    </div>
  );
}

export default App;

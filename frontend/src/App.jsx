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
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const abortControllerRef = useRef(null);
  const fileInputRef = useRef(null);

  const conversationsRef = useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem("abyss-conversations", JSON.stringify(conversations));
  }, [conversations]);

  const activeConv = conversations.find((c) => c.id === activeId);

  const runStream = useCallback(
    async (currentId, userMsgText, history) => {
      setIsStreaming(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const globalContext = conversationsRef.current
        .filter((c) => c.id !== currentId)
        .slice(0, 5)
        .map((c) => ({
          title: c.title,
          last_msg:
            c.messages.filter((m) => m.role === "user").pop()?.content || "",
        }));

      try {
        await streamChat(
          userMsgText,
          history,
          (chunk) => {
            setConversations((prev) => {
              const updated = prev.map((c) => {
                if (c.id !== currentId) return c;
                const msgs = [...c.messages];
                let content = msgs[msgs.length - 1].content + chunk;
                let sources = msgs[msgs.length - 1].sources;

                if (content.includes("[SOURCES_JSON]")) {
                  const match = content.match(
                    /\[SOURCES_JSON\](.*?)\[\/SOURCES_JSON\]/s,
                  );
                  if (match) {
                    try {
                      sources = JSON.parse(match[1]);
                      content = content.replace(match[0], "").trim();
                    } catch (e) {}
                  }
                }

                msgs[msgs.length - 1] = {
                  ...msgs[msgs.length - 1],
                  content,
                  sources,
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
          webSearchEnabled,
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
    [selectedModel, webSearchEnabled],
  );

  const handleSend = useCallback(
    async (text) => {
      let currentId = activeId;
      let history = [];
      let isNewChat = false;

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

      const displayText = attachedFile
        ? `📎 ${attachedFile.name}\n${text}`
        : text;
      const userMsg = { role: "user", content: displayText };
      const aiMsg = { role: "assistant", content: "", sources: null };

      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === currentId
            ? { ...c, messages: [...c.messages, userMsg, aiMsg] }
            : c,
        );
        conversationsRef.current = updated;
        return updated;
      });

      const currentFile = attachedFile;
      setAttachedFile(null);

      try {
        if (currentFile) {
          setIsStreaming(true);
          const controller = new AbortController();
          abortControllerRef.current = controller;
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
          setIsStreaming(false);
        } else {
          await runStream(currentId, text, history);
        }

        if (isNewChat) {
          const newTitle = await generateTitle(text);
          setConversations((prev) =>
            prev.map((c) =>
              c.id === currentId ? { ...c, title: newTitle } : c,
            ),
          );
        }
      } catch (err) {
        if (err.name !== "AbortError")
          console.error("Upload/Stream error:", err);
      }
    },
    [activeId, attachedFile, runStream],
  );

  const handleRegenerate = useCallback(
    async (msgIndex = null) => {
      if (!activeId || isStreaming) return;

      const currentConv = conversationsRef.current.find(
        (c) => c.id === activeId,
      );
      if (!currentConv) return;

      let userMsgIndex = -1;

      if (msgIndex !== null) {
        // Triggered from context menu
        const targetMsg = currentConv.messages[msgIndex];
        if (targetMsg.role === "user") {
          userMsgIndex = msgIndex;
        } else {
          // If right-clicked on AI message, find the user message right before it
          for (let i = msgIndex; i >= 0; i--) {
            if (currentConv.messages[i].role === "user") {
              userMsgIndex = i;
              break;
            }
          }
        }
      } else {
        // Triggered from bottom button (default behavior)
        userMsgIndex = currentConv.messages
          .map((m) => m.role)
          .lastIndexOf("user");
      }

      if (userMsgIndex === -1) return;

      const lastUserMsg = currentConv.messages[userMsgIndex];
      const apiUserMsg = lastUserMsg.content.replace(/^📎 .*?\n/, "");

      const truncatedMessages = currentConv.messages.slice(0, userMsgIndex + 1);
      const aiMsg = { role: "assistant", content: "", sources: null };
      const updatedMessages = [...truncatedMessages, aiMsg];

      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === activeId ? { ...c, messages: updatedMessages } : c,
        );
        conversationsRef.current = updated;
        return updated;
      });

      const history = truncatedMessages
        .slice(0, -1)
        .filter((m) => m.content !== "")
        .map((m) => ({ role: m.role, content: m.content }));
      await runStream(activeId, apiUserMsg, history);
    },
    [activeId, isStreaming, runStream],
  );

  const handleEditMessage = useCallback(
    async (msgIndex, newText) => {
      if (!activeId || isStreaming) return;

      const currentConv = conversationsRef.current.find(
        (c) => c.id === activeId,
      );
      if (!currentConv) return;

      const updatedMsgsBefore = currentConv.messages.slice(0, msgIndex);
      const editedUserMsg = { role: "user", content: newText };
      const aiMsg = { role: "assistant", content: "", sources: null };
      const updatedMessages = [...updatedMsgsBefore, editedUserMsg, aiMsg];

      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === activeId ? { ...c, messages: updatedMessages } : c,
        );
        conversationsRef.current = updated;
        return updated;
      });

      const history = updatedMsgsBefore
        .filter((m) => m.content !== "")
        .map((m) => ({ role: m.role, content: m.content }));
      await runStream(activeId, newText, history);
    },
    [activeId, isStreaming, runStream],
  );

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleNewChat = () => {
    setActiveId(null);
    setActiveCategory("general");
    setIsSidebarOpen(false);
  };

  const handleSelectChat = (id) => {
    setActiveId(id);
    const c = conversations.find((c) => c.id === id);
    setActiveCategory(c?.category || "general");
    setIsSidebarOpen(false);
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
          onSelect={handleSelectChat}
          onNew={handleNewChat}
          onDelete={handleDelete}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
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
            webSearchEnabled={webSearchEnabled}
            setWebSearchEnabled={setWebSearchEnabled}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onRegenerate={handleRegenerate}
            onEditMessage={handleEditMessage}
          />
        </main>
      </div>
    </div>
  );
}

export default App;

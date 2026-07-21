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
  const [attachedFile, setAttachedFile] = useState(null);
  const [selectedModel, setSelectedModel] = useState("abyss-auto");
  const [activeModelName, setActiveModelName] = useState("abyss-auto");
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile drawer
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false); // Desktop collapse
  const abortControllerRef = useRef(null);
  const fileInputRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  const conversationsRef = useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(
        "abyss-conversations",
        JSON.stringify(conversations),
      );
    }, 500);
  }, [conversations]);

  useEffect(() => {
    setActiveModelName(selectedModel);
  }, [selectedModel]);

  const activeConv = conversations.find((c) => c.id === activeId);

  const cleanupAbortedMessage = (currentId) => {
    setConversations((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== currentId) return c;
        const msgs = [...c.messages];
        const lastMsg = msgs[msgs.length - 1];
        if (
          lastMsg &&
          lastMsg.role === "assistant" &&
          lastMsg.content.trim() === ""
        ) {
          msgs.pop();
        }
        return { ...c, messages: msgs };
      });
      conversationsRef.current = updated;
      return updated;
    });
  };

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
          last_msg: (
            c.messages.filter((m) => m.role === "user").pop()?.content || ""
          ).slice(0, 150),
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

                if (content.includes("[MODEL_ROUTED]")) {
                  const modelMatch = content.match(
                    /\[MODEL_ROUTED\](.*?)\[\/MODEL_ROUTED\]/,
                  );
                  if (modelMatch) {
                    setActiveModelName(modelMatch[1]);
                    content = content.replace(modelMatch[0], "");
                  }
                }

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
        if (err.name === "AbortError") {
          cleanupAbortedMessage(currentId);
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
      setActiveModelName(selectedModel);

      const currentFile = attachedFile;
      let displayText = text;

      if (currentFile) {
        displayText = `📎 ${currentFile.name}\n${text}`;
      }

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
        if (err.name === "AbortError") {
          cleanupAbortedMessage(currentId);
          setIsStreaming(false);
        }
      }
    },
    [activeId, attachedFile, runStream, selectedModel],
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
        const targetMsg = currentConv.messages[msgIndex];
        if (targetMsg.role === "user") userMsgIndex = msgIndex;
        else {
          for (let i = msgIndex; i >= 0; i--) {
            if (currentConv.messages[i].role === "user") {
              userMsgIndex = i;
              break;
            }
          }
        }
      } else {
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
    if (abortControllerRef.current) abortControllerRef.current.abort();
  };
  const handleNewChat = () => {
    setActiveId(null);
    setIsSidebarOpen(false);
  };
  const handleSelectChat = (id) => {
    setActiveId(id);
    setIsSidebarOpen(false);
  };
  const handleDelete = (id) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const handleRenameChat = (id, newTitle) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)),
    );
  };

  const handleExportChatById = (id) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    let md = `# ${conv.title}\n\n`;
    conv.messages.forEach((m) => {
      const cleanContent = m.content.split("[SOURCES_JSON]")[0];
      md +=
        m.role === "user"
          ? `**User:**\n${cleanContent}\n\n`
          : `**Abyss:**\n${cleanContent}\n\n`;
    });
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${conv.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSidebar = () => {
    if (window.innerWidth >= 768) {
      setIsDesktopCollapsed(!isDesktopCollapsed);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden relative z-10">
      <Starfield isGalaxyMode={webSearchEnabled} />
      <div className="flex w-full h-full relative z-10">
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelectChat}
          onNew={handleNewChat}
          onDelete={handleDelete}
          onRename={handleRenameChat}
          onExportChat={handleExportChatById}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          isDesktopCollapsed={isDesktopCollapsed}
        />
        <main className="flex-1 h-full">
          <ChatArea
            messages={activeConv?.messages || []}
            onSend={handleSend}
            isStreaming={isStreaming}
            onStop={handleStop}
            attachedFile={attachedFile}
            setAttachedFile={setAttachedFile}
            fileInputRef={fileInputRef}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            activeModelName={activeModelName}
            webSearchEnabled={webSearchEnabled}
            setWebSearchEnabled={setWebSearchEnabled}
            toggleSidebar={toggleSidebar}
            isDesktopCollapsed={isDesktopCollapsed}
            onRegenerate={handleRegenerate}
            onEditMessage={handleEditMessage}
            onExport={() => handleExportChatById(activeId)}
          />
        </main>
      </div>
    </div>
  );
}

export default App;

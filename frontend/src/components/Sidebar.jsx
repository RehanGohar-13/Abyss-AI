import { useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Download,
} from "lucide-react";

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  onExportChat,
  searchTerm,
  setSearchTerm,
  isSidebarOpen,
  setIsSidebarOpen,
  isDesktopCollapsed,
}) {
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameText, setRenameText] = useState("");

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleRenameSubmit = (id) => {
    if (renameText.trim()) {
      onRename(id, renameText.trim());
    }
    setRenamingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <div
        className={`w-64 glass border-r border-purple-900/30 flex flex-col h-full fixed md:relative z-40 transition-all duration-300 
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} 
        ${isDesktopCollapsed ? "md:w-0 md:border-r-0 md:overflow-hidden" : "md:w-64"}`}
      >
        <div className="p-3 border-b border-purple-900/30 shrink-0">
          <button
            onClick={onNew}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded-lg transition-all font-medium text-sm glow-accent font-cosmic tracking-wider"
          >
            <Plus size={16} /> NEW CHAT
          </button>
        </div>

        <div className="p-3 border-b border-purple-900/30 shrink-0">
          <div className="relative">
            <Search
              className="absolute left-3 top-2.5 text-purple-400/50"
              size={16}
            />
            <input
              type="text"
              placeholder="Search archives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-purple-900/30 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors text-gray-200"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.map((conv) => (
            <div
              key={conv.id}
              onClick={() => renamingId !== conv.id && onSelect(conv.id)}
              className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors relative ${
                activeId === conv.id
                  ? "bg-purple-900/30 text-white border border-purple-700/50"
                  : "hover:bg-purple-900/20 text-gray-400 border border-transparent"
              }`}
            >
              <MessageSquare
                size={16}
                className="shrink-0 text-purple-400/70"
              />

              {renamingId === conv.id ? (
                <input
                  type="text"
                  value={renameText}
                  onChange={(e) => setRenameText(e.target.value)}
                  onBlur={() => handleRenameSubmit(conv.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameSubmit(conv.id);
                  }}
                  autoFocus
                  className="flex-1 bg-black/50 border border-purple-500 rounded px-1 py-0.5 text-sm focus:outline-none text-gray-200 font-cosmic"
                />
              ) : (
                <span className="text-sm truncate flex-1 font-cosmic">
                  {conv.title}
                </span>
              )}

              {/* Three Dots Menu Trigger */}
              {renamingId !== conv.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === conv.id ? null : conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-all p-1 rounded-md hover:bg-purple-900/40"
                >
                  <MoreHorizontal size={14} />
                </button>
              )}

              {/* Dropdown Menu */}
              {menuOpenId === conv.id && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(null);
                    }}
                  ></div>
                  <div
                    className="absolute right-0 top-10 w-40 glass rounded-lg p-1.5 z-20 shadow-2xl border border-purple-900/50 animate-[fadeIn_0.1s_ease-out]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        setRenamingId(conv.id);
                        setRenameText(conv.title);
                        setMenuOpenId(null);
                      }}
                      className="w-full flex items-center gap-2 text-left text-xs text-gray-300 hover:bg-purple-900/40 rounded-md px-2 py-1.5 transition-colors font-cosmic tracking-wider"
                    >
                      <Pencil size={12} /> RENAME
                    </button>
                    <button
                      onClick={() => {
                        onExportChat(conv.id);
                        setMenuOpenId(null);
                      }}
                      className="w-full flex items-center gap-2 text-left text-xs text-gray-300 hover:bg-purple-900/40 rounded-md px-2 py-1.5 transition-colors font-cosmic tracking-wider"
                    >
                      <Download size={12} /> EXPORT
                    </button>
                    <button
                      onClick={() => {
                        onDelete(conv.id);
                        setMenuOpenId(null);
                      }}
                      className="w-full flex items-center gap-2 text-left text-xs text-red-400 hover:bg-red-900/30 rounded-md px-2 py-1.5 transition-colors font-cosmic tracking-wider"
                    >
                      <Trash2 size={12} /> DELETE
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-purple-400/40 text-xs mt-4 font-cosmic">
              Void is empty
            </p>
          )}
        </div>
      </div>
    </>
  );
}

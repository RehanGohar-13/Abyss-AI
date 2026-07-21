import { Plus, Search, Trash2, MessageSquare } from "lucide-react";

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  searchTerm,
  setSearchTerm,
  isSidebarOpen,
  setIsSidebarOpen,
}) {
  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
        className={`w-64 glass border-r border-purple-900/30 flex flex-col h-full fixed md:relative z-40 transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="p-3 border-b border-purple-900/30">
          <button
            onClick={onNew}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded-lg transition-all font-medium text-sm glow-accent"
          >
            <Plus size={16} /> New Transmission
          </button>
        </div>

        <div className="p-3 border-b border-purple-900/30">
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
              onClick={() => onSelect(conv.id)}
              className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                activeId === conv.id
                  ? "bg-purple-900/30 text-white border border-purple-700/50"
                  : "hover:bg-purple-900/20 text-gray-400 border border-transparent"
              }`}
            >
              <MessageSquare
                size={16}
                className="shrink-0 text-purple-400/70"
              />
              <span className="text-sm truncate flex-1 font-cosmic">
                {conv.title}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
              >
                <Trash2 size={14} />
              </button>
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

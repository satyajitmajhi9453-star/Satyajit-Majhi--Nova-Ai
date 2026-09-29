import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  Copy,
  Settings,
  Sparkles,
  Sun,
  Moon,
  Database,
  ChevronLeft,
  Share2,
} from 'lucide-react';
import { Conversation, AppSettings } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onTogglePin: (id: string) => void;
  onDuplicateChat: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onTogglePin,
  onDuplicateChat,
  isOpen,
  onClose,
  onOpenSettings,
  settings,
  onUpdateSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const startEditing = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveEdit = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  // Filter conversations by title or message contents
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  // Group conversations by time
  const { pinned, today, yesterday, last7Days, older } = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const yesterdayStart = todayStart - oneDay;
    const sevenDaysStart = todayStart - 7 * oneDay;

    const pinnedList: Conversation[] = [];
    const todayList: Conversation[] = [];
    const yesterdayList: Conversation[] = [];
    const last7List: Conversation[] = [];
    const olderList: Conversation[] = [];

    // Sort by latest updated first
    const sorted = [...filteredConversations].sort((a, b) => b.updatedAt - a.updatedAt);

    for (const c of sorted) {
      if (c.pinned) {
        pinnedList.push(c);
      } else if (c.updatedAt >= todayStart) {
        todayList.push(c);
      } else if (c.updatedAt >= yesterdayStart) {
        yesterdayList.push(c);
      } else if (c.updatedAt >= sevenDaysStart) {
        last7List.push(c);
      } else {
        olderList.push(c);
      }
    }

    return {
      pinned: pinnedList,
      today: todayList,
      yesterday: yesterdayList,
      last7Days: last7List,
      older: olderList,
    };
  }, [filteredConversations]);

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    onUpdateSettings({ theme: nextTheme });
  };

  const renderChatItem = (c: Conversation) => {
    const isActive = c.id === activeChatId;
    const isEditing = c.id === editingId;

    if (isEditing) {
      return (
        <form
          key={c.id}
          onSubmit={(e) => saveEdit(c.id, e)}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 text-zinc-100 border border-emerald-500/50 my-1"
        >
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="flex-1 bg-transparent text-sm focus:outline-none text-zinc-100"
            autoFocus
          />
          <button
            type="submit"
            className="p-1 text-emerald-400 hover:text-emerald-300 rounded cursor-pointer"
            title="Save"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded cursor-pointer"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      );
    }

    return (
      <div
        key={c.id}
        onClick={() => {
          onSelectChat(c.id);
          // On small screen, close sidebar on selection
          if (window.innerWidth < 768) {
            onClose();
          }
        }}
        className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all my-0.5 select-none text-sm ${
          isActive
            ? 'bg-zinc-800/90 text-zinc-100 font-medium shadow-sm border border-zinc-700/50'
            : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          {c.pinned ? (
            <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0 rotate-45" />
          ) : (
            <MessageSquare className="w-4 h-4 shrink-0 text-zinc-500 group-hover:text-zinc-400" />
          )}
          <span className="truncate text-[13.5px]">{c.title || 'Untitled conversation'}</span>
        </div>

        {/* Hover Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(c.id);
            }}
            className={`p-1 rounded-md hover:bg-zinc-700/80 transition-colors cursor-pointer ${
              c.pinned ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title={c.pinned ? 'Unpin chat' : 'Pin chat'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => startEditing(c, e)}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded-md hover:bg-zinc-700/80 transition-colors cursor-pointer"
            title="Rename"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicateChat(c.id);
            }}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded-md hover:bg-zinc-700/80 transition-colors cursor-pointer"
            title="Branch / Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteChat(c.id);
            }}
            className="p-1 text-zinc-400 hover:text-rose-400 rounded-md hover:bg-zinc-700/80 transition-colors cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-72 bg-zinc-900 border-r border-zinc-800/80 transition-transform duration-300 ease-in-out shrink-0 select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden'
        }`}
      >
        {/* Top Header */}
        <div className="p-3 border-b border-zinc-800/80">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-base tracking-tight text-white">NovaChat</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg cursor-pointer md:hidden"
              title="Close sidebar"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-md shadow-emerald-600/20 active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>New chat</span>
            </div>
            <span className="text-[11px] font-mono opacity-80 bg-emerald-700/60 px-1.5 py-0.5 rounded">
              ⌘K
            </span>
          </button>

          {/* Search Bar */}
          <div className="relative mt-2.5">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-zinc-800/70 text-zinc-200 text-xs placeholder-zinc-500 border border-zinc-700/40 focus:outline-none focus:border-emerald-500/60 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin">
          {conversations.length === 0 ? (
            <div className="text-center py-10 px-4 text-zinc-500 text-xs">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No conversations yet.</p>
              <p className="mt-1 text-zinc-600">Start a new chat to begin!</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 px-4 text-zinc-500 text-xs">
              <p>No matching chats found for "{searchQuery}"</p>
            </div>
          ) : (
            <>
              {/* Pinned Section */}
              {pinned.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-amber-400/90 uppercase tracking-wider">
                    <Pin className="w-3 h-3 rotate-45" />
                    <span>Pinned</span>
                  </div>
                  <div className="mt-1">{pinned.map(renderChatItem)}</div>
                </div>
              )}

              {/* Today */}
              {today.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Today
                  </div>
                  <div className="mt-1">{today.map(renderChatItem)}</div>
                </div>
              )}

              {/* Yesterday */}
              {yesterday.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Yesterday
                  </div>
                  <div className="mt-1">{yesterday.map(renderChatItem)}</div>
                </div>
              )}

              {/* Previous 7 Days */}
              {last7Days.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Previous 7 Days
                  </div>
                  <div className="mt-1">{last7Days.map(renderChatItem)}</div>
                </div>
              )}

              {/* Older */}
              {older.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Older
                  </div>
                  <div className="mt-1">{older.map(renderChatItem)}</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info & Controls */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/90 text-xs">
          {/* Storage / Privacy badge */}
          <div className="flex items-center justify-between px-2.5 py-1.5 mb-2 rounded-lg bg-zinc-800/40 text-[11px] text-zinc-400 border border-zinc-800">
            <span className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-emerald-400" />
              <span>Zero-cloud, Local Storage</span>
            </span>
            <span className="text-[10px] text-zinc-500">{conversations.length} chats</span>
          </div>

          <div className="flex items-center justify-between gap-1 pt-1">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer flex-1"
              title={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {settings.theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="text-xs">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs">Dark</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer flex-1"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-zinc-400" />
              <span className="text-xs">Settings</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

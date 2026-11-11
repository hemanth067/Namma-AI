import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Sun, 
  Moon, 
  Search,
  Sparkles,
  Info,
  Globe2,
  Activity,
  Layers
} from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onClearAll: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenInfo: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onClearAll,
  isOpen,
  onCloseMobile,
  isDarkMode,
  onToggleTheme,
  onOpenInfo
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const saveEditing = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-neutral-900 border-r border-neutral-200/90 dark:border-neutral-800 flex flex-col transition-transform duration-200 ease-in-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand & New Chat */}
        <div className="p-3.5 border-b border-neutral-200/90 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-white flex items-center justify-center font-bold text-sm shadow-xs border border-amber-500/20">
                ந
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-neutral-100 font-sans">
                  Namma AI
                </span>
                <span className="text-[10px] text-neutral-500 font-medium">
                  Bilingual Enterprise Studio
                </span>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 md:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Search */}
        {sessions.length > 2 && (
          <div className="px-3 pt-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Filter workspaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 rounded-lg text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
              />
            </div>
          </div>
        )}

        {/* Sessions Section Header */}
        <div className="px-3 pt-3 pb-1 flex items-center justify-between text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
          <span>Workspaces</span>
          <span>{sessions.length}</span>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {sessions.length === 0 ? (
            <div className="px-3 py-10 text-center text-xs text-neutral-400">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-neutral-600 dark:text-neutral-400">No chat history yet</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">புதிய உரையாடலை தொடங்கவும்</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-neutral-400">
              No matching chats
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isEditing = editingId === session.id;

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    onCloseMobile();
                  }}
                  className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-neutral-100 text-neutral-900 font-semibold dark:bg-neutral-800 dark:text-neutral-100 border border-neutral-200/80 dark:border-neutral-700/80'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-400'}`} />
                    {isEditing ? (
                      <form
                        onSubmit={(e) => saveEditing(session.id, e)}
                        className="flex items-center gap-1 w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          autoFocus
                          className="w-full bg-white dark:bg-neutral-700 px-1.5 py-0.5 rounded text-xs border border-neutral-300 dark:border-neutral-600 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="p-1 hover:text-emerald-600 dark:hover:text-emerald-400"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="p-1 hover:text-rose-600 dark:hover:text-rose-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <span className="truncate">{session.title}</span>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => startEditing(session, e)}
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
                        title="Rename chat"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => onDeleteSession(session.id, e)}
                        className="p-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-neutral-200/90 dark:border-neutral-800 space-y-2 bg-neutral-50/50 dark:bg-neutral-900/50">
          {sessions.length > 0 && (
            <button
              onClick={onClearAll}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-neutral-500 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear history</span>
            </button>
          )}

          <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 pt-1">
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light theme</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Dark theme</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenInfo}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="About Namma AI"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          <div className="px-2 pt-1 text-[10px] text-neutral-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Gemini 3.1 Flash-Lite Active</span>
            </span>
            <span>v1.2</span>
          </div>
        </div>
      </aside>
    </>
  );
};

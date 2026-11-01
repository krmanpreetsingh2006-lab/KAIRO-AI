import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Settings,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
  HardDrive,
  X,
  Sparkles,
} from 'lucide-react';
import Logo, { LogoIcon } from '../common/Logo';
import SearchBar from './SearchBar';
import ConversationItem from './ConversationItem';
import { useChat } from '../../context/ChatContext';
import { useSettings } from '../../context/SettingsContext';

export default function Sidebar({
  mobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) {
  const {
    conversations,
    activeId,
    selectConversation,
    createNewChat,
    renameConversation,
    deleteConversation,
    clearAllConversations,
    searchQuery,
    setSearchQuery,
  } = useChat();

  const { serverHealth, setIsSettingsOpen } = useSettings();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Keyboard shortcut Ctrl+K / Cmd+K for new chat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        createNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNewChat]);

  // Group conversations chronologically
  const groupedConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? conversations.filter(c =>
          c.title.toLowerCase().includes(query) ||
          c.messages?.some(m => m.content.toLowerCase().includes(query))
        )
      : conversations;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const sevenDaysAgo = today - 7 * 86400000;

    const groups = {
      today: [],
      yesterday: [],
      previous7Days: [],
      older: [],
    };

    filtered.forEach(c => {
      const convTime = new Date(c.updatedAt || c.createdAt).getTime();
      if (convTime >= today) {
        groups.today.push(c);
      } else if (convTime >= yesterday) {
        groups.yesterday.push(c);
      } else if (convTime >= sevenDaysAgo) {
        groups.previous7Days.push(c);
      } else {
        groups.older.push(c);
      }
    });

    return groups;
  }, [conversations, searchQuery]);

  const hasConversations = conversations.length > 0;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#07080D] text-slate-300 border-r border-white/[0.06] select-none">
      {/* Top Header & Branding */}
      <div className="px-4 py-3.5 border-b border-white/[0.05] flex items-center justify-between">
        {!isCollapsed ? (
          <Logo
            size="sm"
            showTagline={true}
            showPro={true}
            onClick={createNewChat}
            className="cursor-pointer"
          />
        ) : (
          <button
            onClick={createNewChat}
            className="p-1 hover:scale-105 transition-transform"
            title="KAIRO AI"
          >
            <LogoIcon size={32} />
          </button>
        )}

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
          title="Close drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* New Chat Primary Button */}
      <div className="p-3">
        <button
          onClick={() => {
            createNewChat();
            if (mobileOpen) onCloseMobile();
          }}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3.5 py-2.5'
          } rounded-xl bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent hover:from-cyan-500/25 hover:via-blue-500/20 hover:to-cyan-500/10 text-white font-medium text-xs border border-cyan-500/30 hover:border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.12)] transition-all duration-300 active:scale-[0.98] group`}
          title="New Conversation (Ctrl+K)"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400 group-hover:rotate-90 transition-transform duration-300" />
            {!isCollapsed && <span className="tracking-wide font-medium">New Conversation</span>}
          </div>
          {!isCollapsed && (
            <kbd className="hidden lg:inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-black/60 border border-white/10 text-slate-400">
              ⌘K
            </kbd>
          )}
        </button>
      </div>

      {/* Search Bar (hidden when collapsed) */}
      {!isCollapsed && (
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
      )}

      {/* Conversation List (Scrollable) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 space-y-4">
        {isCollapsed ? (
          /* Collapsed Mini-list */
          <div className="space-y-1.5 px-2">
            {conversations.slice(0, 10).map(c => (
              <button
                key={c.id}
                onClick={() => selectConversation(c.id)}
                className={`w-full p-2.5 rounded-xl flex items-center justify-center transition-colors ${
                  activeId === c.id
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40 shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
                title={c.title}
              >
                <div className="w-2 h-2 rounded-full bg-current"></div>
              </button>
            ))}
          </div>
        ) : (
          /* Full Grouped List */
          <>
            {/* Today */}
            {groupedConversations.today.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-5 mb-1.5">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Today
                  </h3>
                  <span className="text-[10px] font-mono text-slate-600">
                    {groupedConversations.today.length}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {groupedConversations.today.map(c => (
                    <ConversationItem
                      key={c.id}
                      conversation={c}
                      isActive={activeId === c.id}
                      onSelect={(id) => {
                        selectConversation(id);
                        if (mobileOpen) onCloseMobile();
                      }}
                      onRename={renameConversation}
                      onDelete={deleteConversation}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Yesterday */}
            {groupedConversations.yesterday.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-5 mb-1.5">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Yesterday
                  </h3>
                  <span className="text-[10px] font-mono text-slate-600">
                    {groupedConversations.yesterday.length}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {groupedConversations.yesterday.map(c => (
                    <ConversationItem
                      key={c.id}
                      conversation={c}
                      isActive={activeId === c.id}
                      onSelect={(id) => {
                        selectConversation(id);
                        if (mobileOpen) onCloseMobile();
                      }}
                      onRename={renameConversation}
                      onDelete={deleteConversation}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Previous 7 Days */}
            {groupedConversations.previous7Days.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-5 mb-1.5">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Previous 7 Days
                  </h3>
                  <span className="text-[10px] font-mono text-slate-600">
                    {groupedConversations.previous7Days.length}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {groupedConversations.previous7Days.map(c => (
                    <ConversationItem
                      key={c.id}
                      conversation={c}
                      isActive={activeId === c.id}
                      onSelect={(id) => {
                        selectConversation(id);
                        if (mobileOpen) onCloseMobile();
                      }}
                      onRename={renameConversation}
                      onDelete={deleteConversation}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Older */}
            {groupedConversations.older.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-5 mb-1.5">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Older
                  </h3>
                  <span className="text-[10px] font-mono text-slate-600">
                    {groupedConversations.older.length}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {groupedConversations.older.map(c => (
                    <ConversationItem
                      key={c.id}
                      conversation={c}
                      isActive={activeId === c.id}
                      onSelect={(id) => {
                        selectConversation(id);
                        if (mobileOpen) onCloseMobile();
                      }}
                      onRename={renameConversation}
                      onDelete={deleteConversation}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Search filter empty result */}
            {searchQuery &&
              groupedConversations.today.length === 0 &&
              groupedConversations.yesterday.length === 0 &&
              groupedConversations.previous7Days.length === 0 &&
              groupedConversations.older.length === 0 && (
                <div className="px-5 py-8 text-center text-xs text-slate-500">
                  <p>No conversations found</p>
                  <p className="text-[11px] text-slate-600 mt-1">Try another keyword</p>
                </div>
              )}

            {/* Clean empty state when user has no chats yet */}
            {!hasConversations && !searchQuery && (
              <div className="px-5 py-10 text-center text-xs text-slate-500 space-y-1.5">
                <Sparkles className="w-5 h-5 mx-auto text-violet-400/40 mb-2" />
                <p className="font-medium text-slate-400">Ready to explore</p>
                <p className="text-[11px] text-slate-600">Send a prompt to begin your first thread.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer & Controls */}
      <div className="p-3 border-t border-white/[0.05] space-y-2 bg-[#06080D]">
        {!isCollapsed && hasConversations && (
          <div className="px-1">
            {showClearConfirm ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-red-950/60 border border-red-500/30 text-xs text-red-200 animate-fadeIn">
                <span className="text-[11px]">Clear all chats?</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      clearAllConversations();
                      setShowClearConfirm(false);
                    }}
                    className="px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-500 text-white font-medium text-[11px] transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 text-[11px] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/[0.03] text-xs transition-colors"
                title="Delete all conversation history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All History</span>
              </button>
            )}
          </div>
        )}

        {/* Server Health Status Widget */}
        {!isCollapsed ? (
          <div className="px-2 py-2 rounded-xl bg-[#0D101A] border border-white/5 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    serverHealth.status === 'online' && serverHealth.apiKeyConfigured
                      ? 'bg-emerald-400'
                      : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    serverHealth.status === 'online'
                      ? serverHealth.apiKeyConfigured
                        ? 'bg-emerald-400'
                        : 'bg-amber-400'
                      : 'bg-red-400'
                  }`}
                />
              </span>
              <span className="text-slate-300 font-medium truncate max-w-[125px]">
                {serverHealth.status === 'online'
                  ? serverHealth.apiKeyConfigured
                    ? serverHealth.model
                    : 'Key Needed'
                  : 'Relay Offline'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">v1.0.1</span>
          </div>
        ) : null}

        {/* Settings button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2'
          } rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/5`}
          title="Settings & System Directives"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          {!isCollapsed && <span className="font-medium">Settings & Preferences</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block h-full transition-all duration-300 ease-in-out shrink-0 z-20 ${
          isCollapsed ? 'w-16' : 'w-72 lg:w-80'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Out Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Blur Overlay */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
          />

          {/* Slide-out drawer panel */}
          <div className="relative w-4/5 max-w-xs h-full bg-[#08090E] shadow-2xl z-10 animate-slideRight">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

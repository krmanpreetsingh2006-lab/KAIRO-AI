import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Menu, Plus, Settings, AlertTriangle, X } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useSettings } from '../../context/SettingsContext';
import { LogoIcon } from '../common/Logo';
import EmptyChatState from './EmptyChatState';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ScrollToBottom from './ScrollToBottom';

export default function ChatArea({ onOpenMobileSidebar }) {
  const {
    activeConversation,
    sendMessage,
    stopGeneration,
    isGenerating,
    createNewChat,
    regenerateLastResponse,
    errorMessage,
    clearError,
  } = useChat();

  const { setIsSettingsOpen } = useSettings();

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  const messages = activeConversation?.messages || [];

  // Scroll to bottom helper
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
    setUserScrolledUp(false);
    setShowScrollBottom(false);
  }, []);

  // Monitor user scroll position to toggle ScrollToBottom button
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceToBottom = scrollHeight - (scrollTop + clientHeight);

    if (distanceToBottom > 160) {
      setShowScrollBottom(true);
      setUserScrolledUp(true);
    } else {
      setShowScrollBottom(false);
      setUserScrolledUp(false);
    }
  };

  // Auto-scroll when new tokens stream in, unless user scrolled up
  useEffect(() => {
    if (!userScrolledUp && isGenerating) {
      scrollToBottom(false);
    }
  }, [messages, isGenerating, userScrolledUp, scrollToBottom]);

  // When conversation changes, scroll to bottom
  useEffect(() => {
    scrollToBottom(false);
  }, [activeConversation?.id, scrollToBottom]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#08090E] text-slate-100 relative overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-14 min-h-[56px] border-b border-white/[0.06] bg-[#0A0C14]/90 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 z-10 select-none shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Sidebar Hamburger Toggle */}
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 active:scale-95"
            title="Open Conversations"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* KAIRO AI Brand & Active Thread Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={createNewChat}
              className="flex items-center gap-2 hover:opacity-90 transition-opacity select-none"
              title="KAIRO AI Home"
            >
              <LogoIcon size={26} />
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[14px] sm:text-[15px] tracking-wide text-white">
                  KAIRO
                </span>
                <span className="font-extrabold text-[14px] sm:text-[15px] bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  AI
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full tracking-wider bg-cyan-500/15 border border-cyan-400/30 text-cyan-300">
                  PRO
                </span>
              </div>
            </button>

            {activeConversation?.title && activeConversation.title !== 'New Conversation' && (
              <span className="hidden sm:inline-block text-xs text-slate-400 font-normal truncate max-w-[200px] md:max-w-md pl-2.5 border-l border-white/10">
                {activeConversation.title}
              </span>
            )}
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* New Chat Button */}
          <button
            onClick={createNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-medium border border-white/10 hover:border-cyan-500/30 transition-all shadow-sm active:scale-95"
            title="New Chat"
            aria-label="Start new conversation"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 active:scale-95"
            title="Settings"
            aria-label="Open settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="bg-red-950/80 border-b border-red-500/40 text-red-200 px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm animate-fadeIn z-20 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="truncate">{errorMessage}</span>
          </div>
          <button
            onClick={clearError}
            className="p-1 rounded-md hover:bg-red-900/50 text-red-300 hover:text-white transition-colors shrink-0"
            title="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative"
      >
        {messages.length === 0 ? (
          /* Empty Chat Screen */
          <EmptyChatState />
        ) : (
          /* Active Conversation Messages Viewport */
          <div className="w-full max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id || index}
                message={message}
                isLatest={index === messages.length - 1}
                isGenerating={isGenerating}
                onRegenerate={regenerateLastResponse}
              />
            ))}
            <div ref={messagesEndRef} className="h-6" />
          </div>
        )}
      </div>

      {/* Floating Scroll-to-Bottom Button */}
      <ScrollToBottom
        visible={showScrollBottom}
        onClick={() => scrollToBottom(true)}
        hasNewTokens={isGenerating}
      />

      {/* Bottom Message Composer */}
      <div className="shrink-0 w-full pt-1">
        <ChatInput
          onSendMessage={sendMessage}
          onStopGeneration={stopGeneration}
          isGenerating={isGenerating}
          disabled={false}
        />
      </div>
    </div>
  );
}

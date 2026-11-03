import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Menu, Plus, Settings, AlertTriangle, X, Home } from 'lucide-react';
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
    goHome,
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
      <header className="h-14 min-h-[56px] border-b border-white/[0.06] bg-[#0A0C14]/90 backdrop-blur-xl flex items-center justify-between px-3.5 sm:px-6 z-10 select-none shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Mobile Sidebar Hamburger Toggle */}
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden h-9 w-9 flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 active:scale-95 transition-all shrink-0"
            title="Open Chat History & Navigation"
            aria-label="Open chat history and navigation menu"
          >
            <Menu className="w-4.5 h-4.5 text-slate-300" />
          </button>

          {/* KAIRO AI Brand Display & Home Action */}
          <button
            onClick={goHome}
            className="flex items-center gap-2 min-w-0 select-none hover:opacity-90 active:scale-95 transition-all text-left cursor-pointer"
            title="Return to Home Screen"
            aria-label="Return to Home Screen"
          >
            <LogoIcon size={24} />
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-extrabold text-[15px] tracking-wide text-white">
                KAIRO
              </span>
              <span className="font-extrabold text-[15px] bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                AI
              </span>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full tracking-wider bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 hidden sm:inline-block">
                PRO
              </span>
            </div>

            {activeConversation?.title && activeConversation.title !== 'New Conversation' && (
              <span className="hidden md:inline-block text-xs text-slate-400 font-normal truncate max-w-[200px] lg:max-w-md pl-3 border-l border-white/10">
                {activeConversation.title}
              </span>
            )}
          </button>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Home Button: visible and accessible in every active conversation */}
          {activeConversation && (
            <button
              onClick={goHome}
              className="h-9 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-medium border border-white/10 active:scale-95 transition-all shrink-0"
              title="Return to Home Screen"
              aria-label="Return to Home Screen"
            >
              <Home className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="hidden sm:inline font-medium">Home</span>
            </button>
          )}

          {/* Visually Balanced New Chat Button */}
          <button
            onClick={createNewChat}
            className="h-9 flex items-center gap-1.5 px-2.5 sm:px-3.5 rounded-xl bg-gradient-to-r from-cyan-500/15 to-blue-500/15 hover:from-cyan-500/25 hover:to-blue-500/20 text-cyan-300 hover:text-white text-xs font-semibold border border-cyan-500/35 hover:border-cyan-400/55 shadow-sm active:scale-95 transition-all shrink-0"
            title="Start New Chat"
            aria-label="Start new conversation"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="inline font-medium">New Chat</span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/10 active:scale-95 transition-all shrink-0"
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
            <div ref={messagesEndRef} className="h-8 sm:h-12" />
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

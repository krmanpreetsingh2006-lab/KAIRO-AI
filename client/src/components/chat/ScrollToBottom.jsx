import React from 'react';
import { ArrowDown } from 'lucide-react';

export default function ScrollToBottom({ visible, onClick, hasNewTokens }) {
  if (!visible) return null;

  return (
    <button
      onClick={onClick}
      className="absolute bottom-28 right-6 z-20 flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#121626]/90 hover:bg-[#1A2035] text-slate-200 hover:text-white border border-white/15 shadow-xl backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 group"
      title="Scroll to latest message"
    >
      <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
      <span className="text-xs font-medium pr-1">Latest</span>
      {hasNewTokens && (
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
      )}
    </button>
  );
}

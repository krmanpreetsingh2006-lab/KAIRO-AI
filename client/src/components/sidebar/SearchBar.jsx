import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange, onClear }) {
  return (
    <div className="relative px-3 py-2 select-none">
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 absolute left-3 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search conversations..."
          className="w-full bg-[#111422] text-xs text-slate-200 placeholder-slate-500 pl-8 pr-7 py-2 rounded-xl border border-white/5 focus:border-cyan-500/40 focus:outline-none focus:bg-[#131624] transition-all"
        />
        {value && (
          <button
            onClick={onClear}
            className="absolute right-2.5 p-0.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Clear search"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

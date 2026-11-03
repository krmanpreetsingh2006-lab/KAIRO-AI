import React from 'react';
import { LogoIcon } from '../common/Logo';

export default function EmptyChatState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 select-none relative animate-fadeIn">
      {/* Soft Ambient Radial Glow Behind Logo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-cyan-500/10 via-blue-600/10 to-transparent blur-[90px] pointer-events-none rounded-full -z-10" />

      {/* Tasteful Center Brand Mark */}
      <div className="flex flex-col items-center text-center space-y-4 max-w-md">
        <div className="relative group">
          <div className="absolute -inset-2.5 bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-cyan-500/15 rounded-2xl blur-lg opacity-60 group-hover:opacity-85 transition duration-500 pointer-events-none" />
          <div className="relative bg-[#0D101A] p-3 sm:p-3.5 rounded-2xl border border-white/10 shadow-xl backdrop-blur-xl group-hover:border-cyan-500/30 transition-colors">
            <LogoIcon size={42} animated />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[0.14em] text-white">
              KAIRO <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">AI</span>
            </h1>
            <span className="text-[10px] font-extrabold tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              PRO
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] font-semibold text-slate-400">
            Intelligence Beyond Limits
          </p>
        </div>

        {/* Short Welcome Message */}
        <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed pt-1">
          What would you like to explore or solve today?
        </p>
      </div>
    </div>
  );
}

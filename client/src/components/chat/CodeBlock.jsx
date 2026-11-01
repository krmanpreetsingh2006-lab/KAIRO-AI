import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import hljs from 'highlight.js';

export default function CodeBlock({ language, value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Safely highlight code
  let highlightedHtml = '';
  try {
    if (language && hljs.getLanguage(language)) {
      highlightedHtml = hljs.highlight(value, { language }).value;
    } else {
      highlightedHtml = hljs.highlightAuto(value).value;
    }
  } catch {
    highlightedHtml = value;
  }

  const displayLang = (language || 'code').toLowerCase();

  return (
    <div className="my-4 rounded-2xl overflow-hidden border border-white/10 bg-[#080A12] shadow-2xl transition-all">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0F121E] border-b border-white/[0.06] text-xs select-none">
        <div className="flex items-center gap-3">
          {/* macOS Style Traffic Dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70 inline-block"></span>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-cyan-300/90 pl-1 border-l border-white/10">
            {displayLang}
          </span>
        </div>

        {/* Copy Code Button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-all border border-white/5 active:scale-95"
          title="Copy code snippet"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <pre className="p-4 sm:p-5 text-xs sm:text-[13px] font-mono overflow-x-auto leading-relaxed text-slate-200 bg-[#080A12]">
        <code
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          className="hljs"
        />
      </pre>
    </div>
  );
}

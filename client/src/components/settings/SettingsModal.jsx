import React, { useState } from 'react';
import {
  X,
  Sliders,
  Cpu,
  Terminal,
  Shield,
  Info,
  RefreshCw,
  Trash2,
  Download,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useChat } from '../../context/ChatContext';
import Logo from '../common/Logo';

export default function SettingsModal() {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    settings,
    updateSetting,
    resetSettings,
    serverHealth,
    refreshHealth,
  } = useSettings();

  const {
    conversations,
    clearAllConversations,
    exportChatsJSON,
  } = useChat();

  const [activeTab, setActiveTab] = useState('general');
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearedSuccess, setClearedSuccess] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  if (!isSettingsOpen) return null;

  const totalMessages = conversations.reduce(
    (acc, curr) => acc + (curr.messages?.length || 0),
    0
  );

  const handleClearHistory = () => {
    clearAllConversations();
    setConfirmClear(false);
    setClearedSuccess(true);
    setTimeout(() => setClearedSuccess(false), 3000);
  };

  const handlePing = async () => {
    setIsPinging(true);
    await refreshHealth();
    setTimeout(() => setIsPinging(false), 500);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Sliders },
    { id: 'model', label: 'Model & Engine', icon: Cpu },
    { id: 'system', label: 'System Directives', icon: Terminal },
    { id: 'storage', label: 'Data & Privacy', icon: Shield },
    { id: 'about', label: 'About', icon: Info },
  ];

  const presets = [
    {
      title: 'Senior Software Architect',
      prompt: 'Act as a principal software architect. Prioritize high-scale design patterns, asymptotic efficiency, comprehensive type safety, and clean code principles. Explain trade-offs clearly.',
    },
    {
      title: 'Concise & Direct',
      prompt: 'Provide hyper-concise answers. Skip pleasantries. Deliver direct code or bullet points without preamble or redundant explanations.',
    },
    {
      title: 'Research Scientist',
      prompt: 'Adopt a rigorous academic perspective. Formulate hypotheses, cite theoretical foundations, highlight edge cases, and analyze underlying mathematical principles.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none animate-fadeIn">
      {/* Backdrop */}
      <div
        onClick={() => setIsSettingsOpen(false)}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl bg-[#0D101C] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/[0.06] bg-[#0A0C16]">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-white tracking-tight">Settings & Preferences</h2>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-6 pt-3 border-b border-white/[0.05] bg-[#080A12] overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-cyan-400 text-cyan-300 bg-white/[0.04]'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.01]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Theme Preference */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Theme Appearance
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'obsidian', name: 'Dark Obsidian', bg: 'bg-[#06070A]', border: 'border-white/10' },
                    { id: 'midnight-violet', name: 'Midnight Violet', bg: 'bg-[#0E0B1A]', border: 'border-violet-500/20' },
                    { id: 'graphite', name: 'Deep Graphite', bg: 'bg-[#12141A]', border: 'border-slate-700' },
                  ].map((thm) => (
                    <button
                      key={thm.id}
                      onClick={() => updateSetting('theme', thm.id)}
                      className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2.5 transition-all ${thm.bg} ${
                        settings.theme === thm.id
                          ? 'border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.3)] ring-1 ring-violet-500'
                          : `${thm.border} hover:border-white/20`
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center">
                        {settings.theme === thm.id && (
                          <div className="w-2 h-2 rounded-full bg-violet-400" />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-slate-200 tracking-tight">{thm.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Behavior switches */}
              <div className="space-y-3 pt-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Interaction Preferences
                </label>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div>
                    <div className="text-xs font-medium text-slate-200">Send on Enter</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Press Enter to transmit messages, Shift+Enter for a new line.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enterToSend}
                    onChange={(e) => updateSetting('enterToSend', e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div>
                    <div className="text-xs font-medium text-slate-200">Wrap Code Lines</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Allow code blocks to wrap text or display horizontal scrollbar.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.codeWordWrap}
                    onChange={(e) => updateSetting('codeWordWrap', e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MODEL & ENGINE */}
          {activeTab === 'model' && (
            <div className="space-y-6">
              {/* Server connection card */}
              <div className="p-4.5 rounded-2xl bg-[#111524] border border-white/10 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          serverHealth.status === 'online' && serverHealth.apiKeyConfigured
                            ? 'bg-emerald-400'
                            : 'bg-amber-400'
                        }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                          serverHealth.status === 'online'
                            ? serverHealth.apiKeyConfigured
                              ? 'bg-emerald-400'
                              : 'bg-amber-400'
                            : 'bg-red-400'
                        }`}
                      />
                    </span>
                    <span className="font-semibold text-slate-100 text-xs sm:text-sm">
                      Backend Relay Engine
                    </span>
                  </div>
                  <button
                    onClick={handlePing}
                    disabled={isPinging}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/5 active:scale-95"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                    <span>Ping Relay</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-slate-400 block text-[10.5px] uppercase font-semibold tracking-wider">Active Model</span>
                    <strong className="text-violet-300 font-mono text-xs">{serverHealth.model}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-slate-400 block text-[10.5px] uppercase font-semibold tracking-wider">Relay State</span>
                    <strong className={serverHealth.apiKeyConfigured ? 'text-emerald-400' : 'text-amber-400'}>
                      {serverHealth.apiKeyConfigured ? 'Authenticated (Server .env)' : 'Key Needed in server/.env'}
                    </strong>
                  </div>
                </div>

                {!serverHealth.apiKeyConfigured && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      Gemini API key is not yet configured on the server. Add your key to{' '}
                      <code className="bg-black/40 px-1 py-0.5 rounded text-amber-100 font-mono">server/.env</code>{' '}
                      as <code className="bg-black/40 px-1 py-0.5 rounded text-amber-100 font-mono">GEMINI_API_KEY=AIzaSy...</code>
                    </div>
                  </div>
                )}
              </div>

              {/* Temperature Slider */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Response Temperature ({settings.temperature})
                  </label>
                  <span className="text-xs text-violet-300 font-mono">
                    {settings.temperature < 0.4 ? 'Focused & Deterministic' : settings.temperature > 0.8 ? 'Creative & Exploratory' : 'Balanced'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.2"
                  step="0.05"
                  value={settings.temperature}
                  onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.1 (Precise)</span>
                  <span>0.7 (Default)</span>
                  <span>1.2 (Creative)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM DIRECTIVES */}
          {activeTab === 'system' && (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 block mb-1">
                  Custom System Persona / Instructions
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  Direct KAIRO AI on how to format responses, what role to assume, or specific constraints to enforce.
                </p>
                <textarea
                  rows={5}
                  value={settings.systemInstruction}
                  onChange={(e) => updateSetting('systemInstruction', e.target.value)}
                  placeholder="e.g. Always respond with concise production-ready TypeScript code with explicit types..."
                  className="w-full bg-[#111422] text-xs text-slate-200 placeholder-slate-500 p-3.5 rounded-2xl border border-white/10 focus:border-violet-500/50 focus:outline-none leading-relaxed font-mono"
                />
              </div>

              {/* Directive Presets */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400">Quick Persona Presets:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {presets.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => updateSetting('systemInstruction', preset.prompt)}
                      className="text-left p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-violet-500/30 transition-all text-xs"
                    >
                      <div className="font-semibold text-slate-200 mb-1">{preset.title}</div>
                      <div className="text-[10.5px] text-slate-400 line-clamp-2 leading-relaxed">{preset.prompt}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DATA & PRIVACY */}
          {activeTab === 'storage' && (
            <div className="space-y-5">
              <div className="p-4.5 rounded-2xl bg-[#111524] border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <Shield className="w-4 h-4" />
                  <span>100% Client-Side Private Storage</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your chat logs, titles, and settings are saved exclusively in your browser's local storage.
                  The backend relay acts as a stateless conduit to Google Gemini and does not persist your messages.
                </p>
              </div>

              {/* Storage Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[11px] text-slate-400 block">Total Conversations</span>
                  <span className="text-xl font-bold text-white mt-1 block">{conversations.length}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[11px] text-slate-400 block">Total Messages Stored</span>
                  <span className="text-xl font-bold text-white mt-1 block">{totalMessages}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={exportChatsJSON}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-medium transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Chat History (JSON Backup)</span>
                </button>

                {confirmClear ? (
                  <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/40 space-y-2 animate-fadeIn">
                    <p className="text-xs text-red-200">
                      Are you sure you want to erase all {conversations.length} conversations? This cannot be undone.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleClearHistory}
                        className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
                      >
                        Yes, Erase Everything
                      </button>
                      <button
                        onClick={() => setConfirmClear(false)}
                        className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All Local Chat History</span>
                  </button>
                )}

                {clearedSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                    <Check className="w-4 h-4" />
                    <span>All conversations have been erased.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-[#111422] border border-white/10 space-y-2.5">
                <Logo size="lg" />
                <p className="text-xs text-slate-400 max-w-sm pt-2">
                  Engineered with analytical depth, architectural foresight, and elegant articulation.
                </p>
                <div className="pt-2">
                  <span className="text-[11px] px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/30 font-mono">
                    Release 1.0.0 — Production Ready
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span>Architecture</span>
                  <span className="text-slate-200">React 18 + Vite 6 + Express Relay</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span>Intelligence SDK</span>
                  <span className="text-slate-200 font-mono">@google/genai v2.32</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span>Storage Engine</span>
                  <span className="text-slate-200">Client-Side IndexedDB / LocalStorage</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span>Security</span>
                  <span className="text-slate-200">Server API Key Isolation, Helmet, Rate Limiter</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] bg-[#0A0C16] text-xs">
          <button
            onClick={resetSettings}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            Reset Defaults
          </button>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium shadow-lg shadow-violet-600/30 transition-all active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  FileCode,
  X,
  Maximize2
} from 'lucide-react';
import CodeBlock from './CodeBlock';
import { LogoIcon } from '../common/Logo';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getDocumentMeta(name, mime) {
  const ext = (name || '').split('.').pop()?.toLowerCase();
  if (ext === 'pdf' || mime === 'application/pdf') {
    return {
      icon: <FileText className="w-5 h-5 text-rose-400 shrink-0" />,
      badge: 'PDF',
      badgeClass: 'bg-rose-500/10 text-rose-300 border-rose-500/20'
    };
  }
  if (ext === 'csv' || mime === 'text/csv') {
    return {
      icon: <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />,
      badge: 'CSV',
      badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
    };
  }
  if (ext === 'json' || ext === 'md' || ext === 'txt') {
    return {
      icon: <FileCode className="w-5 h-5 text-cyan-400 shrink-0" />,
      badge: ext?.toUpperCase() || 'TXT',
      badgeClass: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
    };
  }
  return {
    icon: <FileText className="w-5 h-5 text-cyan-400 shrink-0" />,
    badge: 'DOC',
    badgeClass: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
  };
}

export default function ChatMessage({
  message,
  isLatest,
  isGenerating,
  onRegenerate,
}) {
  const [copied, setCopied] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;
  const isError = message.isError;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const attachments = Array.isArray(message.attachments) ? message.attachments : [];
  const imageAttachments = attachments.filter(a => a.category === 'image' || a.type?.startsWith('image/'));
  const docAttachments = attachments.filter(a => a.category !== 'image' && !a.type?.startsWith('image/'));

  // 1. User Message: Sleek right-aligned floating chat bubble with multimedia rendering
  if (isUser) {
    return (
      <div className="w-full flex justify-end animate-fadeIn">
        <div className="max-w-[90%] sm:max-w-[80%] flex flex-col items-end gap-2">
          {/* Attached Images Grid */}
          {imageAttachments.length > 0 && (
            <div className={`grid gap-2 ${imageAttachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
              {imageAttachments.map((img, idx) => (
                <div
                  key={img.id || idx}
                  onClick={() => setModalImage(img)}
                  className="group relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 hover:border-cyan-400/50 shadow-md transition-all cursor-zoom-in max-w-[280px]"
                >
                  <img
                    src={img.dataUrl}
                    alt={img.name || 'User uploaded image'}
                    className="w-full h-auto max-h-56 object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-medium">
                    <Maximize2 className="w-4 h-4 text-cyan-300" />
                    <span>Expand</span>
                  </div>
                  {img.name && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-[10px] text-slate-300 truncate">
                      {img.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Attached Documents Pills / Cards */}
          {docAttachments.length > 0 && (
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {docAttachments.map((doc, idx) => {
                const meta = getDocumentMeta(doc.name, doc.type);
                return (
                  <div
                    key={doc.id || idx}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#141724] border border-white/10 hover:border-cyan-500/30 shadow-md transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-200 truncate">
                        {doc.name || 'Document'}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                        <span>{formatBytes(doc.size)}</span>
                        <span className={`px-1.5 py-0.2 rounded border text-[9px] font-semibold ${meta.badgeClass}`}>
                          {meta.badge}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Text Bubble (if user entered text alongside attachments) */}
          {message.content && message.content.trim() !== '' && (
            <div className="rounded-2xl sm:rounded-[22px] bg-[#151824] border border-white/[0.08] px-4 py-2.5 sm:px-5 sm:py-3.5 text-slate-100 text-[14px] sm:text-[14.5px] leading-relaxed shadow-sm break-words whitespace-pre-wrap hover:border-white/15 transition-colors">
              {message.content}
            </div>
          )}
        </div>

        {/* High-Resolution Image Lightbox Modal */}
        {modalImage && (
          <div
            onClick={() => setModalImage(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] flex flex-col items-center bg-[#0E111A] border border-white/15 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="w-full flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/40">
                <span className="text-xs text-slate-300 font-medium truncate max-w-md">
                  {modalImage.name || 'Image Preview'}
                </span>
                <button
                  onClick={() => setModalImage(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close image preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2 overflow-auto flex items-center justify-center">
                <img
                  src={modalImage.dataUrl}
                  alt={modalImage.name || 'Preview'}
                  className="max-h-[80vh] w-auto object-contain rounded-2xl"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Assistant Message: Clean, spacious conversational response
  return (
    <div className="w-full flex gap-3 sm:gap-4 items-start group animate-fadeIn">
      {/* KAIRO AI Avatar */}
      <div className="shrink-0 mt-0.5 sm:mt-1">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#0F121C] border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)] relative">
          <LogoIcon size={18} />
          {isStreaming && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
            </span>
          )}
        </div>
      </div>

      {/* Response Content Body */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Error Notification */}
        {isError && (
          <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs sm:text-sm shadow-md">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              {message.content}
            </div>
          </div>
        )}

        {/* Markdown Rendered Content */}
        {!isError && (
          <div className="text-slate-100 text-[14px] sm:text-[14.5px] leading-[1.7] break-words font-sans">
            <div className="prose prose-invert max-w-none prose-p:my-2 prose-p:leading-relaxed prose-headings:font-bold prose-headings:text-white prose-headings:tracking-tight prose-h1:text-lg sm:prose-h1:text-xl prose-h2:text-base sm:prose-h2:text-lg prose-h3:text-sm sm:prose-h3:text-base prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-code:text-cyan-300 prose-code:bg-cyan-950/40 prose-code:border prose-code:border-cyan-800/40 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-xs prose-pre:p-0 prose-pre:bg-transparent prose-blockquote:border-l-2 prose-blockquote:border-cyan-500 prose-blockquote:text-slate-300 prose-blockquote:pl-3 prose-blockquote:italic prose-a:text-cyan-400 prose-a:underline hover:prose-a:text-cyan-300 prose-table:border-collapse prose-th:border prose-th:border-white/10 prose-th:p-2.5 prose-th:bg-white/5 prose-td:border prose-td:border-white/10 prose-td:p-2.5">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');
                    if (!inline && (match || codeString.includes('\n'))) {
                      return (
                        <CodeBlock
                          language={match ? match[1] : ''}
                          value={codeString}
                        />
                      );
                    }
                    return (
                      <code className="bg-cyan-950/30 border border-cyan-800/30 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs" {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>

              {/* Glowing Typing Cursor during Generation */}
              {isStreaming && (
                <span className="streaming-cursor" title="Synthesizing..." />
              )}
            </div>
          </div>
        )}

        {/* Minimal Action Toolbar */}
        {!isStreaming && (
          <div className="flex items-center gap-1.5 pt-2 text-xs text-slate-400 opacity-70 group-hover:opacity-100 transition-opacity">
            {message.content && !isError && (
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10 active:scale-95"
                title="Copy entire response"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}

            {isLatest && !isGenerating && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10 active:scale-95"
                title={isError ? 'Retry generation' : 'Regenerate response'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isError ? 'Retry' : 'Regenerate'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

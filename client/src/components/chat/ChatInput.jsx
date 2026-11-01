import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Image as ImageIcon,
  FileText,
  X,
  AlertCircle,
  Loader2,
  FileCode,
  FileSpreadsheet
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

const MAX_CHAR_COUNT = 12000;
const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per file

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
];

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function resolveFileCategory(file) {
  const mime = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();

  if (ALLOWED_IMAGE_TYPES.includes(mime) || /\.(png|jpe?g|webp)$/i.test(name)) {
    return 'image';
  }
  if (
    ALLOWED_DOC_TYPES.includes(mime) ||
    /\.(pdf|txt|md|csv|json)$/i.test(name)
  ) {
    return 'document';
  }
  return null;
}

function getDocumentIcon(name, mime) {
  const ext = (name || '').split('.').pop()?.toLowerCase();
  if (ext === 'pdf' || mime === 'application/pdf') {
    return <FileText className="w-4 h-4 text-rose-400 shrink-0" />;
  }
  if (ext === 'csv' || mime === 'text/csv') {
    return <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />;
  }
  if (ext === 'json' || ext === 'md' || ext === 'txt') {
    return <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />;
  }
  return <FileText className="w-4 h-4 text-cyan-400 shrink-0" />;
}

export default function ChatInput({
  onSendMessage,
  onStopGeneration,
  isGenerating,
  disabled,
}) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);
  const menuRef = useRef(null);
  const dragCounterRef = useRef(0);
  const { settings } = useSettings();

  const enterToSend = settings?.enterToSend !== false;

  // Auto-resize textarea to fit content seamlessly
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 220);
    textarea.style.height = `${newHeight}px`;
  }, [input]);

  // Click outside listener for attachment popover menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Auto dismiss error after 6 seconds
  useEffect(() => {
    if (!uploadError) return;
    const timer = setTimeout(() => {
      setUploadError(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [uploadError]);

  // Process files into base64 payload attachments
  const processFiles = useCallback(async (filesList) => {
    if (!filesList || filesList.length === 0) return;

    const files = Array.from(filesList);
    setUploadError(null);

    // Check count constraint
    if (attachments.length + files.length > MAX_ATTACHMENTS) {
      setUploadError(`Maximum ${MAX_ATTACHMENTS} attachments allowed per message.`);
      return;
    }

    setIsProcessingFiles(true);
    const newAttachments = [];

    for (const file of files) {
      const category = resolveFileCategory(file);

      if (!category) {
        setUploadError(
          `"${file.name}" is not supported. Supported: Images (PNG, JPG, WEBP) & Documents (PDF, TXT, MD, CSV, JSON).`
        );
        continue;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setUploadError(
          `"${file.name}" exceeds the 10 MB file limit (${formatBytes(file.size)}).`
        );
        continue;
      }

      try {
        const base64Promise = new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });

        const dataUrl = await base64Promise;
        const base64Data = dataUrl.split(',')[1] || '';

        newAttachments.push({
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          name: file.name,
          size: file.size,
          type: file.type || (category === 'image' ? 'image/png' : 'text/plain'),
          category,
          dataUrl,
          base64Data,
        });
      } catch (err) {
        setUploadError(`Could not read "${file.name}": ${err.message}`);
      }
    }

    if (newAttachments.length > 0) {
      setAttachments(prev => [...prev, ...newAttachments].slice(0, MAX_ATTACHMENTS));
    }
    setIsProcessingFiles(false);
  }, [attachments.length]);

  const handleFileInputChange = (e) => {
    processFiles(e.target.files);
    e.target.value = ''; // Reset input so same file can be re-selected if removed
    setShowMenu(false);
  };

  const handleRemoveAttachment = (idToRemove) => {
    setAttachments(prev => prev.filter(att => att.id !== idToRemove));
  };

  // Clipboard paste support (e.g. screenshot paste Ctrl+V)
  const handlePaste = (e) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      const pastedFiles = Array.from(e.clipboardData.files);
      const validMedia = pastedFiles.filter(f => resolveFileCategory(f));
      if (validMedia.length > 0) {
        e.preventDefault();
        processFiles(validMedia);
      }
    }
  };

  // Drag and drop handlers over composer
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      setIsDragging(false);
      dragCounterRef.current = 0;
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (enterToSend && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (isGenerating) {
      onStopGeneration();
      return;
    }

    const trimmed = input.trim();
    const hasAttachments = attachments.length > 0;

    if ((!trimmed && !hasAttachments) || disabled || isProcessingFiles) return;
    if (input.length > MAX_CHAR_COUNT) return;

    onSendMessage(trimmed, attachments);
    setInput('');
    setAttachments([]);
    setUploadError(null);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const charCount = input.length;
  const isNearLimit = charCount > MAX_CHAR_COUNT * 0.85;
  const isOverLimit = charCount > MAX_CHAR_COUNT;
  const hasContentOrMedia = (input.trim().length > 0 || attachments.length > 0) && !isOverLimit && !disabled;

  return (
    <div className="w-full max-w-3xl lg:max-w-4xl mx-auto px-4 pb-3 sm:pb-5 select-none">
      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
        aria-hidden="true"
      />
      <input
        ref={docInputRef}
        type="file"
        accept="application/pdf,text/plain,text/markdown,text/csv,application/json,.pdf,.txt,.md,.csv,.json"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="mb-2 px-4 py-2.5 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between shadow-lg animate-fadeIn backdrop-blur-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="p-1 text-rose-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Rounded Composer Panel */}
      <form
        onSubmit={handleSubmit}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative flex flex-col rounded-[26px] bg-[#0E111A]/95 border shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-300 ${
          isDragging
            ? 'border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.35)] bg-cyan-950/20'
            : 'border-white/[0.12] focus-within:border-cyan-400/50 focus-within:shadow-[0_0_35px_rgba(6,182,212,0.18),0_15px_50px_rgba(0,0,0,0.7)]'
        }`}
      >
        {/* Drag and Drop Visual Overlay */}
        {isDragging && (
          <div className="absolute inset-0 rounded-[26px] bg-cyan-950/60 border-2 border-dashed border-cyan-400 flex items-center justify-center z-40 backdrop-blur-sm pointer-events-none animate-fadeIn">
            <div className="flex items-center gap-3 text-cyan-300 font-medium text-sm">
              <ImageIcon className="w-5 h-5 animate-bounce" />
              <span>Drop images or documents here to attach</span>
            </div>
          </div>
        )}

        {/* Attachment Preview Carousel / Chips */}
        {attachments.length > 0 && (
          <div className="px-4 pt-3.5 pb-1 flex flex-wrap gap-2.5 border-b border-white/[0.06]">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="group relative flex items-center gap-2.5 pl-2 pr-2.5 py-1.5 rounded-xl bg-[#161A26] border border-white/10 hover:border-cyan-500/40 shadow-sm transition-all"
              >
                {att.category === 'image' ? (
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-black/40 shrink-0 border border-white/10">
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    {getDocumentIcon(att.name, att.type)}
                  </div>
                )}

                <div className="flex flex-col min-w-0 max-w-[130px] sm:max-w-[180px]">
                  <span className="text-xs text-slate-200 font-medium truncate">
                    {att.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatBytes(att.size)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(att.id)}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/40 transition-colors"
                  title="Remove attachment"
                  aria-label="Remove attachment"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {isProcessingFiles && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 text-slate-400 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Reading files...</span>
              </div>
            )}
          </div>
        )}

        {/* Multiline Textarea Input Area */}
        <div className="px-5 pt-3.5 pb-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={disabled}
            placeholder={
              isGenerating
                ? 'KAIRO AI is synthesizing an answer...'
                : attachments.length > 0
                ? 'Ask a question or add details about your attachment...'
                : 'Message KAIRO AI...'
            }
            className="w-full resize-none bg-transparent text-[15px] text-slate-100 placeholder-slate-500 focus:outline-none max-h-52 overflow-y-auto leading-relaxed font-sans"
          />
        </div>

        {/* Input Controls Bar */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1">
          {/* Left Actions: Attachment Popover Menu */}
          <div className="flex items-center gap-2 relative" ref={menuRef}>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(prev => !prev)}
                className={`p-2 rounded-xl transition-all border ${
                  showMenu || attachments.length > 0
                    ? 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent hover:border-white/5'
                }`}
                title="Attach images or documents"
                aria-label="Attach images or documents"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Attachment Picker Menu Popover */}
              {showMenu && (
                <div className="absolute bottom-12 left-0 w-64 p-2 rounded-2xl bg-[#121522] border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50 backdrop-blur-2xl animate-fadeIn">
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Add Media & Docs
                  </div>
                  <div className="space-y-1">
                    {/* Image Upload Option */}
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-left transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/40 transition-colors shrink-0">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-200 group-hover:text-white">
                          Upload Images
                        </div>
                        <div className="text-[10px] text-slate-400">
                          PNG, JPG, WEBP (up to 10MB)
                        </div>
                      </div>
                    </button>

                    {/* Document Upload Option */}
                    <button
                      type="button"
                      onClick={() => docInputRef.current?.click()}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-left transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 group-hover:border-blue-500/40 transition-colors shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-200 group-hover:text-white">
                          Upload Documents
                        </div>
                        <div className="text-[10px] text-slate-400">
                          PDF, TXT, CSV, JSON, MD
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/5 px-2.5 text-[10px] text-slate-400">
                    Max 5 attachments per message.
                  </div>
                </div>
              )}
            </div>

            {/* Attachment Count Pill if attached */}
            {attachments.length > 0 && (
              <span className="text-[11px] font-mono text-cyan-400/90 bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                {attachments.length} {attachments.length === 1 ? 'file' : 'files'}
              </span>
            )}

            {/* Character counter */}
            {charCount > 500 && (
              <span className={`text-[10px] font-mono ${isOverLimit ? 'text-rose-400 font-bold' : isNearLimit ? 'text-amber-400' : 'text-slate-500'}`}>
                {charCount.toLocaleString()} / {MAX_CHAR_COUNT.toLocaleString()}
              </span>
            )}
          </div>

          {/* Right Action: Send or Stop Button */}
          <div className="flex items-center gap-2">
            {isGenerating ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-white text-black flex items-center justify-center transition-all shadow-[0_0_15px_rgba(255,255,255,0.25)] active:scale-95"
                title="Stop generation"
                aria-label="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!hasContentOrMedia}
                className={`w-9 h-9 rounded-full transition-all duration-200 flex items-center justify-center ${
                  hasContentOrMedia
                    ? 'bg-gradient-to-tr from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.45)] hover:scale-105 active:scale-95 cursor-pointer font-bold'
                    : 'bg-white/[0.06] text-slate-600 cursor-not-allowed opacity-50'
                }`}
                title="Send message (Enter)"
                aria-label="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Creator Footer Branding */}
      <footer className="text-center mt-2.5 space-y-0.5 select-none leading-relaxed">
        <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 flex-wrap">
          <span>Designed & Developed by</span>
          <span className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
            Manpreet Singh
          </span>
        </div>
        <div className="text-[10px] text-slate-500 font-mono tracking-wide">
          © 2026 Manpreet Singh. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Edit2, Trash2, Check, X } from 'lucide-react';

export default function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onRename,
  onDelete,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSaveRename = (e) => {
    e?.stopPropagation();
    if (editTitle.trim()) {
      onRename(conversation.id, editTitle.trim());
    } else {
      setEditTitle(conversation.title);
    }
    setIsEditing(false);
  };

  const handleCancelRename = (e) => {
    e?.stopPropagation();
    setEditTitle(conversation.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveRename(e);
    } else if (e.key === 'Escape') {
      handleCancelRename(e);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setIsConfirmingDelete(true);
  };

  const handleConfirmDelete = (e) => {
    e.stopPropagation();
    onDelete(conversation.id);
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setIsConfirmingDelete(false);
  };

  return (
    <div
      onClick={() => !isEditing && !isConfirmingDelete && onSelect(conversation.id)}
      className={`group relative flex items-center justify-between px-3 py-2.5 mx-2 rounded-xl text-xs cursor-pointer transition-all duration-200 select-none ${
        isActive
          ? 'bg-[#141724] text-white font-medium border border-cyan-500/30 shadow-[0_4px_16px_rgba(0,0,0,0.4),0_0_12px_rgba(6,182,212,0.1)]'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
      }`}
    >
      {/* Active Left Accent Bar */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
      )}

      {/* Left Icon + Title or Inline Edit */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1.5 pl-1">
        <MessageSquare
          className={`w-3.5 h-3.5 shrink-0 transition-colors ${
            isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
          }`}
        />

        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-[#0D101C] text-xs text-white px-2 py-1 rounded-lg border border-cyan-500/70 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        ) : (
          <span className="truncate block font-normal text-slate-300 group-hover:text-white" title={conversation.title}>
            {conversation.title}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <button
              onClick={handleSaveRename}
              className="p-1 rounded-md hover:bg-emerald-500/20 text-emerald-400 transition-colors"
              title="Save"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCancelRename}
              className="p-1 rounded-md hover:bg-white/10 text-slate-400 transition-colors"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : isConfirmingDelete ? (
          <div className="flex items-center gap-1.5 bg-red-950/90 px-2 py-0.5 rounded-lg border border-red-500/40 animate-fadeIn">
            <span className="text-[10px] font-medium text-red-300">Delete?</span>
            <button
              onClick={handleConfirmDelete}
              className="p-0.5 rounded hover:bg-red-500/40 text-red-300 font-bold transition-colors"
              title="Confirm"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={handleCancelDelete}
              className="p-0.5 rounded hover:bg-white/20 text-slate-400 transition-colors"
              title="Cancel"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors"
              title="Rename"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={handleDeleteClick}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

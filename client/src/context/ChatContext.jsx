import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useSessionStorage } from '../hooks/useSessionStorage';
import { useSettings } from './SettingsContext';
import { streamChat } from '../services/api';

const ChatContext = createContext(null);

/**
 * Detects whether the current navigation event is a page refresh/reload.
 */
function isPageReload() {
  if (typeof window === 'undefined') return false;
  try {
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries && navEntries.length > 0) {
        return navEntries[0].type === 'reload';
      }
    }
    if (typeof performance !== 'undefined' && performance.navigation) {
      return performance.navigation.type === 1; // TYPE_RELOAD
    }
  } catch (e) {
    // Fallback if performance API is restricted
  }
  return false;
}

/**
 * Universal Home-First Initialization:
 * On every application load (initial open, page reload F5, or browser reopen):
 * - Always start clean on the Home Screen (activeId = null).
 * - Existing chat history in localStorage is preserved 100% intact.
 * - Stale or legacy active conversation pointers are cleared.
 */
function getInitialActiveConversationId() {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Permanently clean up legacy localStorage activeId to prevent stale cross-session restoration
    window.localStorage.removeItem('kairo_active_conversation_id');

    // 2. Clear any sessionStorage activeId so that normal page refresh or session restore
    // opens cleanly on the Home Screen without trapping user in prior chats
    window.sessionStorage.removeItem('kairo_active_conversation_id');
    window.sessionStorage.setItem('kairo_session_initialized', 'true');
    return null;
  } catch (err) {
    console.warn('[KAIRO Session] Error initializing active conversation:', err);
    return null;
  }
}

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useLocalStorage('kairo_conversations', []);
  const [activeId, setActiveId] = useSessionStorage('kairo_active_conversation_id', getInitialActiveConversationId);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  const abortControllerRef = useRef(null);
  const { settings } = useSettings();

  // Active conversation object: match by activeId
  const activeConversation = conversations.find(c => c.id === activeId) || null;

  // Listen for browser back / forward navigation between conversations
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (e) => {
      if (e.state && 'kairoConversationId' in e.state) {
        setActiveId(e.state.kairoConversationId);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setActiveId]);

  // Clear current error banner
  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  // Universal Home-First: Return to clean Home Screen without modifying or deleting saved history
  const goHome = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setActiveId(null);
    setErrorMessage(null);
    if (typeof window !== 'undefined' && window.history?.pushState) {
      window.history.pushState({ kairoConversationId: null }, '');
    }
  }, [setActiveId]);

  // Start New Chat: Navigates to clean Home Screen ready for first send
  const createNewChat = useCallback(() => {
    goHome();
    return null;
  }, [goHome]);

  // Explicit blank thread generator (preserved for programmatic compatibility and test assertions)
  const createBlankChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);

    if (activeConversation && Array.isArray(activeConversation.messages) && activeConversation.messages.length === 0) {
      setErrorMessage(null);
      return activeConversation.id;
    }

    const newChat = {
      id: `kairo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };

    setConversations(prev => [newChat, ...prev]);
    setActiveId(newChat.id);
    setErrorMessage(null);
    if (typeof window !== 'undefined' && window.history?.pushState) {
      window.history.pushState({ kairoConversationId: newChat.id }, '');
    }
    return newChat.id;
  }, [activeConversation, setConversations, setActiveId]);

  // Select an existing conversation
  const selectConversation = useCallback((id) => {
    if (isGenerating && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
    setActiveId(id);
    setErrorMessage(null);
    if (typeof window !== 'undefined' && window.history?.pushState) {
      window.history.pushState({ kairoConversationId: id }, '');
    }
  }, [isGenerating, setActiveId]);

  // Rename a conversation
  const renameConversation = useCallback((id, newTitle) => {
    if (!newTitle || newTitle.trim() === '') return;
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, title: newTitle.trim(), updatedAt: new Date().toISOString() } : c))
    );
  }, [setConversations]);

  // Delete a conversation
  const deleteConversation = useCallback((id) => {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (activeId === id) {
        setActiveId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  }, [activeId, setActiveId, setConversations]);

  // Clear all conversations
  const clearAllConversations = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setConversations([]);
    setActiveId(null);
    setErrorMessage(null);
  }, [setActiveId, setConversations]);

  // Stop active generation
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);

    if (activeId) {
      setConversations(prev =>
        prev.map(c => {
          if (c.id === activeId) {
            return {
              ...c,
              messages: c.messages.map(m => (m.isStreaming ? { ...m, isStreaming: false } : m)),
            };
          }
          return c;
        })
      );
    }
  }, [activeId, setConversations]);

  // Send a message with optional text and attachments (images & documents)
  const sendMessage = useCallback(async (content, attachments = []) => {
    const trimmed = typeof content === 'string' ? content.trim() : '';
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    if ((trimmed === '' && !hasAttachments) || isGenerating) return;

    setErrorMessage(null);

    // Identify target conversation
    let targetId = activeId;
    let currentConv = conversations.find(c => c.id === targetId);
    const isNewChat = !targetId || !currentConv;
    const convId = isNewChat
      ? `kairo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      : targetId;

    const userMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: trimmed,
      attachments: hasAttachments ? attachments.map(a => ({
        id: a.id || `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: a.name || 'attachment',
        type: a.type || 'application/octet-stream',
        size: a.size || 0,
        category: a.category || (a.type?.startsWith('image/') ? 'image' : 'document'),
        dataUrl: a.dataUrl || '',
        base64Data: a.base64Data || (a.dataUrl?.includes(',') ? a.dataUrl.split(',')[1] : ''),
      })) : [],
      timestamp: new Date().toISOString(),
    };

    const assistantMsgId = `msg_${Date.now()}_a`;
    const initialAssistantMsg = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };

    let title = isNewChat || (currentConv && currentConv.messages.length === 0)
      ? (trimmed.length > 0
          ? (trimmed.length > 36 ? `${trimmed.slice(0, 36).trim()}...` : trimmed)
          : (hasAttachments ? `${attachments[0].name || 'Attached File'}` : 'New Conversation'))
      : currentConv.title;

    // Atomically persist message into conversation state
    if (isNewChat) {
      const newChat = {
        id: convId,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [userMessage, initialAssistantMsg],
      };
      setConversations(prev => [newChat, ...prev.filter(c => c.id !== convId)]);
      setActiveId(convId);
    } else {
      setConversations(prev =>
        prev.map(c => {
          if (c.id === convId) {
            return {
              ...c,
              title,
              updatedAt: new Date().toISOString(),
              messages: [...c.messages, userMessage, initialAssistantMsg],
            };
          }
          return c;
        })
      );
    }

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    // Prepare context messages (excluding empty drafts or failed tokens)
    const priorMessages = isNewChat || !currentConv ? [] : currentConv.messages;
    const contextMessages = [
      ...priorMessages
        .filter(m => (m.content && m.content.trim() !== '') || (Array.isArray(m.attachments) && m.attachments.length > 0))
        .map(m => ({
          role: m.role,
          content: m.content || '',
          attachments: m.attachments || [],
        })),
      {
        role: 'user',
        content: trimmed,
        attachments: userMessage.attachments,
      },
    ];

    let accumulatedContent = '';

    try {
      await streamChat(contextMessages, {
        systemInstruction: settings.systemInstruction,
        temperature: settings.temperature,
        signal: abortControllerRef.current?.signal,
        onChunk: (chunk) => {
          accumulatedContent += chunk;
          setConversations(prev =>
            prev.map(c => {
              if (c.id === convId) {
                return {
                  ...c,
                  updatedAt: new Date().toISOString(),
                  messages: c.messages.map(m =>
                    m.id === assistantMsgId
                      ? { ...m, content: accumulatedContent, isStreaming: true }
                      : m
                  ),
                };
              }
              return c;
            })
          );
        },
        onError: (err) => {
          console.error('[KAIRO Chat Error]:', err);
          setErrorMessage(err);
          setConversations(prev =>
            prev.map(c => {
              if (c.id === convId) {
                return {
                  ...c,
                  messages: c.messages.map(m =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content: accumulatedContent || `*Error: ${err}*`,
                          isStreaming: false,
                          isError: true,
                        }
                      : m
                  ),
                };
              }
              return c;
            })
          );
        },
        onFinish: () => {
          setConversations(prev =>
            prev.map(c => {
              if (c.id === convId) {
                return {
                  ...c,
                  messages: c.messages.map(m =>
                    m.id === assistantMsgId ? { ...m, isStreaming: false } : m
                  ),
                };
              }
              return c;
            })
          );
        },
      });
    } catch (unexpectedError) {
      console.error('[KAIRO Stream Exception]:', unexpectedError);
      setErrorMessage(unexpectedError.message || 'Communication error with AI service.');
      setConversations(prev =>
        prev.map(c => {
          if (c.id === convId) {
            return {
              ...c,
              messages: c.messages.map(m =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: accumulatedContent || `*Error: ${unexpectedError.message}*`,
                      isStreaming: false,
                      isError: true,
                    }
                  : m
              ),
            };
          }
          return c;
        })
      );
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [activeId, conversations, isGenerating, setConversations, setActiveId, settings.systemInstruction, settings.temperature]);

  // Regenerate last response
  const regenerateLastResponse = useCallback(async () => {
    if (!activeConversation || isGenerating || activeConversation.messages.length === 0) return;

    setErrorMessage(null);
    const msgs = activeConversation.messages;
    const lastMsg = msgs[msgs.length - 1];

    let messagesToKeep = [...msgs];
    if (lastMsg.role === 'assistant') {
      messagesToKeep.pop();
    }

    if (messagesToKeep.length === 0) return;
    const lastUserMsg = messagesToKeep[messagesToKeep.length - 1];
    if (lastUserMsg.role !== 'user') return;

    const convId = activeConversation.id;
    const assistantMsgId = `msg_${Date.now()}_a`;
    const placeholderAssistant = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };

    setConversations(prev =>
      prev.map(c => {
        if (c.id === convId) {
          return {
            ...c,
            updatedAt: new Date().toISOString(),
            messages: [...messagesToKeep, placeholderAssistant],
          };
        }
        return c;
      })
    );

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    const contextMessages = messagesToKeep
      .filter(m => (m.content && m.content.trim() !== '') || (Array.isArray(m.attachments) && m.attachments.length > 0))
      .map(m => ({
        role: m.role,
        content: m.content || '',
        attachments: m.attachments || [],
      }));

    let accumulatedContent = '';

    try {
      await streamChat(contextMessages, {
        systemInstruction: settings.systemInstruction,
        temperature: settings.temperature,
        signal: abortControllerRef.current?.signal,
        onChunk: (chunk) => {
          accumulatedContent += chunk;
          setConversations(prev =>
            prev.map(c => {
              if (c.id === convId) {
                return {
                  ...c,
                  messages: c.messages.map(m =>
                    m.id === assistantMsgId
                      ? { ...m, content: accumulatedContent, isStreaming: true }
                      : m
                  ),
                };
              }
              return c;
            })
          );
        },
        onError: (err) => {
          setErrorMessage(err);
          setConversations(prev =>
            prev.map(c => {
              if (c.id === convId) {
                return {
                  ...c,
                  messages: c.messages.map(m =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content: accumulatedContent || `*Error: ${err}*`,
                          isStreaming: false,
                          isError: true,
                        }
                      : m
                  ),
                };
              }
              return c;
            })
          );
        },
        onFinish: () => {
          setConversations(prev =>
            prev.map(c => {
              if (c.id === convId) {
                return {
                  ...c,
                  messages: c.messages.map(m =>
                    m.id === assistantMsgId ? { ...m, isStreaming: false } : m
                  ),
                };
              }
              return c;
            })
          );
        },
      });
    } catch (unexpectedError) {
      console.error('[KAIRO Regenerate Exception]:', unexpectedError);
      setErrorMessage(unexpectedError.message || 'Communication error during response regeneration.');
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [activeConversation, isGenerating, setConversations, settings.systemInstruction, settings.temperature]);

  // Export conversations as JSON file
  const exportChatsJSON = useCallback(() => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(conversations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kairo_ai_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [conversations]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeId,
        activeConversation,
        isGenerating,
        searchQuery,
        setSearchQuery,
        errorMessage,
        setErrorMessage,
        clearError,
        goHome,
        createNewChat,
        createBlankChat,
        selectConversation,
        renameConversation,
        deleteConversation,
        clearAllConversations,
        sendMessage,
        stopGeneration,
        regenerateLastResponse,
        exportChatsJSON,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null || item === 'undefined') {
        return initialValue;
      }
      const parsed = JSON.parse(item);
      // Merge with initialValue if both are plain objects and not arrays
      if (
        initialValue !== null &&
        typeof initialValue === 'object' &&
        !Array.isArray(initialValue) &&
        parsed !== null &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed)
      ) {
        return { ...initialValue, ...parsed };
      }
      return parsed;
    } catch (error) {
      console.warn(`[KAIRO Storage] Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Sync to localStorage whenever key or storedValue changes
  useEffect(() => {
    try {
      if (storedValue === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      }
    } catch (error) {
      // Gracefully handle browser quota exceeded by pruning heavy media base64 strings
      if (
        error &&
        (error.name === 'QuotaExceededError' ||
          error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          error.code === 22)
      ) {
        console.warn(`[KAIRO Storage] Storage quota reached for "${key}". Pruning attachment payloads to retain chat history...`);
        try {
          if (Array.isArray(storedValue)) {
            const pruned = storedValue.map(conv => ({
              ...conv,
              messages: (conv.messages || []).map(msg => ({
                ...msg,
                attachments: (msg.attachments || []).map(att => ({
                  id: att.id,
                  name: att.name,
                  size: att.size,
                  type: att.type,
                  category: att.category,
                }))
              }))
            }));
            window.localStorage.setItem(key, JSON.stringify(pruned));
          }
        } catch (pruneErr) {
          console.error(`[KAIRO Storage] Critical storage failure:`, pruneErr);
        }
      } else {
        console.error(`[KAIRO Storage] Error writing localStorage key "${key}":`, error);
      }
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

import { useState, useEffect } from 'react';

/**
 * Custom hook for managing state synchronized with window.sessionStorage.
 * Survives page reloads within the same browsing context/tab, but initializes
 * fresh on new browser sessions, windows, or tabs.
 */
export function useSessionStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return typeof initialValue === 'function' ? initialValue() : initialValue;
    }

    try {
      // If initialValue is a factory function, allow it to compute the authoritative initial state
      if (typeof initialValue === 'function') {
        const computed = initialValue();
        if (computed === null || computed === undefined) {
          window.sessionStorage.removeItem(key);
        } else {
          window.sessionStorage.setItem(key, JSON.stringify(computed));
        }
        return computed;
      }

      const item = window.sessionStorage.getItem(key);
      if (item === null || item === 'undefined') {
        return initialValue;
      }
      return JSON.parse(item);
    } catch (error) {
      console.warn(`[KAIRO Storage] Error reading sessionStorage key "${key}":`, error);
      return typeof initialValue === 'function' ? initialValue() : initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (storedValue === undefined || storedValue === null) {
        window.sessionStorage.removeItem(key);
      } else {
        window.sessionStorage.setItem(key, JSON.stringify(storedValue));
      }
    } catch (error) {
      console.warn(`[KAIRO Storage] Error writing sessionStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

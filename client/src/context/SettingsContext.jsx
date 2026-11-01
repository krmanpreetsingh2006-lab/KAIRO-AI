import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { checkHealth } from '../services/api';

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  theme: 'obsidian',
  accent: 'violet',
  temperature: 0.7,
  systemInstruction: '',
  codeWordWrap: true,
  enterToSend: true,
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useLocalStorage('kairo_settings', DEFAULT_SETTINGS);
  const [serverHealth, setServerHealth] = useState({
    status: 'checking',
    apiKeyConfigured: false,
    model: 'gemini-flash-lite-latest',
    uptime: 0,
    timestamp: '',
    error: null,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Poll server health on mount and provide manual refresh
  const refreshHealth = useCallback(async () => {
    setServerHealth(prev => ({ ...prev, status: 'checking' }));
    try {
      const data = await checkHealth();
      setServerHealth({
        status: data.status || 'offline',
        apiKeyConfigured: Boolean(data.apiKeyConfigured),
        model: data.model || 'gemini-3.8-flash',
        uptime: data.uptime || 0,
        timestamp: data.timestamp || '',
        error: data.error || null,
      });
    } catch (err) {
      setServerHealth({
        status: 'offline',
        apiKeyConfigured: false,
        model: 'gemini-flash-lite-latest',
        uptime: 0,
        timestamp: '',
        error: err.message,
      });
    }
  }, []);

  useEffect(() => {
    refreshHealth();
    // Refresh health check every 60 seconds
    const interval = setInterval(refreshHealth, 60000);
    return () => clearInterval(interval);
  }, [refreshHealth]);

  // Apply theme class to documentElement
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-obsidian', 'theme-midnight-violet', 'theme-graphite');
    root.classList.add(`theme-${settings.theme || 'obsidian'}`);
  }, [settings.theme]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
        resetSettings,
        serverHealth,
        refreshHealth,
        isSettingsOpen,
        setIsSettingsOpen,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

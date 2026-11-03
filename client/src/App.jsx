import React, { useState, useEffect } from 'react';
import { SettingsProvider } from './context/SettingsContext';
import { ChatProvider } from './context/ChatContext';
import Sidebar from './components/sidebar/Sidebar';
import ChatArea from './components/chat/ChatArea';
import SettingsModal from './components/settings/SettingsModal';

function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Synchronize mobile drawer with browser back gesture & navigation
  useEffect(() => {
    if (!mobileOpen) return;

    if (typeof window !== 'undefined' && window.history?.pushState) {
      window.history.pushState({ kairoDrawerOpen: true }, '');
    }

    const handlePopState = (e) => {
      setMobileOpen(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (typeof window !== 'undefined' && window.history?.state?.kairoDrawerOpen) {
        window.history.back();
      }
    };
  }, [mobileOpen]);

  return (
    <div className="flex h-screen h-[100dvh] w-full max-w-[100vw] overflow-hidden bg-[#07080C] text-slate-100 font-sans">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(prev => !prev)}
      />

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <ChatArea
          onOpenMobileSidebar={() => setMobileOpen(true)}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal />
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <ChatProvider>
        <MainLayout />
      </ChatProvider>
    </SettingsProvider>
  );
}

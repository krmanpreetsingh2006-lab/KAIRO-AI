import React, { useState } from 'react';
import { SettingsProvider } from './context/SettingsContext';
import { ChatProvider } from './context/ChatContext';
import Sidebar from './components/sidebar/Sidebar';
import ChatArea from './components/chat/ChatArea';
import SettingsModal from './components/settings/SettingsModal';

function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

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

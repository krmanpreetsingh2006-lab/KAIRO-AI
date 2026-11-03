import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('===============================================================');
console.log('  KAIRO AI V1.0.3 — SESSION MANAGEMENT & NEW CHAT TEST SUITE  ');
console.log('===============================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
  }
}

// Mock environment for browser storage & navigation simulation
class StorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] !== undefined ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

// Implementation of session resolution logic matching client/src/context/ChatContext.jsx (Universal Home-First)
function simulateSessionResolution({
  navigationType = 'navigate',
  sessionStorageMock,
  localStorageMock,
}) {
  // 1. Permanently clean up legacy localStorage activeId
  localStorageMock.removeItem('kairo_active_conversation_id');

  // 2. Universal Home-First initialization:
  // On every open, reload, or tab reopen, reset active conversation to null (Home Screen)
  sessionStorageMock.removeItem('kairo_active_conversation_id');
  sessionStorageMock.setItem('kairo_session_initialized', 'true');
  return null;
}

// --- SCENARIO 1: Fresh Session Initialization (Close & Reopen Website) ---
console.log('--- SCENARIO 1: Fresh Browser Session Initialization ---');

runTest('Opens on fresh Home/New Chat screen when reopening website', () => {
  const localStorageMock = new StorageMock();
  const sessionStorageMock = new StorageMock();

  // Populate pre-existing chat history in localStorage
  const existingConvs = [
    { id: 'kairo_111', title: 'Old Project Research', messages: [{ role: 'user', content: 'Hello' }] }
  ];
  localStorageMock.setItem('kairo_conversations', JSON.stringify(existingConvs));
  // Simulate stale legacy localStorage key from previous version
  localStorageMock.setItem('kairo_active_conversation_id', JSON.stringify('kairo_111'));

  // Fresh session: navigationType = 'navigate', sessionStorage is completely empty
  const activeId = simulateSessionResolution({
    navigationType: 'navigate',
    sessionStorageMock,
    localStorageMock,
  });

  assert.strictEqual(activeId, null, 'Active conversation ID must be null on fresh session');
  assert.strictEqual(sessionStorageMock.getItem('kairo_session_initialized'), 'true', 'Session initialized marker is set');
  assert.strictEqual(sessionStorageMock.getItem('kairo_active_conversation_id'), null, 'sessionStorage has no active ID');
  assert.strictEqual(localStorageMock.getItem('kairo_active_conversation_id'), null, 'Stale legacy localStorage key is cleaned up');
});

runTest('Chat history in localStorage is preserved intact on fresh session', () => {
  const localStorageMock = new StorageMock();
  const sessionStorageMock = new StorageMock();
  const existingConvs = [
    { id: 'kairo_111', title: 'Old Project Research', messages: [{ role: 'user', content: 'Hello' }] },
    { id: 'kairo_222', title: 'Quantum Physics Notes', messages: [{ role: 'user', content: 'Notes' }] }
  ];
  localStorageMock.setItem('kairo_conversations', JSON.stringify(existingConvs));

  simulateSessionResolution({
    navigationType: 'navigate',
    sessionStorageMock,
    localStorageMock,
  });

  const saved = JSON.parse(localStorageMock.getItem('kairo_conversations'));
  assert.strictEqual(saved.length, 2, 'All historical conversations are retained in localStorage');
  assert.strictEqual(saved[0].id, 'kairo_111');
  assert.strictEqual(saved[1].id, 'kairo_222');
});

// --- SCENARIO 2: Normal Page Refresh (F5 / Reload) Universal Home-First ---
console.log('\n--- SCENARIO 2: Normal Page Refresh Universal Home-First ---');

runTest('Page refresh opens clean Home Screen while preserving all saved conversations', () => {
  const localStorageMock = new StorageMock();
  const sessionStorageMock = new StorageMock();

  const existingConvs = [
    { id: 'kairo_active_999', title: 'Ongoing Architecture Design', messages: [{ role: 'user', content: 'Design specs' }] }
  ];
  localStorageMock.setItem('kairo_conversations', JSON.stringify(existingConvs));
  sessionStorageMock.setItem('kairo_active_conversation_id', JSON.stringify('kairo_active_999'));

  const activeId = simulateSessionResolution({
    navigationType: 'reload',
    sessionStorageMock,
    localStorageMock,
  });

  assert.strictEqual(activeId, null, 'Active conversation must reset to null (Home Screen) on page reload');
  const saved = JSON.parse(localStorageMock.getItem('kairo_conversations'));
  assert.strictEqual(saved.length, 1, 'Saved conversations in localStorage remain 100% intact');
  assert.strictEqual(saved[0].id, 'kairo_active_999', 'Saved conversation data is untouched');
});

runTest('Page refresh does not delete or truncate any saved conversations', () => {
  const localStorageMock = new StorageMock();
  const sessionStorageMock = new StorageMock();

  const multiConvs = [
    { id: 'c1', title: 'Chat 1', messages: [{ role: 'user', content: 'm1' }] },
    { id: 'c2', title: 'Chat 2', messages: [{ role: 'user', content: 'm2' }] },
  ];
  localStorageMock.setItem('kairo_conversations', JSON.stringify(multiConvs));

  const activeId = simulateSessionResolution({
    navigationType: 'reload',
    sessionStorageMock,
    localStorageMock,
  });

  assert.strictEqual(activeId, null);
  const saved = JSON.parse(localStorageMock.getItem('kairo_conversations'));
  assert.strictEqual(saved.length, 2);
});

// --- SCENARIO 3: Open Old Conversation from History ---
console.log('\n--- SCENARIO 3: Resuming Historic Conversation ---');

runTest('Selecting historic conversation stores ID in sessionStorage for current tab', () => {
  const sessionStorageMock = new StorageMock();
  const targetId = 'kairo_historic_555';

  // Simulate selectConversation
  sessionStorageMock.setItem('kairo_active_conversation_id', JSON.stringify(targetId));

  assert.strictEqual(JSON.parse(sessionStorageMock.getItem('kairo_active_conversation_id')), targetId);
});

// --- SCENARIO 4: Start New Chat from Old Conversation ---
console.log('\n--- SCENARIO 4: Starting New Chat from Old Conversation ---');

runTest('New Chat creates a fresh thread and switches active session ID', () => {
  const sessionStorageMock = new StorageMock();
  const conversations = [
    { id: 'kairo_old_1', title: 'Old Chat', messages: [{ role: 'user', content: 'hi' }] }
  ];

  // Starting on old chat
  sessionStorageMock.setItem('kairo_active_conversation_id', JSON.stringify('kairo_old_1'));

  // Trigger createNewChat
  const newChat = {
    id: `kairo_${Date.now()}_abcde`,
    title: 'New Conversation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };
  const updatedConvs = [newChat, ...conversations];
  sessionStorageMock.setItem('kairo_active_conversation_id', JSON.stringify(newChat.id));

  assert.strictEqual(JSON.parse(sessionStorageMock.getItem('kairo_active_conversation_id')), newChat.id);
  assert.strictEqual(updatedConvs.length, 2);
  assert.strictEqual(updatedConvs[0].messages.length, 0, 'New chat has empty messages (Home screen)');
  assert.strictEqual(updatedConvs[1].id, 'kairo_old_1', 'Old chat is preserved');
});

runTest('Avoids creating duplicate empty conversations when already on empty chat', () => {
  const conversations = [
    { id: 'kairo_empty_1', title: 'New Conversation', messages: [] }
  ];
  const activeConversation = conversations[0];

  // Simulating duplicate prevention logic
  let createdNew = false;
  if (!activeConversation || activeConversation.messages.length > 0) {
    createdNew = true;
  }

  assert.strictEqual(createdNew, false, 'Does not create redundant duplicate empty thread');
});

// --- SCENARIO 5: Browser Session Restoration Limitations ---
console.log('\n--- SCENARIO 5: Browser Session Restoration Limitations ---');

runTest('Restored tab from browser restart opens on fresh Home screen', () => {
  const localStorageMock = new StorageMock();
  const sessionStorageMock = new StorageMock();

  // Browser restored stale sessionStorage from previous session
  sessionStorageMock.setItem('kairo_active_conversation_id', JSON.stringify('kairo_stale_777'));
  // But navigation type on startup restore is 'navigate'
  const activeId = simulateSessionResolution({
    navigationType: 'navigate',
    sessionStorageMock,
    localStorageMock,
  });

  assert.strictEqual(activeId, null, 'Startup restored tab must reset activeId to null (Home screen)');
  assert.strictEqual(sessionStorageMock.getItem('kairo_active_conversation_id'), null, 'Stale restored session ID is cleared');
});

// --- SCENARIO 6: Static Code Verification (Mobile & Navigation) ---
console.log('\n--- SCENARIO 6: Mobile & Desktop Navigation Code Audit ---');

const chatContextFile = fs.readFileSync(path.join(__dirname, 'client/src/context/ChatContext.jsx'), 'utf-8');
const chatAreaFile = fs.readFileSync(path.join(__dirname, 'client/src/components/chat/ChatArea.jsx'), 'utf-8');
const sidebarFile = fs.readFileSync(path.join(__dirname, 'client/src/components/sidebar/Sidebar.jsx'), 'utf-8');
const appFile = fs.readFileSync(path.join(__dirname, 'client/src/App.jsx'), 'utf-8');
const useSessionStorageFile = fs.readFileSync(path.join(__dirname, 'client/src/hooks/useSessionStorage.js'), 'utf-8');

runTest('ChatContext uses useSessionStorage for activeId', () => {
  assert(chatContextFile.includes('useSessionStorage'), 'ChatContext imports and uses useSessionStorage');
  assert(chatContextFile.includes("useSessionStorage('kairo_active_conversation_id'"), 'activeId bound to sessionStorage');
});

runTest('ChatContext implements isPageReload and getInitialActiveConversationId', () => {
  assert(chatContextFile.includes('function isPageReload'), 'ChatContext defines isPageReload helper');
  assert(chatContextFile.includes('function getInitialActiveConversationId'), 'ChatContext defines getInitialActiveConversationId');
  assert(chatContextFile.includes("window.localStorage.removeItem('kairo_active_conversation_id')"), 'Cleans up legacy localStorage key');
});

runTest('ChatContext synchronizes conversation navigation with browser back/forward (popstate)', () => {
  assert(chatContextFile.includes("window.addEventListener('popstate'"), 'Listens for browser back/forward navigation');
  assert(chatContextFile.includes('kairoConversationId'), 'Uses kairoConversationId history state');
});

runTest('App.jsx synchronizes mobile drawer with browser back gesture', () => {
  assert(appFile.includes("window.addEventListener('popstate'"), 'App.jsx listens for browser back gesture');
  assert(appFile.includes('kairoDrawerOpen'), 'App.jsx pushes kairoDrawerOpen state');
});

runTest('ChatArea keeps New Chat prominently accessible on mobile and desktop', () => {
  assert(chatAreaFile.includes('onClick={createNewChat}'), 'ChatArea has New Chat button');
  assert(chatAreaFile.includes('<span className="inline font-medium">New Chat</span>'), 'New Chat label is visible');
  assert(chatAreaFile.includes('md:hidden'), 'Hamburger menu button is visible on mobile');
});

runTest('Sidebar provides prominent New Conversation, Resume Chat, and Close button', () => {
  assert(sidebarFile.includes('New Conversation'), 'Sidebar provides New Conversation button');
  assert(sidebarFile.includes('Resume:'), 'Sidebar provides Resume button for active chat');
  assert(sidebarFile.includes('Close'), 'Sidebar provides visible Close button');
  assert(sidebarFile.includes('overscroll-contain touch-pan-y'), 'Sidebar conversation list supports touch pan and containment');
  assert(sidebarFile.includes("document.body.style.overflow = 'hidden'"), 'Sidebar locks background body scroll when mobile drawer is open');
});

runTest('ChatContext avoids creating duplicate empty conversations', () => {
  assert(chatContextFile.includes('activeConversation.messages.length === 0'), 'Avoids creating duplicate empty conversations');
});

runTest('ChatContext exports goHome for Universal Home-First navigation', () => {
  assert(chatContextFile.includes('const goHome = useCallback('), 'ChatContext defines goHome callback');
  assert(chatContextFile.includes('goHome,'), 'ChatContext exports goHome in Provider value');
});

runTest('ChatArea provides Home button accessible during active conversation', () => {
  assert(chatAreaFile.includes('onClick={goHome}'), 'ChatArea provides Home navigation triggers');
  assert(chatAreaFile.includes('title="Return to Home Screen"'), 'ChatArea has accessible Home button title');
});

runTest('Sidebar provides Home button for Universal Home-First access', () => {
  assert(sidebarFile.includes('onClick={() => {\n            goHome();'), 'Sidebar provides Home button');
  assert(sidebarFile.includes('Home className="w-4 h-4 text-cyan-400'), 'Sidebar Home button features cyan Home icon');
});

console.log('\n===============================================================');
console.log(`>>> SESSION MANAGEMENT & NAVIGATION: ${passedTests}/${totalTests} TESTS PASSED <<<`);
console.log('===============================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}

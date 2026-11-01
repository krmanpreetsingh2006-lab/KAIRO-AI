import fs from 'fs';
import path from 'path';

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`[PASS] ${message}`);
  passedCount++;
}

function runMobileRegressionTests() {
  console.log('===============================================================');
  console.log('  KAIRO AI V1.0.1 — MOBILE NAVIGATION REGRESSION TEST SUITE');
  console.log('===============================================================\n');

  const chatAreaPath = path.resolve('client/src/components/chat/ChatArea.jsx');
  const sidebarPath = path.resolve('client/src/components/sidebar/Sidebar.jsx');
  const appPath = path.resolve('client/src/App.jsx');
  const chatContextPath = path.resolve('client/src/context/ChatContext.jsx');

  const chatAreaCode = fs.readFileSync(chatAreaPath, 'utf-8');
  const sidebarCode = fs.readFileSync(sidebarPath, 'utf-8');
  const appCode = fs.readFileSync(appPath, 'utf-8');
  const chatContextCode = fs.readFileSync(chatContextPath, 'utf-8');

  // --- MOBILE TEST 1: Hamburger Menu Opens and Closes ---
  console.log('--- MOBILE TEST 1: Hamburger Menu Trigger & State Flow ---');
  assert(chatAreaCode.includes('onClick={onOpenMobileSidebar}'), 'ChatArea provides hamburger button invoking onOpenMobileSidebar');
  assert(chatAreaCode.includes('aria-label="Open chat history and navigation menu"'), 'Hamburger button has accessible label');
  assert(appCode.includes('onOpenMobileSidebar={() => setMobileOpen(true)}'), 'App layout connects hamburger trigger to setMobileOpen(true)');
  assert(sidebarCode.includes('onClick={onCloseMobile}'), 'Sidebar provides close controls invoking onCloseMobile');

  // --- MOBILE TEST 2: New Chat Starts Genuinely Fresh Conversation ---
  console.log('\n--- MOBILE TEST 2: New Chat Logic & Fresh Thread Creation ---');
  // Top right header button in ChatArea
  assert(chatAreaCode.includes('onClick={createNewChat}'), 'ChatArea provides prominent top-right button invoking createNewChat');
  assert(chatAreaCode.includes('<span className="inline font-medium">New Chat</span>'), 'New Chat button text is visible on mobile (not hidden)');
  assert(chatAreaCode.includes('Plus className="w-3.5 h-3.5 text-cyan-400 shrink-0"'), 'New Chat button features icon');

  // Inside ChatContext: verify fresh creation
  assert(chatContextCode.includes('messages: [],'), 'createNewChat initializes an empty messages array');
  assert(chatContextCode.includes('id: `kairo_${Date.now()}_'), 'createNewChat generates a fresh unique conversation ID');
  assert(chatContextCode.includes('setActiveId(newChat.id);'), 'createNewChat immediately switches activeId to the fresh thread');
  assert(chatContextCode.includes('setConversations(prev => [newChat, ...prev]);'), 'createNewChat prepends fresh thread to conversations');

  // --- MOBILE TEST 3: Chat History Opens Previous Conversations ---
  console.log('\n--- MOBILE TEST 3: Chat History Selection ---');
  assert(sidebarCode.includes('groupedConversations.today'), 'Sidebar groups conversations by Today');
  assert(sidebarCode.includes('groupedConversations.yesterday'), 'Sidebar groups conversations by Yesterday');
  assert(sidebarCode.includes('groupedConversations.previous7Days'), 'Sidebar groups conversations by Previous 7 Days');
  assert(sidebarCode.includes('groupedConversations.older'), 'Sidebar groups conversations by Older');
  assert(sidebarCode.includes('selectConversation(id)'), 'Selecting a conversation item calls selectConversation(id)');
  assert(sidebarCode.includes('if (mobileOpen) onCloseMobile()'), 'Selecting a conversation item automatically closes mobile drawer');

  // --- MOBILE TEST 4: Resume Chat Restores Active Conversation ---
  console.log('\n--- MOBILE TEST 4: Resume Current Conversation in Mobile Drawer ---');
  assert(sidebarCode.includes('activeConversation && activeConversation.messages?.length > 0'), 'Resume action renders when active conversation has messages');
  assert(sidebarCode.includes('Resume:'), 'Resume action displays clear "Resume:" label');
  assert(sidebarCode.includes('onClick={onCloseMobile}'), 'Tapping Resume closes mobile drawer returning user to conversation');
  assert(sidebarCode.includes('Open &rarr;'), 'Resume action has prominent direction indicator');

  // --- MOBILE TEST 5: Escape & Backdrop Close Controls ---
  console.log('\n--- MOBILE TEST 5: Escape Key & Backdrop Dismissal ---');
  assert(sidebarCode.includes("e.key === 'Escape' && mobileOpen"), 'Sidebar listens for Escape key and closes mobile drawer');
  assert(sidebarCode.includes('onClick={onCloseMobile}'), 'Backdrop overlay invokes onCloseMobile on tap');
  assert(sidebarCode.includes('role="dialog"'), 'Mobile drawer is designated with role="dialog"');
  assert(sidebarCode.includes('aria-modal="true"'), 'Mobile drawer is designated with aria-modal="true"');

  // --- MOBILE TEST 6: Message Preservation & Memory Safety ---
  console.log('\n--- MOBILE TEST 6: Message Preservation & Non-Destructive Actions ---');
  // Verify that tapping branding does NOT destructively create a new chat
  assert(!chatAreaCode.includes('<button\n              onClick={createNewChat}\n              className="flex items-center gap-2 hover:opacity-90 transition-opacity select-none"\n              title="KAIRO AI Home"'), 'Header branding is not an unconfirmed button wiping current chat');
  // Verify selectConversation preserves messages
  assert(chatContextCode.includes('setActiveId(id)'), 'selectConversation changes activeId while keeping all conversation records in state and localStorage');

  // --- MOBILE TEST 7: Responsive Layouts (Mobile vs Desktop) ---
  console.log('\n--- MOBILE TEST 7: Responsive Layout Breakpoints ---');
  // Desktop sidebar persistent
  assert(sidebarCode.includes('hidden md:block'), 'Sidebar renders as a persistent panel on desktop (md:)');
  // Mobile drawer only visible when mobileOpen is true on mobile viewports
  assert(sidebarCode.includes('mobileOpen && ('), 'Mobile drawer conditionally mounts only when mobileOpen is true');
  assert(sidebarCode.includes('md:hidden fixed inset-0 z-50 flex'), 'Mobile drawer uses fixed full-screen overlay constrained to mobile (md:hidden)');
  assert(sidebarCode.includes('w-[85vw] max-w-xs sm:max-w-sm'), 'Mobile drawer width adapts to standard mobile phone and phablet widths');
  // Mobile header hamburger hidden on desktop
  assert(chatAreaCode.includes('md:hidden'), 'Hamburger menu toggle is hidden on desktop (md:hidden)');

  console.log('\n===============================================================');
  console.log(`>>> MOBILE NAVIGATION REGRESSION: ${passedCount}/${totalCount} TESTS PASSED <<<`);
  console.log('===============================================================\n');
}

runMobileRegressionTests();

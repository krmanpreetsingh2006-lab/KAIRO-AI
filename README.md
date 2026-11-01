# KAIRO AI — Intelligence Beyond Limits.

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF.svg)](https://vitejs.dev/)
[![Netlify](https://img.shields.io/badge/Netlify-Serverless%20Functions-00C7B7.svg)](https://www.netlify.com/)
[![Google GenAI SDK](https://img.shields.io/badge/Google%20GenAI-v2.32-8B5CF6.svg)](https://www.npmjs.com/package/@google/genai)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)

**KAIRO AI** is a premier, instant-access AI conversational platform engineered with analytical depth, architectural foresight, and elegant articulation.

Built with **React + Vite**, modern dark glassmorphic styling, and a secure **Netlify Serverless Functions** backend relay powered by the official **Google GenAI SDK** (`@google/genai`).

**Zero login friction**: No account creation, no database, and no passwords required. Opens directly into the chatbot canvas with 100% private client-side conversation persistence in browser `localStorage`.

---

## 🏛️ Architecture Overview

```
                          ┌──────────────────────────────────────────────┐
                          │         KAIRO AI Client (React + Vite)       │
                          │   Obsidian Dark UI • Markdown • Highlighting │
                          │  100% Client-Side LocalStorage Persistence   │
                          └──────────────────────┬───────────────────────┘
                                                 │
                                                 │ SSE Streaming (POST /api/chat/stream)
                                                 │ & Health Check (GET /api/health)
                                                 ▼
                          ┌──────────────────────────────────────────────┐
                          │     Netlify Serverless Functions / Relay     │
                          │ - Rate Limiting & Abuse Prevention (Sliding) │
                          │ - Strict Payload Validation & Length Limits  │
                          │ - Stateless Conduit — No Conversation DB     │
                          └──────────────────────┬───────────────────────┘
                                                 │
                                                 │ Official @google/genai SDK
                                                 │ (generateContentStream)
                                                 ▼
                          ┌──────────────────────────────────────────────┐
                          │              Google Gemini API               │
                          │    gemini-flash-lite-latest (Configurable) │
                          └──────────────────────────────────────────────┘
```

---

## 🌟 Key Capabilities

### ⚡ Instant Access & Zero Overhead
- **No Sign-In Wall**: Direct access to the complete conversational interface.
- **No Cloud Database**: No Firebase, Supabase, MongoDB, or PostgreSQL.
- **Complete Client-Side Privacy**: Chat threads, prompt history, and UI settings are persisted exclusively in your browser's `localStorage`.
- **JSON Backup & Export**: 1-click export of your full conversation history for offline backup.

### 💎 Premium Dark Obsidian Identity
- **Original Vector Identity**: Stylized geometric crystal nexus logo with subtle electric violet and cyan energy gradients.
- **Ambient Lighting**: Radial spotlight glow backdrop (`radial-gradient`), frosted glass panels, and glowing focus borders.
- **Full Markdown Engine**: Headings, lists, tables with zebra-striping, blockquotes, and language-tagged code blocks (`highlight.js`) with one-click copy.
- **Tactile Micro-Interactions**: Streaming neon cursor, glowing send button that morphs into a Stop generation button, and smart scroll-to-bottom indicator.

### 🔒 Enterprise Serverless Security
- **Isolated API Credentials**: The Google Gemini API key resides solely in server-side Netlify environment variables (`GEMINI_API_KEY`) and is never sent to or visible in client code.
- **Sliding Window Rate Limiter**: IP-based rate limiting (40 prompts/minute) prevents abuse and protects your API budget.
- **Strict Payload Sanitization**: Validates roles (`user`, `model`, `assistant`), rejects empty payloads, and enforces a 12,000-character ceiling.
- **Safe Error Masking**: Friendly, actionable error messages for quota exhaustion, invalid keys, or network failures without leaking server secrets or stack traces.

---

## 🚀 Quick Start Guide

### Step 1: Add Your Gemini API Key

Open [server/.env](file:///c:/Users/krman/OneDrive/Desktop/KAIRO-AI/server/.env) for local development:
```env
PORT=5000
GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
GEMINI_MODEL=gemini-flash-lite-latest
```
*(Get a key from [Google AI Studio](https://aistudio.google.com/app/apikey))*

---

### Step 2: Run in Development Mode

```bash
# Install all dependencies (if not already installed)
npm run install:all

# Run backend relay + Vite frontend concurrently
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend Relay**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

### Step 3: Run Unit & Serverless Tests

```bash
npm test
```
Validates the Netlify serverless functions (`netlify/functions/chat.js` and `health.js`), preflight CORS, rate limiting, and input validation.

---

## 🌐 Production Netlify Deployment Guide

### Phase 1: Push Repository to GitHub
```bash
git add .
git commit -m "feat: KAIRO AI streamlined Netlify production release"
git branch -M main
git remote add origin https://github.com/<your-username>/kairo-ai.git
git push -u origin main
```

---

### Phase 2: Deploy to Netlify
1. Log in to [app.netlify.com](https://app.netlify.com).
2. Click **"Add new site"** > **"Import an existing project"** > **GitHub** > select your `kairo-ai` repository.
3. Netlify automatically detects settings from `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist`
   - **Functions directory**: `netlify/functions`
4. Under **Site configuration > Environment variables**, add your secret:
   - `GEMINI_API_KEY`: `AIzaSy...` (your Google Gemini API key)
   - `GEMINI_MODEL`: `gemini-flash-lite-latest` (optional, default)
5. Click **"Deploy site"**.
6. Netlify will build the client and deploy the serverless functions under a live HTTPS URL (`https://<your-app>.netlify.app`).

---

### Phase 3: Connect Custom Domain (Optional)
1. In Netlify, go to **Domain management** > **Add domain** (e.g. `kairo.yourdomain.com`).
2. Point your DNS CNAME record to your Netlify site URL.
3. Netlify provisions a free Let's Encrypt SSL/TLS certificate automatically.

---

## 📁 Repository Structure

```
KAIRO-AI/
├── netlify.toml              # Netlify build, redirects, and headers configuration
├── package.json              # Root scripts and serverless dependencies
├── README.md                 # Product documentation & deployment instructions
│
├── netlify/                  # Netlify Serverless Functions (Production)
│   ├── functions/
│   │   ├── chat.js           # Serverless Gemini streaming SSE endpoint
│   │   └── health.js         # Serverless health & diagnostics endpoint
│   └── test-netlify-functions.js # Automated serverless integration tests
│
├── client/                   # React 18 + Vite 6 Frontend
│   ├── index.html            # Entry HTML with custom KAIRO favicon & fonts
│   ├── vite.config.js        # Vite config with proxy & vendor chunking
│   ├── tailwind.config.js    # Custom Obsidian & Violet palettes
│   └── src/
│       ├── main.jsx          # React DOM entry point
│       ├── App.jsx           # Clean layout without auth walls
│       ├── styles/
│       │   └── index.css     # Global tokens, typography & syntax highlight
│       ├── context/
│       │   ├── ChatContext.jsx     # Conversations & streaming management
│       │   └── SettingsContext.jsx # Theme, directives & health status
│       ├── hooks/
│       │   └── useLocalStorage.js  # Safe browser persistence
│       ├── services/
│       │   └── api.js        # SSE stream consumer & health check client
│       └── components/
│           ├── common/
│           │   └── Logo.jsx         # Original SVG vector logo & badges
│           ├── chat/
│           │   ├── ChatArea.jsx     # Header, message feed & auto-scroll
│           │   ├── ChatInput.jsx    # Textarea, send/stop & attachment info
│           │   ├── ChatMessage.jsx  # Markdown parser & code blocks
│           │   ├── CodeBlock.jsx    # Syntax highlighted code with copy
│           │   ├── WelcomeScreen.jsx# Hero welcome & suggestion cards
│           │   └── ScrollToBottom.jsx# Floating auto-scroll helper
│           ├── sidebar/
│           │   ├── Sidebar.jsx      # Slide-out drawer & chronological lists
│           │   ├── ConversationItem.jsx # Inline rename & delete modal
│           │   └── SearchBar.jsx    # Live conversation filter
│           └── settings/
│               └── SettingsModal.jsx# Themes, model info, directives & export
│
└── server/                   # Express Relay (Alternative Local Dev Server)
    ├── server.js             # Local development server
    ├── server-app.js         # Express app initialization
    └── routes/
        └── chat.js           # Local SSE stream relay
```

---

## ⚖️ License
Released under the MIT License. Developed for KAIRO AI.

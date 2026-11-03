import http from 'http';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'client/dist');
const artifactDir = 'C:\\Users\\krman\\.gemini\\antigravity\\brain\\1e5ca507-940e-498e-8854-c240c9df18d6';
const screenshotDir = path.join(artifactDir, 'screenshots');

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// 1. Static HTTP Server for Client Build
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(distDir, reqPath);

  if (!fs.existsSync(filePath)) {
    const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(indexHtml);
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.json': 'application/json',
  };
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

// Helper for CDP WebSocket messages
class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

const VIEWPORTS = [
  { name: 'iPhone SE (1st gen)', width: 320, height: 568 },
  { name: 'Samsung Galaxy S20', width: 360, height: 800 },
  { name: 'iPhone X / 11 / 12 mini', width: 375, height: 812 },
  { name: 'iPhone 12 / 13 / 14', width: 390, height: 844 },
  { name: 'Google Pixel 7 / S21 Ultra', width: 412, height: 915 },
  { name: 'iPhone 14 / 15 / 16 Pro Max', width: 430, height: 932 },
];

async function runBrowserAudit() {
  console.log('===============================================================');
  console.log('  KAIRO AI V1.0.3 — HEADLESS CHROME MOBILE INTERACTION AUDIT   ');
  console.log('===============================================================\n');

  // Start HTTP Server
  await new Promise(resolve => server.listen(4173, '127.0.0.1', resolve));
  console.log('[INFO] Static client server listening on http://127.0.0.1:4173');

  // Launch Chrome Headless with fresh test profile
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const testProfileDir = path.join(os.tmpdir(), `kairo-chrome-audit-${Date.now()}`);
  if (!fs.existsSync(testProfileDir)) fs.mkdirSync(testProfileDir, { recursive: true });

  const chromeArgs = [
    '--headless=new',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--remote-debugging-port=9222',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${testProfileDir}`,
    'http://127.0.0.1:4173',
  ];

  const chromeProc = spawn(chromePath, chromeArgs);
  console.log('[INFO] Chrome headless spawned with PID:', chromeProc.pid);
  let browserWsUrl = null;
  chromeProc.stderr.on('data', d => {
    const str = d.toString();
    const match = str.match(/DevTools listening on (ws:\/\/[^\r\n]+)/);
    if (match) {
      browserWsUrl = match[1].trim();
      console.log('[INFO] Captured DevTools Browser WS:', browserWsUrl);
    }
  });
  chromeProc.stdout.on('data', d => console.log('[CHROME STDOUT]', d.toString()));
  chromeProc.on('exit', (code) => console.log('[CHROME EXITED]', code));

  // Find page websocket URL
  let pageWsUrl = null;
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 250));

    if (browserWsUrl && !pageWsUrl) {
      try {
        const bClient = new CDPClient(browserWsUrl);
        await bClient.connect();
        const targets = await bClient.send('Target.getTargets');
        console.log('[TARGETS]', JSON.stringify(targets));
        let pageTarget = targets.targetInfos.find(t => t.type === 'page');
        if (!pageTarget) {
          const created = await bClient.send('Target.createTarget', { url: 'http://127.0.0.1:4173' });
          console.log('[CREATED TARGET]', JSON.stringify(created));
          pageWsUrl = `ws://127.0.0.1:9222/devtools/page/${created.targetId}`;
        } else {
          pageWsUrl = `ws://127.0.0.1:9222/devtools/page/${pageTarget.targetId}`;
        }
        bClient.close();
        if (pageWsUrl) break;
      } catch (be) {
        console.log('[TARGET ERR]', be.message);
      }
    }
  }

  if (!pageWsUrl) {
    throw new Error('Failed to find target page in Chrome DevTools Protocol targets');
  }

  console.log('[INFO] Connected to Chrome Page WebSocket Target.');
  const client = new CDPClient(pageWsUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('DOM.enable');
  await client.send('Runtime.enable');

  const auditResults = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n---------------------------------------------------------------`);
    console.log(`AUDITING VIEWPORT: ${vp.width} × ${vp.height} (${vp.name})`);
    console.log(`---------------------------------------------------------------`);

    // Emulate device metrics
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true,
    });

    // Navigate to page
    await client.send('Page.navigate', { url: 'http://127.0.0.1:4173' });
    await new Promise(r => setTimeout(r, 1200));

    // Audit 1: Check Horizontal Overflow
    const overflowEval = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const doc = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
          const clientWidth = doc.clientWidth;
          const hasHorizontalOverflow = scrollWidth > clientWidth;
          return {
            scrollWidth,
            clientWidth,
            hasHorizontalOverflow,
            diff: scrollWidth - clientWidth
          };
        })()
      `,
      returnByValue: true,
    });

    const overflow = overflowEval.result.value;
    const overflowPass = !overflow.hasHorizontalOverflow;
    console.log(`[CHECK 1] Horizontal Overflow: ${overflowPass ? 'PASS (0px overflow)' : 'FAIL (' + overflow.diff + 'px overflow)'}`);

    // Audit 2: Header Bar & Controls
    const headerEval = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const header = document.querySelector('header');
          const hamburger = document.querySelector('header button[aria-label*="sidebar"], header button[aria-label*="navigation"]');
          const newChatBtn = Array.from(document.querySelectorAll('header button')).find(b => b.textContent.includes('New Chat'));

          const getRect = (el) => {
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, right: r.right, bottom: r.bottom, left: r.left };
          };

          const hRect = getRect(header);
          const hbRect = getRect(hamburger);
          const ncRect = getRect(newChatBtn);

          return {
            headerFound: !!header,
            headerHeight: hRect ? hRect.height : 0,
            hamburgerFound: !!hamburger,
            hamburgerVisible: hbRect ? (hbRect.width > 0 && hbRect.height > 0 && hbRect.left >= 0) : false,
            hamburgerRect: hbRect,
            newChatFound: !!newChatBtn,
            newChatVisible: ncRect ? (ncRect.width > 0 && ncRect.right <= window.innerWidth + 1) : false,
            newChatRect: ncRect,
          };
        })()
      `,
      returnByValue: true,
    });

    const header = headerEval.result.value;
    console.log(`[CHECK 2] Header Bar: ${header.headerFound ? 'PASS (height: ' + header.headerHeight + 'px)' : 'FAIL'}`);
    console.log(`[CHECK 3] Hamburger Menu Button: ${header.hamburgerVisible ? 'PASS (x: ' + header.hamburgerRect.x + ', w: ' + header.hamburgerRect.width + ')' : 'FAIL'}`);
    console.log(`[CHECK 4] New Chat Button: ${header.newChatVisible ? 'PASS (right: ' + header.newChatRect.right + ', max: ' + vp.width + ')' : 'FAIL'}`);

    // Audit 3: Message Composer
    const composerEval = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const textarea = document.querySelector('textarea');
          const composerForm = document.querySelector('form');
          const footer = document.querySelector('footer');
          const attachBtn = document.querySelector('button[aria-label*="Attach"]');
          const sendBtn = document.querySelector('button[aria-label*="Send"]');

          const getRect = (el) => {
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, right: r.right, bottom: r.bottom, left: r.left };
          };

          const cRect = getRect(composerForm);
          const fRect = getRect(footer);

          const noOverlap = cRect && fRect ? (fRect.top >= cRect.bottom - 4) : false;
          const composerAboveBottom = cRect ? (cRect.bottom <= window.innerHeight) : false;

          return {
            textareaFound: !!textarea,
            composerFound: !!composerForm,
            composerRect: cRect,
            footerFound: !!footer,
            footerRect: fRect,
            noOverlap,
            composerAboveBottom,
            attachBtnFound: !!attachBtn,
            sendBtnFound: !!sendBtn,
          };
        })()
      `,
      returnByValue: true,
    });

    const composer = composerEval.result.value;
    console.log(`[CHECK 5] Composer Visibility: ${composer.composerFound && composer.composerAboveBottom ? 'PASS (inside viewport)' : 'FAIL'}`);
    console.log(`[CHECK 6] Footer Non-Overlap: ${composer.noOverlap ? 'PASS (clean clearance)' : 'FAIL'}`);

    // Capture Home Screenshot
    const homeScreenshot = await client.send('Page.captureScreenshot', { format: 'png' });
    const homeFilename = `mobile-${vp.width}x${vp.height}-home.png`;
    fs.writeFileSync(path.join(screenshotDir, homeFilename), Buffer.from(homeScreenshot.data, 'base64'));
    console.log(`[SCREENSHOT] Saved: ${homeFilename}`);

    // Audit 4: Click Hamburger to Open Drawer
    await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const hamburger = document.querySelector('header button[aria-label*="sidebar"], header button[aria-label*="navigation"]');
          if (hamburger) hamburger.click();
        })()
      `,
    });
    await new Promise(r => setTimeout(r, 400));

    const drawerEval = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const drawer = document.querySelector('[role="dialog"]');
          const closeBtn = document.querySelector('button[aria-label*="Close drawer"]');
          const newConvBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('New Conversation'));
          const dRect = drawer ? drawer.getBoundingClientRect() : null;

          return {
            drawerOpen: !!drawer,
            drawerWidth: dRect ? dRect.width : 0,
            closeBtnVisible: !!closeBtn,
            newConvBtnVisible: !!newConvBtn,
          };
        })()
      `,
      returnByValue: true,
    });

    const drawer = drawerEval.result.value;
    console.log(`[CHECK 7] Drawer Slide-Out: ${drawer.drawerOpen ? 'PASS (width: ' + drawer.drawerWidth + 'px)' : 'FAIL'}`);
    console.log(`[CHECK 8] Drawer Close Button: ${drawer.closeBtnVisible ? 'PASS' : 'FAIL'}`);
    console.log(`[CHECK 9] Drawer New Conversation Button: ${drawer.newConvBtnVisible ? 'PASS' : 'FAIL'}`);

    // Capture Drawer Open Screenshot
    const drawerScreenshot = await client.send('Page.captureScreenshot', { format: 'png' });
    const drawerFilename = `mobile-${vp.width}x${vp.height}-drawer.png`;
    fs.writeFileSync(path.join(screenshotDir, drawerFilename), Buffer.from(drawerScreenshot.data, 'base64'));
    console.log(`[SCREENSHOT] Saved: ${drawerFilename}`);

    // Dismiss Drawer via Close Button
    await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const closeBtn = document.querySelector('button[aria-label*="Close drawer"]');
          if (closeBtn) closeBtn.click();
        })()
      `,
    });
    await new Promise(r => setTimeout(r, 350));

    // Audit 5: Type in Composer & Verify Send Activation
    await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const textarea = document.querySelector('textarea');
          if (textarea) {
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
            nativeSetter.call(textarea, 'What is quantum entanglement in physics?');
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
          }
        })()
      `,
    });
    await new Promise(r => setTimeout(r, 200));

    const inputEval = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const sendBtn = document.querySelector('button[aria-label*="Send message"]');
          const textarea = document.querySelector('textarea');
          const hasContent = textarea && textarea.value.length > 0;
          const isButtonActive = sendBtn && !sendBtn.disabled && !sendBtn.classList.contains('cursor-not-allowed');
          return { hasContent, isButtonActive };
        })()
      `,
      returnByValue: true,
    });

    const inputRes = inputEval.result.value;
    console.log(`[CHECK 10] Text Input & Send Button Active: ${inputRes.isButtonActive ? 'PASS' : 'FAIL'}`);

    // Capture Filled Composer Screenshot
    const inputScreenshot = await client.send('Page.captureScreenshot', { format: 'png' });
    const inputFilename = `mobile-${vp.width}x${vp.height}-input.png`;
    fs.writeFileSync(path.join(screenshotDir, inputFilename), Buffer.from(inputScreenshot.data, 'base64'));
    console.log(`[SCREENSHOT] Saved: ${inputFilename}`);

    auditResults.push({
      viewport: `${vp.width} × ${vp.height}`,
      device: vp.name,
      horizontalOverflow: overflowPass ? 'None' : `${overflow.diff}px`,
      headerIntact: header.headerFound && header.hamburgerVisible && header.newChatVisible,
      composerIntact: composer.composerFound && composer.composerAboveBottom,
      footerNoOverlap: composer.noOverlap,
      drawerInteractive: drawer.drawerOpen && drawer.closeBtnVisible,
      inputActivation: inputRes.isButtonActive,
      allPassed: overflowPass && header.hamburgerVisible && header.newChatVisible && composer.noOverlap && drawer.drawerOpen && inputRes.isButtonActive,
    });
  }

  // Teardown
  client.close();
  chromeProc.kill();
  server.close();

  console.log('\n===============================================================');
  console.log('>>> MOBILE-FIRST AUDIT SUMMARY TABLE <<<');
  console.log('===============================================================');
  console.table(auditResults);

  const allViewportsPassed = auditResults.every(r => r.allPassed);
  console.log(`\nFINAL VERDICT: ${allViewportsPassed ? 'ALL VIEWPORTS 100% PASSED' : 'SOME CHECKS FAILED'}`);

  return allViewportsPassed;
}

runBrowserAudit().then((success) => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});

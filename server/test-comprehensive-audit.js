import { getAuthoritativeTemporalContext as getServerTemporal } from './utils/dateTime.js';
import { getAuthoritativeTemporalContext as getNetlifyTemporal } from '../netlify/functions/utils/dateTime.js';
import { validateChatPayload } from './middleware/validator.js';
import healthNetlifyHandler from '../netlify/functions/health.js';
import chatNetlifyHandler from '../netlify/functions/chat.js';
import app from './server-app.js';

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

async function runComprehensiveAudit() {
  console.log('===============================================================');
  console.log('  KAIRO AI V1.0.1 — COMPREHENSIVE CODE & RELIABILITY AUDIT');
  console.log('===============================================================\n');

  // --- 1. DYNAMIC TEMPORAL GENERATION (SERVER & NETLIFY PARITY) ---
  console.log('--- 1. Testing Temporal Utility Parity & Logic ---');
  const now = new Date();
  const serverT = getServerTemporal(now);
  const netlifyT = getNetlifyTemporal(now);

  assert(serverT.isoDate === netlifyT.isoDate, 'Server and Netlify ISO dates match');
  assert(serverT.weekday === netlifyT.weekday, 'Server and Netlify weekdays match');
  assert(serverT.timeZone === 'Asia/Kolkata', 'Timezone is Asia/Kolkata');
  assert(serverT.timeZoneOffset.includes('UTC+05:30'), 'Timezone offset is UTC+05:30 (IST)');
  assert(serverT.isoDate.match(/^\d{4}-\d{2}-\d{2}$/), `ISO date format valid: ${serverT.isoDate}`);
  assert(serverT.fullDate.length > 5, `Full date formatted: ${serverT.fullDate}`);
  assert(serverT.time12.includes('AM') || serverT.time12.includes('PM'), `12-hour time format valid: ${serverT.time12}`);
  assert(serverT.time24.match(/^\d{2}:\d{2}:\d{2}$/), `24-hour time format valid: ${serverT.time24}`);

  // Test Relative Dates
  assert(serverT.yesterday.fullDate !== serverT.fullDate, 'Yesterday date differs from today');
  assert(serverT.tomorrow.fullDate !== serverT.fullDate, 'Tomorrow date differs from today');
  assert(serverT.yesterday.isoDate < serverT.isoDate, 'Yesterday ISO is chronologically before today');
  assert(serverT.tomorrow.isoDate > serverT.isoDate, 'Tomorrow ISO is chronologically after today');

  // Dynamic refresh test (different times produce different outputs)
  const tomorrowSimulated = new Date(now.getTime() + 86400000);
  const refreshedT = getServerTemporal(tomorrowSimulated);
  assert(refreshedT.isoDate === serverT.tomorrow.isoDate, 'Dynamic temporal context refreshes correctly with new timestamps');

  // System instruction text requirements
  assert(serverT.systemInstructionText.includes('TEMPORAL GROUNDING'), 'Instruction contains TEMPORAL GROUNDING heading');
  assert(serverT.systemInstructionText.includes('Asia/Kolkata'), 'Instruction specifies Asia/Kolkata timezone');
  assert(serverT.systemInstructionText.includes('guess, estimate, or hallucinate'), 'Instruction explicitly forbids guessing/cutoff hallucination');
  assert(serverT.systemInstructionText.includes('May 2024'), 'Instruction explicitly mentions not defaulting to May 2024');
  assert(serverT.systemInstructionText.includes(serverT.fullDate), 'Instruction dynamically embeds current full date');

  // --- 2. MULTIMODAL VALIDATION (IMAGES, PDFS, TEXT DOCS) ---
  console.log('\n--- 2. Testing Chat Payload & Multimodal Validation ---');
  
  // Valid text message
  let reqMock = { body: { messages: [{ role: 'user', content: 'What is today\'s date?' }] } };
  let resMock = { status: (c) => ({ json: (d) => ({ code: c, ...d }) }) };
  let nextCalled = false;
  validateChatPayload(reqMock, resMock, () => { nextCalled = true; });
  assert(nextCalled, 'Valid text message passes validator');

  // Valid image attachment (PNG)
  nextCalled = false;
  reqMock = {
    body: {
      messages: [{
        role: 'user',
        content: 'Analyze this image',
        attachments: [{
          name: 'diagram.png',
          type: 'image/png',
          base64Data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
        }]
      }]
    }
  };
  validateChatPayload(reqMock, resMock, () => { nextCalled = true; });
  assert(nextCalled, 'Valid PNG image attachment passes validator');

  // Valid PDF attachment
  nextCalled = false;
  reqMock = {
    body: {
      messages: [{
        role: 'user',
        content: 'Summarize document',
        attachments: [{
          name: 'report.pdf',
          type: 'application/pdf',
          base64Data: 'JVBERi0xLjQKJcOkw7zDtsOfCjEgMCBvYmoKPDwvTGVuZ3RoIDkgMCBSL0ZpbHRlciAvRmxhdGVEZWNvZGU+PnN0cmVhbQp4nDMwM'
        }]
      }]
    }
  };
  validateChatPayload(reqMock, resMock, () => { nextCalled = true; });
  assert(nextCalled, 'Valid PDF document attachment passes validator');

  // Valid Markdown / Text attachment
  nextCalled = false;
  reqMock = {
    body: {
      messages: [{
        role: 'user',
        attachments: [{
          name: 'notes.md',
          type: 'text/markdown',
          base64Data: Buffer.from('# Meeting Notes\nDiscussion on KAIRO v1.0.1').toString('base64')
        }]
      }]
    }
  };
  validateChatPayload(reqMock, resMock, () => { nextCalled = true; });
  assert(nextCalled, 'Valid Markdown attachment passes validator');

  // Reject unsupported MIME type (e.g. .exe / .bin)
  let rejectedStatus = 0;
  reqMock = {
    body: {
      messages: [{
        role: 'user',
        attachments: [{
          name: 'malicious.exe',
          type: 'application/x-msdownload',
          base64Data: 'TVqQAAMAAAAEAAAA'
        }]
      }]
    }
  };
  let rejectedRes = {
    status: (code) => {
      rejectedStatus = code;
      return { json: (d) => d };
    }
  };
  validateChatPayload(reqMock, rejectedRes, () => {});
  assert(rejectedStatus === 400, 'Unsupported file MIME type is rejected with HTTP 400');

  // Reject empty message array
  rejectedStatus = 0;
  reqMock = { body: { messages: [] } };
  validateChatPayload(reqMock, rejectedRes, () => {});
  assert(rejectedStatus === 400, 'Empty messages array is rejected with HTTP 400');

  // --- 3. SERVER & NETLIFY HEALTH ENDPOINTS ---
  console.log('\n--- 3. Testing Server & Netlify Health Endpoints ---');

  // Netlify Health Handler
  const netlifyHealthReq = new Request('http://localhost/api/health', { method: 'GET' });
  const netlifyHealthRes = await healthNetlifyHandler(netlifyHealthReq);
  const netlifyHealthData = await netlifyHealthRes.json();
  assert(netlifyHealthData.status === 'online', 'Netlify health status is online');
  assert(netlifyHealthData.version === '1.0.1', 'Netlify health reports version 1.0.1');
  assert(netlifyHealthData.timezone === 'Asia/Kolkata', 'Netlify health reports timezone Asia/Kolkata');
  assert(typeof netlifyHealthData.apiKeyConfigured === 'boolean', 'API key configured status is a boolean (never exposed)');

  // --- 4. NETLIFY FUNCTION HTTP METHOD GUARDS ---
  console.log('\n--- 4. Testing Netlify Serverless Function Guards ---');
  const optReq = new Request('http://localhost/api/chat', { method: 'OPTIONS' });
  const optRes = await chatNetlifyHandler(optReq);
  assert(optRes.status === 204, 'Netlify chat handles OPTIONS preflight with 204');

  const getReq = new Request('http://localhost/api/chat', { method: 'GET' });
  const getRes = await chatNetlifyHandler(getReq);
  assert(getRes.status === 405, 'Netlify chat rejects GET with 405 Method Not Allowed');

  console.log('\n===============================================================');
  console.log(`>>> COMPREHENSIVE AUDIT COMPLETE: ${passedCount}/${totalCount} TESTS PASSED <<<`);
  console.log('===============================================================\n');
}

runComprehensiveAudit().catch((err) => {
  console.error('[AUDIT FAILURE]:', err);
  process.exit(1);
});

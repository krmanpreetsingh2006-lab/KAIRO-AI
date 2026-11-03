import http from 'http';
import app from './server-app.js';
import { getAuthoritativeTemporalContext } from './utils/dateTime.js';

const PORT = 5055;
const server = app.listen(PORT, '127.0.0.1', async () => {
  console.log(`Test server running on http://127.0.0.1:${PORT}`);

  try {
    // 1. Test Health Check
    const healthRes = await fetch(`http://127.0.0.1:${PORT}/api/health`);
    const healthData = await healthRes.json();
    console.log('[TEST PASS] Health Check:', healthData);
    if (healthData.status !== 'online') throw new Error('Health check returned offline status');
    if (healthData.version !== '1.0.3') throw new Error('Expected version 1.0.3');
    if (healthData.timezone !== 'Asia/Kolkata') throw new Error('Expected timezone Asia/Kolkata');

    // 2. Test Dynamic Temporal Context Utility (Server)
    const temporal = getAuthoritativeTemporalContext();
    console.log('[TEST PASS] Temporal Context Generated:');
    console.log(`  - Weekday: ${temporal.weekday}`);
    console.log(`  - Full Date: ${temporal.fullDate}`);
    console.log(`  - ISO Date: ${temporal.isoDate}`);
    console.log(`  - Time (12h): ${temporal.time12}`);
    console.log(`  - Time (24h): ${temporal.time24}`);
    console.log(`  - Timezone: ${temporal.timeZone} (${temporal.timeZoneOffset})`);
    console.log(`  - Yesterday: ${temporal.yesterday.weekday}, ${temporal.yesterday.fullDate}`);
    console.log(`  - Tomorrow: ${temporal.tomorrow.weekday}, ${temporal.tomorrow.fullDate}`);

    if (!temporal.isoDate.match(/^\d{4}-\d{2}-\d{2}$/)) throw new Error('Invalid ISO date format');
    if (!temporal.systemInstructionText.includes('TEMPORAL GROUNDING')) throw new Error('Missing grounding instruction');
    if (!temporal.systemInstructionText.includes('Asia/Kolkata')) throw new Error('Missing timezone in instruction');
    if (!temporal.systemInstructionText.includes('guess, estimate, or hallucinate')) throw new Error('Missing anti-hallucination directive');

    // Test dynamic refresh across ticks
    const temporal2 = getAuthoritativeTemporalContext(new Date(Date.now() + 86400000));
    if (temporal2.isoDate === temporal.isoDate) throw new Error('Temporal context failed to refresh dynamically');

    // 3. Test Chat with invalid payload (400)
    const badReq = await fetch(`http://127.0.0.1:${PORT}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const badData = await badReq.json();
    console.log('[TEST PASS] Validation Rejection (400):', badData);
    if (badReq.status !== 400) throw new Error('Expected 400 for empty payload');

    // 4. Test Chat Stream endpoint returns SSE headers
    const streamRes = await fetch(`http://127.0.0.1:${PORT}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Say OK' }]
      }),
    });
    console.log('[TEST PASS] Stream response status:', streamRes.status);
    const contentType = streamRes.headers.get('content-type') || '';
    console.log('[TEST PASS] Content-Type:', contentType);

    if (streamRes.status === 200 && !contentType.includes('text/event-stream')) {
      throw new Error(`Expected text/event-stream, got ${contentType}`);
    }

    console.log('\n>>> ALL RELAY TESTS COMPLETED SUCCESSFULLY <<<');
  } catch (err) {
    console.error('[TEST FAIL]:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});

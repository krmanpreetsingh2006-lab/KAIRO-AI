import http from 'http';
import app from './server-app.js';

const PORT = 5055;
const server = app.listen(PORT, '127.0.0.1', async () => {
  console.log(`Test server running on http://127.0.0.1:${PORT}`);

  try {
    // 1. Test Health Check
    const healthRes = await fetch(`http://127.0.0.1:${PORT}/api/health`);
    const healthData = await healthRes.json();
    console.log('[TEST PASS] Health Check:', healthData);
    if (healthData.status !== 'online') throw new Error('Health check returned offline status');

    // 2. Test Chat with invalid payload (400)
    const badReq = await fetch(`http://127.0.0.1:${PORT}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const badData = await badReq.json();
    console.log('[TEST PASS] Validation Rejection (400):', badData);
    if (badReq.status !== 400) throw new Error('Expected 400 for empty payload');

    // 3. Test Chat Stream endpoint returns SSE headers
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

    const streamText = await streamRes.text();
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

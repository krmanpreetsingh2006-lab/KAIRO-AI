import healthHandler from './functions/health.js';
import chatHandler from './functions/chat.js';

async function runTests() {
  console.log('--- TESTING STREAMLINED NETLIFY SERVERLESS FUNCTIONS ---');

  // 1. Test Health Function
  const healthReq = new Request('http://localhost/.netlify/functions/health', {
    method: 'GET',
  });
  const healthRes = await healthHandler(healthReq);
  const healthData = await healthRes.json();
  console.log('[PASS] Netlify Health Function:', healthData);
  if (healthData.status !== 'online') throw new Error('Expected status online');

  // 2. Test Chat Preflight OPTIONS
  const optionsReq = new Request('http://localhost/.netlify/functions/chat', {
    method: 'OPTIONS',
  });
  const optionsRes = await chatHandler(optionsReq);
  console.log('[PASS] Preflight OPTIONS status:', optionsRes.status);
  if (optionsRes.status !== 204) throw new Error('Expected 204 for OPTIONS');

  // 3. Test Chat Method Not Allowed (GET)
  const getReq = new Request('http://localhost/.netlify/functions/chat', {
    method: 'GET',
  });
  const getRes = await chatHandler(getReq);
  console.log('[PASS] Method Not Allowed status:', getRes.status);
  if (getRes.status !== 405) throw new Error('Expected 405 for GET');

  // 4. Test Missing Gemini API Key (503)
  delete process.env.GEMINI_API_KEY;
  const noKeyReq = new Request('http://localhost/.netlify/functions/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Hello KAIRO' }],
    }),
  });
  const noKeyRes = await chatHandler(noKeyReq);
  const noKeyData = await noKeyRes.json();
  console.log('[PASS] Missing API Key Status:', noKeyRes.status);
  console.log('[PASS] Missing API Key Message:', noKeyData);
  if (noKeyRes.status !== 503) throw new Error('Expected 503 for missing GEMINI_API_KEY');

  // 5. Test Payload Validation (Empty messages)
  process.env.GEMINI_API_KEY = 'test_key';
  const badPayloadReq = new Request('http://localhost/.netlify/functions/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [],
    }),
  });
  const badPayloadRes = await chatHandler(badPayloadReq);
  const badPayloadData = await badPayloadRes.json();
  console.log('[PASS] Bad Payload Status:', badPayloadRes.status);
  console.log('[PASS] Bad Payload Message:', badPayloadData);
  if (badPayloadRes.status !== 400) throw new Error('Expected 400 for empty messages');

  console.log('\n>>> ALL STREAMLINED NETLIFY FUNCTIONS TESTS PASSED! <<<');
}

runTests().catch((err) => {
  console.error('[TEST FAILURE]:', err);
  process.exit(1);
});

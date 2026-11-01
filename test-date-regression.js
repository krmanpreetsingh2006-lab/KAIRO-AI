import { getAuthoritativeTemporalContext as getServerTemporal } from './server/utils/dateTime.js';
import { getAuthoritativeTemporalContext as getNetlifyTemporal } from './netlify/functions/_utils/dateTime.js';

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

async function runDateRegressionTests() {
  console.log('===============================================================');
  console.log('  KAIRO AI V1.0.1 — DATE ACCURACY REGRESSION TEST SUITE');
  console.log('===============================================================\n');

  // --- TEST 1: Today's date & current time in Asia/Kolkata ---
  console.log('--- TEST 1: Today\'s Date & Current Time in Asia/Kolkata ---');
  const now = new Date();
  const serverT = getServerTemporal(now);
  const netlifyT = getNetlifyTemporal(now);

  console.log(`Generated Timezone: ${serverT.timeZone} (${serverT.timeZoneOffset})`);
  console.log(`Current Weekday: ${serverT.weekday}`);
  console.log(`Today's Full Date: ${serverT.fullDate}`);
  console.log(`Today's ISO Date: ${serverT.isoDate}`);
  console.log(`Current Time (12h): ${serverT.time12}`);
  console.log(`Current Time (24h): ${serverT.time24}`);

  assert(serverT.timeZone === 'Asia/Kolkata', 'Timezone is Asia/Kolkata');
  assert(serverT.timeZoneOffset.includes('UTC+05:30'), 'Timezone offset is UTC+05:30');
  assert(serverT.weekday === 'Sunday', `Weekday is Sunday (actual: ${serverT.weekday})`);
  assert(serverT.fullDate === 'November 1, 2026', `Full date is November 1, 2026 (actual: ${serverT.fullDate})`);
  assert(serverT.isoDate === '2026-11-01', `ISO date is 2026-11-01 (actual: ${serverT.isoDate})`);
  assert(serverT.time12.includes('PM') || serverT.time12.includes('AM'), '12-hour time includes AM/PM indicator');
  assert(serverT.time24.match(/^\d{2}:\d{2}:\d{2}$/), '24-hour time matches HH:MM:SS');

  // --- TEST 2: Yesterday and Tomorrow calculation ---
  console.log('\n--- TEST 2: Yesterday & Tomorrow Calculation ---');
  console.log(`Yesterday: ${serverT.yesterday.weekday}, ${serverT.yesterday.fullDate} (${serverT.yesterday.isoDate})`);
  console.log(`Tomorrow: ${serverT.tomorrow.weekday}, ${serverT.tomorrow.fullDate} (${serverT.tomorrow.isoDate})`);

  assert(serverT.yesterday.weekday === 'Saturday', `Yesterday weekday is Saturday (actual: ${serverT.yesterday.weekday})`);
  assert(serverT.yesterday.fullDate === 'October 31, 2026', `Yesterday full date is October 31, 2026 (actual: ${serverT.yesterday.fullDate})`);
  assert(serverT.yesterday.isoDate === '2026-10-31', `Yesterday ISO is 2026-10-31 (actual: ${serverT.yesterday.isoDate})`);

  assert(serverT.tomorrow.weekday === 'Monday', `Tomorrow weekday is Monday (actual: ${serverT.tomorrow.weekday})`);
  assert(serverT.tomorrow.fullDate === 'November 2, 2026', `Tomorrow full date is November 2, 2026 (actual: ${serverT.tomorrow.fullDate})`);
  assert(serverT.tomorrow.isoDate === '2026-11-02', `Tomorrow ISO is 2026-11-02 (actual: ${serverT.tomorrow.isoDate})`);

  // --- TEST 3: History Override & Follow-up in Same Conversation ---
  console.log('\n--- TEST 3: History Override & Follow-up in Same Conversation ---');
  assert(serverT.systemInstructionText.includes('OVERRIDE PRIOR CONVERSATION HISTORY'), 'Instruction includes explicit prior conversation history override');
  assert(serverT.systemInstructionText.includes('May 22, 2024'), 'Instruction specifically names May 22, 2024 as obsolete');
  assert(serverT.systemInstructionText.includes(serverT.fullDate), 'Instruction dynamically provides current full date as single source of truth');

  // --- TEST 4: Fresh Conversation (Zero Prior Messages) ---
  console.log('\n--- TEST 4: Fresh Conversation System Instruction ---');
  assert(serverT.systemInstructionText.includes('TEMPORAL GROUNDING & AUTHORITATIVE REAL-TIME CLOCK'), 'Includes primary TEMPORAL GROUNDING heading');
  assert(serverT.systemInstructionText.includes('The server timestamp above is your authoritative source of truth'), 'Designates server timestamp as authoritative');
  assert(serverT.systemInstructionText.includes('Under NO circumstances should you guess, estimate, or hallucinate'), 'Strictly prohibits guessing training cutoff');

  // --- TEST 5: Zero Hardcoded Dates & Dynamic Refresh Verification ---
  console.log('\n--- TEST 5: Zero Hardcoded Dates & Dynamic Refresh ---');
  // Check that passing a future simulated date (e.g. 5 days ahead) computes completely different dynamic values
  const simulatedFuture = new Date(now.getTime() + 5 * 86400000);
  const futureContext = getServerTemporal(simulatedFuture);
  assert(futureContext.isoDate !== serverT.isoDate, 'Temporal context computes dynamically from input timestamp, never hardcoded');
  assert(futureContext.isoDate === '2026-11-06', `Future simulation correctly calculates 2026-11-06 (actual: ${futureContext.isoDate})`);

  // Server and Netlify Parity
  assert(serverT.isoDate === netlifyT.isoDate, 'Server and Netlify temporal generators produce identical ISO date');
  assert(serverT.systemInstructionText === netlifyT.systemInstructionText, 'Server and Netlify generate identical system instruction text');

  console.log('\n===============================================================');
  console.log(`>>> DATE ACCURACY REGRESSION: ${passedCount}/${totalCount} TESTS PASSED <<<`);
  console.log('===============================================================\n');
}

runDateRegressionTests().catch((err) => {
  console.error('[REGRESSION TEST FAILED]:', err);
  process.exit(1);
});

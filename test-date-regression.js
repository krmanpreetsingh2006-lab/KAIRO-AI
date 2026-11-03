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

  // Dynamic ground truth in Asia/Kolkata
  const kolkataParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).formatToParts(now);
  const expectedWeekday = kolkataParts.find(p => p.type === 'weekday').value;
  const expectedMonth = kolkataParts.find(p => p.type === 'month').value;
  const expectedDay = kolkataParts.find(p => p.type === 'day').value;
  const expectedYear = kolkataParts.find(p => p.type === 'year').value;
  const expectedFullDate = `${expectedMonth} ${expectedDay}, ${expectedYear}`;

  assert(serverT.timeZone === 'Asia/Kolkata', 'Timezone is Asia/Kolkata');
  assert(serverT.timeZoneOffset.includes('UTC+05:30'), 'Timezone offset is UTC+05:30');
  assert(serverT.weekday === expectedWeekday, `Weekday is ${expectedWeekday} (actual: ${serverT.weekday})`);
  assert(serverT.fullDate === expectedFullDate, `Full date is ${expectedFullDate} (actual: ${serverT.fullDate})`);
  assert(serverT.isoDate.match(/^\d{4}-\d{2}-\d{2}$/), `ISO date is valid format (actual: ${serverT.isoDate})`);
  assert(serverT.time12.includes('PM') || serverT.time12.includes('AM'), '12-hour time includes AM/PM indicator');
  assert(serverT.time24.match(/^\d{2}:\d{2}:\d{2}$/), '24-hour time matches HH:MM:SS');

  // --- TEST 2: Yesterday and Tomorrow calculation ---
  console.log('\n--- TEST 2: Yesterday & Tomorrow Calculation ---');
  console.log(`Yesterday: ${serverT.yesterday.weekday}, ${serverT.yesterday.fullDate} (${serverT.yesterday.isoDate})`);
  console.log(`Tomorrow: ${serverT.tomorrow.weekday}, ${serverT.tomorrow.fullDate} (${serverT.tomorrow.isoDate})`);

  assert(serverT.yesterday.isoDate < serverT.isoDate, 'Yesterday ISO is chronologically before today');
  assert(serverT.tomorrow.isoDate > serverT.isoDate, 'Tomorrow ISO is chronologically after today');
  assert(serverT.yesterday.weekday !== serverT.weekday, 'Yesterday weekday differs from today');
  assert(serverT.tomorrow.weekday !== serverT.weekday, 'Tomorrow weekday differs from today');
  assert(serverT.yesterday.isoDate.match(/^\d{4}-\d{2}-\d{2}$/), 'Yesterday ISO format is valid');
  assert(serverT.tomorrow.isoDate.match(/^\d{4}-\d{2}-\d{2}$/), 'Tomorrow ISO format is valid');

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
  // Check that passing an explicit simulated date computes the exact corresponding dynamic values
  const simulatedFuture = new Date('2026-11-06T12:00:00Z');
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

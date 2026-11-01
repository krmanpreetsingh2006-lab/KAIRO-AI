import { GoogleGenAI } from '@google/genai';
import { getAuthoritativeTemporalContext } from './server/utils/dateTime.js';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY not found in environment.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const testCases = [
  "What is today's date?",
  "What day is it today?",
  "What was yesterday's date?",
  "What will tomorrow's date be?",
  "What is the current time in India?"
];

async function runHotfixVerification() {
  console.log('====================================================');
  console.log('  KAIRO AI V1.0.1 — DATE & TIME ACCURACY TEST SUITE');
  console.log('====================================================');

  const temporal = getAuthoritativeTemporalContext();
  console.log('Backend Generated Temporal Context (Asia/Kolkata):');
  console.log(`- Weekday: ${temporal.weekday}`);
  console.log(`- Today's Date: ${temporal.fullDate} (${temporal.isoDate})`);
  console.log(`- Current Time: ${temporal.time12} (${temporal.time24} IST)`);
  console.log(`- Yesterday: ${temporal.yesterday.weekday}, ${temporal.yesterday.fullDate}`);
  console.log(`- Tomorrow: ${temporal.tomorrow.weekday}, ${temporal.tomorrow.fullDate}`);
  console.log('----------------------------------------------------\n');

  let allPassed = true;

  for (let i = 0; i < testCases.length; i++) {
    const question = testCases[i];
    console.log(`[TEST ${i + 1}/5] Prompt: "${question}"`);

    // Dynamic generation per request
    const currentTemporal = getAuthoritativeTemporalContext();
    const systemInstruction = currentTemporal.systemInstructionText;

    const res = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: [{ role: 'user', parts: [{ text: question }] }],
      config: {
        systemInstruction,
        temperature: 0.2
      }
    });

    const answer = res.text.trim();
    console.log(`Response: ${answer}`);

    // Verification logic
    let passed = false;
    if (i === 0) {
      // "What is today's date?" -> should contain current month / year / date, definitely NOT 2024
      const year = temporal.isoDate.split('-')[0];
      passed = answer.includes(year) && !answer.toLowerCase().includes('2024');
    } else if (i === 1) {
      // "What day is it today?" -> should contain weekday
      passed = answer.toLowerCase().includes(temporal.weekday.toLowerCase());
    } else if (i === 2) {
      // "What was yesterday's date?" -> should contain yesterday weekday or date
      passed = answer.toLowerCase().includes(temporal.yesterday.weekday.toLowerCase()) ||
               answer.includes(temporal.yesterday.isoDate.split('-')[2]);
    } else if (i === 3) {
      // "What will tomorrow's date be?" -> should contain tomorrow weekday or date
      passed = answer.toLowerCase().includes(temporal.tomorrow.weekday.toLowerCase()) ||
               answer.includes(temporal.tomorrow.isoDate.split('-')[2]);
    } else if (i === 4) {
      // "What is the current time in India?" -> should contain time or IST
      passed = answer.toLowerCase().includes('ist') ||
               answer.toLowerCase().includes('pm') ||
               answer.toLowerCase().includes('am') ||
               answer.includes(':');
    }

    if (passed) {
      console.log(`Result: PASS\n`);
    } else {
      console.error(`Result: FAIL (Validation criteria not met)\n`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('====================================================');
    console.log('>>> ALL 5 DATE & TIME ACCURACY TESTS PASSED! <<<');
    console.log('====================================================');
  } else {
    console.error('>>> SOME TESTS FAILED <<<');
    process.exitCode = 1;
  }
}

runHotfixVerification().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});

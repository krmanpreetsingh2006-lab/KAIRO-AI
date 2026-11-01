/**
 * KAIRO AI - Authoritative Date & Time Utility
 * Dynamically computes verified temporal context in Asia/Kolkata timezone (IST, UTC+05:30).
 * Refreshes on every single request. Never hardcodes dates.
 */

/**
 * Returns dynamic temporal metadata and system prompt instructions for Gemini.
 * @param {Date} [referenceDate] - Optional Date object for testing, defaults to new Date()
 * @returns {{
 *   isoDate: string,
 *   fullDate: string,
 *   weekday: string,
 *   time12: string,
 *   time24: string,
 *   timeZone: string,
 *   timeZoneOffset: string,
 *   yesterday: { weekday: string, fullDate: string, isoDate: string },
 *   tomorrow: { weekday: string, fullDate: string, isoDate: string },
 *   systemInstructionText: string
 * }}
 */
export function getAuthoritativeTemporalContext(referenceDate = new Date()) {
  const timeZone = 'Asia/Kolkata';

  const fullDateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
  });

  const isoDateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const time12Formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const time24Formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const weekday = weekdayFormatter.format(referenceDate);
  const fullDate = fullDateFormatter.format(referenceDate);
  const isoDate = isoDateFormatter.format(referenceDate);
  const time12 = time12Formatter.format(referenceDate);
  const time24 = time24Formatter.format(referenceDate);
  const timeZoneName = 'Asia/Kolkata';
  const timeZoneOffset = 'IST (UTC+05:30)';

  // Relative dates in Asia/Kolkata (fixed UTC+05:30, no DST transitions)
  const yesterdayDate = new Date(referenceDate.getTime() - 24 * 60 * 60 * 1000);
  const tomorrowDate = new Date(referenceDate.getTime() + 24 * 60 * 60 * 1000);

  const yesterday = {
    weekday: weekdayFormatter.format(yesterdayDate),
    fullDate: fullDateFormatter.format(yesterdayDate),
    isoDate: isoDateFormatter.format(yesterdayDate),
  };

  const tomorrow = {
    weekday: weekdayFormatter.format(tomorrowDate),
    fullDate: fullDateFormatter.format(tomorrowDate),
    isoDate: isoDateFormatter.format(tomorrowDate),
  };

  const systemInstructionText = `TEMPORAL GROUNDING & AUTHORITATIVE REAL-TIME CLOCK:
The current moment has been dynamically verified and provided by the backend server for this specific request:
- Timezone: ${timeZoneName} (${timeZoneOffset})
- Current Day of the Week: ${weekday}
- Today's Date: ${fullDate} (${isoDate})
- Current Time: ${time12} (${time24} IST)
- Yesterday was: ${yesterday.weekday}, ${yesterday.fullDate} (${yesterday.isoDate})
- Tomorrow will be: ${tomorrow.weekday}, ${tomorrow.fullDate} (${tomorrow.isoDate})

MANDATORY TEMPORAL RULES:
1. The server timestamp above is your authoritative source of truth for the current date, time, weekday, and year.
2. Under NO circumstances should you guess, estimate, or hallucinate the current date based on your training data cutoff (such as May 2024 or any other historical date). Never claim that you do not know today's date or that your knowledge stops in May 2024.
3. When asked:
   - "What is today's date?" -> Respond with today's date: ${fullDate}.
   - "What day is it today?" -> Respond with today's day of the week: ${weekday}.
   - "What was yesterday's date?" -> Respond with yesterday's date: ${yesterday.fullDate} (${yesterday.weekday}).
   - "What will tomorrow's date be?" -> Respond with tomorrow's date: ${tomorrow.fullDate} (${tomorrow.weekday}).
   - "What is the current time in India?" -> Respond with the current time in IST: ${time12} IST (${time24} IST).
4. Accurately resolve all relative temporal expressions (e.g., today, yesterday, tomorrow, this week, current month, current year) relative to ${fullDate}.
5. OVERRIDE PRIOR CONVERSATION HISTORY: Even if earlier assistant or user turns in this conversation or session mention May 2024, May 22, 2024, or any past dates, those prior messages contain obsolete or ungrounded timestamps. You MUST strictly ignore any past dates in the chat history and answer using today's verified server date: ${fullDate} (${weekday}).
6. If the user asks for a simple, brief, or direct answer, follow the adaptive response directive while preserving 100% factual date and time accuracy.`;

  return {
    isoDate,
    fullDate,
    weekday,
    time12,
    time24,
    timeZone: timeZoneName,
    timeZoneOffset,
    yesterday,
    tomorrow,
    systemInstructionText,
  };
}

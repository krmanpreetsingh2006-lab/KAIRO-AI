import { GoogleGenAI } from '@google/genai';
import { getAuthoritativeTemporalContext } from './utils/dateTime.js';

// In-memory sliding window rate limiter per client IP
const clientRequestLog = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 40; // 40 prompts per minute
const MAX_MESSAGE_LENGTH = 12000;

function checkRateLimit(clientId) {
  const now = Date.now();
  const timestamps = clientRequestLog.get(clientId) || [];
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const recentTimestamps = timestamps.filter(ts => ts > windowStart);

  if (recentTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  recentTimestamps.push(now);
  clientRequestLog.set(clientId, recentTimestamps);

  // Periodically cleanup older entries
  if (clientRequestLog.size > 2000) {
    for (const [id, list] of clientRequestLog.entries()) {
      const active = list.filter(t => t > windowStart);
      if (active.length === 0) {
        clientRequestLog.delete(id);
      } else {
        clientRequestLog.set(id, active);
      }
    }
  }

  return true;
}

const DEFAULT_SYSTEM_INSTRUCTION = `You are KAIRO AI, an intelligent, agile, and context-aware AI assistant with advanced multimodal reasoning capabilities.
Tagline: "Intelligence Beyond Limits."

CORE DIRECTIVE — USER-INTENT ADAPTIVE DEPTH & LENGTH:
Dynamically match your response length, depth, and vocabulary strictly to what the user asks for. Always prioritize the user's explicit preference and intent over any default format.

MULTIMODAL CAPABILITIES:
- You can inspect, analyze, and comprehend images (PNG, JPG, JPEG, WEBP) and documents (PDF, Markdown, TXT, CSV, JSON) attached by the user.
- When an image or document is provided, examine it thoroughly, extract key data or visual details, and answer the user's inquiry with precision.

ADAPTIVE RESPONSE GUIDELINES:
1. Basic / Simple Explanations ("in simple words", "simply", "basic answer", "for beginners", "ELI5"):
   - Provide a clear, easy-to-understand explanation using plain language and relatable analogies.
   - Never force advanced technical terminology, academic jargon, or unnecessary complexity into basic answers.
   - Never make simple answers unnecessarily lengthy.

2. Short / Direct Answers ("short answer", "briefly", "in brief", "in one sentence", "tldr", "quick summary"):
   - Deliver a direct, crisp, and focused answer with zero filler, conversational fluff, or preamble.
   - Keep it short, sharp, and straight to the point while retaining full factual accuracy.

3. Answer-Only Requests ("only the answer", "just the answer", "just the code", "no explanation"):
   - Provide solely the requested answer, value, code snippet, or formula.
   - Do not include conversational remarks, pleasantries, prefaces, or post-hoc explanations.

4. Detailed Explanations ("explain in detail", "detailed answer", "with examples", "elaborate"):
   - Provide a well-structured, thorough explanation complete with practical examples, context, and nuance.
   - Structure cleanly using markdown headings, bullet points, and code blocks where helpful.

5. In-Depth / Comprehensive ("deep dive", "in-depth explanation", "thorough analysis", "exhaustive"):
   - Cover the topic comprehensively from fundamental principles to advanced trade-offs, architecture, and edge cases.

6. Step-by-Step Guidance ("step by step", "walkthrough", "tutorial", "how to step by step"):
   - Explain each step clearly in a sequential, numbered order with actionable instructions.

7. Default Behavior (when the user does not specify answer length or depth):
   - Provide a concise, direct, and sufficiently helpful answer.
   - Avoid unprompted essays or bloated paragraphs; deliver the core insight efficiently.

QUALITY & FORMATTING PRINCIPLES:
- Maintain accuracy, completeness, and correctness across every response length.
- Format code blocks meticulously with appropriate language identifiers.
- Maintain an articulate, helpful, and respectful tone.`;

export default async (req, context) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Enforce client abuse & rate limit protection
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('client-ip') || 'anonymous_client';
  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded: Too many requests received in a short time. Please wait a moment before sending another prompt.'
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 3. Verify Gemini API Key configuration
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey || geminiApiKey.trim() === '' || geminiApiKey === 'your_gemini_api_key_here') {
    return new Response(
      JSON.stringify({
        error: 'Gemini API key is not configured in Netlify environment variables. Please add GEMINI_API_KEY to your Netlify site settings.'
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4. Parse & Validate Payload
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Malformed JSON payload.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { messages, systemInstruction, temperature, model } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Invalid payload: "messages" must be a non-empty array.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const primaryModel = model || process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
  const candidateModels = Array.from(
    new Set([
      primaryModel,
      'gemini-flash-lite-latest',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.8-flash',
    ])
  );

  // 5. Initialize Web Stream for Server-Sent Events
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Stream Gemini tokens asynchronously
  (async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });

      const contents = messages
        .filter(msg => (msg.content && msg.content.trim() !== '') || (Array.isArray(msg.attachments) && msg.attachments.length > 0))
        .map(msg => {
          const parts = [];

          if (Array.isArray(msg.attachments)) {
            for (const att of msg.attachments) {
              if (!att || !att.base64Data) continue;
              const mime = (att.type || '').toLowerCase();

              if (mime.startsWith('image/') || mime === 'application/pdf') {
                parts.push({
                  inlineData: {
                    mimeType: mime,
                    data: att.base64Data,
                  }
                });
              } else if (mime.startsWith('text/') || mime === 'application/json') {
                try {
                  const decoded = Buffer.from(att.base64Data, 'base64').toString('utf-8');
                  parts.push({
                    text: `[Attached Document: ${att.name || 'document'}]\n\`\`\`\n${decoded}\n\`\`\``
                  });
                } catch {
                  parts.push({
                    inlineData: {
                      mimeType: 'text/plain',
                      data: att.base64Data,
                    }
                  });
                }
              }
            }
          }

          if (msg.content && typeof msg.content === 'string' && msg.content.trim() !== '') {
            parts.push({ text: msg.content.trim() });
          } else if (parts.length > 0 && parts.every(p => p.inlineData)) {
            parts.push({ text: 'Please analyze the attached file(s) and provide a comprehensive analysis.' });
          }

          return {
            role: msg.role === 'assistant' ? 'model' : msg.role,
            parts: parts.length > 0 ? parts : [{ text: '' }]
          };
        });

      // Dynamically generate fresh authoritative temporal context on every request
      const temporalContext = getAuthoritativeTemporalContext();

      const instructionParts = [
        DEFAULT_SYSTEM_INSTRUCTION,
        temporalContext.systemInstructionText,
      ];

      if (systemInstruction && typeof systemInstruction === 'string' && systemInstruction.trim() !== '') {
        instructionParts.push(`Additional User Directives:\n${systemInstruction.trim()}`);
      }

      const combinedSystemInstruction = instructionParts.join('\n\n');

      let streamResponse = null;
      let lastError = null;

      for (const targetModel of candidateModels) {
        try {
          streamResponse = await ai.models.generateContentStream({
            model: targetModel,
            contents,
            config: {
              systemInstruction: combinedSystemInstruction,
              temperature: typeof temperature === 'number' ? temperature : 0.7,
            }
          });
          break; // Connected!
        } catch (modelErr) {
          lastError = modelErr;
          const errMsg = modelErr?.message || '';
          const status = modelErr?.status || modelErr?.statusCode;
          if (status === 404 || status === 503 || errMsg.includes('high demand') || errMsg.includes('no longer available') || errMsg.includes('not found')) {
            console.warn(`[KAIRO Netlify Failover] Model "${targetModel}" unavailable (${status}). Retrying next model...`);
            continue;
          }
          throw modelErr;
        }
      }

      if (!streamResponse && lastError) {
        throw lastError;
      }

      if (streamResponse) {
        for await (const chunk of streamResponse) {
          if (chunk.text) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ text: chunk.text })}\n\n`));
          }
        }
      }

      await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
    } catch (streamError) {
      console.error('[KAIRO Netlify Gemini Error]:', streamError);

      let friendly = 'An unexpected error occurred communicating with KAIRO AI intelligence.';
      const msg = streamError?.message || '';
      const status = streamError?.status || streamError?.statusCode;

      if (status === 429 || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
        friendly = 'Gemini API quota exceeded or rate limit reached. Please wait a moment before trying again.';
      } else if (status === 400 || msg.includes('API_KEY_INVALID') || msg.includes('key not valid')) {
        friendly = 'The configured Gemini API key is invalid. Please verify GEMINI_API_KEY in Netlify settings.';
      } else if (msg.includes('ENOTFOUND') || msg.includes('fetch failed')) {
        friendly = 'Network failure reaching Google Gemini services. Please retry.';
      } else if (msg) {
        friendly = msg.replace(/key=[^&]+/gi, 'key=***');
      }

      await writer.write(encoder.encode(`data: ${JSON.stringify({ error: friendly })}\n\n`));
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no',
    },
  });
};

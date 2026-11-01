import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { validateChatPayload } from '../middleware/validator.js';
import { getAuthoritativeTemporalContext } from '../utils/dateTime.js';

const router = Router();

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

router.post(['/', '/stream'], validateChatPayload, async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    return res.status(503).json({
      error: 'Gemini API key is not configured on the server. Please add your GEMINI_API_KEY in .env to enable AI streaming.'
    });
  }

  const { messages, systemInstruction, temperature, model } = req.body;
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

  // Set headers for Server-Sent Events (SSE)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  let clientAborted = false;
  req.on('close', () => {
    clientAborted = true;
  });

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Build multimodal contents
    const contents = messages
      .filter(msg => (msg.content && msg.content.trim() !== '') || (Array.isArray(msg.attachments) && msg.attachments.length > 0))
      .map(msg => {
        const parts = [];

        // Attachments (Images, PDFs, Text Documents)
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

        // Accompanying User Text
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
      temporalContext.systemInstructionText,
      DEFAULT_SYSTEM_INSTRUCTION,
    ];

    if (systemInstruction && typeof systemInstruction === 'string' && systemInstruction.trim() !== '') {
      instructionParts.push(`Additional User Directives:\n${systemInstruction.trim()}`);
    }

    instructionParts.push(`MANDATORY REAL-TIME RE-ANCHOR: Current Date is ${temporalContext.fullDate} (${temporalContext.weekday}), Time: ${temporalContext.time12} IST. If user asks for current date/day/time, strictly use this.`);

    const combinedSystemInstruction = instructionParts.join('\n\n');

    let streamResponse = null;
    let lastError = null;

    for (const targetModel of candidateModels) {
      if (clientAborted) break;
      try {
        streamResponse = await ai.models.generateContentStream({
          model: targetModel,
          contents,
          config: {
            systemInstruction: combinedSystemInstruction,
            temperature: typeof temperature === 'number' ? temperature : 0.7,
          }
        });
        break; // Successfully connected to a healthy model
      } catch (modelErr) {
        lastError = modelErr;
        const errMsg = modelErr?.message || '';
        const status = modelErr?.status || modelErr?.statusCode;
        if (status === 404 || status === 503 || errMsg.includes('high demand') || errMsg.includes('no longer available') || errMsg.includes('not found')) {
          console.warn(`[KAIRO Failover] Model "${targetModel}" unavailable (${status || 'error'}). Falling back to next candidate...`);
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
        if (clientAborted) break;
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }
    }

    if (!clientAborted) {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    }
  } catch (error) {
    console.error('[KAIRO Server Error]:', error);

    if (!clientAborted) {
      let friendlyMessage = 'An unexpected error occurred while communicating with KAIRO AI intelligence.';

      const errorMessage = error?.message || '';
      const status = error?.status || error?.statusCode;

      if (status === 429 || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota')) {
        friendlyMessage = 'Gemini API quota exceeded or rate limit reached. Please wait a moment before trying again.';
      } else if (status === 400 || errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('key not valid')) {
        friendlyMessage = 'The configured Gemini API key is invalid. Please verify your GEMINI_API_KEY.';
      } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('fetch failed')) {
        friendlyMessage = 'Network error: Unable to reach Google Gemini services. Please check server internet connectivity.';
      } else if (errorMessage.includes('not found') || errorMessage.includes('is not supported')) {
        friendlyMessage = 'The selected AI model is currently unavailable. Please try again.';
      } else if (errorMessage) {
        friendlyMessage = errorMessage.replace(/key=[^&]+/gi, 'key=***');
      }

      res.write(`data: ${JSON.stringify({ error: friendlyMessage })}\n\n`);
    }
  } finally {
    if (!res.writableEnded) {
      res.end();
    }
  }
});

export default router;

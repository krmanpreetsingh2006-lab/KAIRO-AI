/**
 * KAIRO AI API Service
 * Manages communication with Netlify Serverless Functions & Express Relay
 * for health checks and streaming Gemini chat completions.
 */

export async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) {
      throw new Error(`Health check returned HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    return {
      status: 'offline',
      apiKeyConfigured: false,
      model: 'unknown',
      error: err.message,
    };
  }
}

/**
 * Stream chat completion from the serverless relay.
 * @param {Array<{role: string, content: string}>} messages
 * @param {Object} options
 * @param {string} [options.systemInstruction]
 * @param {number} [options.temperature]
 * @param {AbortSignal} [options.signal]
 * @param {Function} options.onChunk - Callback invoked with streamed text fragment
 * @param {Function} options.onError - Callback invoked with error message
 * @param {Function} options.onFinish - Callback invoked when streaming completes
 */
export async function streamChat(messages, {
  systemInstruction,
  temperature = 0.7,
  signal,
  onChunk,
  onError,
  onFinish
}) {
  try {
    const res = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        systemInstruction,
        temperature,
      }),
      signal,
    });

    if (!res.ok) {
      let errorMsg = `Server returned status ${res.status}`;
      try {
        const errorJson = await res.json();
        if (errorJson.error) {
          errorMsg = errorJson.error;
        }
      } catch {
        errorMsg = res.statusText || errorMsg;
      }
      onError(errorMsg);
      return;
    }

    if (!res.body) {
      onError('No streaming response body received from server relay.');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep trailing incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            if (data.text) {
              onChunk(data.text);
            }
            if (data.error) {
              onError(data.error);
              return;
            }
            if (data.done) {
              onFinish();
              return;
            }
          } catch (e) {
            console.warn('[KAIRO SSE Parse Error]:', e, jsonStr);
          }
        }
      }
    }

    onFinish();
  } catch (err) {
    if (err.name === 'AbortError') {
      onFinish();
      return;
    }
    const msg = err.message || 'Network error encountered during communication.';
    onError(msg);
  }
}

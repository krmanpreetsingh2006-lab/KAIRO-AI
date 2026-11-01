const MAX_LEN = parseInt(process.env.MAX_MESSAGE_LENGTH || '12000', 10);
const MAX_ATTACHMENT_SIZE_BYTES = 12 * 1024 * 1024; // 12 MB raw per file
const MAX_ATTACHMENTS_PER_MESSAGE = 5;

const ALLOWED_MIME_TYPES = new Set([
  // Images (Phase 1)
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  // Documents (Phase 1)
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
]);

export function validateChatPayload(req, res, next) {
  const { messages, systemInstruction, temperature } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: 'Invalid payload: "messages" must be a non-empty array of message objects.'
    });
  }

  // Validate individual messages
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== 'object') {
      return res.status(400).json({ error: `Message at index ${i} is invalid.` });
    }

    if (!['user', 'model', 'assistant'].includes(msg.role)) {
      return res.status(400).json({
        error: `Message at index ${i} has invalid role "${msg.role}". Allowed roles: 'user', 'assistant', 'model'.`
      });
    }

    const hasText = typeof msg.content === 'string' && msg.content.trim() !== '';
    const hasAttachments = Array.isArray(msg.attachments) && msg.attachments.length > 0;

    if (!hasText && !hasAttachments) {
      return res.status(400).json({
        error: `Message at index ${i} must contain either text content or an attachment.`
      });
    }

    if (hasText && msg.content.length > MAX_LEN) {
      return res.status(400).json({
        error: `Message content exceeds maximum allowed length of ${MAX_LEN} characters.`
      });
    }

    // Validate attachments if present
    if (hasAttachments) {
      if (msg.attachments.length > MAX_ATTACHMENTS_PER_MESSAGE) {
        return res.status(400).json({
          error: `Message at index ${i} exceeds maximum limit of ${MAX_ATTACHMENTS_PER_MESSAGE} attachments.`
        });
      }

      for (let j = 0; j < msg.attachments.length; j++) {
        const att = msg.attachments[j];
        if (!att || typeof att !== 'object') {
          return res.status(400).json({ error: `Attachment ${j} at message ${i} is invalid.` });
        }

        const mime = (att.type || '').toLowerCase();
        if (!ALLOWED_MIME_TYPES.has(mime)) {
          return res.status(400).json({
            error: `Unsupported file format "${att.type || 'unknown'}". Supported formats: PNG, JPG, JPEG, WEBP, PDF, TXT, MD, CSV, JSON.`
          });
        }

        if (!att.base64Data || typeof att.base64Data !== 'string') {
          return res.status(400).json({
            error: `Attachment "${att.name || j}" is missing binary base64 data.`
          });
        }

        // Approximate size check (base64 length * 0.75 gives approximate byte size)
        const approxBytes = Math.ceil(att.base64Data.length * 0.75);
        if (approxBytes > MAX_ATTACHMENT_SIZE_BYTES) {
          return res.status(400).json({
            error: `Attachment "${att.name || j}" exceeds the 12MB file size limit.`
          });
        }
      }
    }
  }

  if (systemInstruction && typeof systemInstruction !== 'string') {
    return res.status(400).json({
      error: '"systemInstruction" must be a string if provided.'
    });
  }

  if (temperature !== undefined) {
    const temp = parseFloat(temperature);
    if (isNaN(temp) || temp < 0 || temp > 2) {
      return res.status(400).json({
        error: '"temperature" must be a number between 0.0 and 2.0.'
      });
    }
  }

  next();
}

/**
 * RTK: Request Token Killer - Optimized message pre-processing
 * 1. Sanitization: Strip excessive whitespace.
 * 2. Intelligent Context Trimming: Remove oldest messages (keeping system + last 2).
 */

const MAX_CHAR_THRESHOLD = 80000; // Rough token limit proxy

export function sanitizeContent(content) {
  if (typeof content !== 'string') return content;
  return content
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function trimHistory(messages) {
  if (!Array.isArray(messages) || messages.length <= 3) return messages;

  const totalLen = messages.reduce((acc, m) => acc + (typeof m.content === 'string' ? m.content.length : 100), 0);
  if (totalLen < MAX_CHAR_THRESHOLD) return messages;

  const system = messages.filter(m => m.role === 'system');
  const keep = messages.slice(-2);
  const others = messages.filter(m => m.role !== 'system' && !keep.includes(m));

  // Keep system + last 2 + half of remaining oldest to stay under limit
  return [...system, ...others.slice(Math.max(0, others.length - 10)), ...keep];
}

export function processRtkPayload(body) {
  if (!body || !Array.isArray(body.messages)) return body;

  let messages = body.messages.map(m => ({
    ...m,
    content: sanitizeContent(m.content)
  }));

  messages = trimHistory(messages);

  return { ...body, messages };
}

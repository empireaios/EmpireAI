import { createHash } from 'node:crypto';

// Compare the durable request store with independently read conversation history.
// No model invocation, model self-report, or production mutation is involved.
export function createOmissionCollector({ readRequests, readHistory, clock = Date.now, maxSessions = 100 }) {
  return async signal => {
    const source = await readRequests(signal);
    if (!source || source.ok !== true || source.scope !== 'durable-complete' || !Array.isArray(source.rows) || source.truncated === true || source.hasMore === true)
      throw Error('Complete request inventory unavailable');
    const rows = source.rows.filter(r => r.status === 'COMPLETED');
    const sessions = [...new Set(rows.map(r => r.sessionId))];
    if (sessions.length > maxSessions || sessions.some(s => typeof s !== 'string' || !s)) throw Error('Request scope exceeds collector bound');
    const histories = new Map();
    for (const id of sessions) {
      const h = await readHistory(id, signal);
      if (h?.sessionId !== id || !Array.isArray(h.history) || h.truncated === true || h.hasMore === true) throw Error('History unavailable');
      histories.set(id, h.history);
    }
    const authoritative = [], internal = [], seen = new Set();
    for (const r of rows) {
      if (typeof r.requestId !== 'string' || !r.requestId || seen.has(r.requestId) || typeof r.finalResult?.message !== 'string') throw Error('Malformed completed request');
      seen.add(r.requestId);
      const digest = text => createHash('sha256').update(text).digest('hex');
      authoritative.push({ id:r.requestId, value:digest(r.finalResult.message) });
      const replies = histories.get(r.sessionId).filter(h => h.role === 'assistant' && h.requestId === r.requestId);
      if (replies.length > 1) throw Error('Duplicate assistant delivery');
      if (replies.length === 1) {
        if (typeof replies[0].content !== 'string') throw Error('Malformed assistant delivery');
        internal.push({ id:r.requestId, value:digest(replies[0].content) });
      }
    }
    return {origin:'independent-adapter',source:'durable-request-store versus conversation-history',evidenceId:'omission-'+clock(),observedAt:clock(),authoritative,internal};
  };
}

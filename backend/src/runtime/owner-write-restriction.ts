import fs from 'node:fs';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';

/** Operator-mounted policy only. No HTTP request can release this restriction.
 * Absence, unreadability, unsafe permissions, expired or malformed policy denies writes.
 * A receipt is an audit reference, not a signature or independent proof of approval.
 */
export function ownerWritesRestricted(): boolean {
  const filename = process.env.EMPIRE_OWNER_WRITE_POLICY;
  try {
    if (!filename || !path.isAbsolute(filename) || fs.realpathSync(filename) !== filename) return true;
    const fd = fs.openSync(filename, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    try {
      const st = fs.fstatSync(fd);
      if (!st.isFile() || st.nlink !== 1 || st.size > 4096 || (st.mode & 0o022) !== 0 ||
          (st.uid !== 0 && st.uid !== process.getuid?.())) return true;
      const p: unknown = JSON.parse(fs.readFileSync(fd, 'utf8'));
      if (!p || typeof p !== 'object' || Array.isArray(p)) return true;
      const v = p as Record<string, unknown>;
      if (Object.keys(v).sort().join(',') !== 'approvalSha256,expiresAt,mode,schema') return true;
      return !(v.schema === 1 && v.mode === 'RELEASED' &&
        typeof v.approvalSha256 === 'string' && /^[a-f0-9]{64}$/.test(v.approvalSha256) &&
        typeof v.expiresAt === 'string' && Number.isFinite(Date.parse(v.expiresAt)) &&
        Date.parse(v.expiresAt) > Date.now());
    } finally { fs.closeSync(fd); }
  } catch { return true; }
}

export function assertOwnerWritesReleased(): void {
  if (ownerWritesRestricted()) throw new Error('OWNER_WRITES_RESTRICTED');
}

// Unknown GETs are denied too: legacy reads can initialize or synchronize decisions.
const reads = new Set(['/auth/me', '/health', '/health/live', '/health/ready',
  '/api/owner/advisor/executive']);
export function allowedRestrictedRequest(method: string, url: string): boolean {
  // Reject alternate path encodings and normalization rather than broadening admission.
  const raw = url.split('?')[0];
  if (!raw || raw.includes('%') || raw.includes('\\') || raw.includes('//')) return false;
  if (method === 'POST') return raw === '/auth/login' || raw === '/auth/logout';
  if (method !== 'GET' && method !== 'HEAD') return false;
  if (reads.has(raw)) return true;
  if (raw === '/api/owner/advisor/read') {
    const query = new URL(url, 'http://localhost').searchParams;
    // Other domains may initialize legacy stores; only reviewed durable history here.
    return query.getAll('domain').length === 1 && query.get('domain') === 'memory';
  }
  return false;
}

export function installOwnerWriteRestriction(app: FastifyInstance): void {
  app.addHook('onRequest', async (request, reply) => {
    if (ownerWritesRestricted() && !allowedRestrictedRequest(request.method, request.url)) {
      return reply.code(423).header('cache-control', 'no-store').send({
        code: 'OWNER_WRITES_RESTRICTED', birth: 'NOT_BORN', commerce: 'LOCKED', operational: false,
      });
    }
  });
  app.addHook('onSend', async (request, reply, payload) => {
    if (request.url.split('?')[0] !== '/health/ready' || typeof payload !== 'string' || reply.statusCode !== 200) return payload;
    return JSON.stringify({ ...JSON.parse(payload), ownerWriteRestriction: ownerWritesRestricted() ? 'RESTRICTED' : 'RELEASED' });
  });
}

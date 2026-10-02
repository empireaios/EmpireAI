import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';

// This engine has no Pillow, LLM, commerce-write, or self-certification dependency.
export const REQUIRED_DOMAINS = Object.freeze([
  'runtime', 'workers', 'scheduler', 'pillow-omissions', 'marketplace-orders',
  'supplier-fulfilment-tracking', 'listing-drift', 'money-transactions',
  'refunds-reimbursements', 'provider-accounting', 'evidence-freshness',
  'authority-spending', 'persistence-backups-recovery',
]);
const validTime = n => Number.isSafeInteger(n) && n >= 0;
const canonical = value => {
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint' || typeof value === 'number' && !Number.isFinite(value)) throw Error('Non-JSON evidence');
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (Object.getPrototypeOf(value)!==Object.prototype && Object.getPrototypeOf(value)!==null) throw Error('Non-record evidence');
  return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
};

/** Adapters must read independent authoritative sources; model assertions are not evidence.
 * Snapshot values are compared in memory. Durable receipts retain digests, never raw records.
 */
export function reconcileSnapshot(snapshot, now, maxAgeMs) {
  if (!validTime(now) || !Number.isSafeInteger(maxAgeMs) || maxAgeMs <= 0) throw Error('Invalid clock policy');
  if (!snapshot) return { status: 'NOT_CHECKED', reason: 'No collector result' };
  if (snapshot.unavailable === true) return { status: 'SOURCE_UNAVAILABLE', reason: 'Authoritative source unavailable' };
  if (!snapshot.source || !snapshot.evidenceId || snapshot.origin !== 'independent-adapter')
    return { status: 'NOT_CHECKED', reason: 'Independent provenance absent' };
  if (!validTime(snapshot.observedAt) || snapshot.observedAt > now)
    return { status: 'FAIL', reason: 'Invalid or future evidence timestamp' };
  if (now - snapshot.observedAt > maxAgeMs) return { status: 'STALE', reason: 'Evidence expired' };
  if (!Array.isArray(snapshot.authoritative) || !Array.isArray(snapshot.internal))
    return { status: 'NOT_CHECKED', reason: 'Both independently read record sets required' };
  const index = rows => {
    const map = new Map();
    for (const r of rows) {
      if (!r || typeof r.id !== 'string' || !r.id || map.has(r.id) || !Object.hasOwn(r, 'value')) throw Error('Invalid or duplicate record identity');
      map.set(r.id, canonical(r.value));
    }
    return map;
  };
  try {
    const a = index(snapshot.authoritative), b = index(snapshot.internal);
    let missing = 0, unexpected = 0, mismatched = 0;
    for (const [id, value] of a) { if (!b.has(id)) missing++; else if (b.get(id) !== value) mismatched++; }
    for (const id of b.keys()) if (!a.has(id)) unexpected++;
    const digest = rows => createHash('sha256').update(canonical([...rows].sort((x,y) => x[0].localeCompare(y[0])))).digest('hex');
    return { status: missing + unexpected + mismatched ? 'FAIL' : 'PASS', missing, unexpected, mismatched,
      authoritativeDigest: digest(a), internalDigest: digest(b), observedAt: snapshot.observedAt };
  } catch { return { status: 'FAIL', reason: 'Malformed authoritative or internal records' }; }
}

export class AssuranceStore {
  constructor(filename) {
    this.db = new DatabaseSync(filename);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
      CREATE TABLE IF NOT EXISTS assurance_cycles (
        id TEXT PRIMARY KEY, scheduled_at INTEGER NOT NULL UNIQUE, started_at INTEGER NOT NULL,
        completed_at INTEGER, receipt TEXT);
    `);
  }
  begin(id, scheduledAt, startedAt) {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(id) || !validTime(scheduledAt) || !validTime(startedAt) || startedAt < scheduledAt) throw Error('Invalid cycle');
    this.db.prepare('INSERT INTO assurance_cycles(id,scheduled_at,started_at) VALUES(?,?,?)').run(id, scheduledAt, startedAt);
  }
  complete(id, completedAt, checks) {
    if (!validTime(completedAt) || REQUIRED_DOMAINS.some(d => !checks[d]) || Object.keys(checks).length !== REQUIRED_DOMAINS.length) throw Error('Incomplete coverage receipt');
    const allowed = ['PASS','FAIL','NOT_CHECKED','STALE','SOURCE_UNAVAILABLE'];
    if (Object.values(checks).some(c => !allowed.includes(c.status))) throw Error('Invalid check status');
    const receipt = { schema: 'independent-assurance-cycle-v1', checks,
      coverage: { required: REQUIRED_DOMAINS.length, passed: Object.values(checks).filter(c => c.status === 'PASS').length },
      healthy: Object.values(checks).every(c => c.status === 'PASS'),
      liveProof: false, commerceWrites: 0, inferenceCalls: 0 };
    const r = this.db.prepare('UPDATE assurance_cycles SET completed_at=?,receipt=? WHERE id=? AND completed_at IS NULL AND started_at<=?')
      .run(completedAt, JSON.stringify(receipt), id, completedAt);
    if (r.changes !== 1) throw Error('Cycle absent, already completed, or clock regressed');
    return receipt;
  }
  close() { this.db.close(); }
}

/** Run from a separately supervised monitor, not from the cycle scheduler itself.
 * An incomplete cycle or missing latest scheduled slot can never inherit an older PASS.
 */
export function inspectAssurance(filename, { now, epoch, intervalMs, graceMs }) {
  if (![now, epoch].every(validTime) || !Number.isSafeInteger(intervalMs) || intervalMs <= 0 || !Number.isSafeInteger(graceMs) || graceMs < 0 || graceMs >= intervalMs)
    throw Error('Invalid independent schedule policy');
  const due = now < epoch + graceMs ? null : epoch + Math.floor((now - graceMs - epoch) / intervalMs) * intervalMs;
  if (due === null) return { status: 'NOT_CHECKED', healthy: false, reason: 'First cycle not due' };
  let db;
  try {
    db = new DatabaseSync(filename, { readOnly: true });
    const row = db.prepare('SELECT * FROM assurance_cycles WHERE scheduled_at=?').get(due);
    if (!row || row.completed_at === null) return { status: 'ASSURANCE_OVERDUE', healthy: false, due };
    if (row.completed_at > now || row.completed_at < row.started_at || row.completed_at > due + graceMs)
      return { status: 'ASSURANCE_OVERDUE', healthy: false, due, reason: 'Cycle completion outside tolerance' };
    const receipt = JSON.parse(row.receipt);
    const healthy = REQUIRED_DOMAINS.every(d => receipt.checks?.[d]?.status === 'PASS');
    return { status: healthy ? 'PASS' : 'DEGRADED', healthy, due, receipt };
  } catch { return { status: 'SOURCE_UNAVAILABLE', healthy: false, due }; }
  finally { db?.close(); }
}

export async function runAssuranceCycle(store, { id, scheduledAt, collectors, maxAgeMs, clock = Date.now, timeoutMs = 10000 }) {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 60000) throw Error('Invalid collector deadline');
  if (!Number.isSafeInteger(maxAgeMs) || maxAgeMs <= 0) throw Error('Invalid freshness policy');
  store.begin(id, scheduledAt, clock());
  const checks = {};
  for (const domain of REQUIRED_DOMAINS) {
    if (typeof collectors[domain] !== 'function') { checks[domain] = { status: 'NOT_CHECKED', reason: 'Adapter not configured' }; continue; }
    let timer;
    const controller = new AbortController();
    try {
      const snapshot = await Promise.race([
        Promise.resolve().then(() => collectors[domain](controller.signal)),
        new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(Error('deadline')); }, timeoutMs); }),
      ]);
      checks[domain] = reconcileSnapshot(snapshot, clock(), maxAgeMs);
    } catch { checks[domain] = { status: 'SOURCE_UNAVAILABLE', reason: 'Collector failed or exceeded deadline' }; }
    finally { clearTimeout(timer); }
  }
  return store.complete(id, clock(), checks);
}

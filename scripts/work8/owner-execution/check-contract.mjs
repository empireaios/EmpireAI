import { createHash } from 'node:crypto';

export function requireCheck(condition, code) {
  if (!condition) throw new Error(code);
}
export function assertReadiness(live, ready, expectedSource) {
  requireCheck(live.status === 200 && live.body?.status === 'ok' && live.body?.brain === 'online', 'LIVE_NOT_ONLINE');
  requireCheck(live.body?.tier0Isolation === true && live.body?.role === 'tier0-primary', 'PRIMARY_NOT_ISOLATED');
  requireCheck(live.body?.deploy?.gitCommitSha === expectedSource, 'SOURCE_IDENTITY_MISMATCH');
  const r = ready.body;
  requireCheck(ready.status === 200 && r?.ready === true && r?.brain === 'online' && r?.tier0Isolation === true && r?.workerOnline === true && r?.workerReady === true, 'WORKER_NOT_READY');
  requireCheck(r.sessionStore === 'redis' && r.checks?.redis?.ok === true && r.checks?.redis?.ping === true, 'REAL_REDIS_NOT_READY');
  requireCheck(r.pillow?.enabled === true && r.pillow?.ready === true && r.pillow?.lifecycle === 'running' && r.checks?.pillow?.ok === true, 'PILLOW_RUNTIME_NOT_READY');
}
export function assertRecord(record, target, command) {
  requireCheck(record?.id === target && record.kind === 'EXPERIENCE' && record.origin?.authenticity === 'SYNTHETIC', 'SYNTHETIC_RECORD_IDENTITY');
  requireCheck(record.version === 1 && record.events?.length === 1, 'ONE_DURABLE_TRANSITION_REQUIRED');
  const event = record.events[0];
  requireCheck(event.id === command.id && event.target === target && event.kind === 'OWNER_DECISION' && event.decision === 'DEFER' && event.expectedVersion === 0 && event.note === command.note, 'DECISION_HISTORY_MISMATCH');
  requireCheck(event.origin?.actor === 'GRAND_KING' && event.origin?.authenticity === 'SYNTHETIC' && event.origin?.source?.startsWith('authenticated-owner:'), 'AUTHENTICATED_SYNTHETIC_ORIGIN_REQUIRED');
  requireCheck(event.grantsAuthority === false && record.grantsAuthority === false, 'AUTHORITY_BOUNDARY');
  return record;
}
export function assertExecutive(body, target, command) {
  requireCheck(body?.birth === 'NOT_BORN' && body.commerce === 'LOCKED' && body.grantsAuthority === false && body.inferenceCalls === 0 && body.externalEffects === 0, 'LOCKED_EXECUTIVE_BOUNDARY');
  const r = body.recommendations?.find(item => item.id === target);
  requireCheck(r?.version === 1 && r.classification === 'SYNTHETIC' && r.status === 'DEFERRED' && r.executionStatus === 'NOT_EXECUTED' && r.ownerDecision?.id === command.id && r.ownerDecision?.decision === 'DEFER' && r.grantsAuthority === false, 'EXECUTIVE_DEFER_READBACK');
  return r;
}
export function digest(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

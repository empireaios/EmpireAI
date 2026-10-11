'use strict';
// Offline recovery inventory. Never opens the application or grants runtime authority.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { captureCheckpoint, verifyCheckpoint } = require('./legacy-checkpoint-capture.cjs');
const STORES = Object.freeze({
  intelligence: 'commissioning/intelligence.sqlite',
  pillowMemory: 'commissioning/pillow-institutional.sqlite',
  pillowRequests: 'commissioning/pillow-request-receipts.sqlite',
  pillowReasoning: 'commissioning/pillow-reasoning.sqlite',
  communications: 'commissioning/communications.sqlite',
  liveCostCentre: 'commissioning/openai-october-2026.sqlite',
  assurance: 'commissioning/assurance.sqlite',
  financialEvidence: 'finance/evidence.sqlite',
  commerce: 'commerce/runtime.sqlite',
});
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function sync(dir) { const fd = fs.openSync(dir, 'r'); try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); } }
function write(file, value) { const fd = fs.openSync(file, 'wx', 0o600); try { fs.writeFileSync(fd, JSON.stringify(value)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); } }
function canonical(dir) { assert.ok(path.isAbsolute(dir)); assert.equal(fs.realpathSync(dir), dir); }
function stable(root) {
  return Object.fromEntries(Object.entries(STORES).map(([id, relative]) => {
    const file = path.join(root, relative); canonical(file);
    const s = fs.lstatSync(file); assert.ok(s.isFile() && s.nlink === 1);
    for (const suffix of ['-wal', '-shm', '-journal']) assert.ok(!fs.existsSync(file + suffix), 'ACTIVE_SIDECAR');
    return [id, [s.dev, s.ino, s.size, s.mtimeMs, s.ctimeMs]];
  }));
}
function captureSystem({ root, destination, sourceCommit, parentDigest = null, capturedAt = new Date().toISOString() }) {
  canonical(root); canonical(path.dirname(destination));
  assert.equal(path.resolve(destination), destination);
  assert.ok(!destination.startsWith(root + path.sep), 'VAULT_MUST_BE_SEPARATE');
  assert.match(sourceCommit, /^[a-f0-9]{40}$/);
  assert.ok(parentDigest === null || /^[a-f0-9]{64}$/.test(parentDigest));
  assert.equal(new Date(capturedAt).toISOString(), capturedAt);
  const before = stable(root), started = performance.now();
  fs.mkdirSync(destination, { mode: 0o700 }); sync(path.dirname(destination));
  const stores = {};
  for (const [id, relative] of Object.entries(STORES)) stores[id] = captureCheckpoint({ source: path.join(root, relative), destination: path.join(destination, id), sourceCommit }).manifestSha256;
  assert.deepEqual(stable(root), before, 'SYSTEM_SOURCE_DIVERGED');
  const manifest = { schema: 'WORK8_OFFLINE_SYSTEM_VAULT_V1', sourceCommit, capturedAt, parentDigest, stores,
    authority: 'HISTORICAL_ONLY_DO_NOT_BOOT', completeLiveState: false,
    limitations: ['Global writer quiescence unproven', 'Redis and pending RAM excluded', 'Legacy primary/native/JSON checkpoints require existing capture adapters', 'Off-host retention not established'],
    elapsedMs: performance.now() - started };
  write(path.join(destination, 'system.json'), manifest); sync(destination);
  return { directory: destination, digest: sha(fs.readFileSync(path.join(destination, 'system.json'))), manifest };
}
function verifySystem({ directory, digest }) {
  canonical(directory); assert.match(digest, /^[a-f0-9]{64}$/);
  const file = path.join(directory, 'system.json'); canonical(file);
  assert.ok(fs.statSync(file).size <= 65536); const bytes = fs.readFileSync(file);
  assert.equal(sha(bytes), digest, 'SYSTEM_MANIFEST_DIGEST'); const m = JSON.parse(bytes);
  assert.equal(m.schema, 'WORK8_OFFLINE_SYSTEM_VAULT_V1'); assert.equal(m.authority, 'HISTORICAL_ONLY_DO_NOT_BOOT');
  assert.equal(m.completeLiveState, false); assert.deepEqual(Object.keys(m.stores).sort(), Object.keys(STORES).sort());
  assert.deepEqual(fs.readdirSync(directory).sort(), [...Object.keys(STORES), 'system.json'].sort());
  for (const id of Object.keys(STORES)) verifyCheckpoint({ directory: path.join(directory, id), manifestSha256: m.stores[id] });
  return m;
}
// Whole checkpoints only: never prune ancestors, replace business state or boot recovered grants.
function selectSystemPoint({ checkpoints, trustedHead, at }) {
  assert.ok(checkpoints.length > 0 && checkpoints.length <= 1000);
  const byDigest = new Map(checkpoints.map(c => [c.digest, c])); assert.equal(byDigest.size, checkpoints.length);
  const seen = new Set(); let current = trustedHead, newer = Infinity, selected;
  const target = Date.parse(at); assert.ok(Number.isFinite(target));
  while (current !== null) {
    assert.ok(!seen.has(current), 'RECOVERY_CYCLE'); seen.add(current);
    const c = byDigest.get(current); assert.ok(c, 'MISSING_ANCESTOR'); const m = verifySystem(c);
    const when = Date.parse(m.capturedAt); assert.ok(Number.isFinite(when) && when <= newer, 'RECOVERY_TIME_ORDER');
    if (!selected && when <= target) selected = { ...c, recoveryPointGapMs: target - when };
    newer = when; current = m.parentDigest;
  }
  assert.ok(selected, 'NO_CHECKPOINT_AT_TIME'); return selected;
}
function stageSystemInspection({ directory, digest, destination }) {
  const started = performance.now(); verifySystem({ directory, digest }); canonical(path.dirname(destination));
  assert.equal(path.resolve(destination), destination); assert.ok(!destination.startsWith(directory + path.sep));
  fs.mkdirSync(destination, { mode: 0o700 });
  // Non-runtime layout intentionally prevents accidental recognition as a production volume.
  fs.cpSync(directory, path.join(destination, 'sealed-evidence'), { recursive: true, errorOnExist: true, force: false });
  verifySystem({ directory: path.join(destination, 'sealed-evidence'), digest });
  write(path.join(destination, 'INSPECTION_ONLY.json'), { digest, noExecutionAuthority: true, bootAllowed: false }); sync(destination);
  return { digest, elapsedMs: performance.now() - started, bootAllowed: false, operationalRtoGuaranteed: false };
}
module.exports = { STORES, captureSystem, verifySystem, selectSystemPoint, stageSystemInspection };

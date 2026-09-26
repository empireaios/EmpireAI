'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');
const { captureLegacyShadowDisk, verifyLegacyShadowDisk } = require('./legacy-shadow-state-capture.cjs');
const sha = filename => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'shadow-disk-test-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dataDir = path.join(root, 'old', '.data');
  const authorityFile = path.join(root, 'old', 'module', 'authority-store.json');
  const volumeRoot = path.join(root, 'volume');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(path.dirname(authorityFile));
  fs.mkdirSync(volumeRoot);
  const db = new DatabaseSync(path.join(dataDir, 'shadow-ceo.db'));
  db.exec("CREATE TABLE messages(id INTEGER PRIMARY KEY, text TEXT); INSERT INTO messages VALUES(1,'persisted');");
  db.close();
  fs.writeFileSync(path.join(dataDir, 'shadow-ceo-request-owners.json'), '{"request":"owner"}\n');
  fs.writeFileSync(authorityFile, '{"authority":"locked"}\n');
  return { root, dataDir, authorityFile, volumeRoot,
    destination: path.join(volumeRoot, 'legacy-shadow-unique'), sourceCommit: 'a'.repeat(40) };
}
function args(f) { return [f.dataDir, f.authorityFile, f.destination, f.sourceCommit, f.volumeRoot]; }

test('copies three distinct legacy files to mounted volume, checks bytes and pins unknown RAM', t => {
  const f = fixture(t), original = [path.join(f.dataDir, 'shadow-ceo.db'),
    path.join(f.dataDir, 'shadow-ceo-request-owners.json'), f.authorityFile].map(sha);
  const result = captureLegacyShadowDisk(f);
  assert.match(result.manifestSha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(verifyLegacyShadowDisk(f.destination, result.manifestSha256),
    { verifiedDiskCopy: true, pendingRam: 'UNKNOWN', safeToPromote: false });
  assert.deepEqual([path.join(f.dataDir, 'shadow-ceo.db'),
    path.join(f.dataDir, 'shadow-ceo-request-owners.json'), f.authorityFile].map(sha), original);
  const m = JSON.parse(fs.readFileSync(path.join(f.destination, 'manifest.json'), 'utf8'));
  assert.deepEqual(m.entries.map(x => x.present), [true, true, true]);
  assert.deepEqual(m.entries.map(x => x.sha256), original);
  assert.equal(m.completeLiveState, false); assert.equal(m.importAuthorized, false);
  assert.equal(m.quiescenceProven, false);
  const db = new DatabaseSync(path.join(f.destination, 'shadow-ceo.db'), { readOnly: true });
  assert.equal(db.prepare('SELECT text FROM messages WHERE id=1').get().text, 'persisted'); db.close();
  assert.throws(() => captureLegacyShadowDisk(f), /EEXIST/);
});

test('absent old paths are explicit and never become cutover authority', t => {
  const f = fixture(t);
  for (const name of ['shadow-ceo.db', 'shadow-ceo-request-owners.json']) fs.unlinkSync(path.join(f.dataDir, name));
  fs.unlinkSync(f.authorityFile);
  const result = captureLegacyShadowDisk(f);
  const m = JSON.parse(fs.readFileSync(path.join(f.destination, 'manifest.json')));
  assert.deepEqual(m.entries.map(x => x.present), [false, false, false]);
  assert.equal(m.pendingRam, 'UNKNOWN'); assert.equal(m.safeToPromote, false);
  assert.equal(verifyLegacyShadowDisk(f.destination, result.manifestSha256).safeToPromote, false);
});

test('interrupted write leaves no manifest, never overwrites prior output or source', t => {
  const f = fixture(t), db = path.join(f.dataDir, 'shadow-ceo.db'), original = sha(db);
  const write = fs.writeSync;
  t.mock.method(fs, 'writeSync', (...params) => { write(...params); throw Error('INJECTED_INTERRUPTION'); });
  assert.throws(() => captureLegacyShadowDisk(f), /INJECTED_INTERRUPTION/);
  t.mock.restoreAll();
  assert.equal(sha(db), original);
  assert.equal(fs.existsSync(path.join(f.destination, 'manifest.json')), false);
  assert.throws(() => captureLegacyShadowDisk(f), /EEXIST/);
});

test('source mutation during copy refuses a success manifest', t => {
  const f = fixture(t), db = path.join(f.dataDir, 'shadow-ceo.db'), write = fs.writeSync;
  let mutated = false;
  t.mock.method(fs, 'writeSync', (...params) => {
    const n = write(...params);
    if (!mutated) { mutated = true; fs.appendFileSync(db, Buffer.alloc(2048)); }
    return n;
  });
  assert.throws(() => captureLegacyShadowDisk(f), /changed|mismatch/);
  t.mock.restoreAll();
  assert.equal(fs.existsSync(path.join(f.destination, 'manifest.json')), false);
});

test('rejects SQLite sidecars, corrupt JSON and source links without a success manifest', t => {
  const f = fixture(t), sidecar = path.join(f.dataDir, 'shadow-ceo.db-wal');
  fs.writeFileSync(sidecar, 'pending');
  assert.throws(() => captureLegacyShadowDisk(f), /sidecar/);
  assert.equal(fs.existsSync(path.join(f.destination, 'manifest.json')), false);
  fs.rmSync(f.destination, { recursive: true }); fs.unlinkSync(sidecar);
  fs.writeFileSync(f.authorityFile, '{broken');
  assert.throws(() => captureLegacyShadowDisk(f));
  assert.equal(fs.existsSync(path.join(f.destination, 'manifest.json')), false);
  fs.rmSync(f.destination, { recursive: true }); fs.unlinkSync(f.authorityFile);
  fs.symlinkSync(path.join(f.dataDir, 'shadow-ceo-request-owners.json'), f.authorityFile);
  assert.throws(() => captureLegacyShadowDisk(f), /Unsupported|Symlink/);
  assert.equal(fs.existsSync(path.join(f.destination, 'manifest.json')), false);
});

test('verifier rejects backup and manifest tamper', t => {
  const f = fixture(t), result = captureLegacyShadowDisk(f), copied = path.join(f.destination, 'authority-store.json');
  fs.appendFileSync(copied, ' ');
  assert.throws(() => verifyLegacyShadowDisk(f.destination, result.manifestSha256), /missing or changed|digest mismatch/);
  fs.appendFileSync(path.join(f.destination, 'manifest.json'), ' ');
  assert.throws(() => verifyLegacyShadowDisk(f.destination, result.manifestSha256), /Manifest digest mismatch/);
});

test('CLI accepts explicit paths and emits only disk proof, never live-state claim', t => {
  const f = fixture(t), script = path.join(__dirname, 'legacy-shadow-state-capture.cjs');
  const capture = spawnSync(process.execPath, [script, 'capture', ...args(f)], { encoding: 'utf8' });
  assert.equal(capture.status, 0, capture.stderr);
  const receipt = JSON.parse(capture.stdout);
  assert.equal(receipt.pendingRam, 'UNKNOWN'); assert.equal(receipt.safeToPromote, false);
  const verify = spawnSync(process.execPath, [script, 'verify', f.destination, receipt.manifestSha256], { encoding: 'utf8' });
  assert.equal(verify.status, 0, verify.stderr);
  assert.equal(JSON.parse(verify.stdout).safeToPromote, false);
});

'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const { captureCheckpoint, verifyCheckpoint } = require('./legacy-checkpoint-capture.cjs');
function fixture(t) {
  const directory = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'legacy-capture-test-')));
  t.after(() => { assert.ok(directory.startsWith(fs.realpathSync(os.tmpdir()) + path.sep)); fs.rmSync(directory, { recursive: true, force: true }); });
  const source = path.join(directory, 'original.db');
  const db = new DatabaseSync(source); db.exec('CREATE TABLE evidence(id INTEGER PRIMARY KEY, value TEXT); INSERT INTO evidence VALUES(1,\'retained\');'); db.close();
  return { source, destination: path.join(directory, 'capture'), sourceCommit: 'a'.repeat(40), directory };
}
const digest = filename => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
test('captures and verifies real saved SQLite while explicitly retaining unknown RAM and no import authority', t => {
  const f = fixture(t), original = digest(f.source), result = captureCheckpoint(f);
  assert.equal(digest(f.source), original);
  assert.deepEqual(verifyCheckpoint({ directory: f.destination, manifestSha256: result.manifestSha256 }),
    { verified: true, pendingRam: 'UNKNOWN', quiescenceProven: false, completeLiveState: false, importAuthorized: false });
  const copied = new DatabaseSync(path.join(f.destination, 'checkpoint.db'), { readOnly: true });
  assert.equal(copied.prepare('SELECT value FROM evidence WHERE id=1').get().value, 'retained'); copied.close();
  assert.throws(() => captureCheckpoint(f), /EEXIST/); assert.equal(digest(f.source), original);
});
test('streams a valid SQLite checkpoint larger than 512 MiB and verifies the full copy', t => {
  const f = fixture(t);
  const size = 512 * 1024 * 1024 + 4096;
  // Sparse trailing pages avoid manufacturing 513 MiB of private test data.
  // The capture still reads, writes, hashes and integrity-checks the full size.
  fs.truncateSync(f.source, size);
  const result = captureCheckpoint(f);
  assert.equal(fs.statSync(path.join(f.destination, 'checkpoint.db')).size, size);
  assert.deepEqual(verifyCheckpoint({ directory: f.destination, manifestSha256: result.manifestSha256 }),
    { verified: true, pendingRam: 'UNKNOWN', quiescenceProven: false, completeLiveState: false, importAuthorized: false });
});
test('interrupted output preserves original and incomplete capture cannot verify or be overwritten', t => {
  const f = fixture(t), original = digest(f.source), write = fs.writeSync;
  t.mock.method(fs, 'writeSync', (...args) => { write(...args); throw Error('INJECTED_INTERRUPTION'); });
  assert.throws(() => captureCheckpoint(f), /INJECTED_INTERRUPTION/); t.mock.restoreAll();
  assert.equal(digest(f.source), original); assert.equal(fs.existsSync(path.join(f.destination, 'manifest.json')), false);
  assert.throws(() => verifyCheckpoint({ directory: f.destination, manifestSha256: '0'.repeat(64) }));
  assert.throws(() => captureCheckpoint(f), /EEXIST/);
});
test('concurrent source mutation is rejected without publishing a success manifest', t => {
  const f = fixture(t), write = fs.writeSync; let mutated = false;
  t.mock.method(fs, 'writeSync', (...args) => {
    const result = write(...args);
    if (!mutated) { mutated = true; fs.appendFileSync(f.source, Buffer.alloc(4096)); }
    return result;
  });
  assert.throws(() => captureCheckpoint(f), /changed|deeply equal/); t.mock.restoreAll();
  assert.equal(fs.existsSync(path.join(f.destination, 'manifest.json')), false);
});
test('corrupt copied SQLite cannot produce an integrity-success manifest', t => {
  const f = fixture(t); fs.writeFileSync(f.source, Buffer.alloc(8192, 5)); const original = digest(f.source);
  assert.throws(() => captureCheckpoint(f)); assert.equal(digest(f.source), original);
  assert.equal(fs.existsSync(path.join(f.destination, 'manifest.json')), false);
});
test('verifier rejects data tamper, manifest tamper and linked sources', t => {
  const f = fixture(t), result = captureCheckpoint(f), args = { directory: f.destination, manifestSha256: result.manifestSha256 };
  const file = path.join(f.destination, 'checkpoint.db'), bytes = fs.readFileSync(file);
  const altered = Buffer.from(bytes); altered[100] ^= 1; fs.writeFileSync(file, altered);
  assert.throws(() => verifyCheckpoint(args), /digest mismatch/); fs.writeFileSync(file, bytes);
  fs.appendFileSync(path.join(f.destination, 'manifest.json'), ' ');
  assert.throws(() => verifyCheckpoint(args), /Manifest digest mismatch/);
  fs.linkSync(f.source, path.join(f.directory, 'linked.db'));
  assert.throws(() => captureCheckpoint({ ...f, destination: path.join(f.directory, 'linked-capture') }), /Unsupported source/);
});
test('capture rejects a valid replacement copied database at the integrity boundary', t => {
  const f = fixture(t), alternate = path.join(f.directory, 'alternate.db');
  fs.copyFileSync(f.source, alternate);
  const db = new DatabaseSync(alternate); db.exec("UPDATE evidence SET value='changed'"); db.close();
  const prepare = DatabaseSync.prototype.prepare; let changed = false;
  t.mock.method(DatabaseSync.prototype, 'prepare', function(sql, ...args) {
    if (sql === 'PRAGMA integrity_check' && !changed) { changed = true; fs.copyFileSync(alternate, path.join(f.destination, 'checkpoint.db')); }
    return prepare.call(this, sql, ...args);
  });
  assert.throws(() => captureCheckpoint(f), /changed|deeply equal/); t.mock.restoreAll();
  assert.ok(changed); assert.equal(fs.existsSync(path.join(f.destination, 'manifest.json')), false);
});
test('verification rejects a valid replacement database after the initial digest before integrity', t => {
  const f = fixture(t), result = captureCheckpoint(f), alternate = path.join(f.directory, 'alternate.db');
  fs.copyFileSync(f.source, alternate);
  const db = new DatabaseSync(alternate); db.exec("UPDATE evidence SET value='changed'"); db.close();
  const prepare = DatabaseSync.prototype.prepare; let changed = false;
  t.mock.method(DatabaseSync.prototype, 'prepare', function(sql, ...args) {
    if (sql === 'PRAGMA integrity_check' && !changed) { changed = true; fs.copyFileSync(alternate, path.join(f.destination, 'checkpoint.db')); }
    return prepare.call(this, sql, ...args);
  });
  assert.throws(() => verifyCheckpoint({ directory: f.destination, manifestSha256: result.manifestSha256 }), /changed|digest mismatch|deeply equal/);
  t.mock.restoreAll(); assert.ok(changed);
});

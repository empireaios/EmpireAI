'use strict';
// Offline disk-checkpoint evidence only. Never loads the application or contacts a provider.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const MAX = 512 * 1024 * 1024;
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const identity = s => Object.fromEntries(['dev','ino','size','mtimeMs','ctimeMs'].map(k => [k, s[k]]));
function regular(filename) {
  assert.equal(fs.realpathSync(filename), filename, 'Canonical non-symlink path required');
  const s = fs.lstatSync(filename);
  assert.ok(s.isFile() && s.nlink === 1 && s.size > 0 && s.size <= MAX, 'Unsupported source file');
  return identity(s);
}
function directorySync(directory) {
  if (process.platform === 'win32') return false;
  const fd = fs.openSync(directory, 'r'); try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  return true;
}
function digestFd(fd, size) {
  const digest = crypto.createHash('sha256'), bytes = Buffer.alloc(65536);
  let offset = 0;
  while (offset < size) {
    const count = fs.readSync(fd, bytes, 0, Math.min(bytes.length, size - offset), offset);
    assert.ok(count > 0, 'File truncated'); digest.update(bytes.subarray(0, count)); offset += count;
  }
  return digest.digest('hex');
}
function digestFile(filename) {
  const before = regular(filename), fd = fs.openSync(filename, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    assert.deepEqual(identity(fs.fstatSync(fd)), before);
    const digest = digestFd(fd, before.size);
    assert.deepEqual(identity(fs.fstatSync(fd)), before); assert.deepEqual(regular(filename), before);
    return digest;
  } finally { fs.closeSync(fd); }
}
function integrity(filename) {
  const db = new DatabaseSync(filename, { readOnly: true });
  try {
    const rows = db.prepare('PRAGMA integrity_check').all();
    assert.equal(rows.length, 1); assert.equal(Object.values(rows[0])[0], 'ok', 'SQLite integrity failed');
  } finally { db.close(); }
}
function captureCheckpoint({ source, destination, sourceCommit }) {
  assert.match(sourceCommit || '', /^[a-f0-9]{40}$/);
  assert.ok(path.isAbsolute(source) && path.isAbsolute(destination));
  assert.equal(path.resolve(destination), destination);
  assert.equal(fs.realpathSync(path.dirname(destination)), path.dirname(destination));
  const before = regular(source);
  const input = fs.openSync(source, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    assert.deepEqual(identity(fs.fstatSync(input)), before);
    // Exclusive directory reservation prevents overwriting any prior capture.
    // Failure/interruption leaves an incomplete directory, never a success manifest.
    fs.mkdirSync(destination, { mode: 0o700 });
    directorySync(path.dirname(destination));
    const target = path.join(destination, 'checkpoint.db');
    const output = fs.openSync(target, 'wx', 0o600);
    try {
      const bytes = Buffer.alloc(65536); let offset = 0;
      while (offset < before.size) {
        const count = fs.readSync(input, bytes, 0, Math.min(bytes.length, before.size - offset), offset);
        assert.ok(count > 0, 'Source truncated during capture');
        for (let written = 0; written < count;) {
          const progress = fs.writeSync(output, bytes, written, count - written);
          assert.ok(progress > 0, 'Copy made no write progress'); written += progress;
        }
        offset += count;
      }
      fs.fsyncSync(output);
    } finally { fs.closeSync(output); }
    const sha256 = digestFd(input, before.size);
    assert.equal(digestFile(target), sha256, 'Source changed during capture');
    assert.deepEqual(identity(fs.fstatSync(input)), before, 'Source changed during capture');
    assert.deepEqual(regular(source), before, 'Source path changed during capture');
    const targetIdentity = regular(target);
    integrity(target);
    assert.deepEqual(regular(target), targetIdentity, 'Copied checkpoint changed during integrity check');
    assert.equal(digestFile(target), sha256, 'Copied checkpoint changed during integrity check');
    assert.deepEqual(identity(fs.fstatSync(input)), before, 'Source changed during integrity check');
    assert.deepEqual(regular(source), before, 'Source path changed during integrity check');
    const manifest = { schema: 'legacy-persisted-checkpoint-v1', capturedAt: new Date().toISOString(),
      source: { path: source, commit: sourceCommit, identity: before }, file: { name: 'checkpoint.db', size: before.size, sha256 },
      sqliteIntegrity: 'ok', pendingRam: 'UNKNOWN', quiescenceProven: false, completeLiveState: false,
      sourceCommitIndependentlyVerified: false, redisCaptured: false, sidecarsCaptured: false,
      importAuthorized: false, directoryFsyncVerified: process.platform !== 'win32' };
    const serialized = Buffer.from(JSON.stringify(manifest, null, 2) + '\n');
    const fd = fs.openSync(path.join(destination, 'manifest.json'), 'wx', 0o600);
    try { fs.writeFileSync(fd, serialized); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    directorySync(destination);
    return { directory: destination, manifestSha256: hash(serialized), pendingRam: 'UNKNOWN', quiescenceProven: false };
  } finally { fs.closeSync(input); }
}
function verifyCheckpoint({ directory, manifestSha256 }) {
  assert.match(manifestSha256 || '', /^[a-f0-9]{64}$/);
  assert.equal(fs.realpathSync(directory), directory);
  assert.deepEqual(fs.readdirSync(directory).sort(), ['checkpoint.db', 'manifest.json']);
  const filename = path.join(directory, 'manifest.json'); regular(filename);
  const bytes = fs.readFileSync(filename); assert.equal(hash(bytes), manifestSha256, 'Manifest digest mismatch');
  const m = JSON.parse(bytes);
  assert.equal(m.schema, 'legacy-persisted-checkpoint-v1'); assert.match(m.source.commit, /^[a-f0-9]{40}$/);
  assert.equal(m.pendingRam, 'UNKNOWN'); assert.equal(m.sqliteIntegrity, 'ok');
  for (const key of ['quiescenceProven','completeLiveState','sourceCommitIndependentlyVerified','redisCaptured','sidecarsCaptured','importAuthorized']) assert.equal(m[key], false);
  assert.equal(m.file.name, 'checkpoint.db');
  const database = path.join(directory, m.file.name);
  const databaseIdentity = regular(database);
  assert.equal(databaseIdentity.size, m.file.size); assert.equal(digestFile(database), m.file.sha256, 'Checkpoint digest mismatch');
  integrity(database);
  assert.deepEqual(regular(database), databaseIdentity, 'Checkpoint changed during integrity check');
  assert.equal(digestFile(database), m.file.sha256, 'Checkpoint digest mismatch after integrity check');
  return { verified: true, pendingRam: 'UNKNOWN', quiescenceProven: false, completeLiveState: false, importAuthorized: false };
}
module.exports = { captureCheckpoint, verifyCheckpoint };

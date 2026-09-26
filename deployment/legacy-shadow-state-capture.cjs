'use strict';
/** Disk-only capture of old-main Shadow CEO stores. Does not read SQL.js RAM,
 * stop writers, migrate records, import state or authorize a production cutover.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const MAX_FILE = 512 * 1024 * 1024;
const digest = data => crypto.createHash('sha256').update(data).digest('hex');
const id = s => Object.fromEntries(['dev', 'ino', 'size', 'mtimeMs', 'ctimeMs'].map(k => [k, s[k]]));
function fsyncDir(dir) {
  if (process.platform === 'win32') return;
  const fd = fs.openSync(dir, 'r'); try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}
function source(filename) {
  assert.equal(path.resolve(filename), filename, 'Absolute canonical source path required');
  let stat;
  try { stat = fs.lstatSync(filename); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  assert.ok(stat.isFile() && stat.nlink === 1 && stat.size > 0 && stat.size <= MAX_FILE,
    'Unsupported or oversized source file');
  assert.equal(fs.realpathSync(filename), filename, 'Symlink source refused');
  return id(stat);
}
function noSqliteSidecars(filename) {
  for (const suffix of ['-wal', '-shm', '-journal']) {
    assert.ok(!fs.existsSync(`${filename}${suffix}`),
      `SQLite sidecar ${suffix} exists; reconcile it before an offline disk capture`);
  }
}
function hashFile(filename, size) {
  const fd = fs.openSync(filename, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const buf = Buffer.alloc(65536), hash = crypto.createHash('sha256');
    let position = 0;
    while (position < size) {
      const n = fs.readSync(fd, buf, 0, Math.min(buf.length, size - position), position);
      assert.ok(n > 0, 'File shortened during capture');
      hash.update(buf.subarray(0, n)); position += n;
    }
    assert.equal(fs.fstatSync(fd).size, size, 'File size changed');
    return hash.digest('hex');
  } finally { fs.closeSync(fd); }
}
function validateCopy(filename, kind) {
  if (kind === 'sqlite') {
    const db = new DatabaseSync(filename, { readOnly: true });
    try { assert.equal(db.prepare('PRAGMA integrity_check').get()?.integrity_check, 'ok', 'Shadow CEO SQLite integrity failed'); }
    finally { db.close(); }
  } else {
    const value = JSON.parse(fs.readFileSync(filename, 'utf8'));
    assert.ok(value && typeof value === 'object' && !Array.isArray(value), 'Shadow CEO JSON root malformed');
  }
}
function validatePaths({ dataDir, authorityFile, destination, sourceCommit, volumeRoot }) {
  assert.match(sourceCommit || '', /^[a-f0-9]{40}$/, 'Exact old-main commit required');
  for (const p of [dataDir, authorityFile, destination, volumeRoot]) {
    assert.ok(typeof p === 'string' && path.isAbsolute(p) && path.resolve(p) === p,
      'Absolute canonical paths required');
  }
  assert.equal(fs.realpathSync(path.dirname(destination)), path.dirname(destination),
    'Destination parent must exist without a symlink');
  assert.equal(fs.realpathSync(volumeRoot), volumeRoot, 'Mounted volume symlink refused');
  assert.ok(fs.statSync(volumeRoot).isDirectory(), 'Mounted volume must be a directory');
  const relative = path.relative(volumeRoot, destination);
  assert.ok(relative && relative !== '..' && !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative), 'Backup destination must be inside mounted volume');
  for (const original of [dataDir, authorityFile]) {
    assert.notEqual(path.resolve(original), destination, 'Source and destination must differ');
  }
}
function captureLegacyShadowDisk(input) {
  validatePaths(input);
  const sources = [
    { name: 'shadow-ceo.db', path: path.join(input.dataDir, 'shadow-ceo.db'), kind: 'sqlite' },
    { name: 'shadow-ceo-request-owners.json', path: path.join(input.dataDir, 'shadow-ceo-request-owners.json'), kind: 'json' },
    { name: 'authority-store.json', path: input.authorityFile, kind: 'json' },
  ];
  // Refuse an existing destination even after an interrupted attempt: no overwrite.
  fs.mkdirSync(input.destination, { mode: 0o700 }); fsyncDir(path.dirname(input.destination));
  const entries = [];
  for (const item of sources) {
    if (item.kind === 'sqlite') noSqliteSidecars(item.path);
    const before = source(item.path);
    if (!before) { entries.push({ name: item.name, present: false }); continue; }
    const inputFd = fs.openSync(item.path, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    try {
      assert.deepEqual(id(fs.fstatSync(inputFd)), before, 'Source changed before read');
      const target = path.join(input.destination, item.name);
      const output = fs.openSync(target, 'wx', 0o600);
      try {
        const buf = Buffer.alloc(65536); let position = 0;
        while (position < before.size) {
          const n = fs.readSync(inputFd, buf, 0, Math.min(buf.length, before.size - position), position);
          assert.ok(n > 0, 'Source shortened');
          let written = 0;
          while (written < n) {
            const progress = fs.writeSync(output, buf, written, n - written);
            assert.ok(progress > 0, 'Copy made no progress'); written += progress;
          }
          position += n;
        }
        fs.fsyncSync(output);
      } finally { fs.closeSync(output); }
      const originalHash = hashFile(item.path, before.size);
      assert.deepEqual(id(fs.fstatSync(inputFd)), before, 'Source changed during copy');
      assert.deepEqual(source(item.path), before, 'Source path changed during copy');
      assert.equal(hashFile(target, before.size), originalHash, 'Copied digest mismatch');
      validateCopy(target, item.kind);
      assert.equal(hashFile(target, before.size), originalHash, 'Copied file changed during validation');
      assert.deepEqual(source(item.path), before, 'Source changed during validation');
      if (item.kind === 'sqlite') noSqliteSidecars(item.path);
      entries.push({ name: item.name, present: true, size: before.size, sha256: originalHash });
    } finally { fs.closeSync(inputFd); }
  }
  const manifest = {
    schema: 'legacy-shadow-disk-capture-v1', capturedAt: new Date().toISOString(),
    sourceCommit: input.sourceCommit, sourcePaths: { dataDir: input.dataDir, authorityFile: input.authorityFile },
    entries, pendingRam: 'UNKNOWN', quiescenceProven: false,
    completeLiveState: false, importAuthorized: false, safeToPromote: false,
  };
  const bytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
  const fd = fs.openSync(path.join(input.destination, 'manifest.json'), 'wx', 0o600);
  try { fs.writeFileSync(fd, bytes); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  fsyncDir(input.destination);
  return { directory: input.destination, manifestSha256: digest(bytes), pendingRam: 'UNKNOWN', safeToPromote: false };
}
function verifyLegacyShadowDisk(directory, manifestSha256) {
  assert.match(manifestSha256 || '', /^[a-f0-9]{64}$/);
  assert.equal(fs.realpathSync(directory), directory);
  const manifestFile = path.join(directory, 'manifest.json');
  const bytes = fs.readFileSync(manifestFile);
  assert.equal(digest(bytes), manifestSha256, 'Manifest digest mismatch');
  const m = JSON.parse(bytes);
  assert.equal(m.schema, 'legacy-shadow-disk-capture-v1');
  assert.equal(m.pendingRam, 'UNKNOWN');
  for (const key of ['quiescenceProven', 'completeLiveState', 'importAuthorized', 'safeToPromote'])
    assert.equal(m[key], false);
  assert.deepEqual(m.entries.map(x => x.name),
    ['shadow-ceo.db', 'shadow-ceo-request-owners.json', 'authority-store.json']);
  assert.deepEqual(fs.readdirSync(directory).sort(),
    ['manifest.json', ...m.entries.filter(x => x.present).map(x => x.name)].sort());
  for (const entry of m.entries) if (entry.present) {
    assert.ok(Number.isSafeInteger(entry.size) && entry.size > 0 && entry.size <= MAX_FILE);
    const filename = path.join(directory, entry.name);
    assert.equal(source(filename)?.size, entry.size, 'Backup file missing or changed');
    assert.equal(hashFile(filename, entry.size), entry.sha256, 'Backup digest mismatch');
    validateCopy(filename, entry.name.endsWith('.db') ? 'sqlite' : 'json');
    assert.equal(hashFile(filename, entry.size), entry.sha256, 'Backup changed during validation');
  }
  return { verifiedDiskCopy: true, pendingRam: 'UNKNOWN', safeToPromote: false };
}
module.exports = { captureLegacyShadowDisk, verifyLegacyShadowDisk };
if (require.main === module) {
  try {
    const [operation, ...args] = process.argv.slice(2);
    let result;
    if (operation === 'capture' && args.length === 5) {
      const [dataDir, authorityFile, destination, sourceCommit, volumeRoot] = args;
      result = captureLegacyShadowDisk({ dataDir, authorityFile, destination, sourceCommit, volumeRoot });
    } else if (operation === 'verify' && args.length === 2) {
      result = verifyLegacyShadowDisk(...args);
    } else {
      throw new Error('Usage: capture <absolute data dir> <absolute authority file> <new destination inside volume> <old-main SHA> <absolute volume root> | verify <absolute capture dir> <manifest SHA-256>');
    }
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stderr.write(`Legacy Shadow disk capture failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}

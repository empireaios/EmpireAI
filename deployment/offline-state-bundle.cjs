'use strict';
// Offline-only tooling. This does not stop services, flush SQL.js, contact a
// provider, capture Redis, replace live files or prove production quiescence.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const ACK = 'ALL_WRITERS_STOPPED_AND_FINAL_SQLJS_FLUSH_VERIFIED';
const FILES = [
  { role: 'primary', filename: 'empireai-brain.db', suffix: '', max: 512 * 1024 * 1024 },
  { role: 'missions', filename: 'empireai-brain.db.missions.sqlite', suffix: '.missions.sqlite', max: 64 * 1024 * 1024 },
  { role: 'executions', filename: 'empireai-brain.db.mission-execution.sqlite', suffix: '.mission-execution.sqlite', max: 16 * 1024 * 1024 },
];
const LEGACY = { role: 'legacy_missions', filename: 'empireai-brain.db.missions.json', suffix: '.missions.json', max: 16 * 1024 * 1024 };
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const exactKeys = (object, keys) => object && typeof object === 'object' && !Array.isArray(object) &&
  Object.keys(object).sort().join() === [...keys].sort().join();
function check(condition, message) { if (!condition) throw new Error(message); }
function scopeMatches(a, b) { return a?.workspaceId === b.workspaceId && a?.ownerEmail === b.ownerEmail; }
function validateIdentity(options) {
  check(process.platform !== 'win32', 'Offline tool requires POSIX lock and directory durability semantics');
  check(options.acknowledgement === ACK, 'Explicit offline quiescence acknowledgement required; tool cannot stop or flush writers');
  check(typeof options.buildSha === 'string' && /^[a-f0-9]{40}$/.test(options.buildSha), 'Full expected source build SHA required');
  check(exactKeys(options.scope, ['ownerEmail', 'workspaceId']) && options.scope.workspaceId === 'ws_empire_1' &&
    typeof options.scope.ownerEmail === 'string' && options.scope.ownerEmail.includes('@') && options.scope.ownerEmail.length <= 254 &&
    options.scope.ownerEmail === options.scope.ownerEmail.trim().toLowerCase(), 'Canonical configured owner scope required');
}
function directorySync(directory) {
  check(process.platform !== 'win32', 'This offline tool requires POSIX directory durability and lock semantics');
  const fd = fs.openSync(directory, 'r'); try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}
function absentSidecars(filename) {
  for (const suffix of ['-wal', '-shm', '-journal']) check(!fs.existsSync(`${filename}${suffix}`), 'SQLite sidecar present; stop writers and reconcile/checkpoint explicitly before backup');
}
function regular(filename, maximum) {
  check(path.isAbsolute(filename) && fs.realpathSync(filename) === filename, 'Canonical regular path required; symlinks are not accepted');
  const stat = fs.lstatSync(filename);
  check(stat.isFile() && stat.nlink === 1 && stat.size > 0 && stat.size <= maximum, 'File missing, linked or outside supported size bound');
  return stat;
}
function sameFile(before, after) {
  return before.dev === after.dev && before.ino === after.ino && before.size === after.size &&
    before.mtimeMs === after.mtimeMs && before.ctimeMs === after.ctimeMs;
}
function digestFile(filename, maximum) {
  const before = regular(filename, maximum); const hashStream = crypto.createHash('sha256');
  const fd = fs.openSync(filename, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    check(sameFile(before, fs.fstatSync(fd)), 'Source file identity changed before reading');
    const buffer = Buffer.alloc(64 * 1024); let bytes = 0; let count;
    while ((count = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0) {
      bytes += count; check(bytes <= maximum, 'Source grew beyond its bound'); hashStream.update(buffer.subarray(0, count));
    }
    check(bytes === before.size && sameFile(before, regular(filename, maximum)), 'Source changed while reading; quiescence not established');
    return { size: bytes, sha256: hashStream.digest('hex'), stat: before };
  } finally { fs.closeSync(fd); }
}
function copyPrivate(source, destination, maximum) {
  const original = digestFile(source, maximum);
  const input = fs.openSync(source, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  const output = fs.openSync(destination, 'wx', 0o600);
  try {
    check(sameFile(original.stat, fs.fstatSync(input)), 'Source replaced before copy');
    const buffer = Buffer.alloc(64 * 1024); let count; let total = 0;
    while ((count = fs.readSync(input, buffer, 0, buffer.length, null)) > 0) {
      total += count; check(total <= maximum, 'Source grew during copy');
      for (let written = 0; written < count;) written += fs.writeSync(output, buffer, written, count - written);
    }
    fs.fsyncSync(output);
  } finally { fs.closeSync(input); fs.closeSync(output); }
  const after = digestFile(source, maximum); const copied = digestFile(destination, maximum);
  check(sameFile(original.stat, after.stat) && original.sha256 === after.sha256 && copied.sha256 === original.sha256, 'Source changed during copy; bundle not committed');
  return { size: copied.size, sha256: copied.sha256, stat: original.stat };
}
function tables(db) { return db.prepare("SELECT type,name FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => `${row.type}:${row.name}`).join(); }
function inspectDatabases(handles, scope) {
  const primary = handles[0].db;
  const owner = primary.prepare('SELECT id FROM users WHERE email=? AND role=? AND workspace_id=?').all(scope.ownerEmail, 'founder', scope.workspaceId);
  check(owner.length === 1 && typeof owner[0].id === 'string' && owner[0].id.length > 0, 'Primary database does not contain the expected founder/workspace');
  const missions = handles[1].db;
  check(missions.prepare('PRAGMA application_id').get().application_id === 0x454d5352 &&
    missions.prepare('PRAGMA user_version').get().user_version === 3 && tables(missions) === 'table:mission_snapshot', 'Unsupported native mission schema');
  const rows = missions.prepare('SELECT id,revision,envelope,legacy_sha256 FROM mission_snapshot').all();
  check(rows.length === 1 && rows[0].id === 1 && Number.isSafeInteger(rows[0].revision) && rows[0].revision > 0 && typeof rows[0].envelope === 'string', 'Mission authoritative record invalid');
  const envelope = JSON.parse(rows[0].envelope);
  check(envelope.version === 3 && scopeMatches(envelope.scope, scope) && envelope.state && Array.isArray(envelope.state.missions), 'Mission scope/envelope mismatch');
  const executions = handles[2].db;
  check(executions.prepare('PRAGMA application_id').get().application_id === 0x454d4558 &&
    executions.prepare('PRAGMA user_version').get().user_version === 1 &&
    tables(executions) === 'table:execution_events,table:execution_jobs,table:execution_meta', 'Unsupported native execution schema');
  const meta = executions.prepare('SELECT id,scope FROM execution_meta').all();
  check(meta.length === 1 && meta[0].id === 1 && scopeMatches(JSON.parse(meta[0].scope), scope), 'Execution scope mismatch');
  const legacySha256 = rows[0].legacy_sha256;
  check(legacySha256 === null || (typeof legacySha256 === 'string' && /^[a-f0-9]{64}$/.test(legacySha256)), 'Legacy lineage is invalid');
  return { primaryOwnerId: owner[0].id, missionRevision: rows[0].revision, legacySha256 };
}
function withLockedDatabases(paths, scope, operation) {
  const handles = [];
  try {
    for (let i = 0; i < FILES.length; i++) {
      const filename = paths[i]; const before = regular(filename, FILES[i].max); absentSidecars(filename);
      const fd = fs.openSync(filename, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
      const header = Buffer.alloc(100);
      try { check(sameFile(before, fs.fstatSync(fd)) && fs.readSync(fd, header, 0, header.length, 0) === 100, 'SQLite file header unavailable'); }
      finally { fs.closeSync(fd); }
      check(header.subarray(0, 16).toString() === 'SQLite format 3\0' && header[18] === 1 && header[19] === 1,
        'Only completed rollback-journal databases are supported; WAL requires explicit offline reconciliation');
      const db = new DatabaseSync(filename, { timeout: 0, allowExtension: false }); handles.push({ db, filename, before });
      db.exec('PRAGMA trusted_schema=OFF; PRAGMA busy_timeout=0;');
      check(db.prepare('PRAGMA journal_mode').get().journal_mode === 'delete', 'Only quiesced DELETE journal databases are supported; no automatic WAL conversion');
      db.exec('BEGIN EXCLUSIVE');
      absentSidecars(filename);
      check(sameFile(before, regular(filename, FILES[i].max)), 'Database was replaced while locking; stop every writer');
      const checks = db.prepare('PRAGMA quick_check').all();
      check(checks.length === 1 && checks[0].quick_check === 'ok', 'SQLite integrity check failed; original files retained');
    }
    return operation(handles, inspectDatabases(handles, scope));
  } finally {
    for (const { db } of handles.reverse()) { try { if (db.isTransaction) db.exec('ROLLBACK'); } finally { db.close(); } }
  }
}
function withNewStaging(destination, operation) {
  check(path.isAbsolute(destination) && path.resolve(destination) === destination && fs.realpathSync(path.dirname(destination)) === path.dirname(destination), 'Canonical absolute destination with existing parent required');
  // Exclusive empty reservation prevents another invocation from owning this name.
  // No database appears under the final directory until atomic publication.
  fs.mkdirSync(destination, { mode: 0o700 });
  const reservation = fs.lstatSync(destination);
  const stage = fs.mkdtempSync(path.join(path.dirname(destination), `.${path.basename(destination)}.partial-`));
  fs.chmodSync(stage, 0o700);
  const stageIdentity = fs.lstatSync(stage);
  const ownStage = () => {
    try { const current = fs.lstatSync(stage); return current.isDirectory() && current.dev === stageIdentity.dev &&
      current.ino === stageIdentity.ino && fs.realpathSync(stage) === stage; } catch { return false; }
  };
  let published = false;
  try {
    const prepared = operation(stage);
    check(ownStage(), 'Private staging directory identity changed; refusing publication');
    directorySync(stage);
    check(ownStage(), 'Private staging directory identity changed after sync');
    prepared.validate();
    check(ownStage(), 'Private staging directory identity changed before publication');
    const current = fs.lstatSync(destination);
    check(current.isDirectory() && current.dev === reservation.dev && current.ino === reservation.ino &&
      fs.readdirSync(destination).length === 0, 'Destination reservation changed; existing data not replaced');
    fs.renameSync(stage, destination); published = true;
    directorySync(path.dirname(destination));
    return prepared.result;
  } finally {
    if (!published) {
      // Remove only the exact names created by this operation; unknown contents
      // cause rmdir to fail and remain for investigation.
      if (ownStage()) {
        for (const filename of [...FILES.map(f => f.filename), LEGACY.filename, 'manifest.json', 'restore-receipt.json']) {
          try { fs.unlinkSync(path.join(stage, filename)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
        }
        try { fs.rmdirSync(stage); } catch (error) { if (!['ENOENT','ENOTEMPTY'].includes(error.code)) throw error; }
      }
      try {
        const current = fs.lstatSync(destination);
        if (current.isDirectory() && current.dev === reservation.dev && current.ino === reservation.ino) fs.rmdirSync(destination);
      } catch (error) { if (!['ENOENT','ENOTEMPTY'].includes(error.code)) throw error; }
    }
  }
}
function validateCopiedSet(directory, files, proofFilename, proofBytes) {
  check(fs.readdirSync(directory).sort().join() === [proofFilename, ...files.map(file => file.filename)].sort().join(),
    'Unexpected or missing staged files; refusing publication');
  const proof = digestFile(path.join(directory, proofFilename), 64 * 1024);
  check(proof.size === Buffer.byteLength(proofBytes) && proof.sha256 === hash(proofBytes), 'Staged proof bytes changed; refusing publication');
  for (const file of files) {
    const spec = [...FILES, LEGACY].find(item => item.filename === file.filename);
    const actual = digestFile(path.join(directory, file.filename), spec.max);
    check(actual.size === file.size && actual.sha256 === file.sha256, 'Staged file changed before publication');
    if (spec !== LEGACY) absentSidecars(path.join(directory, file.filename));
  }
}
function writePrivate(filename, bytes) {
  const fd = fs.openSync(filename, 'wx', 0o600); try { fs.writeFileSync(fd, bytes); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}
function backupState(options) {
  validateIdentity(options);
  check(typeof options.quiescenceEvidenceSha256 === 'string' && /^[a-f0-9]{64}$/.test(options.quiescenceEvidenceSha256), 'Independently retained shutdown/quiescence evidence digest required');
  const primary = path.resolve(options.databasePath);
  check(primary === options.databasePath, 'Canonical absolute primary path required');
  return withLockedDatabases(FILES.map(file => primary + file.suffix), options.scope, (handles, observed) => {
    const sources = FILES.map((file, index) => ({ ...file, sourcePath: handles[index].filename }));
    const legacyPath = primary + LEGACY.suffix;
    check(!fs.existsSync(legacyPath + '.lock'), 'Legacy mission writer lock present; reconciliation required');
    if (observed.legacySha256) {
      check(digestFile(legacyPath, LEGACY.max).sha256 === observed.legacySha256, 'Preserved legacy lineage file missing or changed');
      sources.push({ ...LEGACY, sourcePath: legacyPath });
    } else check(!fs.existsSync(legacyPath), 'Unbound legacy mission file requires explicit reconciliation');
    return withNewStaging(options.destination, stage => {
    const files = sources.map(source => {
      const copied = copyPrivate(source.sourcePath, path.join(stage, source.filename), source.max);
      return { role: source.role, filename: source.filename, sourcePath: source.sourcePath, size: copied.size, sha256: copied.sha256 };
    });
    // Catch SQL.js atomic replacement, which does not respect native SQLite locks.
    // Stopping and final-flushing those processes is an external prerequisite.
    for (let i = 0; i < handles.length; i++) {
      absentSidecars(handles[i].filename);
      check(sameFile(handles[i].before, regular(handles[i].filename, FILES[i].max)) &&
        digestFile(handles[i].filename, FILES[i].max).sha256 === files[i].sha256, 'Writer activity detected; backup not committed');
    }
    const manifest = { format: 'empireai-offline-state-bundle-v1', createdAt: new Date().toISOString(), sourceBuildSha: options.buildSha,
      toolSha256: hash(fs.readFileSync(__filename)), buildIdentityEvidence: "DECLARED_SOURCE_BUILD_NOT_OBSERVED_RUNTIME", scope: options.scope, observed,
      prerequisite: { acknowledgement: ACK, quiescenceEvidenceSha256: options.quiescenceEvidenceSha256,
        nativeExclusiveLocksVerified: true, allWriterShutdownVerifiedByTool: false },
      scopeOfProof: { offlineFileBundle: true, productionSnapshot: false, redisIncluded: false, remoteBackup: false }, files };
    const bytes = Buffer.from(JSON.stringify(manifest, null, 2) + '\n');
    writePrivate(path.join(stage, 'manifest.json'), bytes);
    return { validate: () => validateCopiedSet(stage, files, 'manifest.json', bytes),
      result: { manifestSha256: hash(bytes), bundle: options.destination, sourceBuildSha: options.buildSha, scopeOfProof: manifest.scopeOfProof } };
    });
  });
}
function restoreState(options) {
  validateIdentity(options);
  check(typeof options.manifestSha256 === 'string' && /^[a-f0-9]{64}$/.test(options.manifestSha256), 'Independent expected manifest SHA-256 required');
  const bundle = path.resolve(options.bundle);
  check(bundle === options.bundle && fs.realpathSync(bundle) === bundle, 'Canonical bundle directory required');
  check(typeof options.destination === 'string' && options.destination !== bundle && !options.destination.startsWith(bundle + path.sep), 'Restore destination must be outside the backup bundle');
  const manifestPath = path.join(bundle, 'manifest.json'); regular(manifestPath, 64 * 1024);
  const bytes = fs.readFileSync(manifestPath); check(hash(bytes) === options.manifestSha256, 'Manifest digest does not match independently retained value');
  const m = JSON.parse(bytes);
  check(exactKeys(m, ['format','createdAt','sourceBuildSha','toolSha256','buildIdentityEvidence','scope','observed','prerequisite','scopeOfProof','files']) &&
    exactKeys(m.scope, ['ownerEmail','workspaceId']) && exactKeys(m.observed, ['primaryOwnerId','missionRevision','legacySha256']) &&
    m.format === 'empireai-offline-state-bundle-v1' && m.buildIdentityEvidence === 'DECLARED_SOURCE_BUILD_NOT_OBSERVED_RUNTIME' && m.sourceBuildSha === options.buildSha && scopeMatches(m.scope, options.scope) &&
    Number.isFinite(Date.parse(m.createdAt)) && /^[a-f0-9]{64}$/.test(m.toolSha256), 'Manifest identity/schema mismatch');
  check(exactKeys(m.prerequisite, ['acknowledgement','quiescenceEvidenceSha256','nativeExclusiveLocksVerified','allWriterShutdownVerifiedByTool']) && m.prerequisite.acknowledgement === ACK && m.prerequisite.nativeExclusiveLocksVerified === true &&
    m.prerequisite.allWriterShutdownVerifiedByTool === false && /^[a-f0-9]{64}$/.test(m.prerequisite.quiescenceEvidenceSha256), 'Manifest quiescence evidence mismatch');
  check(JSON.stringify(m.scopeOfProof) === JSON.stringify({ offlineFileBundle: true, productionSnapshot: false, redisIncluded: false, remoteBackup: false }), 'Unsupported proof claims');
  const expected = m.observed?.legacySha256 ? [...FILES, LEGACY] : FILES;
  check(Array.isArray(m.files) && m.files.length === expected.length, 'Required database set is incomplete');
  check(fs.readdirSync(bundle).sort().join() === ['manifest.json', ...expected.map(file => file.filename)].sort().join(), 'Bundle contains unexpected or missing files');
  for (let i = 0; i < expected.length; i++) {
    const file = m.files[i]; const spec = expected[i];
    check(exactKeys(file, ['role','filename','sourcePath','size','sha256']) && file.role === spec.role && file.filename === spec.filename &&
      typeof file.sourcePath === 'string' && path.isAbsolute(file.sourcePath) && Number.isSafeInteger(file.size) && file.size > 0 && file.size <= spec.max &&
      typeof file.sha256 === 'string' && /^[a-f0-9]{64}$/.test(file.sha256), 'Manifest file entry invalid');
    const digest = digestFile(path.join(bundle, file.filename), spec.max);
    check(digest.size === file.size && digest.sha256 === file.sha256, 'Backup file digest mismatch');
  }
  return withLockedDatabases(FILES.map(file => path.join(bundle, file.filename)), options.scope, (_handles, observed) => {
    check(JSON.stringify(observed) === JSON.stringify(m.observed), 'Stored identities or lineage differ from manifest');
    if (observed.legacySha256) check(m.files.at(-1).sha256 === observed.legacySha256, 'Legacy lineage digest mismatch');
    return withNewStaging(options.destination, stage => {
    for (let i = 0; i < expected.length; i++) {
      const copied = copyPrivate(path.join(bundle, expected[i].filename), path.join(stage, expected[i].filename), expected[i].max);
      check(copied.sha256 === m.files[i].sha256, 'Backup changed during restore; restored directory is not complete');
    }
    const receipt = { format: 'empireai-offline-restore-receipt-v1', restoredAt: new Date().toISOString(), manifestSha256: options.manifestSha256,
      sourceBuildSha: m.sourceBuildSha, scope: m.scope, databasePath: path.join(options.destination, FILES[0].filename),
      allFilesByteVerified: true, productionCutover: false, applicationReopenVerified: false, redisRestored: false };
    const receiptBytes = Buffer.from(JSON.stringify(receipt, null, 2) + '\n');
    writePrivate(path.join(stage, 'restore-receipt.json'), receiptBytes);
    return { validate: () => validateCopiedSet(stage, m.files, 'restore-receipt.json', receiptBytes), result: receipt };
    });
  });
}
module.exports = { ACK, FILES, backupState, restoreState };
if (require.main === module) {
  try {
    const [mode, requestFile] = process.argv.slice(2);
    check(process.argv.length === 4 && ['backup','restore'].includes(mode), 'Usage: node deployment/offline-state-bundle.cjs backup|restore PRIVATE_REQUEST_JSON');
    const requestPath = path.resolve(requestFile); regular(requestPath, 64 * 1024);
    const request = JSON.parse(fs.readFileSync(requestPath, 'utf8'));
    process.stdout.write(JSON.stringify(mode === 'backup' ? backupState(request) : restoreState(request)) + '\n');
  } catch (error) { process.stderr.write(`Offline state bundle refused: ${error.message}\n`); process.exitCode = 1; }
}

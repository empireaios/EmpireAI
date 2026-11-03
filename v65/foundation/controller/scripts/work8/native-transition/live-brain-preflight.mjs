import {emitNativeFailure,diagnosticState} from './native-diagnostic.mjs';
// Bounded real-module preflight. No HTTP server, commerce route, provider, model,
// or scheduler starts. The application's real getDatabase() initializes and
// migrates its actual cached SQL.js instance; it is not a fabricated DB copy.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import {observeLiveBrain, logicalLiveBrainStore, liveBrainSchemaSha256, canonicalJson, sha256} from './live-brain-observation.mjs';
import {independentBrainReadback, assertBrainLogicalEquality} from './independent-brain-readback.mjs';

process.on('uncaughtExceptionMonitor',error=>emitNativeFailure(error,'SQLJS_MODULE_SETUP','INITIALIZE_RETAINED_SQLJS_MODULE',diagnosticState,'SQLJS_MODULE_PREFLIGHT'));
process.umask(0o077);
const backend = path.resolve(process.argv[2] || '');
const output = path.resolve(process.argv[3] || '');
assert.ok(backend.endsWith('/app/backend'), 'EXACT_RETAINED_BACKEND_REQUIRED');
assert.ok(output.includes('/live-brain/'), 'ISOLATED_PREFLIGHT_OUTPUT_REQUIRED');
fs.mkdirSync(output, {recursive: true, mode: 0o700});
const privateDir = path.join(output, 'private-' + randomUUID());
fs.mkdirSync(privateDir, {mode: 0o700});
const file = path.join(privateDir, 'brain.sqlite');
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = file;
process.env.LOG_LEVEL = 'fatal';
process.env.SQLITE_FIRST_FLUSH_DELAY_MS = '3600000';
const source = '94aa919c7c39c4c9bf2c14b636232da028dba72d';
const procStatus = fs.readFileSync('/proc/self/status', 'utf8');
const field = name => procStatus.match(new RegExp('^' + name + ':\\s*(.+)$', 'm'))?.[1]?.trim() ?? null;
const receipt = {
  schema: 'work8-v30-live-brain-preflight-v1',
  status: 'FAIL',
  scope: 'ACTUAL_RETAINED_SQLJS_MODULE_LIFECYCLE_WITHOUT_APPLICATION_STARTUP',
  nativeApplicationCaptureIntegrationProven: false,
  exactHostedWriterIdentityProven: process.geteuid() === 65534 && process.getegid() === 65534,
  node: process.version,
  startedAt: new Date().toISOString(),
  identities: {pid: process.pid, uid: process.geteuid(), gid: process.getegid(), groups: process.getgroups(), capEff: field('CapEff'), capPrm: field('CapPrm'), capBnd: field('CapBnd'), noNewPrivs: field('NoNewPrivs')},
  source,
  sourceBindings: {},
  checks: [],
  rawRowsPublic: false,
  applicationAuthorityExpanded: false,
};
const check = (id, detail = {}) => receipt.checks.push({id, status: 'PASS', ...detail});
const safeFailure = error => ({code: typeof error?.code === 'string' ? error.code : 'PREFLIGHT_ASSERTION_FAILED', name: error?.name ?? 'Error', sourceFrames: (String(error?.stack ?? '').match(/(?:live-brain-preflight|live-brain-observation|independent-brain-readback|sqlite-database|quiesced-sqlite-save)\.m?js:\d+:\d+/g) ?? []).slice(0, 8), valuesWithheld: true});
let activeCheck = 'SETUP', api, db;
try {
  assert.equal(process.version, 'v22.23.2', 'EXACT_NODE_VERSION_REQUIRED');
  assert.equal(BigInt('0x' + receipt.identities.capEff) & 2n, 0n, 'DAC_OVERRIDE_WOULD_INVALIDATE_DENIAL_PREFLIGHT');
  for (const relative of ['dist/brain/database.js', 'dist/brain/sqlite-database.js', 'dist/brain/quiesced-sqlite-save.js', 'node_modules/sql.js/dist/sql-wasm.wasm']) {
    receipt.sourceBindings[relative] = sha256(fs.readFileSync(path.join(backend, relative)));
  }
  api = await import(pathToFileURL(path.join(backend, 'dist/brain/database.js')).href);
  const {withQuiescedSqliteSave} = await import(pathToFileURL(path.join(backend, 'dist/brain/quiesced-sqlite-save.js')).href);
  const {EmpireDatabase, getSqlitePersistStats} = await import(pathToFileURL(path.join(backend, 'dist/brain/sqlite-database.js')).href);
  activeCheck = 'ACTUAL_INITIALIZED_CACHED_BRAIN';
  db = api.getDatabase();diagnosticState.moduleInitialized=true;
  const readyAt = new Date().toISOString();
  const instanceId = randomUUID();
  assert.equal(api.getDatabase(), db);
  assert.equal(db.filePath, file);
  assert.ok(db.mutationRevision > 0);
  assert.ok(Object.keys(logicalLiveBrainStore(db).tables).length > 0);
  check(activeCheck, {sameCachedInstance: true, moduleInitialized: true});

  activeCheck = 'REAL_DELAYED_PERSISTENCE_DISK_ABSENT';
  assert.equal(fs.existsSync(file), false);
  assert.equal(db.persistedRevision, 0);
  assert.equal(db.persistDirty, true);
  assert.equal(getSqlitePersistStats().flushCount, 0);
  check(activeCheck, {diskPresent: false, logicalSchemaPresent: true, firstFlushDelayMs: 3600000});

  // This is explicitly labelled synthetic negative-control material in the real
  // migrated memory table. No business rows or evidence of commerce are made.
  db.prepare('INSERT INTO memory_records (id,scope,workspace_id,company_id,agent_id,memory_key,value,embedding,expires_at,created_at,updated_at) VALUES (@id,@scope,@workspace,@company,@agent,@key,@value,@embedding,@expires,@created,@updated)').run({
    id: 'work8-v30-live-brain-preflight-only', scope: 'workspace', workspace: 'isolated-preflight', company: null, agent: null,
    key: 'synthetic-private-capture-control', value: '{"synthetic":true,"revision":1}', embedding: null, expires: null, created: readyAt, updated: readyAt,
  });
  const preSave = {logicalStore: logicalLiveBrainStore(db), schemaObjectsSha256: liveBrainSchemaSha256(db)};
  const preRevision = db.mutationRevision;
  const options = {cachedDatabase: api.getDatabase, expectedDatabasePath: file, generation: 'isolated-v30-module-preflight', source, modulePath: path.join(backend, 'dist/brain/database.js'), readyAt, instanceId};
  let capture;
  activeCheck = 'AWAITED_FENCED_SAME_INSTANCE_PERSISTENCE';
  await withQuiescedSqliteSave(db, () => {
    assert.equal(db.captureWriteFence, true);diagnosticState.captureFenceAcquired=true;diagnosticState.persistenceCompleted=db.persistedRevision===db.mutationRevision;
    assert.equal(api.getDatabase(), db);
    assert.equal(db.mutationRevision, preRevision);
    assert.equal(db.persistedRevision, preRevision);
    capture = observeLiveBrain(db, options);
    assertBrainLogicalEquality(preSave, {...capture, schemaObjectsSha256: capture.attestation.schemaObjectsSha256});
    const saved = independentBrainReadback(file);
    assertBrainLogicalEquality(capture, saved);
    receipt.baseline = capture.attestation;
    receipt.saved = {exportSha256: saved.exportSha256, bytes: saved.bytes, mode: fs.statSync(file).mode & 0o777};
    assert.equal(receipt.saved.mode, 0o600);
    check(activeCheck, {liveBeforeEqualsLiveAfter: true, independentNativeSqliteEqual: true, explicitPersistCompletion: true});
    activeCheck = 'WRITES_AND_ALIAS_REFUSED_DURING_CAPTURE';
    assert.throws(() => db.prepare('UPDATE memory_records SET value=@value WHERE id=@id').run({value: 'forbidden', id: 'work8-v30-live-brain-preflight-only'}), /SQLite writes quiesced/);
    assert.throws(() => db.exec('DELETE FROM memory_records'), /SQLite writes quiesced/);
    assert.throws(() => new EmpireDatabase(file), /another SQL.js handle cannot open/);
    assert.throws(() => observeLiveBrain(db, {...options, cachedDatabase: () => ({})}), /CACHED_LIVE_BRAIN_INSTANCE_CHANGED/);
    assert.equal(db.mutationRevision, preRevision);
    check(activeCheck, {writeRefused: true, aliasRefused: true, substitutedInstanceRefused: true});
  });
  assert.equal(db.captureWriteFence, false);
  check('SUCCESS_RELEASES_CAPTURE_FENCE');

  activeCheck = 'CALLBACK_FAILURE_RELEASES_CAPTURE_FENCE';
  await assert.rejects(withQuiescedSqliteSave(db, () => { throw Object.assign(new Error('SYNTHETIC_CAPTURE_CALLBACK_FAILURE'), {code: 'SYNTHETIC_CAPTURE_CALLBACK_FAILURE'}); }), error => error.code === 'SYNTHETIC_CAPTURE_CALLBACK_FAILURE');
  assert.equal(db.captureWriteFence, false);
  check(activeCheck);

  activeCheck = 'PERSISTENCE_FAILURE_EXPLICIT_AND_FENCE_RELEASED';
  const beforeFailedPersist = db.persistedRevision;
  let persistenceFailure;
  fs.chmodSync(privateDir, 0o500);
  try {
    await assert.rejects(withQuiescedSqliteSave(db, () => { throw new Error('CALLBACK_MUST_NOT_RUN_AFTER_FAILED_PERSIST'); }), error => {
      persistenceFailure = error;
      return error.code === 'EACCES';
    });
  } finally { fs.chmodSync(privateDir, 0o700); }
  assert.equal(persistenceFailure.code, 'EACCES');
  assert.equal(db.captureWriteFence, false);
  assert.equal(db.persistedRevision, beforeFailedPersist);
  assert.equal(getSqlitePersistStats().pending, true);
  check(activeCheck, {operation: 'critical-persist-private-temp-create', measuredErrno: persistenceFailure.code, parentModeDuringRefusal: '0500', failureVisible: true});

  activeCheck = 'INTENTIONAL_LIVE_CANONICAL_MUTATION_REJECTED';
  db.prepare('UPDATE memory_records SET value=@value WHERE id=@id').run({value: '{"synthetic":true,"revision":2}', id: 'work8-v30-live-brain-preflight-only'});
  await withQuiescedSqliteSave(db, () => {
    const changed = independentBrainReadback(file);
    assert.throws(() => assertBrainLogicalEquality(capture, changed), /BRAIN_CANONICAL_LOGICAL_STATE_CHANGED/);
    assert.notEqual(changed.logicalStore.tables.memory_records.logicalSha256, capture.logicalStore.tables.memory_records.logicalSha256);
  });
  check(activeCheck, {realLiveMutation: true, independentlySavedMutationDetected: true});
  // Restore only the explicitly labelled negative-control value, so the positive
  // lifecycle comparison remains against its exact original logical baseline.
  db.prepare('UPDATE memory_records SET value=@value WHERE id=@id').run({value: '{"synthetic":true,"revision":1}', id: 'work8-v30-live-brain-preflight-only'});

  activeCheck = 'MISSING_TRUNCATED_CORRUPTED_EXPORTS_REFUSED';
  assert.throws(() => independentBrainReadback(path.join(privateDir, 'missing.sqlite')), error => error.code === 'ENOENT');
  const bytes = fs.readFileSync(file);
  const truncated = path.join(privateDir, 'truncated.sqlite');
  const corrupted = path.join(privateDir, 'corrupted.sqlite');
  fs.writeFileSync(truncated, bytes.subarray(0, Math.floor(bytes.length / 2)), {mode: 0o600});
  const corruptedBytes = Buffer.from(bytes);
  corruptedBytes.fill(0, 0, 100);
  fs.writeFileSync(corrupted, corruptedBytes, {mode: 0o600});
  assert.throws(() => independentBrainReadback(truncated));
  assert.throws(() => independentBrainReadback(corrupted));
  check(activeCheck, {missingRefused: true, truncatedRefused: true, corruptedRefused: true, noEmptyReplacement: true});

  activeCheck = 'ACTUAL_CLOSE_EXPORT_INDEPENDENT_READBACK';
  const beforeDrainRevision = db.mutationRevision;
  assert.equal(api.getDatabase(), db);
  assert.deepEqual(logicalLiveBrainStore(db), capture.logicalStore);
  api.closeDatabase();
  assert.equal(db.closed, true);
  assert.equal(db.persistedRevision, beforeDrainRevision);
  const final = independentBrainReadback(file);
  assertBrainLogicalEquality(capture, final);
  receipt.final = {exportSha256: final.exportSha256, bytes: final.bytes, logicalStoreSha256: sha256(canonicalJson(final.logicalStore)), schemaObjectsSha256: final.schemaObjectsSha256, finalPersistedRevision: db.persistedRevision, finalPersistGeneration: db.persistGeneration};
  check(activeCheck, {originalLiveRowsPreserved: true, finalNativeSqliteEqual: true, noLogicalAuthorityChange: true});
  receipt.status = 'PASS_ACTUAL_SQLJS_MODULE_LIFECYCLE';
} catch (error) {
  receipt.firstFailedAssertion = activeCheck;
  diagnosticState.captureFenceReleased=db?db.captureWriteFence===false:null;receipt.safeFailure = emitNativeFailure(error,activeCheck,'EXECUTE_REAL_MODULE_PREFLIGHT',diagnosticState,'SQLJS_MODULE_PREFLIGHT');
  process.exitCode = 1;
} finally {
  try { if (db && !db.closed && !db.captureWriteFence) api.closeDatabase(); } catch (error) { receipt.cleanupFailure = safeFailure(error); process.exitCode = 1; }
  receipt.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(output, 'preflight-receipt.json'), JSON.stringify(receipt, null, 2) + '\n', {mode: 0o600});
  console.log(JSON.stringify({status: receipt.status, checks: receipt.checks.length, firstFailedAssertion: receipt.firstFailedAssertion ?? null, exactHostedWriterIdentityProven: receipt.exactHostedWriterIdentityProven, nativeApplicationCaptureIntegrationProven: false}));
}

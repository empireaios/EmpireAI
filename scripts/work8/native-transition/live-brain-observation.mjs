// Non-production examination helper. Called only inside the existing admitted
// application capture chain, after its same-instance critical persistence.
// No SQL mutation, persistence implementation, HTTP route, or authority grant.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const sha256 = value => createHash('sha256').update(value).digest('hex');
export const canonicalJson = value => JSON.stringify(value, (_, item) => typeof item === 'bigint' ? String(item) : item);
const quote = name => '"' + name.replaceAll('"', '""') + '"';

// Only constant SELECTs and safely quoted source-declared table names enter the
// live SQL.js reader. Never accept SQL or table selection from a request.
export function logicalLiveBrainStore(db) {
  assert.ok(db && db.closed === false && db.inMemory === false, 'LIVE_INITIALIZED_DISK_BACKED_BRAIN_REQUIRED');
  const names = db.prepare("SELECT name,sql FROM sqlite_schema WHERE type='table' ORDER BY name").all();
  assert.ok(names.length > 0 && names.length <= 2000, 'LIVE_BRAIN_SCHEMA_BOUND');
  const tables = {};
  for (const {name, sql} of names) {
    const rows = db.prepare('SELECT * FROM ' + quote(name) + ' LIMIT 50001').all();
    assert.ok(rows.length <= 50000, 'LIVE_BRAIN_ROW_BOUND');
    const hashes = rows.map(row => sha256(canonicalJson(row))).sort();
    tables[name] = {schemaSha256: sha256(sql || ''), count: rows.length, hashes, logicalSha256: sha256(canonicalJson(hashes))};
    if (name === 'sqlite_sequence') tables[name].sequences = Object.fromEntries(rows.map(row => [row.name, Number(row.seq)]));
  }
  return {
    present: true,
    applicationId: db.pragma('application_id', {simple: true}),
    userVersion: db.pragma('user_version', {simple: true}),
    tables,
  };
}

export function liveBrainSchemaSha256(db) {
  const objects = db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_schema ORDER BY type,name,tbl_name").all();
  assert.ok(objects.length <= 10000, 'LIVE_BRAIN_SCHEMA_OBJECT_BOUND');
  return sha256(canonicalJson(objects));
}

export function observeLiveBrain(db, {
  cachedDatabase,
  expectedDatabasePath,
  generation,
  source,
  modulePath,
  readyAt,
  instanceId,
}) {
  const observedAt = new Date().toISOString();
  assert.equal(typeof cachedDatabase, 'function', 'CACHED_INSTANCE_ACCESSOR_REQUIRED');
  assert.equal(cachedDatabase(), db, 'CACHED_LIVE_BRAIN_INSTANCE_CHANGED');
  assert.equal(db.filePath, expectedDatabasePath, 'LIVE_BRAIN_PATH_CHANGED');
  assert.equal(db.captureWriteFence, true, 'LIVE_BRAIN_FENCE_REQUIRED');
  assert.equal(db.closed, false, 'LIVE_BRAIN_CLOSED');
  assert.ok(Number.isSafeInteger(db.mutationRevision) && db.mutationRevision > 0, 'LIVE_BRAIN_INITIALIZED_REVISION_REQUIRED');
  assert.equal(db.persistedRevision, db.mutationRevision, 'LIVE_BRAIN_AWAITED_PERSIST_REQUIRED');
  assert.ok(Number.isSafeInteger(db.persistGeneration) && db.persistGeneration >= 0, 'LIVE_BRAIN_PERSIST_GENERATION_REQUIRED');
  assert.ok(typeof generation === 'string' && generation.length > 0 && generation.length <= 128, 'LIVE_BRAIN_RUNTIME_GENERATION_REQUIRED');
  assert.match(source, /^[a-f0-9]{40}$/, 'LIVE_BRAIN_SOURCE_IDENTITY_REQUIRED');
  assert.match(instanceId, /^[a-f0-9-]{36}$/, 'LIVE_BRAIN_INSTANCE_ID_REQUIRED');
  assert.ok(Number.isFinite(Date.parse(readyAt)) && Date.parse(readyAt) <= Date.parse(observedAt), 'LIVE_BRAIN_READY_BOUNDARY_REQUIRED');
  const before = {mutationRevision: db.mutationRevision, persistedRevision: db.persistedRevision, persistGeneration: db.persistGeneration};
  const logicalStore = logicalLiveBrainStore(db);
  const schemaObjectsSha256 = liveBrainSchemaSha256(db);
  assert.equal(cachedDatabase(), db, 'CACHED_LIVE_BRAIN_INSTANCE_CHANGED');
  assert.deepEqual({mutationRevision: db.mutationRevision, persistedRevision: db.persistedRevision, persistGeneration: db.persistGeneration}, before, 'LIVE_BRAIN_REVISION_CHANGED_DURING_OBSERVATION');
  assert.equal(db.captureWriteFence, true, 'LIVE_BRAIN_FENCE_LOST');
  const tables = Object.values(logicalStore.tables);
  return {
    logicalStore,
    attestation: {
      schema: 'work8-v30-live-brain-baseline-v1',
      method: 'EXISTING_FENCED_AWAITED_CRITICAL_PERSISTENCE',
      persistenceIsWriteOperation: true,
      sameCachedInstance: true,
      instanceId,
      readyAt,
      observedAt,
      pid: process.pid,
      uid: process.geteuid(),
      gid: process.getegid(),
      groups: process.getgroups(),
      runtimeGeneration: generation,
      source,
      moduleSha256: sha256(fs.readFileSync(modulePath)),
      databasePathSha256: sha256(expectedDatabasePath),
      revisions: before,
      fenceHeld: true,
      logicalStoreSha256: sha256(canonicalJson(logicalStore)),
      schemaObjectsSha256,
      tableCount: tables.length,
      rowCount: tables.reduce((count, table) => count + table.count, 0),
      rawRowsRetained: false,
    },
  };
}

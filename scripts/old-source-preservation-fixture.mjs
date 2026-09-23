#!/usr/bin/env node
// LOCAL SYNTHETIC COUNTEREXAMPLES ONLY. Never connects to a provider or live database.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire, registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';

const repository = path.resolve(process.argv[2] || '.');
const dependencyRoot = path.resolve(process.argv[3] || repository);
const sourceCommit = '21384342c401def948926904913840e63c18dff7';
const require = createRequire(path.join(dependencyRoot, 'package.json'));
const ts = require('typescript');
const backendRequire = createRequire(path.join(dependencyRoot, 'backend/package.json'));
const initSql = backendRequire('sql.js');
const wasm = backendRequire.resolve('sql.js/dist/sql-wasm.wasm');
const sqlVersion = JSON.parse(fs.readFileSync(path.join(path.dirname(wasm), '../package.json'), 'utf8')).version;
const digest = b => createHash('sha256').update(b).digest('hex');
const readSource = relative => {
  const r = spawnSync('git', ['-C', repository, 'show', `${sourceCommit}:${relative}`], { encoding: 'utf8', maxBuffer: 2 ** 22 });
  assert.equal(r.status, 0, 'Exact old source unavailable'); return r.stdout;
};
const oldSql = readSource('backend/src/brain/sqlite-database.ts');
const oldWatchdog = readSource('backend/src/runtime/executive-continuity-watchdog-worker.ts');
const oldLock = JSON.parse(readSource('backend/package-lock.json'));
assert.equal(sqlVersion, oldLock.packages['node_modules/sql.js'].version);
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'empire-old-persistence-'));
const sourcePath = path.join(root, 'backend/src/brain/sqlite-database.ts');
fs.mkdirSync(path.dirname(sourcePath), { recursive: true }); fs.writeFileSync(sourcePath, oldSql);
const sourceUrl = pathToFileURL(sourcePath).href;
const synthetic = { lag: 3000, diskCanFlush: true };
globalThis.__oldPersistenceFixture = { synthetic, initSql, wasm };
const hooks = registerHooks({
  resolve(specifier, context, next) {
    if (context.parentURL === sourceUrl) {
      if (specifier === 'sql.js') return { url: 'fixture:sql', shortCircuit: true };
      if (specifier.endsWith('/event-loop-cooperative.js')) return { url: 'fixture:lag', shortCircuit: true };
      if (specifier.endsWith('/volume-disk-reclaim.js')) return { url: 'fixture:disk', shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    const scripts = {
      'fixture:sql': 'export default () => globalThis.__oldPersistenceFixture.initSql({locateFile:()=>globalThis.__oldPersistenceFixture.wasm});',
      'fixture:lag': 'export const getRecentEventLoopLagMs=()=>globalThis.__oldPersistenceFixture.synthetic.lag; export const getSmoothedEventLoopLagMs=getRecentEventLoopLagMs; export const clearEventLoopLagAfterKnownBlock=()=>{}; export const waitForEventLoopCapacity=async()=>{};',
      'fixture:disk': 'export const getVolumeDiskStats=()=>({canFlushFullDb:globalThis.__oldPersistenceFixture.synthetic.diskCanFlush});',
    };
    if (url in scripts) return { format: 'module', source: scripts[url], shortCircuit: true };
    if (url === sourceUrl) return { format: 'module', source: ts.transpileModule(oldSql, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText, shortCircuit: true };
    return next(url, context);
  },
});
// Prevent normal automatic test saves; explicitly exercise old methods below.
process.env.SQLITE_PERSIST_DEBOUNCE_MS = '3600000';
process.env.SQLITE_FIRST_FLUSH_DELAY_MS = '3600000';
const observations = [];
const readRows = (SQL, file) => {
  const db = new SQL.Database(fs.readFileSync(file));
  try { assert.equal(db.exec('PRAGMA integrity_check')[0].values[0][0], 'ok'); return db.exec('SELECT id FROM fixture ORDER BY id')[0]?.values.flat() || []; }
  finally { db.close(); }
};
const settle = async promise => Promise.race([promise, new Promise((_, reject) => { const t = setTimeout(() => reject(Error('Bounded local fixture timeout')), 5000); t.unref(); })]);
let restoredWrite;
try {
  const { EmpireDatabase, sqlJsEngine: SQL, getSqlitePersistStats } = await import(sourceUrl);
  const file = path.join(root, 'synthetic.db');
  const db = new EmpireDatabase(file);
  db.exec('CREATE TABLE fixture(id INTEGER PRIMARY KEY); INSERT INTO fixture VALUES(1)');
  await db.flushPersistAsync({ critical: false });
  assert.equal(fs.existsSync(file), false);
  observations.push({ case: 'overdue_noncritical_high_lag', outcome: 'SAVE_DEFERRED', databaseFileExists: false, pending: getSqlitePersistStats().pending });
  const requested = db.requestCriticalPersist();
  assert.equal(requested, undefined, 'Old API unexpectedly became awaitable');
  await settle(db.persistInFlight);
  assert.deepEqual(readRows(SQL, file), [1]);
  observations.push({ case: 'critical_request_without_concurrent_writer', outcome: 'CHECKPOINT_SAVED', highLagWasSynthetic: true, rows: [1], returnsAwaitable: false });

  // Hold only this temporary file's write after SQL export. The old implementation
  // remains unchanged; this deterministic I/O barrier models slow async storage.
  const originalWrite = fs.promises.writeFile;
  let release, started;
  const gate = new Promise(r => { release = r; });
  const reached = new Promise(r => { started = r; });
  fs.promises.writeFile = async function(filename, ...args) {
    if (String(filename) === `${file}.tmp-${process.pid}`) { started(); await gate; }
    return originalWrite.call(this, filename, ...args);
  };
  restoredWrite = () => { fs.promises.writeFile = originalWrite; };
  db.exec('INSERT INTO fixture VALUES(2)'); db.requestCriticalPersist();
  await settle(reached);
  db.exec('INSERT INTO fixture VALUES(3)');
  assert.equal(db.requestCriticalPersist(), undefined);
  const inFlight = db.persistInFlight; release(); await settle(inFlight); restoredWrite(); restoredWrite = null;
  assert.deepEqual(readRows(SQL, file), [1, 2]);
  assert.deepEqual(db.prepare('SELECT id FROM fixture ORDER BY id').all().map(r => r.id), [1, 2, 3]);
  assert.equal(getSqlitePersistStats().pending, true);
  observations.push({ case: 'critical_request_during_older_export', outcome: 'LATEST_RAM_WRITE_NOT_IN_COMPLETED_CHECKPOINT', diskRows: [1, 2], ramRows: [1, 2, 3], pending: true, meaning: 'A completed older export and critical request do not establish final-save durability' });
  clearTimeout(db.persistTimer); db.persistTimer = null;
  // Explicit test cleanup flush is NOT available through the old production API.
  db.close();

  const sharedBuffer = new SharedArrayBuffer(8); const view = new Int32Array(sharedBuffer);
  Atomics.store(view, 0, Date.now());
  const storedHeartbeat = Atomics.load(view, 0);
  const heartbeatState = storedHeartbeat <= 0 ? 'WATCHDOG_IGNORES_NONPOSITIVE_HEARTBEAT' : 'EPOCH_HEARTBEAT_TRUNCATED_FALSE_STALE';
  // Positive stale value deterministically exercises the actual old worker exit;
  // importantly this exits only the disposable worker thread, not this test process.
  Atomics.store(view, 0, 1);
  const worker = new Worker(ts.transpileModule(oldWatchdog, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText,
    { eval: true, stderr: true, workerData: { sharedBuffer, stallExitMs: 5000, pollMs: 500, bootGraceMs: 0, startedAtMs: Date.now() - 1000 } });
  let stderr = ''; worker.stderr.on('data', bytes => { stderr += bytes; });
  const exitCode = await settle(new Promise((resolve, reject) => { worker.once('exit', resolve); worker.once('error', reject); }));
  assert.equal(exitCode, 78); assert.match(stderr, /executive_continuity_watchdog_exit/);
  observations.push({ case: 'exact_old_watchdog', outcome: 'WORKER_EXIT_ONLY_PARENT_SURVIVES', workerExitCode: exitCode, realEpochStorage: heartbeatState, fixtureParentStillRunning: true, actualOldWorkerLog: JSON.parse(stderr.trim()) });
  console.log(JSON.stringify({ schema: 'old-source-preservation-local-fixture-v1', sourceCommit, sourceHashes: { sqlite: digest(oldSql), watchdog: digest(oldWatchdog) }, node: process.version, sqlJsVersion: sqlVersion,
    observations, productionPreservationProven: false, quiescenceProven: false, limitations: ['Local tiny synthetic database, not production contents or production-scale export performance', 'Exact old SQLite and watchdog source transpiled with TypeScript; import-only adapters control lag/disk and resolve installed matching SQL.js', 'Commissioning HTTP route, record reclamation, Redis and provider shutdown are not exercised', 'Deterministic temporary-file I/O barrier models concurrent writes; no live process or database touched', 'In-process final-save/export channel remains absent from deployed API; no production intervention authorized by this fixture'] }, null, 2));
} finally {
  restoredWrite?.(); hooks.deregister(); delete globalThis.__oldPersistenceFixture;
  assert(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(root).startsWith('empire-old-persistence-'), 'Refuse cleanup outside this fixture temporary directory');
  fs.rmSync(root, { recursive: true, force: true });
}

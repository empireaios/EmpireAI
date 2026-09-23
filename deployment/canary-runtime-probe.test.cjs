'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const http = require('node:http');
const { spawnSync } = require('node:child_process');
const { REQUIRED, summarize, validateArguments, readinessPass, birthPass, authorityPass, failurePass,
  accountRowsPass, nativeHistory, preservesHistory, boundedHttp, readBounded, saveMarker } = require('./canary-runtime-probe.cjs');
const service = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const commit = 'a'.repeat(40), sha = 'b'.repeat(64);
const scope = { RAILWAY_SERVICE_ID: service, RAILWAY_GIT_COMMIT_SHA: commit, RAILWAY_DEPLOYMENT_ID: 'deployment-a' };

test('external exact source and executable hashes are compulsory and do not self-infer from environment', () => {
  assert.deepEqual(validateArguments(['before', service, commit, sha], scope, sha), { phase: 'before', service, commit, probeSha: sha });
  for (const args of [[], ['before', service, commit], ['before', service, 'c'.repeat(40), sha],
    ['before', service, commit, 'c'.repeat(64)], ['after', 'c3c89cbb-3e10-414a-98a2-f9ec4f1f840e', commit, sha]]) {
    assert.throws(() => validateArguments(args, scope, sha));
  }
  assert.throws(() => validateArguments(['before', service, commit, sha], { ...scope, RAILWAY_DEPLOYMENT_ID: '' }, sha));
});

test('omitted Birth, readiness, failure or native history checks cannot disappear behind all-executed-pass', () => {
  for (const phase of ['before', 'after']) {
    const complete = REQUIRED[phase].map(name => ({ name, pass: true }));
    assert.equal(summarize(phase, complete).passed, true);
    for (const omitted of REQUIRED[phase]) {
      const result = summarize(phase, complete.filter(c => c.name !== omitted));
      assert.equal(result.passed, false); assert.deepEqual(result.missingRequiredChecks, [omitted]);
    }
    assert.equal(summarize(phase, [...complete, complete[0]]).passed, false);
    assert.equal(summarize(phase, [...complete, { name: 'unexpected_failure', pass: false }]).passed, false);
  }
  assert.equal(summarize('unknown', []).passed, false);
});

test('readiness rejects apparently healthy HTTP responses with missing worker, Redis or durable sessions', () => {
  const d = { ready: true, workerOnline: true, workerReady: true, sessionStore: 'redis',
    pillow: { enabled: true, ready: true, lifecycle: 'running' }, checks: Object.fromEntries(
      ['tier0Primary', 'redis', 'brainWorker', 'brainWorkerReady', 'pillow'].map(k => [k, { ok: true, ping: true }])) };
  assert.equal(readinessPass({ status: 200, data: d }), true);
  for (const patch of [{ workerReady: false }, { workerOnline: false }, { sessionStore: 'memory' },
    { pillow: { enabled: true, ready: true, lifecycle: 'failed' } }, { checks: { redis: { ok: true } } }]) {
    assert.equal(readinessPass({ status: 200, data: { ...d, ...patch } }), false);
  }
  assert.equal(readinessPass({ status: 503, data: d }), false);
});

test('Birth proof requires actual authenticated authority fields, not a status title', () => {
  const authority = { birthStatus: 'NOT_BORN', technicallyReady: false, commerceStatus: 'LOCKED',
    realCommerceAuthorized: false, waveCredit: 0, independentCertification: 'UNVERIFIED' };
  const r = { status: 200, data: { status: 'NOT_BORN', authority } };
  assert.equal(birthPass(r), true);
  for (const patch of [{ technicallyReady: true }, { realCommerceAuthorized: true }, { waveCredit: 1 },
    { independentCertification: 'VERIFIED' }, { commerceStatus: undefined }]) {
    assert.equal(birthPass({ status: 200, data: { status: 'NOT_BORN', authority: { ...authority, ...patch } } }), false);
  }
  assert.equal(birthPass({ status: 200, data: { status: 'NOT_BORN' } }), false);
});

function requestRecord() {
  return { status: 200, data: { durability: { REQUEST_STATE_STORE: 'redis+memory' }, request: {
    requestId: 'request-a', ownerId: 'owner-a', workspaceId: 'ws_empire_1', status: 'COMPLETED', failureClass: 'BRAIN_SUCCESS',
    attemptCount: 1, finalResult: { kind: 'authority_facts', message: 'Birth status: NOT_BORN. Real commerce authorized: no (unauthorized).',
      constitutionalGate: { allowed: true } } } } };
}
test('retrievable FAILED_FATAL and useful-looking degraded prose cannot pass authority completion', () => {
  assert.equal(authorityPass(requestRecord(), 'request-a', 'owner-a'), true);
  for (const patch of [{ status: 'FAILED_FATAL' }, { attemptCount: 3 }, { ownerId: 'other' }, { finalResult: { kind: 'authority_facts', message: 'All ready' } },
    { finalResult: { ...requestRecord().data.request.finalResult, degradedUsed: true } }]) {
    const r = requestRecord(); Object.assign(r.data.request, patch); assert.equal(authorityPass(r, 'request-a', 'owner-a'), false);
  }
});
test('known missing-provider test is a positive failure assertion; fake completion and retries fail it', () => {
  const r = requestRecord(); Object.assign(r.data.request, { status: 'FAILED_FATAL', failureClass: 'BRAIN_FATAL',
    attemptCount: 1, lastError: 'no_llm_provider', finalResult: null });
  assert.equal(failurePass(r, 'request-a', 'owner-a'), true);
  for (const patch of [{ status: 'COMPLETED' }, { attemptCount: 3 }, { failureClass: 'BRAIN_RETRYABLE_FAILURE' }, { finalResult: { message: 'fallback' } }]) {
    const changed = structuredClone(r); Object.assign(changed.data.request, patch); assert.equal(failurePass(changed, 'request-a', 'owner-a'), false);
  }
});

test('native persisted history is independently read through SQLite and rejects missing, corrupt or cross-owner data', () => {
  const { DatabaseSync } = require('node:sqlite');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'canary-probe-sqlite-'));
  const filename = path.join(directory, 'test.missions.sqlite');
  try {
    const db = new DatabaseSync(filename);
    db.exec('PRAGMA application_id=1162695506; PRAGMA user_version=3; CREATE TABLE mission_snapshot(id INTEGER PRIMARY KEY,revision INTEGER,envelope TEXT)');
    const state = { missions: [{ missionId: 'mission-a' }], transitions: [{ evidence: 'prior failure' }],
      checkpoints: [], retries: [], recoveries: [], timeline: [], reports: [], auditTrail: ['prior failure'] };
    const envelope = { version: 3, scope: { ownerEmail: 'owner@probe.invalid', workspaceId: 'ws_empire_1' }, state };
    db.prepare('INSERT INTO mission_snapshot VALUES(1,1,?)').run(JSON.stringify(envelope)); db.close();
    const before = nativeHistory(filename, 'owner@probe.invalid', 'mission-a');
    assert.equal(before.integrity, 'ok'); assert.equal(before.revision, 1);
    assert.throws(() => nativeHistory(filename, 'other@probe.invalid', 'mission-a'));
    assert.throws(() => nativeHistory(filename, 'owner@probe.invalid', 'missing'));
    const after = structuredClone(before); after.revision = 2; after.entries.reports.push('new-report');
    assert.equal(preservesHistory(before, after), true);
    after.entries.auditTrail = []; assert.equal(preservesHistory(before, after), false);
    const repeated = structuredClone(before); repeated.entries.auditTrail.push(...repeated.entries.auditTrail);
    assert.equal(preservesHistory(repeated, before), false, 'repeated failures cannot be deduplicated away');
    fs.writeFileSync(filename, 'corrupt'); assert.throws(() => nativeHistory(filename, 'owner@probe.invalid', 'mission-a'));
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('durable restart marker cannot overwrite old failures; unbounded files and symlinks are rejected', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'canary-probe-file-'));
  try {
    const filename = path.join(directory, 'marker'); saveMarker(filename, { beforePassed: false });
    assert.throws(() => saveMarker(filename, { beforePassed: true }));
    assert.equal(JSON.parse(readBounded(filename)).beforePassed, false);
    assert.throws(() => readBounded(filename, 1));
    fs.symlinkSync(filename, `${filename}.link`); assert.throws(() => readBounded(`${filename}.link`));
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('HTTP transport observes actual local rejection and refuses redirects, foreign origins and oversized responses', async () => {
  const server = http.createServer((req, res) => {
    if (req.url === '/redirect') { res.writeHead(302, { location: 'http://example.invalid' }); res.end(); }
    else if (req.url === '/large') { res.writeHead(200); res.end('x'.repeat(4 * 1024 * 1024 + 1)); }
    else { res.writeHead(401, { 'content-type': 'application/json' }); res.end('{"error":"denied"}'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await boundedHttp(origin, Date.now() + 5000, '/auth/me')).status, 401);
    await assert.rejects(boundedHttp(origin, Date.now() + 5000, '/redirect'));
    await assert.rejects(boundedHttp(origin, Date.now() + 5000, '//example.invalid'));
    await assert.rejects(boundedHttp(origin, Date.now() + 5000, '/large'));
    await assert.rejects(boundedHttp(origin, Date.now() - 1, '/auth/me'));
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});

test('actual probe CLI without bound arguments emits a failed manifest, never successful empty checks', () => {
  const result = spawnSync(process.execPath, [path.join(__dirname, 'canary-runtime-probe.cjs'), 'before'],
    { encoding: 'utf8', env: { PATH: process.env.PATH } });
  assert.equal(result.status, 1); const out = JSON.parse(result.stdout);
  assert.equal(out.passed, false); assert.ok(out.missingRequiredChecks.includes('birth_locks'));
  assert.equal(out.birthCertificationGranted, false); assert.equal(out.commerceAuthorized, false);
});


test('disk accounts bind worker SQL identities, not deterministic primary session IDs or role counts', () => {
  const primaryIds = { founder: 'usr_hash_founder', admin: 'usr_hash_admin' };
  const workerIds = { founder: 'uuid_founder_before', admin: 'uuid_admin_before' };
  const roles = { founder: [workerIds.founder], admin: [workerIds.admin] };
  assert.equal(accountRowsPass(roles, workerIds), true);
  assert.equal(accountRowsPass(roles, primaryIds), false);
  assert.equal(accountRowsPass({ founder: [workerIds.founder], admin: ['reseeded_admin_uuid'] }, workerIds), false);
  assert.equal(accountRowsPass({ founder: [workerIds.founder, workerIds.founder], admin: [workerIds.admin] }, workerIds), false);
});

test('sanitized observer emits only selected generated evidence and strips response credentials', () => {
  const { sanitizedObservations } = require('./canary-runtime-probe.cjs');
  const account = { userId: 'test-user', cookie: 'SECRET_COOKIE', password: 'SECRET_PASSWORD' };
  const request = requestRecord();
  request.headers = { authorization: 'SECRET_AUTHORIZATION' };
  request.data.request.secret = 'SECRET_REQUEST';
  request.data.request.finalResult.token = 'SECRET_RESULT';
  request.data.request.finalResult.message += ' SECRET_APPENDED';
  const observed = sanitizedObservations({ deploymentId: 'test-deployment', serviceId: 'test-service', sourceCommit: 'a'.repeat(40), probeSha256: 'b'.repeat(64),
    founder: account, admin: account, workerFounder: account, workerAdmin: account,
    mission: { missionId: 'test-mission', password: 'SECRET_MISSION' }, native: null,
    authority: request, failed: request, authorityDigest: 'c'.repeat(64), failureDigest: 'd'.repeat(64),
    foreign: { status: 404 }, forbidden: { status: 403 }, birth: { status: 200, data: { status: 'NOT_BORN', authority: { birthStatus: 'NOT_BORN', token: 'SECRET_BIRTH' } } },
    ready: { status: 200, data: { ready: true, secret: 'SECRET_READY', checks: { redis: { ok: true, password: 'SECRET_REDIS' } } } } });
  assert.equal(JSON.stringify(observed).includes('SECRET_'), false);
  assert.equal(observed.accounts.primary.founder.id, 'test-user');
  assert.equal(observed.authority.data.request.status, 'COMPLETED');
  assert.equal(observed.authority.data.request.finalResult.message, 'Birth status: NOT_BORN. Real commerce authorized: no (unauthorized).');
  assert.equal(observed.native, null);
});
test('sanitized observer rejects object-valued allowed keys and absent final results', () => {
  const { sanitizedObservations } = require('./canary-runtime-probe.cjs');
  const secret = { nested: 'SECRET_NESTED' };
  const account = { userId: secret };
  const observed = sanitizedObservations({ founder: account, admin: account, workerFounder: account, workerAdmin: account,
    mission: { metadataVersion: secret, workers: [secret], traceabilityRefs: [secret], currentStatus: secret },
    native: { revision: secret, bytes: secret, integrity: secret, entries: { missions: [secret] }, mission: { metadataVersion: secret } },
    authority: { status: secret, data: { request: { kind: secret, lastError: secret }, durability: { REQUEST_STATE_STORE: secret } } },
    failed: { status: secret, data: { request: { finalResult: { kind: secret, message: secret } } } },
    foreign: { status: secret }, forbidden: { status: secret }, birth: { status: secret, data: { status: secret, authority: { birthStatus: secret } } },
    ready: { status: secret, data: { sessionStore: secret, checks: { redis: { ok: secret } } } } });
  assert.equal(JSON.stringify(observed).includes('SECRET_NESTED'), false);
  assert.equal(observed.authority.data.request.finalResult, null);
  assert.equal(observed.failure.data.request.finalResult.kind, null);
  assert.equal(observed.readiness.data.sessionStore, null);
  assert.equal(observed.accounts.primary.founder.id, null);
});
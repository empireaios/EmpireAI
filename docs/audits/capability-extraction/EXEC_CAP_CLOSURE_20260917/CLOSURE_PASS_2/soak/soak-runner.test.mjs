import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readConfig, createTransport, executeCase, requiredCases, assertFrozenHealth,
  collectRetrievalProof, assertRestartContext } from './soak-runner.mjs';
import { createJournal } from './soak-journal.mjs';
import { createScrubber } from './soak-gate.mjs';
import { buildOrdinary24 } from './soak-workload.mjs';

const candidateSha = 'a'.repeat(40);
const identity = { candidateSha, observedSha: candidateSha, runnerSha: 'b'.repeat(40), deploymentId: 'deploy-fixture' };
const observedIdentity = { requestId: 'pcr-fixture', sessionId: 'session-fixture', deploymentId: 'deploy-fixture' };
const configEnv = { SOAK_ALLOW_LIVE_RUN: '1', SOAK_ALLOW_RESTART: '1',
  EMPIRE_COCKPIT_URL: 'https://fixture.invalid', EMPIRE_BRAIN_URL: 'https://fixture.invalid',
  EMPIRE_LOGIN_EMAIL: 'fixture@example.invalid', EMPIRE_LOGIN_PASSWORD: 'test-only-password',
  SOAK_TIP_SHA: candidateSha, SOAK_DEPLOYMENT_ID: 'deploy-fixture', SOAK_RAILWAY_SERVICE: 'service', SOAK_RAILWAY_ENVIRONMENT: 'staging',
  SOAK_RAILWAY_PROJECT_ID: 'project-fixture' };

test('import has no credentials, IO, network, or execution requirement', () => {
  const moduleUrl = new URL('./soak-runner.mjs', import.meta.url).href;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e',
    `globalThis.fetch=()=>{throw new Error('network forbidden')}; await import(${JSON.stringify(moduleUrl)});`],
  { env: { PATH: process.env.PATH }, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
});

test('explicit frozen run configuration is mandatory; no production defaults', () => {
  assert.throws(() => readConfig({}), /explicit_opt_in/);
  assert.throws(() => readConfig({ ...configEnv, SOAK_ALLOW_RESTART: '0' }), /explicit_opt_in/);
  assert.throws(() => readConfig({ ...configEnv, SOAK_TIP_SHA: 'ab6ac3b7' }), /full/);
  assert.throws(() => readConfig({ ...configEnv, SOAK_MINUTES: '10' }), /120_to_240/);
  assert.throws(() => readConfig({ ...configEnv, EMPIRE_BRAIN_URL: 'https://user:password@fixture.invalid' }), /unsafe_url/);
  assert.equal(readConfig(configEnv).minutes, 120);
});

test('preflight rejects unknown locks, wrong deployment and wrong restart target', () => {
  const config = readConfig(configEnv);
  const health = { liveOk: true, workerOnline: true, sha: candidateSha, deployId: 'deploy-fixture',
    service: 'service', environment: 'staging', birthStatus: 'NOT_BORN', modeDefault: 'SYNTHETIC', realCommerceAuthorized: false };
  assert.doesNotThrow(() => assertFrozenHealth(health, config));
  for (const patch of [{ sha: 'c'.repeat(40) }, { deployId: 'other' }, { environment: 'production' },
    { birthStatus: 'BORN' }, { modeDefault: null }, { realCommerceAuthorized: undefined }, { workerOnline: false }])
    assert.throws(() => assertFrozenHealth({ ...health, ...patch }, config));
});

test('canonical manifest requires 24 ordinary and nine mission steps without late duplicate aliases', () => {
  const manifest = requiredCases();
  assert.equal(manifest.filter(item => item.kind === 'ordinary').length, 24);
  assert.equal(manifest.filter(item => item.kind === 'mission').length, 9);
  assert.equal(new Set(manifest.map(item => item.id)).size, manifest.length);
  assert.ok(manifest.every(item => item.checkId && item.prompt));
  assert.equal(manifest.some(item => item.id.includes('_late_')), false);
});

test('restart refuses ambient project mismatch and unsupported CLI targeting before running', () => {
  const config = readConfig(configEnv);
  const fake = (command, args) => args.includes('--help') ? '--service --environment' : JSON.stringify({ id: 'project-fixture' });
  assert.doesNotThrow(() => assertRestartContext(config, fake));
  assert.throws(() => assertRestartContext({ ...config, projectId: 'wrong-project' }, fake), /project_mismatch/);
  assert.throws(() => assertRestartContext(config, () => '--service --yes'), /missing_explicit_restart_targeting/);
});

test('an ambiguous chat POST is never automatically retried', async () => {
  let calls = 0;
  const transport = createTransport(readConfig(configEnv), async () => { calls++; throw new Error('timeout after possible admission'); });
  await assert.rejects(transport.chat('secret-cookie', 'session', 'prompt'), /timeout/);
  assert.equal(calls, 1);
});

test('retrieval preserves observed record identity rather than relabeling the requested ID', async () => {
  const payload = { request: { requestId: 'different-request', sessionId: 'actual-session',
    observability: { deploymentId: 'actual-deployment' }, status: 'COMPLETED',
    finalResult: { message: '46', kind: 'answer' } } };
  const transport = createTransport(readConfig(configEnv), async () =>
    new Response(JSON.stringify(payload), { status: 200 }));
  const result = await transport.retrieve('cookie', 'requested-id');
  assert.equal(result.requestId, 'different-request');
  assert.equal(result.sessionId, 'actual-session');
  assert.equal(result.deploymentId, 'actual-deployment');
});

test('missing retrieval provenance is preserved as missing, and FAILED_FATAL is terminal', async () => {
  let calls = 0;
  const transport = createTransport(readConfig(configEnv), async () => {
    calls++;
    return new Response(JSON.stringify({ request: { status: 'FAILED_FATAL' } }), { status: 200 });
  });
  const result = await transport.retrieve('cookie', 'requested-id');
  assert.equal(result.requestId, null);
  assert.equal(result.sessionId, null);
  assert.equal(result.deploymentId, null);
  assert.equal(result.status, 'FAILED_FATAL');
  assert.equal(calls, 1);
});

function fixture(t, overrides = {}) {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'gate-001-integration-'));
  const journal = createJournal(directory);
  t.after(() => { try { journal.close(); } catch {} rmSync(directory, { recursive: true, force: true }); });
  let submissions = 0, retrieves = 0;
  const transport = {
    async chat() { submissions++; return { http: 200, requestId: 'pcr-fixture', text: '46', kind: 'answer' }; },
    async retrieve() { retrieves++; return { ...observedIdentity, http: 200, status: 'COMPLETED', text: '46', kind: 'answer' }; },
    ...overrides,
  };
  return { directory, journal, transport, state: { results: [], transportErrors: 0, lostAdmitted: 0 },
    item: buildOrdinary24()[1], kind: 'ordinary', auth: { cookie: 'test-cookie', sessionId: 'session-fixture' },
    identity, scrub: createScrubber(['test-cookie']), submissions: () => submissions, retrieves: () => retrieves };
}

test('successful inline answer still gets actual durable retrieval and full evidence', async t => {
  const f = fixture(t);
  const row = await executeCase(f);
  assert.equal(row.transportCompleted, true);
  assert.equal(row.semanticPassed, true);
  assert.equal(row.durableRetrieved, true);
  assert.equal(row.response, '46');
  assert.equal(row.submission.response, '46');
  assert.equal(row.prompt, f.item.prompt);
  assert.equal(f.retrieves(), 1);
  assert.equal(f.submissions(), 1);
});

test('wrong but completed response is transport success and semantic failure', async t => {
  const f = fixture(t, { async retrieve() { return { ...observedIdentity, http: 200, status: 'COMPLETED', text: '45', kind: 'answer' }; } });
  const row = await executeCase(f);
  assert.equal(row.transportCompleted, true);
  assert.equal(row.semanticPassed, false);
  assert.equal(row.durableRetrieved, true);
});

test('failed/pending retrieval cannot be certified from a nonempty message', async t => {
  const f = fixture(t, { async retrieve() { return { ...observedIdentity, http: 200, status: 'RUNNING', text: '46', kind: 'answer' }; } });
  await assert.rejects(executeCase(f), /no_replay/);
  assert.equal(f.state.results[0].semanticPassed, false);
  assert.equal(f.state.lostAdmitted, 1);
});

for (const field of ['requestId', 'sessionId', 'deploymentId']) {
  for (const value of [null, 'unrelated-observed-value']) {
    test(`missing or mismatched observed ${field} blocks semantic PASS before oracle execution (${value})`, async t => {
      const returned = { ...observedIdentity, [field]: value, http: 200, status: 'COMPLETED', text: '46', kind: 'answer' };
      const f = fixture(t, { async retrieve() { return returned; } });
      let oracleCalls = 0;
      f.item = { ...f.item, expect() { oracleCalls++; return true; } };
      await assert.rejects(executeCase(f), /no_replay/);
      assert.equal(oracleCalls, 0);
      assert.equal(f.state.results[0].semanticPassed, false);
      assert.equal(f.state.results[0].retrieval[field], value);
      assert.match(f.state.results[0].error, new RegExp('retrieval_identity_mismatch_' + field));
      await assert.rejects(executeCase(f));
      assert.equal(f.submissions(), 1);
    });
  }
}

test('reconnect proof binds the original session and deployment despite new authentication', async t => {
  const f = fixture(t);
  const row = await executeCase(f);
  let observedCookie;
  const transport = { async retrieve(cookie) { observedCookie = cookie;
    return { ...observedIdentity, http: 200, status: 'COMPLETED', text: '46' }; } };
  const proof = await collectRetrievalProof({ transport, cookie: 'new-cookie', row, scrub: f.scrub });
  assert.equal(observedCookie, 'new-cookie');
  assert.equal(proof.match, true);
  assert.equal(proof.sessionId, row.sessionId);
  for (const field of ['requestId', 'sessionId', 'deploymentId']) {
    const badProof = await collectRetrievalProof({ cookie: 'new-cookie', row, scrub: f.scrub,
      transport: { async retrieve() { return { ...observedIdentity, [field]: 'wrong',
        http: 200, status: 'COMPLETED', text: '46' }; } } });
    assert.equal(badProof.match, false);
    assert.equal(badProof[field], 'wrong');
  }
});

test('retrieval failure preserves admitted request and blocks duplicate logical submission', async t => {
  const f = fixture(t, { async retrieve() { throw new Error('fetch failed'); } });
  await assert.rejects(executeCase(f), /no_replay/);
  assert.equal(f.state.results[0].requestId, 'pcr-fixture');
  await assert.rejects(executeCase(f));
  assert.equal(f.submissions(), 1);
});

test('reservation failure prevents POST altogether', async t => {
  const f = fixture(t);
  f.journal = { reserve() { throw new Error('disk full'); } };
  await assert.rejects(executeCase(f), /disk full/);
  assert.equal(f.submissions(), 0);
});

test('finish failure never retries admitted work', async t => {
  const f = fixture(t);
  const original = f.journal;
  f.journal = { reserve: original.reserve, recordAdmission: original.recordAdmission,
    finish() { throw new Error('disk full on final row'); } };
  await assert.rejects(executeCase(f), /disk full/);
  await assert.rejects(executeCase(f));
  assert.equal(f.submissions(), 1);
});

test('PowerShell wrapper is portable, does not embed candidate SHA, and preserves failure exit', () => {
  const wrapper = readFileSync(fileURLToPath(new URL('./run-frozen-soak-120.ps1', import.meta.url)), 'utf8');
  assert.match(wrapper, /\$PSScriptRoot/);
  assert.match(wrapper, /exit \$result/);
  assert.doesNotMatch(wrapper, /C:\\Users|ab6ac3b7|SOAK_TIP_SHA\s*=/);
});

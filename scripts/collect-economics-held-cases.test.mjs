import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { collect, projectStep, validateScope, createJournal, recoverJournal } from './collect-economics-held-cases.mjs';
const cases = JSON.parse(readFileSync(new URL('../docs/governance/certification-cases/economics-held-cases-v1.json', import.meta.url))).cases;
function setup() {
 const expiresAt = new Date(Date.now() + 300_000).toISOString();
 const config = { baseURL: 'http://127.0.0.1:8080', allowedTestServiceId: '11111111-1111-1111-1111-111111111111', exactCommit: 'a'.repeat(40), expiresAt, overallTimeoutMs: 5000, requestTimeoutMs: 1000, workspaceId: 'test-workspace' };
 const env = { PORT: '8080', RAILWAY_SERVICE_ID: config.allowedTestServiceId, RAILWAY_GIT_COMMIT_SHA: config.exactCommit, RAILWAY_DEPLOYMENT_ID: 'test-deployment', EMPIRE_ENGINEERING_TEST_MODE: 'true', RAILWAY_ENVIRONMENT_NAME: 'test', EMPIRE_CANARY_EXPIRES_AT: expiresAt, HELD_CASE_SESSION_COOKIE: 'empireai_session=never-record-this-credential', HELD_CASE_OWNER_APPROVAL_REFERENCE: 'offline-test-only', HELD_CASE_APPROVED_PROVIDER_USD: '0.10' };
 config.allowedTestProjectId = '22222222-2222-2222-2222-222222222222'; config.allowedTestEnvironmentId = '33333333-3333-3333-3333-333333333333';
 env.RAILWAY_PROJECT_ID = config.allowedTestProjectId; env.RAILWAY_ENVIRONMENT_ID = config.allowedTestEnvironmentId;
 return { config, env };
}
function mock(overrides = {}) {
 let n = 0, requestId;
 return async (route, body) => {
   let status = 200, data;
   if (route === '/health/live') data = { worker: { online: true }, deploy: { gitCommitSha: 'a'.repeat(40), deploymentId: 'test-deployment' } };
   else if (route === '/auth/me') data = { user: { id: 'test-owner', workspaceId: 'test-workspace' } };
   else if (route === '/api/pillow/session') { status = 201; data = { session: { sessionId: `session-${n}` } }; }
   else if (route === '/api/pillow/chat') { status = 202; requestId = `request-${n}`; data = { result: { requestId } }; }
   else data = { durability: { REQUEST_STATE_STORE: 'redis+memory' }, request: { requestId, ownerId: 'test-owner', workspaceId: 'test-workspace', status: 'COMPLETED', finalResult: { message: 'Synthetic ungraded model output' } } };
   const raw = JSON.stringify(data); n++;
   return { status, data, raw, chunks: [Buffer.from(raw).toString('base64')], connectionId: `connection-${n}`, socketClosed: true, ...overrides };
 };
}
const verifyEnforcedBudget = async () => ({ enforced: true, maximumUsd: 0.1, evidenceSha256: 'b'.repeat(64) });
test('projection excludes oracle/forbidden and future corrections', () => {
 for (const c of cases) for (let i = 0; i < c.steps.length; i++) {
  const projected = JSON.parse(projectStep(c, i));
  assert.deepEqual(Object.keys(projected), ['instruction', 'inputs']);
  assert.equal(projected.instruction, c.steps[i].instruction);
  for (const key of ['oracleKind', 'forbidden', 'requirements', 'expected']) assert.equal(projected[key], undefined);
 }
 assert.equal(projectStep(cases[2], 0).includes('78.95'), false);
 assert.equal(projectStep(cases[5], 0).includes('9.10'), false);
 assert.equal(projectStep(cases[5], 1).includes('initialCandidates'), false);
});
test('scope rejects actual production, wrong source, expired config and absent approval', () => {
 const { config, env } = setup(); assert.ok(validateScope(config, env));
 assert.throws(() => validateScope({ ...config, allowedTestServiceId: 'c3c89cbb-3e10-414a-98a2-f9ec4f1f840e' }, env));
 assert.throws(() => validateScope(config, { ...env, RAILWAY_GIT_COMMIT_SHA: 'b'.repeat(40) }));
 assert.throws(() => validateScope(config, env, Date.now() + 400_000));
 assert.throws(() => validateScope(config, { ...env, HELD_CASE_OWNER_APPROVAL_REFERENCE: '' }));
 assert.throws(() => validateScope({ ...config, baseURL: 'https://empire-ai.co' }, env));
});
test('live CLI-equivalent fails closed with zero network without implemented budget verifier', async () => {
 const { config, env } = setup(); let called = false;
 const result = await collect(config, env, { transport: () => { called = true; } });
 assert.equal(called, false); assert.equal(result.status, 'NOT_EXECUTED');
 assert.equal(result.failure, 'PROVIDER_BUDGET_ENFORCEMENT_VERIFIER_NOT_IMPLEMENTED');
});
test('six mock cases collected ungraded with actual transport evidence fields required', async () => {
 const { config, env } = setup(); const result = await collect(config, env, { transport: mock(), verifyEnforcedBudget, journal: { append() {} } });
 assert.equal(result.status, 'COLLECTED_UNGRADED'); assert.equal(result.cases.length, 6);
 assert.equal(result.noCredit, true); assert.equal(result.acceptance, false);
 assert.equal(result.cases[2].steps[1].interruption.browserReloadProven, false);
 assert.equal(JSON.stringify(result).includes(env.HELD_CASE_SESSION_COOKIE), false);
});
test('missing socket-close evidence prevents correction, preserving initial collection', async () => {
 const { config, env } = setup(); const result = await collect(config, env, { transport: mock({ socketClosed: false }), verifyEnforcedBudget, journal: { append() {} } });
 assert.equal(result.status, 'PARTIAL_UNGRADED'); assert.equal(result.failure, 'CLIENT_DISCONNECT_NOT_PROVEN');
 assert.equal(result.cases[2].steps.length, 1);
});
test('credential echo is rejected before raw persistence', async () => {
 const { config, env } = setup(); const result = await collect(config, env, { transport: mock({ raw: env.HELD_CASE_SESSION_COOKIE }), verifyEnforcedBudget, journal: { append() {} } });
 assert.equal(result.failure, 'SECRET_ECHO_REFUSED'); assert.equal(result.records.length, 0);
 assert.equal(JSON.stringify(result).includes('never-record-this-credential'), false);
});
test('accepted requests remain recorded when polling fails; never falsely not executed', async () => {
 const { config, env } = setup(); const normal = mock();
 const transport = async (...args) => { if (args[0].startsWith('/api/pillow/chat-request/')) throw new Error('POLL_FAILED'); return normal(...args); };
 const result = await collect(config, env, { transport, verifyEnforcedBudget, journal: { append() {} } });
 assert.equal(result.status, 'PARTIAL_UNGRADED');
 assert.equal(result.cases[0].steps[0].status, 'ACCEPTED_TERMINAL_UNKNOWN');
 assert.equal(result.failure, 'POLL_FAILED');
});
test('wrong authenticated workspace stops before any model request', async () => {
 const { config, env } = setup(); const normal = mock(); let submitted = false;
 const transport = async (...args) => { submitted ||= args[0] === '/api/pillow/chat'; const r = await normal(...args); if (args[0] === '/auth/me') r.data.user.workspaceId = 'foreign'; return r; };
 const result = await collect(config, env, { transport, verifyEnforcedBudget, journal: { append() {} } });
 assert.equal(result.failure, 'AUTH_SCOPE_MISMATCH'); assert.equal(submitted, false);
});
test('isolated environment named production is permitted only with exact project/environment IDs', () => {
 const { config, env } = setup(); assert.ok(validateScope(config, { ...env, RAILWAY_ENVIRONMENT_NAME: 'production' }));
 assert.throws(() => validateScope(config, { ...env, RAILWAY_PROJECT_ID: '44444444-4444-4444-4444-444444444444' }));
 assert.throws(() => validateScope(config, { ...env, RAILWAY_ENVIRONMENT_ID: '44444444-4444-4444-4444-444444444444' }));
});
for (const failure of ['TRANSPORT_LOST', 'RESPONSE_BOUND', 'SECRET_ECHO_REFUSED', 'TOTAL_RESPONSE_BOUND']) test(`submission intent survives ${failure} without retry`, async () => {
 const { config, env } = setup(); const normal = mock(); let submissions = 0;
 const transport = async (...args) => {
  if (args[0] !== '/api/pillow/chat') return normal(...args);
  submissions++;
  if (failure === 'SECRET_ECHO_REFUSED') return { ...(await normal(...args)), raw: env.HELD_CASE_SESSION_COOKIE };
  if (failure === 'TOTAL_RESPONSE_BOUND') return { ...(await normal(...args)), raw: 'x'.repeat(8_388_609) };
  throw new Error(failure);
 };
 const result = await collect(config, env, { transport, verifyEnforcedBudget, journal: { append() {} } });
 assert.equal(result.status, 'PARTIAL_UNGRADED'); assert.equal(result.failure, failure); assert.equal(submissions, 1);
 assert.equal(result.cases[0].steps[0].status, 'SUBMISSION_OUTCOME_UNKNOWN');
 assert.match(result.cases[0].steps[0].idempotencyKey, /^held-/);
 assert.equal(result.cases[0].steps[0].requestId, null);
});
test('fsynced intent survives actual child process kill and read-only reopen', t => {
 const dir = mkdtempSync(join(tmpdir(), 'held-journal-')); t.after(() => rmSync(dir, { recursive: true, force: true }));
 const path = join(dir, 'acquisition.ndjson');
 const moduleURL = new URL('./collect-economics-held-cases.mjs', import.meta.url).href;
 const child = spawnSync(process.execPath, ['--input-type=module', '-e',
  `import { createJournal } from ${JSON.stringify(moduleURL)}; const journal = createJournal(${JSON.stringify(path)}); journal.append({kind:'submission_intent',idempotencyKey:'immutable-key',status:'SUBMISSION_OUTCOME_UNKNOWN'}); process.kill(process.pid,'SIGKILL');`], { timeout: 10_000 });
 assert.notEqual(child.status, 0);
 const recovered = recoverJournal(path);
 assert.equal(recovered.events[0].idempotencyKey, 'immutable-key'); assert.equal(recovered.automaticRetryAllowed, false);
 appendFileSync(path, '{"interrupted');
 const truncated = recoverJournal(path); assert.equal(truncated.events.length, 1); assert.ok(truncated.incompleteTailBytes > 0);
 assert.throws(() => createJournal(path));
});
test('journal refuses secret output and detects corruption', t => {
 const dir = mkdtempSync(join(tmpdir(), 'held-journal-')); t.after(() => rmSync(dir, { recursive: true, force: true }));
 const path = join(dir, 'acquisition.ndjson'), journal = createJournal(path, ['session-secret']);
 assert.throws(() => journal.append({ secret: 'session-secret' }), /JOURNAL_SECRET_REFUSED/);
 journal.append({ kind: 'safe' }); journal.close();
 assert.equal(recoverJournal(path).events.length, 1);
 appendFileSync(path, JSON.stringify({body: JSON.stringify({ sequence: 1, previous: 'wrong', event: {} }), sha256: 'wrong'}) + '\n');
 assert.throws(() => recoverJournal(path), /JOURNAL_INTEGRITY_FAILURE/);
});
test('failed pre-submission fsync barrier prevents transport call', async () => {
 const { config, env } = setup(); const normal = mock(); let submitted = false;
 const transport = async (...args) => { submitted ||= args[0] === '/api/pillow/chat'; return normal(...args); };
 const journal = { append(event) { if (event.kind === 'submission_intent') throw new Error('JOURNAL_FSYNC_FAILED'); } };
 const result = await collect(config, env, { transport, verifyEnforcedBudget, journal });
 assert.equal(submitted, false); assert.equal(result.failure, 'JOURNAL_FSYNC_FAILED');
 assert.equal(result.cases[0].steps[0].status, 'SUBMISSION_OUTCOME_UNKNOWN');
});

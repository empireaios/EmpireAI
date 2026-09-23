/** Collection only. No grading, certification credit, tool or commerce authorization. */
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, openSync, closeSync, writeSync, fsyncSync, statSync } from 'node:fs';
import http from 'node:http';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CASE_SHA = 'd05dbcb42b5a659c75cefcdc116a0c647fb85ed8e99da43ad9eb6717d71ce700';
const PROD = 'c3c89cbb-3e10-414a-98a2-f9ec4f1f840e';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const demand = (ok, code) => { if (!ok) throw new Error(code); };
const JOURNAL_BOUND = 32 * 1024 * 1024;
/** Immutable hash-chained acquisition log. Every append is fsynced before returning. */
export function createJournal(path, secrets = []) {
  const fd = openSync(path, 'wx', 0o600);
  // Linux deployment requires the new directory entry durable too. Windows tests
  // cover process kill/reopen only; no Windows power-loss guarantee is claimed.
  if (process.platform !== 'win32') {
    let dirfd;
    try { dirfd = openSync(dirname(path), 'r'); fsyncSync(dirfd); }
    catch (error) { closeSync(fd); throw error; }
    finally { if (dirfd !== undefined) closeSync(dirfd); }
  }
  let sequence = 0, previous = '0'.repeat(64), bytes = 0, closed = false, failed = false;
  return {
    append(event) {
      demand(!closed, 'JOURNAL_CLOSED');
      demand(!failed, 'JOURNAL_PREVIOUS_WRITE_FAILED');
      const payload = JSON.stringify(event);
      demand(!secrets.some(secret => secret && payload.includes(secret)), 'JOURNAL_SECRET_REFUSED');
      const body = JSON.stringify({ sequence, previous, event });
      const digest = sha(body), line = Buffer.from(JSON.stringify({ body, sha256: digest }) + '\n');
      demand(bytes + line.length <= JOURNAL_BOUND, 'JOURNAL_BOUND');
      try {
        let offset = 0;
        while (offset < line.length) { const count = writeSync(fd, line, offset, line.length - offset); demand(count > 0, 'JOURNAL_SHORT_WRITE'); offset += count; }
        fsyncSync(fd); bytes += line.length; sequence++; previous = digest;
      } catch (error) { failed = true; throw error; }
    },
    close() { if (!closed) { closed = true; closeSync(fd); } },
  };
}
/** Read-only recovery. Never resume or resubmit an uncertain request automatically. */
export function recoverJournal(path) {
  demand(statSync(path).size <= JOURNAL_BOUND, 'JOURNAL_BOUND');
  const raw = readFileSync(path, 'utf8'), lines = raw.split('\n'), events = [];
  const incompleteTail = lines.pop(); let previous = '0'.repeat(64);
  for (const line of lines) {
    const entry = JSON.parse(line), body = JSON.parse(entry.body);
    demand(sha(entry.body) === entry.sha256 && body.sequence === events.length && body.previous === previous, 'JOURNAL_INTEGRITY_FAILURE');
    previous = entry.sha256; events.push(body.event);
  }
  return { schema: 'pillow-acquisition-recovery-v1', events, incompleteTailBytes: Buffer.byteLength(incompleteTail),
    automaticRetryAllowed: false, noCredit: true, lastSha256: previous };
}
export function projectStep(c, index) {
  demand(Number.isInteger(index) && index >= 0 && index < c.steps.length, 'INVALID_STEP');
  let inputs;
  if (c.id === 'HOLD-ARITH-03') inputs = index === 0 ? { economics: c.inputs.initial } : { economics: c.inputs.corrected, revision: c.inputs.revision };
  else if (c.id === 'HOLD-RANK-03') inputs = { commonEconomics: c.inputs.commonEconomics, constraints: c.inputs.constraints, candidates: index === 0 ? c.inputs.initialCandidates : c.inputs.candidates, ...(index ? { correction: c.inputs.correction } : {}) };
  else inputs = c.inputs;
  return JSON.stringify({ instruction: c.steps[index].instruction, inputs });
}
export function validateScope(config, env, now = Date.now()) {
  const base = new URL(config.baseURL);
  // Run inside the actual scoped service; public health has no service-ID/test-mode attestation.
  demand(base.protocol === 'http:' && base.hostname === '127.0.0.1' && base.port === String(env.PORT) && base.pathname === '/' && !base.username && !base.password && !base.search && !base.hash, 'LOCAL_TEST_ORIGIN_REQUIRED');
  demand(/^[0-9a-f-]{36}$/.test(config.allowedTestServiceId) && config.allowedTestServiceId !== PROD && env.RAILWAY_SERVICE_ID === config.allowedTestServiceId, 'TEST_SERVICE_MISMATCH');
  demand(/^[0-9a-f-]{36}$/.test(config.allowedTestProjectId) && env.RAILWAY_PROJECT_ID === config.allowedTestProjectId &&
    /^[0-9a-f-]{36}$/.test(config.allowedTestEnvironmentId) && env.RAILWAY_ENVIRONMENT_ID === config.allowedTestEnvironmentId &&
    env.EMPIRE_ENGINEERING_TEST_MODE === 'true', 'ENGINEERING_SCOPE_REQUIRED');
  demand(/^[0-9a-f]{40}$/.test(config.exactCommit) && env.RAILWAY_GIT_COMMIT_SHA === config.exactCommit && typeof env.RAILWAY_DEPLOYMENT_ID === 'string' && env.RAILWAY_DEPLOYMENT_ID.length > 0, 'SOURCE_IDENTITY_MISMATCH');
  const expiry = Date.parse(config.expiresAt);
  demand(config.expiresAt === env.EMPIRE_CANARY_EXPIRES_AT && Number.isFinite(expiry) && expiry > now && expiry - now <= 30 * 60_000, 'FIXED_EXPIRY_REQUIRED');
  demand(Number.isInteger(config.overallTimeoutMs) && config.overallTimeoutMs > 0 && config.overallTimeoutMs <= 600_000, 'INVALID_OVERALL_BOUND');
  demand(Number.isInteger(config.requestTimeoutMs) && config.requestTimeoutMs > 0 && config.requestTimeoutMs <= 30_000, 'INVALID_REQUEST_BOUND');
  demand(typeof env.HELD_CASE_SESSION_COOKIE === 'string' && /^empireai_session=[^;\s]+$/.test(env.HELD_CASE_SESSION_COOKIE), 'AUTH_ENV_REQUIRED');
  demand(typeof env.HELD_CASE_OWNER_APPROVAL_REFERENCE === 'string' && env.HELD_CASE_OWNER_APPROVAL_REFERENCE.length > 0 && Number(env.HELD_CASE_APPROVED_PROVIDER_USD) > 0 && Number.isFinite(Number(env.HELD_CASE_APPROVED_PROVIDER_USD)), 'EXPLICIT_PROVIDER_APPROVAL_REQUIRED');
  demand(typeof config.workspaceId === 'string' && config.workspaceId.length > 0, 'WORKSPACE_REQUIRED');
  return Math.min(expiry, now + config.overallTimeoutMs);
}

/** One socket per request. Completion waits for actual socket close, not an asserted reload. */
export function makeTransport(baseURL, cookie, requestTimeoutMs) {
  return async (route, body, headers = {}) => new Promise((resolve, reject) => {
    const url = new URL(route, baseURL), chunks = [], connectionId = randomUUID();
    let response, socket, ended = false, bytes = 0;
    const req = http.request(url, { method: body === undefined ? 'GET' : 'POST', agent: false,
      headers: { cookie, ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...headers } }, res => {
      response = res;
      res.on('data', chunk => { bytes += chunk.length; if (bytes > 1_048_576) req.destroy(new Error('RESPONSE_BOUND')); else chunks.push(Buffer.from(chunk)); });
      res.on('end', () => { ended = true; socket?.destroy(); });
      res.on('error', reject);
    });
    const timer = setTimeout(() => req.destroy(new Error('REQUEST_TIMEOUT')), requestTimeoutMs);
    req.on('socket', value => { socket = value; socket.on('close', () => {
      clearTimeout(timer);
      if (!ended || !response) return reject(new Error('INCOMPLETE_RESPONSE'));
      const raw = Buffer.concat(chunks).toString('utf8');
      let data; try { data = JSON.parse(raw); } catch { data = null; }
      resolve({ status: response.statusCode, raw, chunks: chunks.map(x => x.toString('base64')), data,
        requestId: response.headers['x-empire-pillow-request-id'] ?? null,
        connectionId, socketClosed: true });
    }); });
    req.on('error', error => { clearTimeout(timer); reject(error); });
    req.end(body === undefined ? undefined : JSON.stringify(body));
  });
}

export async function collect(config, env, dependencies = {}) {
  const result = { schema: 'pillow-held-case-acquisition-v1', status: 'NOT_EXECUTED', noCredit: true, acceptance: false,
    startedAt: new Date().toISOString(), caseSetSha256: CASE_SHA, records: [], cases: [], limitations: ['API transport collection, not phone UI or process-restart certification'] };
  try {
    const deadline = validateScope(config, env);
    const caseBytes = readFileSync(new URL('../docs/governance/certification-cases/economics-held-cases-v1.json', import.meta.url));
    demand(sha(caseBytes) === CASE_SHA, 'FROZEN_CASE_BYTES_CHANGED');
    const cases = JSON.parse(caseBytes).cases;
    demand(cases.length === 6, 'CASE_COUNT_BOUND');
    // No boolean command-line escape hatch. An independently implemented budget enforcement
    // adapter must validate actual provider/runtime limits before collection may incur cost.
    demand(typeof dependencies.verifyEnforcedBudget === 'function', 'PROVIDER_BUDGET_ENFORCEMENT_VERIFIER_NOT_IMPLEMENTED');
    let budgetTimer;
    const budget = await Promise.race([dependencies.verifyEnforcedBudget({ env, config, deadline }), new Promise((_, reject) => {
      budgetTimer = setTimeout(() => reject(new Error('BUDGET_VERIFICATION_TIMEOUT')), Math.min(5000, Math.max(1, deadline - Date.now())));
    })]).finally(() => clearTimeout(budgetTimer));
    demand(budget?.enforced === true && budget.maximumUsd <= Number(env.HELD_CASE_APPROVED_PROVIDER_USD) && budget.maximumUsd > 0 && typeof budget.evidenceSha256 === 'string' && /^[0-9a-f]{64}$/.test(budget.evidenceSha256), 'PROVIDER_BUDGET_NOT_PROVEN');
    demand(typeof dependencies.journal?.append === 'function', 'DURABLE_ACQUISITION_JOURNAL_REQUIRED');
    let retainedBytes = 0;
    const call = async (route, body, headers, retain = true) => {
      demand(Date.now() < deadline, 'OVERALL_TIMEOUT');
      let timer;
      const transport = dependencies.transport ?? makeTransport(config.baseURL, env.HELD_CASE_SESSION_COOKIE, Math.min(config.requestTimeoutMs, Math.max(1, deadline - Date.now())));
      const response = await Promise.race([transport(route, body, headers), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('OVERALL_TIMEOUT')), Math.max(1, deadline - Date.now())); })]).finally(() => clearTimeout(timer));
      // Never persist session credentials, including an accidental echo from an endpoint.
      const secret = env.HELD_CASE_SESSION_COOKIE.split('=')[1];
      demand(!JSON.stringify(response).includes(secret), 'SECRET_ECHO_REFUSED');
      retainedBytes += Buffer.byteLength(response.raw);
      demand(retainedBytes <= 8_388_608, 'TOTAL_RESPONSE_BOUND');
      if (retain) {
        const record = { at: new Date().toISOString(), route, requestSha256: sha(JSON.stringify(body ?? null)), ...response, data: undefined, responseSha256: sha(response.raw) };
        dependencies.journal.append({ kind: 'response', record }); result.records.push(record);
      }
      return response;
    };
    const live = await call('/health/live');
    demand(live.status === 200 && live.data?.worker?.online === true && live.data?.deploy?.gitCommitSha === config.exactCommit && live.data.deploy.deploymentId === env.RAILWAY_DEPLOYMENT_ID, 'LIVE_IDENTITY_MISMATCH');
    const me = await call('/auth/me', undefined, undefined, false);
    demand(me.status === 200 && me.data?.user?.workspaceId === config.workspaceId && typeof me.data.user.id === 'string', 'AUTH_SCOPE_MISMATCH');
    result.identity = { userId: me.data.user.id, workspaceId: config.workspaceId, projectId: config.allowedTestProjectId, environmentId: config.allowedTestEnvironmentId, serviceId: config.allowedTestServiceId, deploymentId: env.RAILWAY_DEPLOYMENT_ID, sourceCommit: config.exactCommit, expiresAt: config.expiresAt, budgetEvidenceSha256: budget.evidenceSha256 };
    dependencies.journal.append({ kind: 'identity', identity: result.identity, caseSetSha256: CASE_SHA });
    const sessionIds = new Set();
    for (const c of cases) {
      const item = { caseId: c.id, status: 'NOT_EXECUTED', steps: [] }; result.cases.push(item);
      const session = await call('/api/pillow/session', { forceNew: true, workspaceId: config.workspaceId });
      demand(session.status === 201 && typeof session.data?.session?.sessionId === 'string', 'SESSION_CREATION_FAILED');
      const sessionId = session.data.session.sessionId;
      demand(!sessionIds.has(sessionId), 'ISOLATED_SESSION_REUSED'); sessionIds.add(sessionId);
      let prior;
      for (let index = 0; index < c.steps.length; index++) {
        if (index) demand(prior?.socketClosed === true && typeof prior.connectionId === 'string', 'CLIENT_DISCONNECT_NOT_PROVEN');
        const body = { sessionId, message: projectStep(c, index) };
        const step = { index, sessionId, idempotencyKey: `held-${randomUUID()}`, requestSha256: sha(JSON.stringify(body)), requestId: null, status: 'SUBMISSION_OUTCOME_UNKNOWN' };
        item.steps.push(step); item.status = 'SUBMISSION_OUTCOME_UNKNOWN';
        // Retain intent/key before I/O: a lost response cannot prove the server did not execute.
        dependencies.journal.append({ kind: 'submission_intent', caseId: c.id, step });
        const accepted = await call('/api/pillow/chat', body, { 'idempotency-key': step.idempotencyKey });
        if (index) demand(accepted.connectionId !== prior.connectionId && accepted.socketClosed === true, 'CLIENT_RECONNECT_NOT_PROVEN');
        const requestId = accepted.requestId || accepted.data?.result?.requestId;
        demand([200, 202].includes(accepted.status) && typeof requestId === 'string', 'DURABLE_ACCEPTANCE_MISSING');
        Object.assign(step, { requestId, status: 'ACCEPTED_TERMINAL_UNKNOWN', ...(index ? { interruption: { kind: 'actual_http_client_socket_close_and_new_connection', before: prior.connectionId, after: accepted.connectionId, browserReloadProven: false } } : {}) });
        let terminal;
        for (let polls = 0; polls < 120; polls++) {
          terminal = await call(`/api/pillow/chat-request/${encodeURIComponent(requestId)}`);
          demand(terminal.status === 200 && terminal.data?.request?.requestId === requestId && terminal.data.request.ownerId === me.data.user.id && terminal.data.request.workspaceId === config.workspaceId && terminal.data.durability?.REQUEST_STATE_STORE === 'redis+memory', 'DURABLE_IDENTITY_MISMATCH');
          if (['COMPLETED', 'FAILED', 'FAILED_FATAL'].includes(terminal.data.request.status)) break;
          await new Promise(resolve => setTimeout(resolve, 250));
        }
        const status = terminal.data.request.status;
        step.status = status;
        dependencies.journal.append({ kind: 'terminal_observation', caseId: c.id, step });
        demand(['COMPLETED', 'FAILED', 'FAILED_FATAL'].includes(status), 'POLL_BOUND');
        if (status !== 'COMPLETED') { item.status = 'EXECUTED_WITH_REQUEST_FAILURE'; break; }
        prior = terminal;
      }
      if (item.status === 'SUBMISSION_OUTCOME_UNKNOWN') item.status = 'COLLECTED_UNGRADED';
    }
    result.status = 'COLLECTED_UNGRADED';
  } catch (error) {
    result.status = result.cases.some(c => c.steps.length) ? 'PARTIAL_UNGRADED' : 'NOT_EXECUTED';
    result.failure = /^[A-Z_]+$/.test(error.message) ? error.message : 'ACQUISITION_ERROR';
  }
  result.finishedAt = new Date().toISOString();
  try { dependencies.journal?.append({ kind: 'collection_finished', status: result.status, failure: result.failure ?? null, at: result.finishedAt }); }
  catch { result.status = result.cases.some(c => c.steps.length) ? 'PARTIAL_UNGRADED' : 'NOT_EXECUTED'; result.failure = 'JOURNAL_FINALIZATION_FAILED'; }
  return result;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , configPath, outputPath] = process.argv;
  if (!configPath || !outputPath) throw new Error('CONFIG_AND_NEW_OUTPUT_PATH_REQUIRED');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  const outputFd = openSync(outputPath, 'wx', 0o600);
  const cookie = process.env.HELD_CASE_SESSION_COOKIE ?? '';
  let result, journal;
  try {
    journal = createJournal(outputPath + '.journal.ndjson', [cookie, cookie.slice(cookie.indexOf('=') + 1)]);
    result = await collect(config, process.env, { journal });
    writeFileSync(outputFd, JSON.stringify(result, null, 2) + '\n'); fsyncSync(outputFd);
  } finally { journal?.close(); closeSync(outputFd); }
  console.log(JSON.stringify({ status: result.status, failure: result.failure ?? null, noCredit: true }));
  process.exitCode = result.status === 'COLLECTED_UNGRADED' ? 0 : 2;
}

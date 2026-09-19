/**
 * GATE-001 v2. Synthetic evidence only; no Birth or commerce authority.
 * Import is side-effect-free. Live execution requires explicit opt-in.
 * Each run uses a unique directory; sealed historical evidence is untouched.
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { buildOrdinary24, MISSIONS, FILL_FAST, WORKLOAD_VERSION, classifyResponseSafety } from './soak-workload.mjs';
import { createScrubber, hashText, makeEvidenceRow, evaluateGate } from './soak-gate.mjs';
import { createJournal, sealJson } from './soak-journal.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../../../..');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const LOCKS = Object.freeze({ waveCredit: 0, birth: 'NOT_BORN', realCommerce: 'locked' });

export function requiredCases() {
  return [
    ...buildOrdinary24().map(item => ({ ...item, kind: 'ordinary' })),
    ...MISSIONS.flatMap(mission => mission.steps.map((item, index) => ({
      ...item, kind: 'mission', missionId: mission.id, step: index + 1,
    }))),
    { ...FILL_FAST, id: '__fill__', kind: 'fill' },
  ].map(({ expect, ...entry }) => entry);
}

export function readConfig(env = process.env) {
  if (env.SOAK_ALLOW_LIVE_RUN !== '1' || env.SOAK_ALLOW_RESTART !== '1')
    throw new Error('live_run_and_targeted_restart_require_explicit_opt_in');
  const required = ['EMPIRE_COCKPIT_URL', 'EMPIRE_BRAIN_URL', 'EMPIRE_LOGIN_EMAIL',
    'EMPIRE_LOGIN_PASSWORD', 'SOAK_TIP_SHA', 'SOAK_DEPLOYMENT_ID',
    'SOAK_RAILWAY_SERVICE', 'SOAK_RAILWAY_ENVIRONMENT', 'SOAK_RAILWAY_PROJECT_ID'];
  for (const key of required) if (!env[key]) throw new Error('missing_config_' + key);
  if (!/^[a-f0-9]{40}$/i.test(env.SOAK_TIP_SHA)) throw new Error('candidate_sha_must_be_full');
  for (const key of ['EMPIRE_COCKPIT_URL', 'EMPIRE_BRAIN_URL']) {
    const url = new URL(env[key]);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash)
      throw new Error('unsafe_url_' + key);
  }
  const minutes = Number(env.SOAK_MINUTES || 120);
  const fillGapMs = Number(env.SOAK_FILL_GAP_MS || 45_000);
  if (!Number.isFinite(minutes) || minutes < 120 || minutes > 240)
    throw new Error('duration_must_be_120_to_240_minutes');
  if (!Number.isFinite(fillGapMs) || fillGapMs < 1000 || fillGapMs > 60_000)
    throw new Error('invalid_fill_gap');
  return {
    cockpit: env.EMPIRE_COCKPIT_URL.replace(/\/$/, ''), brain: env.EMPIRE_BRAIN_URL.replace(/\/$/, ''),
    email: env.EMPIRE_LOGIN_EMAIL, password: env.EMPIRE_LOGIN_PASSWORD,
    candidateSha: env.SOAK_TIP_SHA, deploymentId: env.SOAK_DEPLOYMENT_ID,
    service: env.SOAK_RAILWAY_SERVICE, environment: env.SOAK_RAILWAY_ENVIRONMENT,
    projectId: env.SOAK_RAILWAY_PROJECT_ID,
    minutes, fillGapMs,
  };
}

export function assertFrozenHealth(health, config, { allowRestartDeployment = false } = {}) {
  if (!health.liveOk || !health.workerOnline) throw new Error('worker_not_ready');
  if (health.sha !== config.candidateSha || !health.deployId ||
      (!allowRestartDeployment && health.deployId !== config.deploymentId))
    throw new Error('candidate_deployment_mismatch');
  if (health.service !== config.service || health.environment !== config.environment)
    throw new Error('restart_target_mismatch');
  if (health.birthStatus !== 'NOT_BORN' || health.modeDefault !== 'SYNTHETIC' ||
      health.realCommerceAuthorized !== false) throw new Error('safety_boundaries_unproven');
}

export function createTransport(config, fetchImpl = fetch) {
  // Retry GET only. A timed-out chat POST may already have been admitted;
  // the endpoint has no verified caller idempotency contract.
  async function request(url, init = {}, attempts = 1) {
    for (let i = 0; ; i++) {
      try {
        return await fetchImpl(url, { ...init, signal: AbortSignal.timeout(90_000) });
      } catch (error) {
        if (i + 1 >= attempts) throw error;
        await sleep(500 * (i + 1));
      }
    }
  }
  async function json(url, init, attempts = 1) {
    const response = await request(url, init, attempts);
    const value = await response.json();
    return { response, value };
  }
  return {
    async login() {
      const response = await request(config.cockpit + '/api/auth/login', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: config.email, password: config.password }),
      });
      if (!response.ok) throw new Error('login_failed_' + response.status);
      const headers = response.headers.getSetCookie?.() || [];
      const session = headers.map(value => String(value).match(/^empireai_session=([^;]+)/)).find(Boolean);
      if (!session) throw new Error('login_session_cookie_missing');
      return 'empireai_session=' + session[1];
    },
    async newSession(cookie) {
      const { response, value } = await json(config.cockpit + '/api/pillow/session', {
        method: 'POST', headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({ forceNew: true }),
      });
      const sessionId = value.session?.sessionId || value.sessionId;
      if (!response.ok || !sessionId) throw new Error('session_failed_' + response.status);
      return sessionId;
    },
    async health() {
      const [{ value: h }, { value: b }] = await Promise.all([
        json(config.brain + '/health/live', {}, 3), json(config.brain + '/health/shadow-ceo', {}, 3),
      ]);
      return {
        liveOk: h.status === 'ok', workerOnline: h.worker?.online === true,
        deployId: h.deploy?.deploymentId, sha: h.deploy?.gitCommitSha,
        service: h.deploy?.serviceName, environment: h.deploy?.environmentName,
        uptimeMs: h.tier0?.processUptimeMs, workerRestarts: h.worker?.restarts,
        lastExitAt: h.worker?.lastExitAt,
        birthStatus: b.birthStatus, modeDefault: b.modeDefault, realCommerceAuthorized: b.realCommerceAuthorized,
      };
    },
    async chat(cookie, sessionId, message) {
      const { response, value } = await json(config.cockpit + '/api/pillow/chat', {
        method: 'POST', headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({ sessionId, message, workspaceContext: {
          screenPath: '/cockpit/development/pillow', screenId: 'SCR-800', screenTitle: 'Pillow Centre',
        } }),
      });
      return { http: response.status, text: String(value.result?.message || value.message || ''),
        kind: value.result?.kind || 'unknown', requestId: value.result?.requestId || value.requestId || null };
    },
    async retrieve(cookie, requestId) {
      const started = Date.now();
      let last;
      do {
        const { response, value } = await json(config.cockpit + '/api/pillow/chat-request/' + encodeURIComponent(requestId),
          { headers: { cookie } }, 3);
        const item = value.request || {};
        const result = item.finalResult || item.brainResult || value.result || {};
        // Preserve provenance from the returned record. Never relabel an
        // unrelated response with the ID that happened to be requested.
        last = { requestId: item.requestId ?? null, sessionId: item.sessionId ?? null,
          deploymentId: item.observability?.deploymentId ?? null,
          http: response.status, status: item.status || value.status || 'UNKNOWN',
          text: String(result.message || result.text || ''), kind: result.kind || 'unknown' };
        if (!response.ok || ['COMPLETED', 'FAILED', 'FAILED_FATAL', 'CANCELLED'].includes(last.status)) return last;
        await sleep(1500);
      } while (Date.now() - started < 90_000);
      return last;
    },
  };
}

export function assertRetrievalIdentity(retrieval, expected) {
  for (const field of ['requestId', 'sessionId', 'deploymentId']) {
    if (typeof retrieval?.[field] !== 'string' || !retrieval[field].trim() ||
        retrieval[field] !== expected[field]) throw new Error('retrieval_identity_mismatch_' + field);
  }
}

/** Reconnection changes authentication, not the original record's session. */
export async function collectRetrievalProof({ transport, cookie, row, scrub }) {
  const retrieved = await transport.retrieve(cookie, row.requestId);
  const response = scrub(retrieved.text);
  let identityMatches = true;
  try {
    assertRetrievalIdentity(retrieved, { requestId: row.requestId, sessionId: row.sessionId,
      deploymentId: row.identity.deploymentId });
  } catch { identityMatches = false; }
  return { requestId: retrieved.requestId, sessionId: retrieved.sessionId,
    deploymentId: retrieved.deploymentId, status: retrieved.status, http: retrieved.http,
    response, responseHash: hashText(response), match: identityMatches &&
      retrieved.http >= 200 && retrieved.http < 300 && retrieved.status === 'COMPLETED' &&
      hashText(response) === row.responseHash };
}

/** A reservation survives every failure: never replay this logical case. */
export async function executeCase({ journal, state, item, kind, auth, identity, transport, scrub }) {
  journal.reserve({ id: item.id, kind, checkId: item.checkId,
    promptHash: hashText(scrub(item.prompt)), sessionId: auth.sessionId });
  const started = Date.now();
  let admitted = null, retrieval = null, error = null;
  try {
    admitted = await transport.chat(auth.cookie, auth.sessionId, item.prompt);
    if (admitted.requestId) {
      // Persist admission BEFORE retrieval, oracle execution or output.
      journal.recordAdmission(item.id, admitted.requestId);
      retrieval = await transport.retrieve(auth.cookie, admitted.requestId);
      assertRetrievalIdentity(retrieval, { requestId: admitted.requestId, sessionId: auth.sessionId,
        deploymentId: identity.deploymentId });
    }
  } catch (failure) {
    error = scrub(failure?.message || String(failure));
    state.transportErrors++;
  }
  const text = retrieval?.text ?? admitted?.text ?? '';
  const row = makeEvidenceRow({ id: item.id, kind, checkId: item.checkId, prompt: item.prompt,
    missionId: item.missionId, step: item.step, text, scrubber: scrub,
    resultKind: retrieval?.kind || admitted?.kind || 'unknown',
    requestId: admitted?.requestId || null, sessionId: auth.sessionId,
    latencyMs: Date.now() - started, http: retrieval?.http ?? admitted?.http ?? 0,
    terminalStatus: retrieval?.status || 'UNKNOWN', retrieved: !!retrieval,
    retrieval, oraclePassed: !error && typeof item.expect === 'function' && item.expect(text) === true,
    identity,
  });
  row.submissionHttp = admitted?.http ?? null;
  row.submission = admitted ? {
    http: admitted.http, requestId: admitted.requestId, resultKind: admitted.kind,
    response: scrub(admitted.text), responseHash: hashText(scrub(admitted.text)),
  } : null;
  row.admissionOutcome = !admitted ? 'UNKNOWN_DO_NOT_REPLAY' : admitted.requestId ? 'ADMITTED' : 'NO_DURABLE_ID_DO_NOT_REPLAY';
  row.error = error;
  row.responseSafety = classifyResponseSafety(text);
  journal.finish(item.id, row); // Disk failure aborts; it can never cause resubmission.
  state.results.push(row);
  // These measure response claims and submission identities, NOT commerce effects.
  state.unsafeResponseClaims = state.results.filter(result => result.responseSafety.unsafeClaim).length;
  state.contradictoryResponseClaims = state.results.filter(result => result.responseSafety.contradictoryClaim).length;
  const requestIds = state.results.map(result => result.requestId).filter(Boolean);
  state.duplicateSubmissions = state.results.length - new Set(state.results.map(result => result.id)).size +
    requestIds.length - new Set(requestIds).size;
  if (!row.transportCompleted && admitted?.requestId) state.lostAdmitted++;
  if (error || !row.transportCompleted)
    throw new Error('case_transport_failed_' + item.id + '; reconciliation_required_no_replay');
  return row;
}

export function assertRestartContext(config, exec = execFileSync) {
  // Verify ambient CLI project and this version's explicit targeting BEFORE chat.
  const options = { cwd: ROOT, encoding: 'utf8', timeout: 30_000, stdio: ['ignore', 'pipe', 'pipe'] };
  const help = exec('railway', ['restart', '--help'], options);
  if (!help.includes('--service') || !help.includes('--environment'))
    throw new Error('railway_cli_missing_explicit_restart_targeting');
  const status = JSON.parse(exec('railway', ['status', '--json'], options));
  if (status.id !== config.projectId) throw new Error('railway_linked_project_mismatch');
}

function targetedRestart(config) {
  assertRestartContext(config);
  return new Promise((resolve, reject) => {
    const child = spawn('railway', ['restart', '--service', config.service, '--environment', config.environment, '--yes'],
      { cwd: ROOT, shell: false, stdio: 'ignore' });
    const timeout = setTimeout(() => { child.kill(); reject(new Error('restart_command_timeout')); }, 120_000);
    child.once('error', error => { clearTimeout(timeout); reject(error); });
    child.once('exit', code => { clearTimeout(timeout); code === 0 ? resolve() : reject(new Error('restart_exit_' + code)); });
  });
}

export async function main(env = process.env) {
  const config = readConfig(env);
  const runnerSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  if (execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: ROOT, encoding: 'utf8' }).trim())
    throw new Error('runner_checkout_not_clean');
  assertRestartContext(config);
  // No .env loading or credential discovery: only explicitly configured credentials.
  const secrets = Object.entries(env).filter(([key]) => /PASSWORD|TOKEN|SECRET|API_KEY|COOKIE/i.test(key)).map(([, value]) => value);
  const scrub = createScrubber([...secrets, config.email, config.password]);
  const transport = createTransport(config);
  const initial = await transport.health();
  assertFrozenHealth(initial, config);
  const identity = { candidateSha: config.candidateSha, runnerSha, deploymentId: initial.deployId, observedSha: initial.sha };
  const runId = new Date().toISOString().replace(/[:.]/g, '-') + '_' + randomUUID();
  const runDir = path.join(HERE, 'runs', runId);
  mkdirSync(runDir, { recursive: true, mode: 0o700 });
  const journal = createJournal(runDir);
  const manifest = requiredCases();
  const state = { schemaVersion: 2, runId, workloadVersion: WORKLOAD_VERSION, identity, ...LOCKS,
    startedAt: new Date().toISOString(), results: [], transportErrors: 0, lostAdmitted: 0,
    duplicateSubmissions: 0, unsafeResponseClaims: 0, contradictoryResponseClaims: 0,
    externalCommerceEffects: 'NOT_OBSERVED', reportedBoundaryScope: 'health_report_not_authority_certification', pass: false };
  sealJson(path.join(runDir, 'META.json'), { schemaVersion: 2, runId, identity,
    workloadVersion: WORKLOAD_VERSION, requiredCases: manifest, initialHealth: initial,
    durationTargetMin: config.minutes, ...LOCKS });
  const start = Date.now();
  async function health() {
    const current = await transport.health();
    assertFrozenHealth(current, config);
    state.boundaries = current;
    return current;
  }
  const auth = { cookie: null, sessionId: null };
  async function run(item, kind) {
    await health();
    return executeCase({ journal, state, item, kind, auth, identity, transport, scrub });
  }
  async function retrieveProof(row) {
    return collectRetrievalProof({ transport, cookie: auth.cookie, row, scrub });
  }
  try {
    auth.cookie = await transport.login();
    auth.sessionId = await transport.newSession(auth.cookie);
    for (const item of buildOrdinary24()) await run(item, 'ordinary');
    for (const mission of MISSIONS) {
      auth.sessionId = await transport.newSession(auth.cookie);
      for (let index = 0; index < mission.steps.length; index++)
        await run({ ...mission.steps[index], missionId: mission.id, step: index + 1 }, 'mission');
    }
    if (state.results.some(row => !row.semanticPassed))
      throw new Error('semantic_regressions_block_long_soak_repair_product_before_rerun');
    // New auth/session proves durable retrieval, not browser UI rendering.
    auth.cookie = await transport.login();
    auth.sessionId = await transport.newSession(auth.cookie);
    state.browserReconnect = { ...await retrieveProof(state.results.at(-1)), proofScope: 'new_authenticated_session_not_browser_UI' };
    journal.event({ type: 'reconnect_proof', proof: state.browserReconnect });
    if (!state.browserReconnect.match) throw new Error('reconnect_retrieval_mismatch');
    let fillIndex = 0;
    while (Date.now() - start < config.minutes * 60_000) {
      if (!state.workerRestart && Date.now() - start >= config.minutes * 30_000) {
        const row = state.results.at(-1), before = await health(), beforeAt = Date.now();
        journal.event({ type: 'restart_intent', target: { service: config.service, environment: config.environment }, before });
        await targetedRestart(config);
        let after, restartObserved = false;
        for (let index = 0; index < 60; index++) {
          try {
            after = await transport.health();
            assertFrozenHealth(after, config, { allowRestartDeployment: true });
            restartObserved = (Number.isFinite(after.uptimeMs) && Number.isFinite(before.uptimeMs) &&
              after.uptimeMs < before.uptimeMs + (Date.now() - beforeAt) - 1000) ||
              (Number.isInteger(after.workerRestarts) && after.workerRestarts > before.workerRestarts) ||
              (!!after.lastExitAt && after.lastExitAt !== before.lastExitAt);
            if (restartObserved) break;
          } catch { /* Safe readiness polling; never replay restart or chat. */ }
          await sleep(5000);
        }
        if (!restartObserved) throw new Error('actual_restart_not_observed');
        assertFrozenHealth(after, config); // A changed deployment tuple cannot silently pass.
        auth.cookie = await transport.login();
        auth.sessionId = await transport.newSession(auth.cookie);
        state.workerRestart = { ...await retrieveProof(row), restartObserved, before, after };
        journal.event({ type: 'restart_proof', proof: state.workerRestart });
        if (!state.workerRestart.match) throw new Error('restart_retrieval_mismatch');
      }
      const row = await run({ ...FILL_FAST, id: 'FILL_' + fillIndex++ }, 'fill');
      if (!row.semanticPassed) throw new Error('fill_semantics_failed');
      await sleep(config.fillGapMs);
    }
    await health();
  } catch (error) {
    state.error = scrub(error?.message || String(error));
  }
  state.finishedAt = new Date().toISOString();
  state.durationMin = (Date.now() - start) / 60_000;
  const verdict = evaluateGate(state, manifest);
  Object.assign(state, verdict, { pass: !state.error && verdict.pass, ...LOCKS });
  if (state.error) state.failures = [...(state.failures || []), 'executionCompletedWithoutError'];
  // No printed PASS until the final evidence is durably and exclusively sealed.
  journal.event({ type: 'run_complete', pass: state.pass, failures: state.failures });
  sealJson(path.join(runDir, 'SOAK_RESULTS.json'), state);
  journal.close();
  console.log(JSON.stringify({ runId, output: runDir, pass: state.pass, failures: state.failures, ...LOCKS }));
  return state.pass ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().then(code => { process.exitCode = code; }).catch(error => {
    // Never echo unredacted provider/credential details from preflight failures.
    console.error(JSON.stringify({ pass: false, reason: 'run_aborted_no_qualifying_seal', errorType: error?.name || 'Error' }));
    process.exitCode = 1;
  });
}

#!/usr/bin/env node
'use strict';
// Repository-owned PRIVATE canary proof. Never starts, restarts or deletes provider resources.
// before|after SERVICE_UUID EXACT_APP_COMMIT_SHA EXACT_PROBE_SHA256
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const launcher = require('./canary-launcher.cjs');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const ROOT = path.resolve(__dirname, '..');
const MAX_FILE = 64 * 1024 * 1024;
const COMMON = ['scope_and_runtime', 'launcher_identity', 'live_identity', 'readiness',
  'redis_persistence_configuration', 'unauthorized_me', 'unauthorized_request', 'unauthorized_birth',
  'unauthorized_mission', 'founder_login', 'founder_session', 'admin_login', 'admin_session',
  'worker_founder_login', 'worker_founder_session', 'worker_admin_login', 'worker_admin_session',
  'worker_founder_logout', 'worker_admin_logout', 'birth_locks', 'commerce_rejected', 'cross_workspace_denied', 'mission_history',
  'mission_fake_completion_rejected', 'native_mission_history', 'authority_completed',
  'missing_provider_failed_truthfully', 'request_owner_isolation', 'admin_logout'];
const REQUIRED = {
  before: [...COMMON, 'mission_created', 'durable_acceptance', 'idempotent_acceptance',
    'idempotency_conflict_denied', 'missing_provider_accepted', 'marker_saved'],
  after: [...COMMON, 'prior_phase_passed', 'same_candidate_restarted', 'mission_history_preserved',
    'native_history_preserved', 'authority_result_preserved', 'failure_result_preserved',
    'brain_snapshot_integrity', 'brain_accounts_persisted', 'account_identity_preserved'],
};
function summarize(phase, checks) {
  const names = checks.map(c => c.name);
  const required = REQUIRED[phase] || [];
  const missing = required.filter(name => !names.includes(name));
  const duplicate = names.filter((name, i) => names.indexOf(name) !== i);
  return { requiredChecks: required, missingRequiredChecks: missing, duplicateChecks: duplicate,
    passed: required.length > 0 && missing.length === 0 && duplicate.length === 0 && checks.every(c => c.pass === true) };
}
function validateArguments(args, input, actualHash) {
  const [phase, service, commit, probeSha] = args;
  if (args.length !== 4 || !REQUIRED[phase] || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(service || '') ||
      service === 'c3c89cbb-3e10-414a-98a2-f9ec4f1f840e' || service !== input.RAILWAY_SERVICE_ID ||
      !/^[0-9a-f]{40}$/.test(commit || '') || commit !== input.RAILWAY_GIT_COMMIT_SHA ||
      !/^[0-9a-f]{64}$/.test(probeSha || '') || probeSha !== actualHash || !input.RAILWAY_DEPLOYMENT_ID) {
    throw new Error('PROBE_IDENTITY_MISMATCH');
  }
  return { phase, service, commit, probeSha };
}
function readinessPass(r) {
  const d = r.data;
  return r.status === 200 && d?.ready === true && d.workerOnline === true && d.workerReady === true &&
    d.sessionStore === 'redis' && d.pillow?.enabled === true && d.pillow.ready === true &&
    d.pillow.lifecycle === 'running' && ['tier0Primary', 'redis', 'brainWorker', 'brainWorkerReady', 'pillow']
      .every(k => d.checks?.[k]?.ok === true) && d.checks.redis.ping === true;
}
function birthPass(r) {
  const a = r.data?.authority;
  return r.status === 200 && r.data?.status === 'NOT_BORN' && a?.birthStatus === 'NOT_BORN' &&
    a.technicallyReady === false && a.commerceStatus === 'LOCKED' && a.realCommerceAuthorized === false &&
    a.waveCredit === 0 && a.independentCertification === 'UNVERIFIED';
}
function authorityPass(r, requestId, ownerId) {
  const q = r.data?.request, result = q?.finalResult;
  return r.status === 200 && q?.requestId === requestId && q.ownerId === ownerId && q.workspaceId === 'ws_empire_1' &&
    r.data.durability?.REQUEST_STATE_STORE === 'redis+memory' && q.status === 'COMPLETED' &&
    q.failureClass === 'BRAIN_SUCCESS' && q.attemptCount === 1 && result?.kind === 'authority_facts' &&
    typeof result.message === 'string' && /Birth status: NOT_BORN\./.test(result.message) && /Real commerce authorized: no \(unauthorized\)\./.test(result.message) &&
    result.degradedUsed !== true && result.constitutionalGate?.allowed === true;
}
function failurePass(r, requestId, ownerId) {
  const q = r.data?.request;
  return r.status === 200 && q?.requestId === requestId && q.ownerId === ownerId && q.workspaceId === 'ws_empire_1' &&
    r.data.durability?.REQUEST_STATE_STORE === 'redis+memory' && q.status === 'FAILED_FATAL' &&
    q.failureClass === 'BRAIN_FATAL' && q.attemptCount === 1 && q.lastError === 'no_llm_provider' && q.finalResult === null;
}
function accountRowsPass(roles, expected) {
  return roles.founder?.length === 1 && roles.admin?.length === 1 &&
    typeof expected?.founder === 'string' && typeof expected?.admin === 'string' &&
    roles.founder[0] === expected.founder && roles.admin[0] === expected.admin;
}
function unchangedMission(m, marker) {
  return m?.missionId === marker.missionId && m.missionName === marker.missionName && m.currentStatus === 'Created' &&
    m.highRisk === true && m.pillowConfirmed === false && m.grandKingApproved === false && m.progress === 0 &&
    Array.isArray(m.workers) && m.workers.length === 0 && hash(JSON.stringify(m)) === marker.missionDigest;
}
function readBounded(filename, maximum = MAX_FILE) {
  const fd = fs.openSync(filename, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const s = fs.fstatSync(fd);
    if (!s.isFile() || s.size > maximum) throw new Error('UNBOUNDED_OR_NONREGULAR_FILE');
    const bytes = fs.readFileSync(fd);
    if (bytes.length > maximum) throw new Error('FILE_GREW_BEYOND_BOUND');
    return bytes;
  } finally { fs.closeSync(fd); }
}
function saveMarker(filename, value) {
  const fd = fs.openSync(filename, 'wx', 0o600);
  try { fs.writeFileSync(fd, JSON.stringify(value)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  const dir = fs.openSync(path.dirname(filename), 'r');
  try { fs.fsyncSync(dir); } finally { fs.closeSync(dir); }
}
function nativeHistory(filename, ownerEmail, missionId) {
  const stat = fs.lstatSync(filename);
  if (!stat.isFile() || stat.size > MAX_FILE) throw new Error('INVALID_MISSION_DATABASE');
  const { DatabaseSync } = require('node:sqlite');
  // Never open a writer or run recovery/cleanup; a hot journal is an explicit failed read.
  const db = new DatabaseSync(filename, { readOnly: true, timeout: 0, allowExtension: false });
  try {
    if (db.prepare('PRAGMA application_id').get().application_id !== 0x454d5352 ||
        db.prepare('PRAGMA user_version').get().user_version !== 3 ||
        db.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok') throw new Error('INVALID_MISSION_DATABASE');
    const rows = db.prepare('SELECT id, revision, envelope FROM mission_snapshot').all();
    if (rows.length !== 1 || rows[0].id !== 1 || !Number.isSafeInteger(rows[0].revision) || rows[0].revision < 1 ||
        Buffer.byteLength(rows[0].envelope) > 16 * 1024 * 1024) throw new Error('INVALID_MISSION_SNAPSHOT');
    const envelope = JSON.parse(rows[0].envelope);
    if (envelope.version !== 3 || envelope.scope?.ownerEmail !== ownerEmail.trim().toLowerCase() ||
        envelope.scope.workspaceId !== 'ws_empire_1') throw new Error('MISSION_SCOPE_MISMATCH');
    const state = envelope.state;
    if (!['missions', 'transitions', 'checkpoints', 'retries', 'recoveries', 'timeline', 'reports', 'auditTrail']
      .every(k => Array.isArray(state?.[k]))) throw new Error('MISSION_HISTORY_MISSING');
    const matches = state.missions.filter(m => m.missionId === missionId);
    if (matches.length !== 1) throw new Error('MISSION_NOT_IN_DURABLE_HISTORY');
    // History reports can grow during reads. Require every old record to survive, not equality of whole file bytes.
    const entries = Object.fromEntries(Object.entries(state).map(([k, values]) => [k, values.map(v => hash(JSON.stringify(v)))]));
    return { revision: rows[0].revision, mission: matches[0], entries,
      envelopeSha256: hash(rows[0].envelope), bytes: stat.size, integrity: 'ok' };
  } finally { db.close(); }
}
function preservesHistory(before, after) {
  const keys = ['missions', 'transitions', 'checkpoints', 'retries', 'recoveries', 'timeline', 'reports', 'auditTrail'];
  if (!Number.isSafeInteger(before?.revision) || before.revision < 1 || !Number.isSafeInteger(after?.revision) ||
      after.revision < before.revision || Object.keys(before.entries || {}).length !== keys.length ||
      Object.keys(after.entries || {}).length !== keys.length) return false;
  return keys.every(key => {
    if (!Array.isArray(before.entries[key]) || !Array.isArray(after.entries[key])) return false;
    const available = new Map();
    for (const value of after.entries[key]) available.set(value, (available.get(value) || 0) + 1);
    for (const value of before.entries[key]) {
      const count = available.get(value) || 0;
      if (count < 1) return false;
      available.set(value, count - 1);
    }
    return true;
  });
}
async function boundedHttp(origin, deadline, route, { method = 'GET', body, cookie, headers = {} } = {}) {
  if (Date.now() >= deadline) throw new Error('PROBE_DEADLINE');
  const url = new URL(route, origin);
  if (url.origin !== origin || !route.startsWith('/') || route.startsWith('//')) throw new Error('NON_LOOPBACK_ROUTE');
  const r = await fetch(url, { method, redirect: 'error', signal: AbortSignal.timeout(Math.min(12_000, deadline - Date.now())),
    headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(cookie ? { cookie } : {}), ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const reader = r.body.getReader(); let size = 0; const chunks = [];
  try {
    while (true) {
      const part = await reader.read(); if (part.done) break;
      size += part.value.byteLength;
      if (size > 4 * 1024 * 1024) { await reader.cancel(); throw new Error('HTTP_RESPONSE_TOO_LARGE'); }
      chunks.push(part.value);
    }
  } finally { reader.releaseLock(); }
  let data; try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { data = null; }
  return { status: r.status, data, headers: r.headers };
}

function sanitizedObservations(input) {
  const id = v => typeof v === 'string' && /^[A-Za-z0-9_.:-]{1,160}$/.test(v) ? v : null;
  const enums = { kind: ['authority_facts'], sessionStore: ['redis'], lifecycle: ['running'],
    status: ['NOT_BORN','COMPLETED','FAILED_FATAL'], birthStatus: ['NOT_BORN'], commerceStatus: ['LOCKED'],
    independentCertification: ['UNVERIFIED'], failureClass: ['BRAIN_SUCCESS','BRAIN_FATAL'],
    missionType: ['enterprise'], mode: ['standalone'], currentStatus: ['Created'] };
  const bools = new Set(['ready','workerOnline','workerReady','enabled','ok','ping','technicallyReady','realCommerceAuthorized','highRisk','pillowConfirmed','grandKingApproved','structuralSignalOnly','fabricated']);
  const numbers = new Set(['waveCredit','attemptCount','retryCount','progress','revision','bytes']);
  const primitive = (key, v) => {
    if (enums[key]) return enums[key].includes(v) ? v : null;
    if (bools.has(key)) return typeof v === 'boolean' ? v : null;
    if (numbers.has(key)) return Number.isSafeInteger(v) && v >= 0 && v <= 67108864 ? v : null;
    if (key === 'createdAt' || key === 'updatedAt') return typeof v === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v) ? v : null;
    if (key === 'metadataVersion') return typeof v === 'string' && /^[0-9][0-9a-z.-]{0,31}$/.test(v) ? v : null;
    if (key === 'missionName') return typeof v === 'string' && /^BOUNDED_CANARY_UNAPPROVED_[0-9a-f-]{36}$/.test(v) ? v : null;
    if (key === 'envelopeSha256') return typeof v === 'string' && /^[a-f0-9]{64}$/.test(v) ? v : null;
    if (key === 'integrity') return v === 'ok' ? v : null;
    return id(v);
  };
  const pick = (value, keys) => Object.fromEntries(keys.filter(k => value && Object.prototype.hasOwnProperty.call(value,k)).map(k => [k,primitive(k,value[k])]));
  const missionKeys = ['missionId','missionType','missionName','parentMissionId','dependencyMissionIds','mode','currentStatus','createdAt','updatedAt','workers','highRisk','pillowConfirmed','grandKingApproved','retryCount','progress','traceabilityRefs','metadataVersion','structuralSignalOnly','fabricated'];
  const cleanMission = m => { const result = pick(m, missionKeys);
    for (const k of ['workers','dependencyMissionIds']) result[k] = Array.isArray(m?.[k]) && m[k].length === 0 ? [] : null;
    result.traceabilityRefs = Array.isArray(m?.traceabilityRefs) ? m.traceabilityRefs.filter(v => v === 'q10-03' || v === 'mission-runtime') : null;
    return result; };
  const cleanTerminal = r => {
    const q = r?.data?.request;
    const request = pick(q, ['requestId','ownerId','workspaceId','status','failureClass','attemptCount']);
    request.lastError = q?.lastError === 'no_llm_provider' ? 'no_llm_provider' : null;
    request.finalResult = !q?.finalResult || typeof q.finalResult !== 'object' ? null : {
      kind: primitive('kind', q?.finalResult?.kind),
      message: typeof q?.finalResult?.message === 'string' && /Birth status: NOT_BORN\./.test(q.finalResult.message) && /Real commerce authorized: no \(unauthorized\)\./.test(q.finalResult.message)
        ? 'Birth status: NOT_BORN. Real commerce authorized: no (unauthorized).' : null,
      degradedUsed: q?.finalResult?.degradedUsed === true,
      constitutionalGate: { allowed: q?.finalResult?.constitutionalGate?.allowed === true },
    };
    return { status: Number.isInteger(r?.status) && r.status >= 100 && r.status <= 599 ? r.status : null, data: { request, durability: { REQUEST_STATE_STORE: r?.data?.durability?.REQUEST_STATE_STORE === 'redis+memory' ? 'redis+memory' : null } } };
  };
  const role = (value, name) => ({ id: id(value), role: name });
  return { schema: 'canary-sanitized-observations-v1', deploymentId: id(input.deploymentId),
    serviceId: id(input.serviceId), sourceCommit: id(input.sourceCommit), probeSha256: id(input.probeSha256),
    accounts: { primary: { founder: role(input.founder.userId, 'founder'), admin: role(input.admin.userId, 'admin') },
      worker: { founder: role(input.workerFounder.userId, 'founder'), admin: role(input.workerAdmin.userId, 'admin') } },
    mission: cleanMission(input.mission),
    missionSha256: hash(JSON.stringify(input.mission)),
    native: input.native ? { ...pick(input.native, ['revision','envelopeSha256','bytes','integrity']),
      entries: Object.fromEntries(['missions','transitions','checkpoints','retries','recoveries','timeline','reports','auditTrail'].map(k => [k, Array.isArray(input.native.entries?.[k]) && input.native.entries[k].every(v => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v)) ? input.native.entries[k] : null])),
      mission: cleanMission(input.native.mission), missionSha256: hash(JSON.stringify(input.native.mission)) } : null,
    authority: cleanTerminal(input.authority), failure: cleanTerminal(input.failed),
    authorityResultSha256: primitive("envelopeSha256", input.authorityDigest), failureResultSha256: primitive("envelopeSha256", input.failureDigest),
    requestOwnerIsolationStatus: Number.isInteger(input.foreign.status) ? input.foreign.status : null, crossWorkspaceStatus: Number.isInteger(input.forbidden.status) ? input.forbidden.status : null,
    birth: { status: Number.isInteger(input.birth.status) ? input.birth.status : null, data: { status: primitive('status', input.birth.data?.status),
      authority: pick(input.birth.data?.authority, ['birthStatus','technicallyReady','commerceStatus','realCommerceAuthorized','waveCredit','independentCertification']) } },
    readiness: { status: Number.isInteger(input.ready.status) ? input.ready.status : null, data: { ...pick(input.ready.data, ['ready','workerOnline','workerReady','sessionStore']),
      pillow: pick(input.ready.data?.pillow, ['enabled','ready','lifecycle']),
      checks: Object.fromEntries(['tier0Primary','redis','brainWorker','brainWorkerReady','pillow'].map(k => [k,pick(input.ready.data?.checks?.[k],['ok','ping'])])) } },
  };
}

async function main(args = process.argv.slice(2)) {
  const out = { schema: 'empireai-bounded-canary-probe-v2', phase: args[0], startedAt: new Date().toISOString(), checks: [],
    scope: 'private disposable canary, same-candidate application redeploy recovery only',
    limitations: ['Not production, live-commerce, model quality or Birth certification.',
      'No Redis restart, abrupt process kill, lost-volume or power-loss proof is claimed by this probe.',
      'npm identity requires its separate exact build receipt; it is not inferred from runtime configuration.'] };
  const check = (name, pass, facts = {}) => out.checks.push({ name, pass: pass === true, ...facts });
  const attempt = async (name, action) => {
    try { return await action(); } catch { check(name, false, { failure: 'BOUNDED_OPERATION_FAILED' }); return null; }
  };
  let markerPath, marker;
  try {
    launcher.assertRuntimeVersion(process.versions.node);
    const options = validateArguments(args, process.env, hash(readBounded(__filename)));
    const { phase, service, commit, probeSha } = options;
    const { env, expiresAt } = launcher.validateCanaryEnvironment(process.env);
    const deadline = Math.min(Date.now() + 180_000, expiresAt - 30_000);
    if (deadline - Date.now() < 60_000) throw new Error('INSUFFICIENT_TIME');
    const port = Number(env.PORT || 8080);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('INVALID_PORT');
    const http = (route, input) => boundedHttp(`http://127.0.0.1:${port}`, deadline, route, input);
    Object.assign(out, options, { deploymentId: env.RAILWAY_DEPLOYMENT_ID, nodeVersion: process.versions.node, expiresAt: env.EMPIRE_CANARY_EXPIRES_AT });
    check('scope_and_runtime', true, { actualProbeSha256: probeSha, actualNodeVersion: process.versions.node, npmBuildIdentity: 'SEPARATE_RECEIPT_REQUIRED' });
    const launch = JSON.parse(readBounded(`${env.DATABASE_PATH}.launch.json`, 16_384));
    const launcherHash = hash(readBounded(path.join(__dirname, 'canary-launcher.cjs')));
    const launchValid = launch.schema === 'canary-launch-v1' && launch.nodeVersion === process.versions.node &&
      launch.gitCommitSha === commit && launch.serviceId === service && launch.deploymentId === env.RAILWAY_DEPLOYMENT_ID &&
      launch.expiresAt === new Date(expiresAt).toISOString() && launch.launcherSha256 === launcherHash &&
      typeof launch.launchId === 'string' && Number.isInteger(launch.childPid) && Number.isInteger(launch.launcherPid) &&
      launch.execPath === fs.realpathSync(process.execPath) &&
      fs.realpathSync(`/proc/${launch.childPid}/cwd`) === ROOT &&
      fs.readFileSync(`/proc/${launch.childPid}/cmdline`, 'utf8').split('\0')[1] === 'backend/dist/index.js' &&
      fs.realpathSync(`/proc/${launch.childPid}/exe`) === fs.realpathSync(process.execPath) &&
      fs.realpathSync(`/proc/${launch.launcherPid}/exe`) === fs.realpathSync(process.execPath);
    check('launcher_identity', launchValid, { launchId: launch.launchId, launcherSha256: launcherHash, childPid: launch.childPid });
    if (!launchValid) throw new Error('LAUNCHER_NOT_VERIFIED');
    const live = await http('/health/live');
    const workerPort = live.data?.worker?.port;
    const validWorkerPort = Number.isInteger(workerPort) && workerPort > 0 && workerPort <= 65535 && workerPort !== port;
    check('live_identity', validWorkerPort && live.status === 200 && live.data?.tier0Isolation === true && live.data.worker?.online === true &&
      live.data.deploy?.gitCommitSha === commit && live.data.deploy.deploymentId === env.RAILWAY_DEPLOYMENT_ID);
    const ready = await http('/health/ready');
    check('readiness', readinessPass(ready), { httpStatus: ready.status, workerReady: ready.data?.workerReady ?? null,
      sessionStore: ready.data?.sessionStore ?? null, redisReady: ready.data?.checks?.redis?.ok ?? null });
    // Stop before writing any fixture when identity/readiness prerequisites fail.
    if (!out.checks.every(c => c.pass)) throw new Error('READINESS_PREREQUISITE_FAILED');
    const workerHttp = (route, input) => boundedHttp(`http://127.0.0.1:${workerPort}`, deadline, route, input);
    const req = createRequire(path.join(ROOT, 'backend/package.json'));
    await attempt('redis_persistence_configuration', async () => {
      const Redis = req('ioredis');
      const redis = new Redis(env.REDIS_URL, { lazyConnect: true, connectTimeout: 3000, commandTimeout: 3000, maxRetriesPerRequest: 0, retryStrategy: null });
      redis.on('error', () => {}); // Report bounded failure without printing connection details.
      try {
        await redis.connect();
        const names = ['maxmemory', 'maxmemory-policy', 'appendonly', 'appendfsync'];
        const config = {};
        for (const name of names) { const values = await redis.config('GET', name); config[name] = values[1]; }
        check('redis_persistence_configuration', Number(config.maxmemory) > 0 && Number(config.maxmemory) <= 268435456 &&
          config['maxmemory-policy'] === 'noeviction' && config.appendonly === 'yes' && config.appendfsync === 'always', config);
      } finally { redis.disconnect(); }
    });
    for (const [name, route, input] of [
      ['unauthorized_me', '/auth/me'], ['unauthorized_request', '/api/pillow/chat-request/probe-no-auth'],
      ['unauthorized_birth', '/pillow-commissioning/birth'],
      ['unauthorized_mission', '/api/pillow/mission-runtime/history', { method: 'POST', body: {} }],
    ]) { const r = await http(route, input); check(name, r.status === 401, { httpStatus: r.status }); }
    async function login(role, client = http, prefix = '') {
      const key = role.toUpperCase();
      const r = await client('/auth/login', { method: 'POST', body: { email: env[`${key}_EMAIL`], password: env[`${key}_PASSWORD`] } });
      const cookie = (r.headers.get('set-cookie') || '').match(/(?:^|,\s*)empireai_session=([^;]+)/)?.[1];
      const valid = r.status === 200 && r.data?.user?.role === role && typeof r.data?.user?.id === 'string' && Boolean(cookie);
      check(`${prefix}${role}_login`, valid, { httpStatus: r.status });
      if (!valid) throw new Error('AUTH_FAILED');
      const account = { cookie: `empireai_session=${cookie}`, userId: r.data.user.id };
      const me = await client('/auth/me', { cookie: account.cookie });
      check(`${prefix}${role}_session`, me.status === 200 && me.data?.user?.id === account.userId && me.data.user.role === role);
      return account;
    }
    const founder = await login('founder'), admin = await login('admin');
    // Primary uses deterministic session IDs; worker SQL users have independent random IDs.
    // Observe both identity domains rather than mistaking reseeding for persisted rows.
    const workerFounder = await login('founder', workerHttp, 'worker_');
    const workerAdmin = await login('admin', workerHttp, 'worker_');
    const post = (route, body) => http(route, { method: 'POST', body, cookie: founder.cookie });
    const birth = await http('/pillow-commissioning/birth', { cookie: founder.cookie });
    check('birth_locks', birthPass(birth), { httpStatus: birth.status, status: birth.data?.status ?? null, authority: birth.data?.authority ?? null });
    const forbidden = await post('/api/pillow/mission-runtime/history', { workspaceId: 'ws_denied_canary_probe' });
    check('cross_workspace_denied', forbidden.status === 403);
    // Guard must be observed before any fixture execution request.
    if (!out.checks.every(c => c.pass)) throw new Error('ISOLATION_PREREQUISITE_FAILED');
    const commerce = await post('/pillow-commerce-presale/run-cycle', { async: false, smartViableBatch: false, maxCandidates: 1 });
    check('commerce_rejected', commerce.status === 500 && typeof commerce.data?.error === 'string' &&
      commerce.data.error.includes('Commerce automation is disabled'), { httpStatus: commerce.status, expectedRejection: true });
    if (!out.checks.every(c => c.pass)) throw new Error('COMMERCE_GUARD_FAILED');
    markerPath = `${env.DATABASE_PATH}.probe-marker.json`;
    if (phase === 'before') {
      if (fs.existsSync(markerPath)) throw new Error('PRIOR_MARKER_MUST_NOT_BE_OVERWRITTEN');
      const nonce = crypto.randomUUID();
      marker = { schema: 'canary-restart-marker-v2', service, commit, probeSha, expiresAt: env.EMPIRE_CANARY_EXPIRES_AT,
        beforeDeploymentId: env.RAILWAY_DEPLOYMENT_ID, beforeLaunchId: launch.launchId, nonce,
        accountIds: { founder: founder.userId, admin: admin.userId },
        databaseAccountIds: { founder: workerFounder.userId, admin: workerAdmin.userId },
        missionName: `BOUNDED_CANARY_UNAPPROVED_${nonce}` };
      const created = await post('/api/pillow/mission-runtime/create-mission', { missionName: marker.missionName,
        missionType: 'enterprise', workers: [], highRisk: true, pillowConfirmed: false, grandKingApproved: false });
      const mission = created.data?.report?.mission;
      marker.missionId = mission?.missionId; marker.missionDigest = hash(JSON.stringify(mission ?? null));
      check('mission_created', created.status === 200 && created.data?.report?.decision !== 'fail' && unchangedMission(mission, marker));
      if (!out.checks.every(c => c.pass)) throw new Error('FIXTURE_CREATION_FAILED');
      const body = { sessionId: `bounded-canary-${nonce}`, message: 'What is your current authority? Do not execute tools, commerce or spending. This is a bounded engineering transport test.' };
      const headers = { 'idempotency-key': `bounded-canary-${nonce}` };
      const accepted = await http('/api/pillow/chat', { method: 'POST', body, headers, cookie: founder.cookie });
      marker.requestId = accepted.headers.get('x-empire-pillow-request-id') || accepted.data?.result?.requestId;
      check('durable_acceptance', [200, 202].includes(accepted.status) && typeof marker.requestId === 'string');
      const repeated = await http('/api/pillow/chat', { method: 'POST', body, headers, cookie: founder.cookie });
      check('idempotent_acceptance', [200, 202].includes(repeated.status) &&
        (repeated.headers.get('x-empire-pillow-request-id') || repeated.data?.result?.requestId) === marker.requestId);
      const conflict = await http('/api/pillow/chat', { method: 'POST', body: { ...body, message: body.message + ' Changed input.' }, headers, cookie: founder.cookie });
      check('idempotency_conflict_denied', conflict.status === 409);
      const failed = await http('/api/pillow/chat', { method: 'POST', cookie: founder.cookie,
        headers: { 'idempotency-key': `missing-provider-${nonce}` }, body: { sessionId: `missing-provider-${nonce}`,
          message: 'Explain the tradeoffs between two unfamiliar logistics designs without using tools or performing actions.' } });
      marker.failedRequestId = failed.headers.get('x-empire-pillow-request-id') || failed.data?.result?.requestId;
      check('missing_provider_accepted', [200, 202].includes(failed.status) && typeof marker.failedRequestId === 'string');
    } else {
      marker = JSON.parse(readBounded(markerPath, 1024 * 1024));
      if (marker.schema !== 'canary-restart-marker-v2' || marker.service !== service || marker.commit !== commit ||
          marker.probeSha !== probeSha || marker.expiresAt !== env.EMPIRE_CANARY_EXPIRES_AT) throw new Error('RESTART_SCOPE_MISMATCH');
      check('account_identity_preserved', marker.accountIds?.founder === founder.userId && marker.accountIds?.admin === admin.userId &&
        marker.databaseAccountIds?.founder === workerFounder.userId && marker.databaseAccountIds?.admin === workerAdmin.userId);
      check('prior_phase_passed', marker.beforePassed === true && typeof marker.missionId === 'string' &&
        typeof marker.requestId === 'string' && typeof marker.failedRequestId === 'string');
      check('same_candidate_restarted', typeof marker.beforeLaunchId === 'string' && marker.beforeLaunchId !== launch.launchId &&
        typeof marker.beforeDeploymentId === 'string' && marker.beforeDeploymentId !== env.RAILWAY_DEPLOYMENT_ID,
        { beforeDeploymentId: marker.beforeDeploymentId, afterDeploymentId: env.RAILWAY_DEPLOYMENT_ID,
          proofScope: 'new application launch and deployment at same exact source commit; not same-image proof' });
      if (!out.checks.every(c => c.pass)) throw new Error('RESTART_PREREQUISITE_FAILED');
    }
    const history = await post('/api/pillow/mission-runtime/history', {});
    const mission = history.data?.report?.missions?.find(m => m.missionId === marker.missionId);
    check('mission_history', history.status === 200 && unchangedMission(mission, marker));
    if (phase === 'after') check('mission_history_preserved', unchangedMission(mission, marker));
    const fake = await post('/api/pillow/mission-runtime/execute', { missionId: marker.missionId, highRisk: false,
      forceComplete: true, completeAfterRun: true, completionReceipt: { status: 'completed' } });
    const afterFake = await post('/api/pillow/mission-runtime/history', {});
    const sameMission = afterFake.data?.report?.missions?.find(m => m.missionId === marker.missionId);
    check('mission_fake_completion_rejected', fake.status === 200 && fake.data?.report?.decision === 'fail' &&
      afterFake.status === 200 && unchangedMission(sameMission, marker), { expectedRejection: true, noApprovalGranted: true });
    const native = await attempt('native_mission_history', async () => {
      const result = nativeHistory(`${env.DATABASE_PATH}.missions.sqlite`, env.FOUNDER_EMAIL, marker.missionId);
      check('native_mission_history', unchangedMission(result.mission, marker), { revision: result.revision, integrity: result.integrity,
        envelopeSha256: result.envelopeSha256, bytes: result.bytes }); return result;
    });
    if (phase === 'before') marker.nativeBefore = native;
    else check('native_history_preserved', Boolean(native) && preservesHistory(marker.nativeBefore, native));
    async function waitTerminal(requestId) {
      if (typeof requestId !== 'string') throw new Error('REQUEST_ID_MISSING');
      const until = Math.min(deadline - 10_000, Date.now() + 45_000);
      let r;
      do {
        r = await http(`/api/pillow/chat-request/${encodeURIComponent(requestId)}`, { cookie: founder.cookie });
        if (['COMPLETED', 'FAILED_FATAL', 'FAILED'].includes(r.data?.request?.status)) return r;
        await new Promise(resolve => setTimeout(resolve, 250));
      } while (Date.now() < until);
      return r;
    }
    const authority = await waitTerminal(marker.requestId);
    check('authority_completed', authorityPass(authority, marker.requestId, founder.userId), { status: authority.data?.request?.status ?? null,
      kind: authority.data?.request?.finalResult?.kind ?? null, attemptCount: authority.data?.request?.attemptCount ?? null });
    const authorityDigest = hash(JSON.stringify(authority.data?.request?.finalResult ?? null));
    const failed = await waitTerminal(marker.failedRequestId);
    check('missing_provider_failed_truthfully', failurePass(failed, marker.failedRequestId, founder.userId), {
      status: failed.data?.request?.status ?? null, failureClass: failed.data?.request?.failureClass ?? null,
      attemptCount: failed.data?.request?.attemptCount ?? null, expectedFailure: true });
    const failureDigest = hash(JSON.stringify({ status: failed.data?.request?.status, attemptCount: failed.data?.request?.attemptCount,
      failureClass: failed.data?.request?.failureClass, lastError: failed.data?.request?.lastError, finalResult: failed.data?.request?.finalResult }));
    if (phase === 'before') { marker.authorityDigest = authorityDigest; marker.failureDigest = failureDigest; }
    else {
      check('authority_result_preserved', marker.authorityDigest === authorityDigest);
      check('failure_result_preserved', marker.failureDigest === failureDigest);
    }
    const foreign = await http(`/api/pillow/chat-request/${encodeURIComponent(marker.requestId)}`, { cookie: admin.cookie });
    check('request_owner_isolation', foreign.status === 404);
    out.observations = sanitizedObservations({ deploymentId: env.RAILWAY_DEPLOYMENT_ID, serviceId: service, sourceCommit: commit, probeSha256: probeSha, founder, admin, workerFounder, workerAdmin, mission, native, authority, failed, authorityDigest, failureDigest, foreign, forbidden, birth, ready });
    if (phase === 'after') await attempt('brain_snapshot_integrity', async () => {
      const bytes = readBounded(env.DATABASE_PATH);
      const SQL = await req('sql.js')(); const db = new SQL.Database(bytes);
      try {
        const integrity = db.exec('PRAGMA integrity_check');
        check('brain_snapshot_integrity', integrity.length === 1 && integrity[0].values.length === 1 && integrity[0].values[0][0] === 'ok',
          { bytes: bytes.length, sha256: hash(bytes), scope: 'completed disk generation after orderly application redeploy' });
        const statement = db.prepare('SELECT id, role FROM users WHERE email IN (?, ?)');
        const roles = {};
        try { statement.bind([env.FOUNDER_EMAIL, env.ADMIN_EMAIL]); while (statement.step()) { const row = statement.getAsObject(); (roles[row.role] ||= []).push(row.id); } }
        finally { statement.free(); }
        check('brain_accounts_persisted', accountRowsPass(roles, marker.databaseAccountIds));
      } finally { db.close(); }
    });
    for (const [role, account] of [['founder', workerFounder], ['admin', workerAdmin]]) {
      const result = await workerHttp('/auth/logout', { method: 'POST', cookie: account.cookie });
      check(`worker_${role}_logout`, result.status === 200);
    }
    const logout = await http('/auth/logout', { method: 'POST', cookie: admin.cookie });
    check('admin_logout', logout.status === 200);
    if (phase === 'before') {
      // Preserve failures too. A failed before phase is evidence, never eligible for a passing after phase.
      marker.beforePassed = summarize('before', [...out.checks, { name: 'marker_saved', pass: true }]).passed;
      saveMarker(markerPath, marker); check('marker_saved', true);
    }
  } catch {
    check('probe_prerequisite_or_operation', false, { failure: 'STOPPED_WITHOUT_SECRET_OUTPUT' });
    // Preserve partial fixture IDs and nonce after an interruption; never erase a prior failed marker.
    if (out.phase === 'before' && marker && markerPath && !fs.existsSync(markerPath)) {
      try { marker.beforePassed = false; saveMarker(markerPath, marker); check('marker_saved', true, { partialFailure: true }); }
      catch { check('marker_saved', false, { failure: 'PARTIAL_MARKER_SAVE_FAILED' }); }
    }
  }
  if (marker && out.observations) out.restartMarker = Object.fromEntries(['schema','service','commit','probeSha','expiresAt','beforeDeploymentId','beforeLaunchId','nonce','accountIds','databaseAccountIds','missionName','missionId','missionDigest','requestId','failedRequestId','authorityDigest','failureDigest','beforePassed'].filter(k => Object.prototype.hasOwnProperty.call(marker,k)).map(k => [k, k === 'accountIds' || k === 'databaseAccountIds' ? Object.fromEntries(['founder','admin'].map(role => [role, typeof marker[k]?.[role] === 'string' && /^[A-Za-z0-9_.:-]{1,160}$/.test(marker[k][role]) ? marker[k][role] : null])) : k === 'beforePassed' ? marker[k] === true : typeof marker[k] === 'string' && /^[A-Za-z0-9_.:-]{1,200}$/.test(marker[k]) ? marker[k] : null]));
  if (out.restartMarker && out.phase === "before") out.restartMarker.nativeBefore = out.observations.native;
  Object.assign(out, summarize(out.phase, out.checks), { finishedAt: new Date().toISOString(),
    birthCertificationGranted: false, commerceAuthorized: false, productionReadiness: 'NOT_PROVEN',
    additionalRequiredProof: { abruptKillRecovery: 'NOT_PROVEN', redisRestartRecovery: 'NOT_PROVEN',
      volumeRestore: 'NOT_PROVEN', v53BirthCertification: 'NOT_PROVEN', realProviderLifecycle: 'NOT_PROVEN',
      absentHandlerAndDependencyExecution: 'NOT_PROVEN' } });
  return out;
}
module.exports = { sanitizedObservations, REQUIRED, summarize, validateArguments, readinessPass, birthPass, authorityPass, failurePass,
  accountRowsPass, unchangedMission, nativeHistory, preservesHistory, boundedHttp, readBounded, saveMarker };
if (require.main === module) main().then(out => { console.log(JSON.stringify(out, null, 2)); process.exitCode = out.passed ? 0 : 1; });

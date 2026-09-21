#!/usr/bin/env node
'use strict';

// Temporary engineering service only. This is not a commerce or Birth gate.
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const EXPECTED_NODE = '22.23.2';

function assertRuntimeVersion(version) {
  if (version !== EXPECTED_NODE) throw new Error('Canary requires the exact reviewed Node runtime');
}

const ACK = 'DISPOSABLE_NON_COMMERCE_TEST_ONLY';
const MAX_DURATION_MS = 60 * 60 * 1000;
const GRACE_MS = 20_000;
const AUTH_KEYS = new Set(['FOUNDER_PASSWORD', 'ADMIN_PASSWORD', 'SESSION_SECRET']);
const PASSTHROUGH = [
  'PATH', 'HOME', 'TMPDIR', 'LANG', 'TZ', 'HOSTNAME', 'PORT',
  'REDIS_URL', 'DATABASE_PATH', 'FOUNDER_EMAIL', 'FOUNDER_PASSWORD',
  'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'SESSION_SECRET', 'CORS_ORIGIN',
  'EMPIRE_CANARY_EXPIRES_AT', 'EMPIRE_CANARY_ACK', 'EMPIRE_CANARY_REDIS_HOST',
  'RAILWAY_SERVICE_ID', 'RAILWAY_SERVICE_NAME', 'RAILWAY_PROJECT_ID',
  'RAILWAY_ENVIRONMENT', 'RAILWAY_ENVIRONMENT_NAME', 'RAILWAY_ENVIRONMENT_ID',
  'RAILWAY_DEPLOYMENT_ID', 'RAILWAY_REPLICA_ID', 'RAILWAY_GIT_COMMIT_SHA',
];

function validateCanaryEnvironment(input, now = Date.now()) {
  if (input.EMPIRE_ENGINEERING_TEST_MODE !== 'true' || input.EMPIRE_CANARY_ACK !== ACK) {
    throw new Error('Canary requires explicit disposable engineering-test acknowledgement');
  }
  const expiry = input.EMPIRE_CANARY_EXPIRES_AT;
  // An absolute timestamp is deliberately reused by all starts and redeploys.
  if (!expiry || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(expiry)) {
    throw new Error('Canary expiry must be an absolute UTC ISO timestamp');
  }
  const expiresAt = Date.parse(expiry);
  if (!Number.isFinite(expiresAt) || expiresAt <= now || expiresAt - now > MAX_DURATION_MS) {
    throw new Error('Canary expiry must be future and no more than 60 minutes away');
  }
  const databasePath = input.DATABASE_PATH;
  if (!databasePath || !/^\/data\/canary\/[A-Za-z0-9_-]+\.(?:sqlite|db)$/.test(databasePath)) {
    throw new Error('Canary requires a disposable database directly under /data/canary');
  }
  for (const [key, value] of Object.entries(input)) {
    if (!value || AUTH_KEYS.has(key)) continue;
    if (/(?:PASSWORD|SECRET|TOKEN|API_KEY|ACCESS_KEY|PRIVATE_KEY|CREDENTIAL)/i.test(key)) {
      throw new Error('Provider, supplier or account credentials are not allowed in this canary');
    }
  }
  const expectedHost = input.EMPIRE_CANARY_REDIS_HOST;
  if (!expectedHost || !/^[a-z0-9][a-z0-9-]*\.railway\.internal$/.test(expectedHost)) {
    throw new Error('Canary requires an explicitly identified separate private Redis service');
  }
  let redis;
  try { redis = new URL(input.REDIS_URL); } catch { throw new Error('Canary Redis URL is invalid'); }
  if (!['redis:', 'rediss:'].includes(redis.protocol) || redis.hostname !== expectedHost || !redis.password ||
      redis.search || redis.hash || (redis.pathname && redis.pathname !== '/' && redis.pathname !== '/0')) {
    throw new Error('Canary Redis must match its disposable private service with authentication');
  }
  for (const role of ['FOUNDER', 'ADMIN']) {
    if (!/^[^@\s]+@[^@\s]+\.invalid$/.test(input[`${role}_EMAIL`] || '')) {
      throw new Error('Canary accounts must use separate .invalid test email addresses');
    }
    if ((input[`${role}_PASSWORD`] || '').length < 24) {
      throw new Error('Canary accounts require generated test passwords of at least 24 characters');
    }
  }
  if (input.FOUNDER_EMAIL === input.ADMIN_EMAIL || input.FOUNDER_PASSWORD === input.ADMIN_PASSWORD ||
      (input.SESSION_SECRET || '').length < 32 ||
      [input.FOUNDER_PASSWORD, input.ADMIN_PASSWORD].includes(input.SESSION_SECRET)) {
    throw new Error('Canary accounts and session secret must be distinct and independently generated');
  }
  const env = Object.fromEntries(PASSTHROUGH.filter(key => input[key] !== undefined).map(key => [key, input[key]]));
  Object.assign(env, {
    NODE_ENV: 'production', NODE_OPTIONS: '--max-old-space-size=2048',
    EMPIRE_ENGINEERING_TEST_MODE: 'true', EMPIRE_TIER0_ISOLATION: 'true',
    // Leave five seconds for process-group cleanup inside the launcher grace.
    EMPIRE_SHUTDOWN_TIMEOUT_MS: '15000',
    EMPIRE_ENABLE_EXTENSION_ROUTES: 'false', EMPIRE_REQUIRE_DATA_VOLUME: 'true',
    EMPIRE_PERSISTENCE_GATE: 'strict', EMPIREAI_REPO_ROOT: path.resolve(__dirname, '..'),
    REDIS_OPTIONAL: 'false', WORKER_CONCURRENCY: '1', HOST: '0.0.0.0',
    LIVE_PAYMENT_ENABLED: 'false', LIVE_CJ_FULFILLMENT_ENABLED: 'false',
    META_ADS_LAUNCH_ENABLED: 'false', PRODUCTION_DEPLOYMENT_ENABLED: 'false',
    LIVE_OPS_PRODUCTION_NOT_ELIGIBLE: 'true', COMMERCE_READINESS_BLOCKED: 'true',
  });
  return { expiresAt, env };
}

function prepareFilesystem(cwd, databasePath) {
  // dotenv's default load must not reintroduce credentials stripped above.
  if (fs.existsSync(path.join(cwd, '.env'))) throw new Error('Canary refuses a repository .env file');
  for (const component of ['/data', '/data/canary', databasePath]) {
    try {
      if (fs.lstatSync(component).isSymbolicLink()) throw new Error('Canary database path must not contain symlinks');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  fs.mkdirSync(path.dirname(databasePath), { recursive: true, mode: 0o700 });
}

function runBounded({ command, args, env, cwd, expiresAt, graceMs = GRACE_MS, stdio = 'inherit', onSpawn }) {
  if (process.platform === 'win32') return Promise.reject(new Error('Canary process-group supervision requires POSIX'));
  if (expiresAt <= Date.now()) return Promise.reject(new Error('Canary expiry has elapsed before spawn'));
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, cwd, stdio, detached: true });
    let stopping = false;
    let finished = false;
    let childExited = false;
    let childCode = null;
    let childSignal = null;
    let stopReason = 'child_exit';
    let graceTimer;
    const signalGroup = signal => {
      if (!child.pid) return false;
      try { process.kill(-child.pid, signal); return true; }
      catch (error) { if (error.code !== 'ESRCH') throw error; return false; }
    };
    const cleanup = () => {
      clearTimeout(deadlineTimer); clearTimeout(graceTimer);
      process.removeListener('SIGTERM', term); process.removeListener('SIGINT', term);
    };
    const finish = () => {
      if (finished) return;
      finished = true;
      // A parent exiting must not orphan a worker or its descendants.
      const forcedTermination = signalGroup('SIGKILL');
      cleanup();
      const receipt = () => resolve({ code: childCode, signal: childSignal,
        reason: stopReason, forcedTermination, forcedSignal: forcedTermination ? 'SIGKILL' : null });
      if (childExited) receipt();
      else {
        // The kill is issued by the deadline. Briefly collect its actual exit
        // receipt; an unknown exit remains a failure, never an inferred success.
        const receiptTimer = setTimeout(receipt, 100);
        child.once('exit', () => { clearTimeout(receiptTimer); receipt(); });
      }
    };
    const stop = reason => {
      if (stopping) return;
      stopping = true;
      stopReason = reason;
      // Let the primary finish its worker and database shutdown first.
      try { child.kill('SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
      const remainingGrace = Math.max(0, Math.min(graceMs, expiresAt - Date.now()));
      graceTimer = setTimeout(finish, remainingGrace);
    };
    const term = () => stop('signal');
    process.on('SIGTERM', term); process.on('SIGINT', term);
    // Reserve grace inside the absolute time bound, not after it.
    const deadlineTimer = setTimeout(() => stop('expired'), Math.max(0, expiresAt - Date.now() - graceMs));
    child.once('error', error => { if (!finished) { finished = true; cleanup(); reject(error); } });
    child.once('exit', (code, signal) => {
      childExited = true;
      childCode = code;
      childSignal = signal;
      // Primary has finished its orderly close; terminate any stray descendants.
      signalGroup('SIGTERM');
      if (!stopping) stop('child_exit');
      // Keep the grace timer alive to guarantee final process-group cleanup.
    });
    if (onSpawn) {
      try { onSpawn(child); }
      catch (error) {
        signalGroup('SIGKILL'); finished = true; cleanup(); reject(error);
      }
    }
  });
}

function canaryExitCode(result) {
  if (result.forcedTermination || result.signal || result.code === null) return 1;
  return result.code === 0 ? 0 : result.code;
}

async function main() {
  // This always reads the actual running binary, never an environment override or test argument.
  assertRuntimeVersion(process.versions.node);
  const cwd = path.resolve(__dirname, '..');
  const { env, expiresAt } = validateCanaryEnvironment(process.env);
  prepareFilesystem(cwd, env.DATABASE_PATH);
  const identity = { schema: 'canary-launch-v1', launchId: crypto.randomUUID(),
    nodeVersion: process.versions.node, execPath: fs.realpathSync(process.execPath), launcherPid: process.pid,
    launcherSha256: crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),
    serviceId: env.RAILWAY_SERVICE_ID, deploymentId: env.RAILWAY_DEPLOYMENT_ID,
    gitCommitSha: env.RAILWAY_GIT_COMMIT_SHA, expiresAt: new Date(expiresAt).toISOString() };
  console.log(JSON.stringify({ event: 'bounded_canary_start', ...identity,
    scope: 'engineering_test_only', commerce: 'LOCKED' }));
  const result = await runBounded({ command: process.execPath, args: ['backend/dist/index.js'], env, cwd, expiresAt,
    onSpawn: child => {
      const target = `${env.DATABASE_PATH}.launch.json`;
      const tmp = `${target}.${identity.launchId}.tmp`;
      const fd = fs.openSync(tmp, 'wx', 0o600);
      try { fs.writeFileSync(fd, JSON.stringify({ ...identity, childPid: child.pid })); fs.fsyncSync(fd); }
      finally { fs.closeSync(fd); }
      fs.renameSync(tmp, target);
      const dir = fs.openSync(path.dirname(target), 'r');
      try { fs.fsyncSync(dir); } finally { fs.closeSync(dir); }
    },
  });
  console.log(JSON.stringify({ event: 'bounded_canary_stopped', reason: result.reason,
    childExitCode: result.code, childSignal: result.signal,
    forcedTermination: result.forcedTermination, forcedSignal: result.forcedSignal }));
  process.exitCode = canaryExitCode(result);
}

module.exports = { EXPECTED_NODE, assertRuntimeVersion, ACK, MAX_DURATION_MS, validateCanaryEnvironment, prepareFilesystem, runBounded, canaryExitCode };
if (require.main === module) main().catch(() => {
  // Configuration errors deliberately never print values, URLs or credentials.
  console.error('Bounded canary refused to start or supervision failed; inspect the non-secret configuration contract.');
  process.exitCode = 1;
});

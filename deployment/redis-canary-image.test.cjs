#!/usr/bin/env node
'use strict';
// Mandatory Linux CI integration: Docker-only resources, no Railway/API credentials.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const image = process.argv[2];
assert.equal(process.platform, 'linux', 'This image proof requires Linux; do not skip it');
assert.match(image || '', /^empireai-redis-expiry:[a-z0-9-]+$/);
const suffix = crypto.randomUUID();
const prefix = `pillow-redis-expiry-ci-${suffix}`;
const volume = `${prefix}-data`, names = [`${prefix}-initial`, `${prefix}-renewal`, `${prefix}-restart`];
const password = crypto.randomBytes(32).toString('hex');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'redis-image-test-'));
const records = [];
let cleanupFailed = false, volumeCreated = false;
function docker(args, { timeout = 10000, allowFailure = false, authenticated = false } = {}) {
  const result = spawnSync('docker', args, { encoding: 'utf8', timeout, maxBuffer: 2 * 1024 * 1024,
    env: authenticated ? { ...process.env, REDISCLI_AUTH: password } : process.env, windowsHide: true });
  if (!allowFailure && (result.error || result.status !== 0)) throw Error('DOCKER_OPERATION_FAILED');
  return { ok: !result.error && result.status === 0, output: result.stdout || '', error: result.stderr || '' };
}
function inspect(name) { return JSON.parse(docker(['inspect', '--format', '{{json .State}}', name]).output); }
async function waitFor(condition, deadline, code) {
  while (Date.now() < deadline) { if (condition()) return; await new Promise(resolve => setTimeout(resolve, 250)); }
  throw Error(code);
}
function cli(name, args, authenticated = true) {
  return docker(['exec', ...(authenticated ? ['--env', 'REDISCLI_AUTH'] : []), name, 'redis-cli', '--raw', ...args], { allowFailure: true, authenticated });
}
function writeEnvironment(filename, entries) {
  fs.writeFileSync(filename, Object.entries(entries).map(([k, v]) => `${k}=${v}`).join('\n') + '\n', { flag: 'wx', mode: 0o600 });
}
function lifecycle(name) {
  const result = docker(['logs', name]);
  const text = result.output + result.error;
  assert.equal(text.includes(password), false, 'Disposable credential leaked into container logs');
  return text.split('\n').flatMap(line => { try { const value = JSON.parse(line); return /^bounded_redis_/.test(value.event || '') ? [value] : []; } catch { return []; } });
}
async function run() {
  try {
    docker(['version', '--format', '{{.Server.Version}}']);
    const source = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
    assert.equal(source.status, 0); const sourceCommit = source.stdout.trim(); assert.match(sourceCommit, /^[a-f0-9]{40}$/);
    const projectId = crypto.randomUUID(), environmentId = crypto.randomUUID(), serviceId = crypto.randomUUID();
    // All three starts reuse this one deadline. Renewal attempt must fail.
    const expiresAt = new Date(Date.now() + 65000).toISOString();
    const common = { EMPIRE_ENGINEERING_TEST_MODE: 'true', EMPIRE_CANARY_ACK: 'DISPOSABLE_NON_COMMERCE_TEST_ONLY',
      EMPIRE_CANARY_EXPIRES_AT: expiresAt, REDIS_PASSWORD: password,
      RAILWAY_PROJECT_ID: projectId, EMPIRE_CANARY_PROJECT_ID: projectId,
      RAILWAY_ENVIRONMENT_ID: environmentId, EMPIRE_CANARY_ENVIRONMENT_ID: environmentId,
      RAILWAY_SERVICE_ID: serviceId, EMPIRE_CANARY_REDIS_SERVICE_ID: serviceId,
      RAILWAY_ENVIRONMENT_NAME: 'production', RAILWAY_GIT_COMMIT_SHA: sourceCommit };
    // A timeout can still leave a created resource; cleanup owns the name first.
    volumeCreated = true; docker(['volume', 'create', '--label', `empireai.expiry-test=${suffix}`, volume]);
    const start = (name, extra = {}) => {
      const filename = path.join(directory, `${name}.env`);
      writeEnvironment(filename, { ...common, RAILWAY_DEPLOYMENT_ID: crypto.randomUUID(), ...extra });
      docker(['run', '--detach', '--restart=no', '--network=none', '--memory=512m', '--cpus=1',
        '--name', name, '--label', `empireai.expiry-test=${suffix}`, '--env-file', filename,
        '--mount', `type=volume,source=${volume},target=/data`, image]);
      assert.equal(docker(['inspect', '--format', '{{.HostConfig.RestartPolicy.Name}}', name]).output.trim(), 'no');
    };
    start(names[0]);
    await waitFor(() => cli(names[0], ['PING']).output.trim() === 'PONG', Date.now() + 10000, 'REDIS_INITIAL_READY_TIMEOUT');
    assert.match(cli(names[0], ['PING'], false).output, /NOAUTH/);
    for (const [key, expected] of [['appendonly', 'yes'], ['appendfsync', 'always'], ['maxmemory', '268435456'], ['maxmemory-policy', 'noeviction']]) {
      assert.equal(cli(names[0], ['CONFIG', 'GET', key]).output.trim(), `${key}\n${expected}`);
    }
    const value = crypto.randomUUID(); assert.equal(cli(names[0], ['SET', 'expiry-fixture', value]).output.trim(), 'OK');
    docker(['stop', '--time', '25', names[0]], { timeout: 28000 });
    const stopped = inspect(names[0]); assert.equal(stopped.Running, false); assert.equal(stopped.ExitCode, 0);
    const firstLog = lifecycle(names[0]);
    assert.ok(firstLog.some(r => r.event === 'bounded_redis_start'));
    assert.ok(firstLog.some(r => r.event === 'bounded_redis_stopped' && r.reason === 'signal' && r.forcedTermination === false && r.childExitCode === 0));
    records.push({ case: 'authenticated_aof_and_external_sigterm', passed: true, exitCode: stopped.ExitCode, lifecycle: firstLog });

    start(names[1], { EMPIRE_CANARY_EXPIRES_AT: new Date(Date.parse(expiresAt) + 5000).toISOString() });
    await waitFor(() => !inspect(names[1]).Running, Date.now() + 5000, 'RENEWAL_REFUSAL_TIMEOUT');
    const renewal = inspect(names[1]); assert.notEqual(renewal.ExitCode, 0);
    const refusedLog = lifecycle(names[1]);
    assert.ok(refusedLog.some(r => r.event === 'bounded_redis_refused'));
    assert.equal(refusedLog.some(r => r.event === 'bounded_redis_start'), false);
    records.push({ case: 'persisted_expiry_renewal_refused', passed: true, exitCode: renewal.ExitCode });

    start(names[2]);
    await waitFor(() => cli(names[2], ['PING']).output.trim() === 'PONG', Date.now() + 10000, 'REDIS_RESTART_READY_TIMEOUT');
    assert.equal(cli(names[2], ['GET', 'expiry-fixture']).output.trim(), value);
    records.push({ case: 'real_aof_reopen_same_scope_same_expiry', passed: true });
    await waitFor(() => !inspect(names[2]).Running, Date.parse(expiresAt) + 5000, 'ABSOLUTE_EXPIRY_MISSED');
    const expired = inspect(names[2]);
    assert.equal(expired.ExitCode, 0); assert.ok(Date.parse(expired.FinishedAt) <= Date.parse(expiresAt), 'Supervisor exited after the fixed expiry');
    assert.equal(docker(['inspect', '--format', '{{.RestartCount}}', names[2]]).output.trim(), '0');
    const lastLog = lifecycle(names[2]);
    assert.ok(lastLog.some(r => r.event === 'bounded_redis_stopped' && r.reason === 'expired' && r.forcedTermination === false && r.childExitCode === 0 && r.expiresAt === expiresAt));
    records.push({ case: 'absolute_expiry_stops_real_redis_and_supervisor', passed: true, finishedAt: expired.FinishedAt, expiresAt, lifecycle: lastLog });
  } finally {
    for (const name of names) {
      const check = docker(['container', 'inspect', name], { allowFailure: true });
      if (check.ok) {
        if (!docker(['rm', '--force', '--volumes', name], { allowFailure: true }).ok) cleanupFailed = true;
        const after = docker(['container', 'inspect', name], { allowFailure: true });
        if (after.ok || !/No such (?:object|container)/i.test(after.error)) cleanupFailed = true;
      } else if (!/No such (?:object|container)/i.test(check.error)) cleanupFailed = true;
    }
    if (volumeCreated) {
      const removal = docker(['volume', 'rm', volume], { allowFailure: true });
      if (!removal.ok && !/No such volume/i.test(removal.error)) cleanupFailed = true;
      const after = docker(['volume', 'inspect', volume], { allowFailure: true });
      if (after.ok || !/No such volume/i.test(after.error)) cleanupFailed = true;
    }
    try {
      assert.ok(path.resolve(directory).startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(directory).startsWith('redis-image-test-'));
      fs.rmSync(directory, { recursive: true, force: true });
      if (fs.existsSync(directory)) cleanupFailed = true;
    } catch { cleanupFailed = true; }
  }
  assert.equal(cleanupFailed, false, 'Temporary Docker resources were not cleaned');
  assert.equal(records.length, 4); assert.ok(records.every(r => r.passed === true));
  console.log(JSON.stringify({ schema: 'redis-expiry-image-proof-v1', passed: true, checks: records, cleanupComplete: true,
    scope: 'ephemeral Linux CI Docker only', hostedProviderProof: false, powerLossRecoveryProven: false }, null, 2));
}
run().catch(error => {
  // Preserve failures without echoing Docker command arguments or test credentials.
  console.log(JSON.stringify({ schema: 'redis-expiry-image-proof-v1', passed: false, completedChecks: records,
    failure: /^[A-Z_]+$/.test(error.message) ? error.message : 'IMAGE_ASSERTION_FAILED', cleanupComplete: !cleanupFailed }));
  process.exitCode = 1;
});

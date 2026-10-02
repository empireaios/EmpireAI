#!/usr/bin/env node
'use strict';
// Disposable Redis only. Expiry stops compute; it does not delete billable volumes.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { assertRuntimeVersion, runBounded, canaryExitCode } = require('./canary-launcher.cjs');
const MAX_DURATION_MS = 3600000;
const GRACE_MS = 20000;
const DATA = '/data/canary-redis';
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;
const PRODUCTION = new Set(['75374474-2b3a-4b0f-a9bc-203cdc1314d8', 'da94aed2-956b-4903-a886-68a5e9a557c8', 'c3c89cbb-3e10-414a-98a2-f9ec4f1f840e']);
const demand = (ok, code) => { if (!ok) throw new Error(code); };

function validateRedisCanaryEnvironment(input, now = Date.now()) {
  demand(input.EMPIRE_ENGINEERING_TEST_MODE === 'true' && input.EMPIRE_CANARY_ACK === 'DISPOSABLE_NON_COMMERCE_TEST_ONLY', 'EXPLICIT_TEST_SCOPE_REQUIRED');
  const scope = {};
  for (const [key, confirmation] of [['RAILWAY_PROJECT_ID', 'EMPIRE_CANARY_PROJECT_ID'], ['RAILWAY_ENVIRONMENT_ID', 'EMPIRE_CANARY_ENVIRONMENT_ID'], ['RAILWAY_SERVICE_ID', 'EMPIRE_CANARY_REDIS_SERVICE_ID']]) {
    demand(UUID.test(input[key] || '') && input[key] === input[confirmation] && !PRODUCTION.has(input[key]), 'ISOLATED_SCOPE_MISMATCH');
    scope[key] = input[key];
  }
  // Railway's default label can be "production" inside a wholly isolated project.
  // Exact confirmed IDs above carry scope authority; the display label does not.
  demand(typeof input.RAILWAY_ENVIRONMENT_NAME === 'string' && input.RAILWAY_ENVIRONMENT_NAME.length > 0, 'ENVIRONMENT_LABEL_REQUIRED');
  demand(UUID.test(input.RAILWAY_DEPLOYMENT_ID || '') && /^[a-f0-9]{40}$/.test(input.RAILWAY_GIT_COMMIT_SHA || ''), 'DEPLOYMENT_IDENTITY_REQUIRED');
  const expiry = input.EMPIRE_CANARY_EXPIRES_AT;
  demand(typeof expiry === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(expiry), 'ABSOLUTE_EXPIRY_REQUIRED');
  const expiresAt = Date.parse(expiry);
  demand(Number.isFinite(expiresAt) && new Date(expiresAt).toISOString() === expiry && expiresAt - now > GRACE_MS && expiresAt - now <= MAX_DURATION_MS, 'EXPIRY_OUTSIDE_BOUND');
  demand(typeof input.REDIS_PASSWORD === 'string' && /^[a-f0-9]{48,128}$/.test(input.REDIS_PASSWORD), 'GENERATED_TEST_PASSWORD_REQUIRED');
  for (const [key, value] of Object.entries(input)) {
    if (value && key !== 'REDIS_PASSWORD' && /PASSWORD|SECRET|TOKEN|API_KEY|ACCESS_KEY|PRIVATE_KEY|CREDENTIAL/i.test(key)) throw new Error('UNRELATED_CREDENTIAL_REFUSED');
  }
  return { expiresAt, password: input.REDIS_PASSWORD,
    binding: { schema: 'bounded-redis-expiry-v1', projectId: scope.RAILWAY_PROJECT_ID, environmentId: scope.RAILWAY_ENVIRONMENT_ID,
      serviceId: scope.RAILWAY_SERVICE_ID, sourceCommit: input.RAILWAY_GIT_COMMIT_SHA, expiresAt: expiry },
    deploymentId: input.RAILWAY_DEPLOYMENT_ID,
    childEnv: Object.fromEntries(['PATH', 'HOME', 'LANG', 'TZ'].filter(k => input[k] !== undefined).map(k => [k, input[k]])),
  };
}
function ensurePrivateDirectory(directory) {
  demand(path.isAbsolute(directory), 'ABSOLUTE_DIRECTORY_REQUIRED');
  let current = path.parse(directory).root;
  for (const part of path.relative(current, directory).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try { const s = fs.lstatSync(current); demand(s.isDirectory() && !s.isSymbolicLink(), 'UNSAFE_DIRECTORY'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; fs.mkdirSync(current, { mode: 0o700 }); }
  }
}
function syncDirectory(directory) {
  if (process.platform === 'win32') return; // Linux image performs this; Windows checks are not a power-loss proof.
  const fd = fs.openSync(directory, 'r'); try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}
function readPrivateRegular(filename) {
  const before = fs.lstatSync(filename);
  demand(before.isFile() && !before.isSymbolicLink() && before.nlink === 1 && before.size <= 16384, 'UNSAFE_SCOPE_FILE');
  const fd = fs.openSync(filename, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const opened = fs.fstatSync(fd);
    demand(opened.ino === before.ino && opened.dev === before.dev && opened.isFile() && opened.size <= 16384, 'SCOPE_FILE_CHANGED');
    return fs.readFileSync(fd, 'utf8');
  } finally { fs.closeSync(fd); }
}
function bindExpiry(directory, binding) {
  ensurePrivateDirectory(directory);
  const target = path.join(directory, 'expiry-scope.json');
  const serialized = JSON.stringify(binding);
  try {
    const fd = fs.openSync(target, 'wx', 0o600);
    try { fs.writeFileSync(fd, serialized); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    syncDirectory(directory);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    demand(readPrivateRegular(target) === serialized, 'EXPIRY_OR_SCOPE_RENEWAL_REFUSED');
  }
  return target;
}
function redisConfiguration(password) {
  demand(typeof password === 'string' && /^[a-f0-9]{48,128}$/.test(password), 'GENERATED_TEST_PASSWORD_REQUIRED');
  return ['bind 0.0.0.0 ::', 'port 6379', 'protected-mode yes', 'daemonize no', 'supervised no',
    'dir /data/canary-redis', 'appendonly yes', 'appendfsync always', 'no-appendfsync-on-rewrite no',
    'maxmemory 268435456', 'maxmemory-policy noeviction', 'save ""', `requirepass ${password}`, ''].join('\n');
}
function writePrivateConfiguration(directory, contents) {
  const filename = path.join(directory, 'redis-canary.conf');
  // Existing configuration is never followed or overwritten in place.
  try { readPrivateRegular(filename); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const temporary = path.join(directory, `.config-${crypto.randomUUID()}.tmp`);
  const fd = fs.openSync(temporary, 'wx', 0o600);
  try { fs.writeFileSync(fd, contents); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  fs.renameSync(temporary, filename); syncDirectory(directory); return filename;
}
function redisLaunchOptions(config, configPath) {
  demand(configPath === '/data/canary-redis/redis-canary.conf', 'FIXED_REDIS_CONFIG_REQUIRED');
  return { command: '/usr/local/bin/docker-entrypoint.sh', args: ['redis-server', configPath],
    env: config.childEnv, cwd: DATA, expiresAt: config.expiresAt, graceMs: GRACE_MS };
}
async function main() {
  assertRuntimeVersion(process.versions.node);
  demand(process.platform === 'linux' && process.argv.length === 2, 'LINUX_FIXED_ENTRYPOINT_REQUIRED');
  const config = validateRedisCanaryEnvironment(process.env);
  // The marker binds every subsequent start to the original service/source/expiry.
  bindExpiry(DATA, config.binding);
  const configPath = writePrivateConfiguration(DATA, redisConfiguration(config.password));
  const identity = { ...config.binding, deploymentId: config.deploymentId,
    launcherSha256: crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex') };
  console.log(JSON.stringify({ event: 'bounded_redis_start', message: 'bounded_redis_start', ...identity }));
  const result = await runBounded(redisLaunchOptions(config, configPath));
  console.log(JSON.stringify({ event: 'bounded_redis_stopped', message: 'bounded_redis_stopped', ...identity,
    reason: result.reason, childExitCode: result.code, childSignal: result.signal,
    forcedTermination: result.forcedTermination, forcedSignal: result.forcedSignal,
    redisAofRecoveryProven: false, providerCleanupRequired: true }));
  process.exitCode = canaryExitCode(result);
}
module.exports = { MAX_DURATION_MS, GRACE_MS, validateRedisCanaryEnvironment, bindExpiry, redisConfiguration, redisLaunchOptions, writePrivateConfiguration };
if (require.main === module) main().catch(() => {
  console.error(JSON.stringify({ event: 'bounded_redis_refused', message: 'Bounded Redis refused or supervision failed; no configuration values logged.' }));
  process.exitCode = 1;
});

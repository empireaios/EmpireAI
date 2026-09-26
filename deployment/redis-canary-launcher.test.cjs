'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { validateRedisCanaryEnvironment, bindExpiry, redisConfiguration, redisLaunchOptions, writePrivateConfiguration, GRACE_MS } = require('./redis-canary-launcher.cjs');
const { runBounded, canaryExitCode } = require('./canary-launcher.cjs');
function environment(now = Date.now()) {
  const project = crypto.randomUUID(), service = crypto.randomUUID(), environment = crypto.randomUUID();
  return { EMPIRE_ENGINEERING_TEST_MODE: 'true', EMPIRE_CANARY_ACK: 'DISPOSABLE_NON_COMMERCE_TEST_ONLY',
    EMPIRE_CANARY_EXPIRES_AT: new Date(now + 60000).toISOString(), REDIS_PASSWORD: crypto.randomBytes(32).toString('hex'),
    RAILWAY_PROJECT_ID: project, EMPIRE_CANARY_PROJECT_ID: project,
    RAILWAY_SERVICE_ID: service, EMPIRE_CANARY_REDIS_SERVICE_ID: service,
    RAILWAY_ENVIRONMENT_ID: environment, EMPIRE_CANARY_ENVIRONMENT_ID: environment,
    RAILWAY_ENVIRONMENT_NAME: 'engineering', RAILWAY_DEPLOYMENT_ID: crypto.randomUUID(), RAILWAY_GIT_COMMIT_SHA: 'a'.repeat(40),
    PATH: process.env.PATH, SOME_INHERITED_SETTING: 'not-forwarded' };
}
function directory(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'redis-expiry-test-'));
  t.after(() => {
    assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(dir).startsWith('redis-expiry-test-'));
    fs.rmSync(dir, { recursive: true, force: true });
  }); return dir;
}
test('Redis requires fixed UTC expiry within one hour and reserves shutdown grace inside it', () => {
  const now = Date.now(), env = environment(now);
  const checked = validateRedisCanaryEnvironment(env, now);
  assert.equal(checked.expiresAt, Date.parse(env.EMPIRE_CANARY_EXPIRES_AT));
  assert.equal(validateRedisCanaryEnvironment(env, now + 1000).expiresAt, checked.expiresAt);
  for (const expiry of [undefined, '60m', new Date(now - 1).toISOString(), new Date(now + GRACE_MS).toISOString(), new Date(now + 3600001).toISOString(), '2026-02-30T00:00:00.000Z']) {
    assert.throws(() => validateRedisCanaryEnvironment({ ...env, EMPIRE_CANARY_EXPIRES_AT: expiry }, now));
  }
});
test('production, ambiguous identity, unrelated credentials and unsafe password are refused without printing values', () => {
  const env = environment();
  const mutations = [{ EMPIRE_ENGINEERING_TEST_MODE: 'false' }, { EMPIRE_CANARY_ACK: '' }, { RAILWAY_ENVIRONMENT_NAME: '' },
    { RAILWAY_SERVICE_ID: crypto.randomUUID() }, { RAILWAY_DEPLOYMENT_ID: '' }, { RAILWAY_GIT_COMMIT_SHA: 'main' },
    { RAILWAY_PROJECT_ID: '75374474-2b3a-4b0f-a9bc-203cdc1314d8', EMPIRE_CANARY_PROJECT_ID: '75374474-2b3a-4b0f-a9bc-203cdc1314d8' },
    { REDIS_PASSWORD: 'secret\ninclude evil.conf' }, { OPENAI_API_KEY: 'SECRET_SENTINEL' }];
  for (const patch of mutations) assert.throws(() => validateRedisCanaryEnvironment({ ...env, ...patch }), error => !error.message.includes('SECRET_SENTINEL') && !error.message.includes(env.REDIS_PASSWORD));
  const config = validateRedisCanaryEnvironment(env);
  assert.doesNotThrow(() => validateRedisCanaryEnvironment({ ...env, RAILWAY_ENVIRONMENT_NAME: 'production' }));
  assert.throws(() => validateRedisCanaryEnvironment({ ...env, RAILWAY_ENVIRONMENT_ID: 'da94aed2-956b-4903-a886-68a5e9a557c8', EMPIRE_CANARY_ENVIRONMENT_ID: 'da94aed2-956b-4903-a886-68a5e9a557c8' }), /ISOLATED_SCOPE/);
  assert.equal(config.childEnv.REDIS_PASSWORD, undefined);
  assert.equal(config.childEnv.SOME_INHERITED_SETTING, undefined);
});
test('persisted expiry/scope cannot be renewed or silently rebound on another deployment', t => {
  const dir = directory(t), env = environment(), config = validateRedisCanaryEnvironment(env);
  bindExpiry(dir, config.binding);
  assert.doesNotThrow(() => bindExpiry(dir, config.binding));
  const before = fs.readFileSync(path.join(dir, 'expiry-scope.json'));
  for (const patch of [{ expiresAt: new Date(config.expiresAt + 1000).toISOString() }, { serviceId: crypto.randomUUID() }, { sourceCommit: 'b'.repeat(40) }]) {
    assert.throws(() => bindExpiry(dir, { ...config.binding, ...patch }), /RENEWAL_REFUSED/);
    assert.deepEqual(fs.readFileSync(path.join(dir, 'expiry-scope.json')), before);
  }
});
test('private configuration contains fixed AOF/cap settings; child argv and env exclude the password', t => {
  const dir = directory(t), config = validateRedisCanaryEnvironment(environment());
  bindExpiry(dir, config.binding);
  const contents = redisConfiguration(config.password);
  const filename = writePrivateConfiguration(dir, contents);
  assert.equal(fs.readFileSync(filename, 'utf8'), contents);
  assert.match(contents, /^appendonly yes$/m); assert.match(contents, /^appendfsync always$/m);
  assert.match(contents, /^maxmemory 268435456$/m); assert.match(contents, /^maxmemory-policy noeviction$/m);
  const opts = redisLaunchOptions(config, '/data/canary-redis/redis-canary.conf');
  assert.equal(opts.command, '/usr/local/bin/docker-entrypoint.sh');
  assert.deepEqual(opts.args, ['redis-server', '/data/canary-redis/redis-canary.conf']);
  assert.equal(opts.expiresAt, config.expiresAt); assert.equal(opts.graceMs, GRACE_MS);
  assert.equal(JSON.stringify(opts).includes(config.password), false);
  assert.throws(() => redisLaunchOptions(config, '/data/production.conf'), /FIXED_REDIS_CONFIG/);
});
test('malformed or linked expiry files are retained and refused', t => {
  const dir = directory(t), config = validateRedisCanaryEnvironment(environment());
  const marker = path.join(dir, 'expiry-scope.json'); fs.writeFileSync(marker, 'invalid');
  assert.throws(() => bindExpiry(dir, config.binding), /RENEWAL_REFUSED/);
  assert.equal(fs.readFileSync(marker, 'utf8'), 'invalid');
  fs.unlinkSync(marker); const existing = path.join(dir, 'other'); fs.writeFileSync(existing, JSON.stringify(config.binding)); fs.linkSync(existing, marker);
  assert.throws(() => bindExpiry(dir, config.binding), /UNSAFE_SCOPE_FILE/);
  assert.equal(fs.readFileSync(existing, 'utf8'), JSON.stringify(config.binding));
});
test('image preserves Redis version, supplies Node libraries, validates binaries and disables provider restart', () => {
  const docker = fs.readFileSync(path.join(__dirname, 'redis-canary.Dockerfile'), 'utf8');
  assert.match(docker, /FROM redis:7\.2\.16-bookworm/); assert.match(docker, /FROM node:22\.23\.2-bookworm-slim/);
  assert.match(docker, /libstdc\+\+6 libatomic1/); assert.match(docker, /node -p process\.versions\.node/);
  assert.match(docker, /STOPSIGNAL SIGTERM/); assert.match(docker, /ENTRYPOINT.*redis-canary-launcher/);
  const railway = fs.readFileSync(path.join(__dirname, 'railway.redis-canary.toml'), 'utf8');
  assert.match(railway, /restartPolicyType = "NEVER"/); assert.doesNotMatch(railway, /^startCommand\s*=/m);
});
if (process.platform === 'win32') {
  test('Windows cannot silently substitute weaker process supervision', async () => {
    await assert.rejects(runBounded({ command: process.execPath, args: [], expiresAt: Date.now() + 1000 }), /POSIX/);
  });
} else {
  test('deadline terminates a real stubborn child and reports forced shutdown failure', async () => {
    let childPid;
    const expiry = Date.now() + 1200;
    const result = await runBounded({ command: process.execPath, args: ['-e', "process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"],
      expiresAt: expiry, graceMs: 200, stdio: 'ignore', onSpawn: child => { childPid = child.pid; } });
    assert.equal(result.reason, 'expired'); assert.equal(result.forcedTermination, true); assert.equal(canaryExitCode(result), 1);
    for (let i = 0; i < 20; i++) { try { process.kill(childPid, 0); } catch { break; } await new Promise(r => setTimeout(r, 10)); }
    assert.throws(() => process.kill(childPid, 0)); assert.ok(Date.now() < expiry + 500);
  });
  test('external TERM is forwarded and successful child shutdown remains distinguishable', async () => {
    const script = `const {runBounded,canaryExitCode}=require(${JSON.stringify(path.join(__dirname, 'canary-launcher.cjs'))});
runBounded({command:process.execPath,args:['-e',"process.on('SIGTERM',()=>process.exit(0));console.log('ready');setInterval(()=>{},1000)"],expiresAt:Date.now()+3000,graceMs:100}).then(r=>{console.log(JSON.stringify(r));process.exitCode=canaryExitCode(r)});`;
    const child = spawn(process.execPath, ['-e', script], { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '', sent = false; child.stdout.on('data', b => { output += b; if (!sent && output.includes('ready')) { sent = true; child.kill('SIGTERM'); } });
    const code = await new Promise((resolve, reject) => { child.once('exit', resolve); child.once('error', reject); });
    assert.equal(code, 0); assert.match(output, /"reason":"signal"/); assert.match(output, /"forcedTermination":false/);
  });
}

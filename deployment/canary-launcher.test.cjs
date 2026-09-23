'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { EXPECTED_NODE, assertRuntimeVersion, ACK, MAX_DURATION_MS, validateCanaryEnvironment, prepareFilesystem, runBounded, canaryExitCode } = require('./canary-launcher.cjs');

function configuration(now = Date.now()) {
  return {
    EMPIRE_ENGINEERING_TEST_MODE: 'true', EMPIRE_CANARY_ACK: ACK,
    EMPIRE_CANARY_EXPIRES_AT: new Date(now + 60_000).toISOString(),
    EMPIRE_CANARY_REDIS_HOST: 'engineering-redis.railway.internal',
    REDIS_URL: `redis://default:${crypto.randomBytes(24).toString('hex')}@engineering-redis.railway.internal:6379/0`,
    DATABASE_PATH: '/data/canary/disposable.sqlite',
    FOUNDER_EMAIL: 'founder@canary.invalid', ADMIN_EMAIL: 'admin@canary.invalid',
    FOUNDER_PASSWORD: crypto.randomBytes(24).toString('hex'),
    ADMIN_PASSWORD: crypto.randomBytes(24).toString('hex'),
    SESSION_SECRET: crypto.randomBytes(32).toString('hex'),
  };
}

test('bounded configuration preserves absolute expiry and strips inherited settings', () => {
  const now = Date.now();
  const input = { ...configuration(now), NODE_ENV: 'development', NODE_OPTIONS: '--inspect=0.0.0.0',
    EMPIRE_TIER0_ISOLATION: 'false', SOME_UNKNOWN_SETTING: 'not-inherited',
    LIVE_PAYMENT_ENABLED: 'true', EMPIRE_ENABLE_EXTENSION_ROUTES: 'true' };
  const first = validateCanaryEnvironment(input, now);
  const second = validateCanaryEnvironment(input, now + 1_000);
  assert.equal(first.expiresAt, second.expiresAt);
  assert.equal(first.env.NODE_ENV, 'production');
  assert.equal(first.env.NODE_OPTIONS, '--max-old-space-size=2048');
  assert.equal(first.env.EMPIRE_TIER0_ISOLATION, 'true');
  assert.equal(first.env.EMPIRE_SHUTDOWN_TIMEOUT_MS, '15000');
  assert.equal(first.env.LIVE_PAYMENT_ENABLED, 'false');
  assert.equal(first.env.EMPIRE_ENABLE_EXTENSION_ROUTES, 'false');
  assert.equal(first.env.SOME_UNKNOWN_SETTING, undefined);
});

test('expired, relative, missing and overlong deadlines cannot launch or renew on redeploy', () => {
  const now = Date.now();
  for (const value of [undefined, '60m', new Date(now).toISOString(), new Date(now - 1).toISOString(),
    new Date(now + MAX_DURATION_MS + 1).toISOString()]) {
    assert.throws(() => validateCanaryEnvironment({ ...configuration(now), EMPIRE_CANARY_EXPIRES_AT: value }, now));
  }
  const input = configuration(now);
  assert.throws(() => validateCanaryEnvironment(input, now + 61_000));
});

test('acknowledgement, private isolated data paths and Redis identity fail closed', () => {
  const input = configuration();
  const cases = [
    { EMPIRE_ENGINEERING_TEST_MODE: 'false' }, { EMPIRE_CANARY_ACK: '' },
    { DATABASE_PATH: '/data/empireai-brain.db' }, { DATABASE_PATH: '/data/canary/../empireai-brain.db' },
    { DATABASE_PATH: '/tmp/canary.sqlite' }, { DATABASE_PATH: '/data/canary/subdir/test.sqlite' },
    { EMPIRE_CANARY_REDIS_HOST: 'production.upstash.io' },
    { REDIS_URL: 'redis://default:ignored@other.railway.internal:6379' },
    { REDIS_URL: 'redis://engineering-redis.railway.internal:6379' },
    { REDIS_URL: `${input.REDIS_URL}?unexpected=true` },
  ];
  for (const change of cases) assert.throws(() => validateCanaryEnvironment({ ...input, ...change }));
});

test('provider credentials and public or reused account credentials are refused without values in errors', () => {
  const input = configuration();
  const sentinel = 'secret-must-not-appear-in-errors';
  for (const key of ['OPENAI_API_KEY', 'CJ_API_SECRET', 'AWS_ACCESS_KEY_ID', 'STRIPE_SECRET_KEY', 'RAILWAY_TOKEN']) {
    assert.throws(() => validateCanaryEnvironment({ ...input, [key]: sentinel }), error => !error.message.includes(sentinel));
  }
  for (const change of [
    { FOUNDER_EMAIL: 'owner@actual.example' }, { FOUNDER_PASSWORD: 'public-default' },
    { ADMIN_PASSWORD: input.FOUNDER_PASSWORD }, { ADMIN_EMAIL: input.FOUNDER_EMAIL },
    { SESSION_SECRET: input.ADMIN_PASSWORD },
  ]) assert.throws(() => validateCanaryEnvironment({ ...input, ...change }));
});

test('dotenv cannot reintroduce stripped provider credentials', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'canary-dotenv-'));
  try {
    fs.writeFileSync(path.join(directory, '.env'), 'DO_NOT_READ=fixture\n');
    assert.throws(() => prepareFilesystem(directory, '/data/canary/disposable.sqlite'), /\.env/);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('expired supervision does not spawn a child', async () => {
  let spawned = false;
  await assert.rejects(runBounded({ command: process.execPath, args: ['-e', 'process.exit(99)'],
    expiresAt: Date.now() - 1, onSpawn: () => { spawned = true; } }), /elapsed/);
  assert.equal(spawned, false);
});

test('actual child receives TERM and finishes its save before the absolute deadline', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'canary-grace-'));
  const receipt = path.join(directory, 'saved.json');
  const expiresAt = Date.now() + 1_000;
  try {
    const result = await runBounded({ command: process.execPath, args: ['-e', `
      const fs=require('node:fs');
      process.on('SIGTERM',()=>setTimeout(()=>{fs.writeFileSync(process.argv[1],JSON.stringify({saved:true}));process.exit(0)},30));
      setInterval(()=>{},1000);
    `, receipt], expiresAt, graceMs: 300, stdio: 'ignore' });
    assert.deepEqual(JSON.parse(fs.readFileSync(receipt, 'utf8')), { saved: true });
    assert.equal(result.reason, 'expired');
    assert.equal(result.code, 0);
    assert.equal(result.forcedTermination, false);
    assert.equal(result.signal, null);
    assert.equal(canaryExitCode(result), 0);
    assert.ok(Date.now() < expiresAt + 300, 'supervision must not renew the deadline');
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

function running(pid) {
  try {
    // A reaped-or-pending-reap zombie cannot execute work or retain open files.
    return fs.readFileSync(`/proc/${pid}/stat`, 'utf8').split(') ')[1][0] !== 'Z';
  } catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

test('actual stubborn descendant is killed when its parent exits', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'canary-group-'));
  const receipt = path.join(directory, 'descendant.pid');
  try {
    const result = await runBounded({ command: process.execPath, args: ['-e', `
      const {spawn}=require('node:child_process');
      const child=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"],{stdio:'ignore'});
      require('node:fs').writeFileSync(process.argv[1],String(child.pid));
      setTimeout(()=>process.exit(7),100);
    `, receipt], expiresAt: Date.now() + 3_000, graceMs: 150, stdio: 'ignore' });
    const pid = Number(fs.readFileSync(receipt, 'utf8'));
    assert.equal(result.code, 7);
    assert.equal(result.reason, 'child_exit');
    assert.equal(result.forcedTermination, true);
    assert.notEqual(canaryExitCode(result), 0);
    // SIGKILL delivery can race this observer by one scheduler tick.
    for (let attempt = 0; attempt < 20 && running(pid); attempt++) await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(running(pid), false, 'orphan worker must not keep running');
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('launcher forwards external TERM and closes a real child', async () => {
  const script = `
    const {runBounded}=require(${JSON.stringify(path.join(__dirname, 'canary-launcher.cjs'))});
    runBounded({command:process.execPath,args:['-e',"process.on('SIGTERM',()=>process.exit(0));console.log('ready');setInterval(()=>{},1000)"],
      expiresAt:Date.now()+5000,graceMs:100,onSpawn:()=>{},stdio:'inherit'}).then(result=>console.log(JSON.stringify(result)));
  `;
  const child = spawn(process.execPath, ['-e', script], { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  let signalled = false;
  child.stdout.on('data', chunk => {
    output += chunk;
    if (!signalled && output.includes('ready')) { signalled = true; child.kill('SIGTERM'); }
  });
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
  assert.equal(code, 0);
  assert.match(output, /"reason":"signal"/);
  assert.match(output, /"code":0/);
});

test('a child ignoring TERM is forcibly stopped within the original deadline', async () => {
  let childPid;
  const expiresAt = Date.now() + 700;
  const result = await runBounded({ command: process.execPath,
    args: ['-e', "process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"],
    expiresAt, graceMs: 150, stdio: 'ignore', onSpawn: child => { childPid = child.pid; } });
  assert.equal(result.reason, 'expired');
  assert.equal(result.signal, 'SIGKILL');
  assert.equal(result.forcedTermination, true);
  assert.equal(result.forcedSignal, 'SIGKILL');
  assert.notEqual(canaryExitCode(result), 0);
  for (let attempt = 0; attempt < 20 && running(childPid); attempt++) await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(running(childPid), false);
  assert.ok(Date.now() < expiresAt + 300);
});

test('failed persistence during deadline shutdown remains a failure', async () => {
  let ready = '';
  const result = await runBounded({ command: process.execPath,
    args: ['-e', "process.on('SIGTERM',()=>process.exit(1));console.log('handler-ready');setInterval(()=>{},1000)"],
    expiresAt: Date.now() + 3000, graceMs: 500, stdio: 'pipe',
    onSpawn: child => { child.stdout.on('data', chunk => { ready += chunk; }); },
  });
  assert.match(ready, /handler-ready/, 'the save handler must be installed before testing deadline shutdown');
  assert.equal(result.reason, 'expired');
  assert.equal(result.code, 1);
  assert.equal(result.signal, null);
  assert.equal(result.forcedTermination, false);
  assert.equal(canaryExitCode(result), 1);
});

test('external TERM cannot hide a child shutdown failure in the wrapper exit status', async () => {
  const script = `
    const {runBounded,canaryExitCode}=require(${JSON.stringify(path.join(__dirname, 'canary-launcher.cjs'))});
    runBounded({command:process.execPath,args:['-e',"process.on('SIGTERM',()=>process.exit(1));console.log('ready');setInterval(()=>{},1000)"],
      expiresAt:Date.now()+5000,graceMs:100,stdio:'inherit'}).then(result=>{console.log(JSON.stringify(result));process.exitCode=canaryExitCode(result)});
  `;
  const child = spawn(process.execPath, ['-e', script], { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  let signalled = false;
  child.stdout.on('data', chunk => {
    output += chunk;
    if (!signalled && output.includes('ready')) { signalled = true; child.kill('SIGTERM'); }
  });
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
  assert.equal(code, 1);
  assert.match(output, /"reason":"signal"/);
  assert.match(output, /"code":1/);
  assert.match(output, /"forcedTermination":false/);
});

test('unlaunchable child is reported and supervision listeners are removed', async () => {
  const before = process.listenerCount('SIGTERM');
  await assert.rejects(runBounded({ command: '/no-such-canary-executable', args: [],
    expiresAt: Date.now() + 1_000, graceMs: 100, stdio: 'ignore' }), /ENOENT/);
  assert.equal(process.listenerCount('SIGTERM'), before);
});

test('Railway canary config requires readiness and disables all automatic restarts', () => {
  const config = fs.readFileSync(path.join(__dirname, 'railway.canary.toml'), 'utf8');
  assert.match(config, /builder = "RAILPACK"/);
  assert.match(config, /npm ci --prefix pillow/);
  assert.match(config, /npm ci --prefix backend/);
  assert.match(config, /startCommand = "node deployment\/canary-launcher.cjs"/);
  assert.match(config, /restartPolicyType = "NEVER"/);
  assert.match(config, /healthcheckPath = "\/health\/ready"/);
});

test('lifecycle records include searchable messages and retain truthful shutdown facts', () => {
  // Execute only the actual logging expressions with synthetic local values.
  // This tests emitted JSON without starting the launcher or a provider service.
  const source = fs.readFileSync(path.join(__dirname, 'canary-launcher.cjs'), 'utf8');
  const expressions = source.match(/console\.log\(JSON\.stringify\(\{ event: 'bounded_canary_(?:start|stopped)'[\s\S]*?\}\)\);/g);
  assert.equal(expressions?.length, 2);
  const records = [];
  const identity = { launchId: 'synthetic-launch', deploymentId: 'synthetic-deployment', gitCommitSha: 'a'.repeat(40) };
  const result = { reason: 'deadline', code: null, signal: 'SIGKILL', forcedTermination: true, forcedSignal: 'SIGKILL' };
  for (const expression of expressions) require('node:vm').runInNewContext(expression, {
    identity, result, console: { log: line => records.push(JSON.parse(line)) },
  });
  assert.deepEqual(records, [
    { event: 'bounded_canary_start', message: 'bounded_canary_start', ...identity, scope: 'engineering_test_only', commerce: 'LOCKED' },
    { event: 'bounded_canary_stopped', message: 'bounded_canary_stopped', reason: 'deadline', childExitCode: null, childSignal: 'SIGKILL', forcedTermination: true, forcedSignal: 'SIGKILL' },
  ]);
  // Provider indexing/retrieval still requires a fresh hosted observation.
});


test('runtime version injection cannot authorize a different actual executable', async () => {
  assert.equal(EXPECTED_NODE, '22.23.2');
  assert.doesNotThrow(() => assertRuntimeVersion('22.23.2'));
  for (const version of ['24.10.0', '20.20.2', '22.23.1', undefined]) assert.throws(() => assertRuntimeVersion(version));
  if (process.versions.node !== EXPECTED_NODE) {
    const child = spawn(process.execPath, [path.join(__dirname, 'canary-launcher.cjs')], {
      env: { ...configuration(), EXPECTED_NODE: '22.23.2', NODE_VERSION: '22.23.2', NODE_ENV: 'test' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = ''; child.stdout.on('data', c => { output += c; });
    assert.equal(await new Promise(resolve => child.once('exit', resolve)), 1);
    assert.equal(output.includes('bounded_canary_start'), false);
  }
});

test('failure to persist launch identity kills the child instead of orphaning it', async () => {
  let pid;
  await assert.rejects(runBounded({ command: process.execPath, args: ['-e', 'setInterval(()=>{},1000)'],
    expiresAt: Date.now() + 5000, stdio: 'ignore', onSpawn: child => { pid = child.pid; throw new Error('disk unavailable'); } }), /disk unavailable/);
  for (let attempt = 0; attempt < 20 && running(pid); attempt++) await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(running(pid), false);
});

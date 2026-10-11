'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { runSupervisedRuntime } = require('./locked-supervision.cjs');

for (const writableAudit of [true, false]) test(`simultaneous real observer deaths contain runtime; audit writable=${writableAudit}`, { timeout: 10000 }, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'work8-containment-'));
  if (writableAudit) {
    fs.mkdirSync(path.join(root, 'commissioning'));
    fs.writeFileSync(path.join(root, 'commissioning/assurance-containment.jsonl'), '{"event":"retained-history"}\n');
  }
  const children = [], events = [], launches = new Map();
  let ready = false, runtime, output = '';
  try {
    const result = await runSupervisedRuntime({ cwd: root,
      env: { PATH: process.env.PATH, RAILWAY_VOLUME_MOUNT_PATH: root, RAILWAY_GIT_COMMIT_SHA: 'isolated-fixture', ASSURANCE_RUNTIME_ORIGIN: 'https://twin.example.invalid' },
      command: process.execPath, args: ['-e', "process.on('SIGTERM',()=>{console.log('ORDERLY_STOP');process.exit(0)});console.log('READY');setInterval(()=>{},1000)"],
      graceMs: 500, stdio: ['ignore', 'pipe', 'pipe'], onEvent: e => events.push(e),
      supervisorOptions: { retryMs: 5, maxRestarts: 1, spawnImpl: (_exe, args, options) => {
        const name = args[0], count = (launches.get(name) || 0) + 1; launches.set(name, count);
        const child = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { env: options.env, stdio: 'ignore' });
        children.push(child);
        if (ready) setTimeout(() => child.kill('SIGKILL'), 10);
        return child;
      } }, onSpawn: child => {
        runtime = child;
        child.stdout.on('data', chunk => {
          output += chunk;
          if (!ready && output.includes('READY')) { ready = true; for (const observer of children) observer.kill('SIGKILL'); }
        });
      }
    });
    assert.equal(result.reason, 'containment'); assert.equal(result.coverageLost, true);
    assert.equal(result.code, 0); assert.equal(result.forcedTermination, false);
    assert.match(output, /ORDERLY_STOP/);
    assert.deepEqual([...launches.values()], [2, 2]);
    assert.equal(events.filter(e => e.event === 'assurance_restart_quarantined').length, 2);
    const receipts = events.filter(e => e.event === 'assurance_coverage_containment');
    assert.equal(receipts.length, 1); assert.equal(receipts[0].auditPersisted, writableAudit);
    assert.equal(receipts[0].recoveryVerified, false);
    if (writableAudit) {
      const persisted = fs.readFileSync(path.join(root, 'commissioning/assurance-containment.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
      assert.equal(persisted.length, 2); assert.deepEqual(persisted[0], { event: 'retained-history' });
      assert.equal(persisted[1].action, 'STOP_RUNTIME');
      assert.equal(persisted[1].monitoringCoverage, 'LOST'); assert.equal(persisted[1].recoveryVerified, false);
    }
  } finally {
    for (const child of [...children, runtime].filter(Boolean)) if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('one quarantined observer does not falsely claim complete coverage loss', { timeout: 10000 }, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'work8-one-observer-'));
  const children = [], events = [];
  try {
    const result = await runSupervisedRuntime({ cwd: root, env: { PATH: process.env.PATH, ASSURANCE_RUNTIME_ORIGIN: 'https://twin.example.invalid' },
      command: process.execPath, args: ['-e', 'setInterval(()=>{},1000)'], expiresAt: Date.now() + 500, graceMs: 50, stdio: 'ignore',
      onEvent: e => events.push(e), supervisorOptions: { maxRestarts: 0, spawnImpl: (_exe, args, options) => {
        const child = spawn(process.execPath, ['-e', args[0].includes('permanent-worker') ? 'process.exit(1)' : 'setInterval(()=>{},1000)'], { env: options.env, stdio: 'ignore' });
        children.push(child); return child;
      } }
    });
    assert.equal(result.coverageLost, false); assert.equal(result.reason, 'expired');
    assert.equal(events.filter(e => e.event === 'assurance_restart_quarantined').length, 1);
    assert.equal(events.some(e => e.event === 'assurance_coverage_containment'), false);
  } finally { for (const child of children) child.kill('SIGKILL'); fs.rmSync(root, { recursive: true, force: true }); }
});

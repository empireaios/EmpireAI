'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { superviseAssurance } = require('./assurance-supervisor.cjs');
const { runBounded } = require('./canary-launcher.cjs');

// The launcher is independent of both observers. Exhausted coverage contains
// the runtime; it never repairs records or grants authority to restart work.
async function runSupervisedRuntime({ cwd, env, command, args, expiresAt = null,
  graceMs, stdio, onSpawn, onEvent = e => console.log(JSON.stringify(e)), supervisorOptions = {} }) {
  const controller = new AbortController();
  const quarantined = new Set();
  let coverageLost = false;
  const stopAssurance = superviseAssurance({ ...supervisorOptions, cwd, env, onEvent: event => {
    onEvent(event);
    if (event.event !== 'assurance_restart_quarantined') return;
    quarantined.add(event.component);
    if (coverageLost || !quarantined.has('permanent-worker.mjs') || !quarantined.has('permanent-inspector.mjs')) return;
    coverageLost = true;
    const receipt = { event: 'assurance_coverage_containment', at: new Date().toISOString(),
      source: env.RAILWAY_GIT_COMMIT_SHA || null, monitoringCoverage: 'LOST',
      action: 'STOP_RUNTIME', recoveryVerified: false, commerce: 'LOCKED', birth: 'NOT_BORN' };
    try {
      const target = path.join(env.RAILWAY_VOLUME_MOUNT_PATH, 'commissioning', 'assurance-containment.jsonl');
      const fd = fs.openSync(target, fs.constants.O_WRONLY | fs.constants.O_APPEND | fs.constants.O_CREAT | fs.constants.O_NOFOLLOW, 0o600);
      try { fs.writeSync(fd, JSON.stringify(receipt) + '\n'); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
      const dir = fs.openSync(path.dirname(target), 'r');
      try { fs.fsyncSync(dir); } finally { fs.closeSync(dir); }
      onEvent({ ...receipt, auditPersisted: true });
    } catch {
      onEvent({ ...receipt, auditPersisted: false });
    } finally {
      controller.abort();
    }
  }});
  try {
    const result = await runBounded({ command, args, env, cwd, expiresAt, graceMs, stdio, onSpawn, signal: controller.signal });
    return { ...result, coverageLost };
  } finally { stopAssurance(); }
}
module.exports = { runSupervisedRuntime };

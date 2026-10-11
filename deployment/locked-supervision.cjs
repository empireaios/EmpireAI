'use strict';
const path = require('node:path');
const { recordContainment, settleAudit } = require('./containment-audit.cjs');
const { superviseAssurance } = require('./assurance-supervisor.cjs');
const { runBounded } = require('./canary-launcher.cjs');

// The launcher is independent of both observers. Exhausted coverage contains
// the runtime; it never repairs records or grants authority to restart work.
async function runSupervisedRuntime({ cwd, env, command, args, expiresAt = null,
  graceMs, stdio, onSpawn, onEvent = e => console.log(JSON.stringify(e)), supervisorOptions = {}, guardLeaseMs = 20000 }) {
  const controller = new AbortController();
  const quarantined = new Set();
  let coverageLost = false;
  let audit = Promise.resolve();
  const stopAssurance = superviseAssurance({ ...supervisorOptions, cwd, env, onEvent: event => {
    onEvent(event);
    if (event.event !== 'assurance_restart_quarantined') return;
    quarantined.add(event.component);
    if (coverageLost || !quarantined.has('permanent-worker.mjs') || !quarantined.has('permanent-inspector.mjs')) return;
    coverageLost = true;
    const receipt = { event: 'assurance_coverage_containment', at: new Date().toISOString(),
      source: env.RAILWAY_GIT_COMMIT_SHA || null, monitoringCoverage: 'LOST',
      action: 'STOP_RUNTIME', recoveryVerified: false, commerce: 'LOCKED', birth: 'NOT_BORN' };
    controller.abort();
    audit = recordContainment(env, receipt).then(auditPersisted=>onEvent({...receipt,auditPersisted}));
  }});
  let leaseTimer;
  try {
    const io = Array.isArray(stdio) ? stdio.slice(0,3) : [stdio||'inherit',stdio||'inherit',stdio||'inherit'];
    const result = await runBounded({ command:process.execPath,
      args:[path.join(__dirname,'launcher-loss-guard.cjs'),String(guardLeaseMs),String(Math.min(graceMs??20000,20000)),command,...args],
      env, cwd, expiresAt, graceMs, stdio:[...io,'ipc'], signal: controller.signal, onSpawn:child=>{
        const renew=()=>{if(child.connected)child.send({type:'launcher_progress'},()=>{});};
        renew();leaseTimer=setInterval(renew,Math.max(10,Math.floor(guardLeaseMs/4)));
        onSpawn?.(child);
      }});
    return { ...result, coverageLost };
  } finally { clearInterval(leaseTimer);stopAssurance();await settleAudit(audit); }
}
module.exports = { runSupervisedRuntime };

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {AssuranceControlPlane, inspectControlPlaneMonitor} from './control-plane.mjs';

// This catalogue is a component examination of the shipped control plane, not a
// production runbook registry. All injected resources are process-local.
export const WORK8_RECOVERY_CASES = Object.freeze([
  'cache-expiry', 'duplicate-delivery', 'failed-repair', 'unknown-outcome',
  'expired-approval', 'forbidden-financial-repair', 'watchdog-loss',
  'compounded-cache-worker', 'restart-preservation', 'recurring-failure', 'stale-closure',
]);
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export async function runWork8RecoveryExam({scenarioId, seed = 8} = {}) {
  if (!WORK8_RECOVERY_CASES.includes(scenarioId) || !Number.isSafeInteger(seed) || seed < 0) throw Error('INVALID_EXAM');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'empire-work8-assurance-'));
  const workspace = `synthetic:work8:${scenarioId}`;
  let time = 1800000000000 + seed * 1000;
  const trace = [], resource = {cache: true, worker: true, executions: 0};
  const baseline = {journal: [{id: 'mock-opening', debit: 10000, credit: 10000}], pillow: 'NOT_BORN', commerce: 'LOCKED'};
  const before = digest(baseline);
  const record = (stage, detail) => trace.push({at: time, stage, detail});
  const runbooks = {
    refresh: {version: 'work8-v1', authority: 'A', capability: 'cache', maxAttempts: 2, cooldownMs: 100, timeoutMs: 50,
      execute: () => {resource.executions++; record('repair-attempt', {cache: resource.cache}); if (scenarioId === 'unknown-outcome') throw Error('INJECTED_TIMEOUT'); if (scenarioId !== 'failed-repair') resource.cache = true; return {reportedHealthy: true};},
      // An affirmative executor claim is deliberately ignored by this reader.
      verify: () => ({healthy: resource.cache, observedAt: time, source: 'independent-resource-read'})},
    owner: {version: 'work8-v1', authority: 'B', capability: 'worker', maxAttempts: 1, cooldownMs: 100, timeoutMs: 50,
      execute: () => {resource.executions++; resource.worker = true;}, verify: () => ({healthy: resource.worker, observedAt: time})},
    forbidden: {version: 'work8-v1', authority: 'C', capability: 'finance', maxAttempts: 1, cooldownMs: 100, timeoutMs: 50,
      execute: () => {throw Error('FORBIDDEN_EXECUTION');}, verify: () => ({healthy: false})},
  };
  let cp = new AssuranceControlPlane({root, now: () => time, revision: 'work8-local-exam', runbooks});
  const observe = (id, capability, runbookId) => cp.observe(workspace, {id, capability, runbookId, synthetic: true,
    status: 'FAILED', classification: capability === 'finance' ? 'FINANCIAL_DISCREPANCY' : 'INJECTED_RESOURCE_FAULT', severity: 'HIGH', summary: `Isolated ${capability} fault`, evidence: {scenarioId, seed, resource: {...resource}}});
  const checks = [];
  const check = (name, passed) => checks.push({name, passed: passed === true});
  try {
    cp.heartbeat(workspace);
    record('healthy-baseline', {...resource});
    let incident;
    if (scenarioId === 'stale-closure') {
      resource.cache = false; incident = observe('cache', 'cache', 'refresh');
      time += 180001;
      cp.observe(workspace, {id: 'cache', capability: 'cache', synthetic: true, status: 'HEALTHY', classification: 'INJECTED_RESOURCE_FAULT', summary: 'Replayed old healthy claim', evidence: {observedAt: time - 180001, healthy: true}});
      record('stale-evidence-injected', {resourceHealthy: resource.cache, claimedSourceAt: time - 180001});
      check('stale source claim cannot close unresolved incident', cp.get(workspace, 'incident', incident.id).status !== 'RECOVERED');
    } else if (scenarioId === 'watchdog-loss') {
      time += 90001;
      const watchdog = inspectControlPlaneMonitor(cp, workspace);
      record('watchdog-inspection', {fresh: watchdog.fresh});
      check('independent watchdog detects lost primary heartbeat', !watchdog.fresh && watchdog.incident.classification === 'MONITORING_COVERAGE_LOST');
      check('watchdog does not impersonate primary monitor', cp.snapshot(workspace).monitor.fresh === false);
    } else if (scenarioId === 'forbidden-financial-repair') {
      incident = observe('journal', 'finance', 'forbidden');
      const result = await cp.recover(workspace, incident.id);
      check('financial repair denied', result.status === 'NO_RUNBOOK' && resource.executions === 0);
      check('incident remains visible', cp.get(workspace, 'incident', incident.id).status === 'UNRESOLVED');
    } else if (scenarioId === 'expired-approval') {
      resource.worker = false; incident = observe('worker', 'worker', 'owner');
      await cp.recover(workspace, incident.id);
      const approval = cp.list(workspace, 'approval')[0]; time += 3600001;
      const response = await cp.command(workspace, 'exam-owner', {id: 'expired-approve', type: 'approve', approvalId: approval.id});
      check('stale owner approval denied', response.status === 'ACTION_DENIED');
      check('owner-controlled repair never ran', resource.executions === 0 && resource.worker === false);
    } else {
      resource.cache = false; record('fault-injected', {...resource});
      incident = observe('cache', 'cache', 'refresh');
      check('detected before repair', incident.status === 'DETECTED' && resource.cache === false);
      if (scenarioId === 'duplicate-delivery') {
        observe('cache', 'cache', 'refresh');
        check('duplicate coalesced', cp.list(workspace, 'incident').length === 1);
      }
      if (scenarioId === 'compounded-cache-worker') {resource.worker = false; observe('worker', 'worker', 'owner');}
      const result = await cp.recover(workspace, incident.id);
      record('recovery-result', {status: result.status, resource: {...resource}});
      if (scenarioId === 'unknown-outcome') {
        const again = await cp.recover(workspace, incident.id);
        check('unknown outcome prevents replay', result.status === 'UNKNOWN' && again.status === 'UNKNOWN' && resource.executions === 1);
        check('unknown is never closed', cp.get(workspace, 'incident', incident.id).status === 'UNRESOLVED');
      } else if (scenarioId === 'failed-repair') {
        time += 101; await cp.recover(workspace, incident.id); time += 101;
        const exhausted = await cp.recover(workspace, incident.id);
        check('executor success cannot forge independent recovery', result.status === 'FAILED' && resource.cache === false);
        check('attempt budget opens circuit', exhausted.status === 'CIRCUIT_OPEN' && resource.executions === 2);
      } else {
        check('resource actually recovered', result.status === 'VERIFIED' && resource.cache === true);
        await cp.recover(workspace, incident.id);
        check('completed repair not replayed', resource.executions === 1);
        if (scenarioId === 'compounded-cache-worker') {
          await cp.tick(workspace);
          check('unrelated fault not hidden by cache recovery', cp.list(workspace, 'incident').some(i => i.capability === 'worker' && i.status === 'OWNER_ACTION_REQUIRED') && resource.worker === false);
        }
        if (scenarioId === 'recurring-failure') {
          resource.cache = false; time += 101;
          const repeated = observe('cache', 'cache', 'refresh');
          check('recurrence retained as a new unresolved incident', repeated.id !== incident.id && cp.list(workspace, 'incident').length === 2 && repeated.status === 'DETECTED');
          await cp.recover(workspace, repeated.id);
          resource.cache = false; time += 101;
          const third = observe('cache', 'cache', 'refresh');
          const blocked = await cp.recover(workspace, third.id);
          check('cross-incident oscillation bounded', blocked.status === 'CIRCUIT_OPEN' && resource.executions === 2 && resource.cache === false);
        }
        if (scenarioId === 'restart-preservation') {
          const events = cp.db.prepare('SELECT * FROM cp_events ORDER BY seq').all();
          cp.close(); cp = new AssuranceControlPlane({root, now: () => time, revision: 'work8-local-exam', runbooks});
          check('restart preserves immutable audit and recovery', digest(events) === digest(cp.db.prepare('SELECT * FROM cp_events ORDER BY seq').all()) && cp.get(workspace, 'incident', incident.id).status === 'RECOVERED');
          await cp.recover(workspace, incident.id); check('restart cannot repeat completed repair', resource.executions === 1);
        }
      }
    }
    check('financial and authority baseline preserved', before === digest(baseline));
    const events = cp.db.prepare('SELECT seq,at,type,body FROM cp_events WHERE workspace=? ORDER BY seq').all(workspace).map(e => ({...e, body: JSON.parse(e.body)}));
    check('durable audit has incident evidence', events.some(e => e.type === 'INCIDENT_DETECTED'));
    record('independent-oracle', checks);
    return {schema: 'work8-assurance-exam-v1', scenarioId, seed, environment: 'isolated-local-control-plane',
      permittedEffects: ['temporary SQLite database', 'process-local injected resource'], costCap: 0,
      timeMode: 'virtual except control-plane timeout bound', elapsedVirtualMs: time - (1800000000000 + seed * 1000),
      result: checks.every(c => c.passed) ? 'PASS' : 'FAIL', checks, trace, events,
      baselineDigest: before, finalDigest: digest(baseline), independentOracle: 'resource reads + SQLite event readback; no executor success claims',
      limitations: ['Component-level intercepted recovery; not whole-system or real-provider proof']};
  } finally {cp.close(); fs.rmSync(root, {recursive: true, force: true});}
}

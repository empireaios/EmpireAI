import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createAssuranceRuntime} from '../../assurance/runtime.js';
import {rebuildReconciliation, verifyReconciliation, reconciliationHash, readReconciliationSources} from '../../assurance/evidence-reconciliation.js';

test('registered reconciliation family budget survives restart and refuses a third recurring repair', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'work8-registered-recurrence-'));
  const workspace = 'ws_empire_1';
  const revision = 'e3e8500a5ae7c8bd0d556d1d37a24238619d84fb';
  const realNow = Date.now;
  let now = realNow();
  Date.now = () => now;
  fs.mkdirSync(path.join(root, 'commissioning'));
  for (const [file, sql] of [
    ['intelligence.sqlite', 'CREATE TABLE objects(workspace TEXT,kind TEXT,id TEXT,body TEXT)'],
    ['pillow-request-receipts.sqlite', 'CREATE TABLE receipts(workspace TEXT,request TEXT,body TEXT)'],
    ['pillow-institutional.sqlite', 'CREATE TABLE records(workspace TEXT,kind TEXT,id TEXT,body TEXT)'],
  ]) {
    const db = new DatabaseSync(path.join(root, 'commissioning', file!));
    db.exec(sql!);
    db.close();
  }
  const db = new DatabaseSync(path.join(root, 'commissioning', 'intelligence.sqlite'));
  db.prepare('INSERT INTO objects VALUES(?,?,?,?)').run(workspace, 'evidence', 'retained', JSON.stringify({id:'retained', facts:{value:1}}));
  db.close();
  let runtime = await createAssuranceRuntime(root, revision);
  let inferenceCalls = 0;
  const denyInference = () => {runtime.advisor.ports.infer = async () => {inferenceCalls++; throw new Error('UNAUTHORISED_INFERENCE');};};
  const repairs = () => runtime.control.snapshot(workspace).recoveries.filter((r: any) => r.runbookId === 'rebuild_reconciliation');
  try {
    denyInference();
    const digest = reconciliationHash(readReconciliationSources(root, workspace));
    rebuildReconciliation(root, workspace, revision);
    await runtime.cycle();
    assert.equal(repairs().length, 0);
    for (let ordinal = 1; ordinal <= 2; ordinal++) {
      now += 31000;
      fs.unlinkSync(path.join(root, 'commissioning', `reconciliation-${workspace}.json`));
      await runtime.cycle();
      assert.equal(verifyReconciliation(root, workspace).healthy, true);
      assert.equal(repairs().length, ordinal);
      assert.ok(repairs().every((r: any) => r.status === 'VERIFIED'));
      assert.equal(reconciliationHash(readReconciliationSources(root, workspace)), digest);
      const retained = repairs();
      runtime.control.close();
      runtime = await createAssuranceRuntime(root, revision);
      denyInference();
      await runtime.cycle();
      assert.deepEqual(repairs(), retained);
    }
    const retainedRepairs = repairs();
    const retainedEvents = runtime.control.snapshot(workspace).events.filter((e: any) => e.type === 'RECOVERY_RESULT' && e.body.runbookId === 'rebuild_reconciliation');
    assert.equal(retainedEvents.length, 2);
    now += 31000;
    fs.unlinkSync(path.join(root, 'commissioning', `reconciliation-${workspace}.json`));
    await runtime.cycle();
    assert.equal(verifyReconciliation(root, workspace).healthy, false);
    assert.deepEqual(repairs(), retainedRepairs);
    const incident = runtime.control.snapshot(workspace).incidents.find((i: any) => i.probeId === 'reconciliation_view' && i.status === 'UNRESOLVED');
    assert.ok(incident);
    assert.match(incident.limitation, /Recurring recovery circuit open/);
    runtime.control.close();
    runtime = await createAssuranceRuntime(root, revision);
    denyInference();
    await runtime.cycle();
    assert.deepEqual(repairs(), retainedRepairs);
    assert.equal(runtime.control.get(workspace, 'incident', incident.id).status, 'UNRESOLVED');
    assert.equal(verifyReconciliation(root, workspace).healthy, false);
    for (const event of retainedEvents) assert.deepEqual(runtime.control.snapshot(workspace).events.find((e: any) => e.seq === event.seq), event);
    assert.equal(reconciliationHash(readReconciliationSources(root, workspace)), digest);
    assert.equal(inferenceCalls, 0);
  } finally {
    runtime.control.close();
    Date.now = realNow;
    fs.rmSync(root, {recursive:true, force:true});
  }
});

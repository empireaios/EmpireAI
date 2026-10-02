import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { AssuranceStore, REQUIRED_DOMAINS, reconcileSnapshot, runAssuranceCycle, inspectAssurance } from '../../assurance/independent-assurance.mjs';
const snapshot = () => ({ origin: 'independent-adapter', source: 'fixture-marketplace', evidenceId: 'fixture-1', observedAt: 1000,
  authoritative: [{ id: 'order-1', value: { paid: true } }], internal: [{ id: 'order-1', value: { paid: true } }] });
const policy = { now: 1050, epoch: 1000, intervalMs: 100, graceMs: 50 };
function fixture() { const dir = fs.mkdtempSync(path.join(os.tmpdir(),'assurance-')); const filename=path.join(dir,'cycles.sqlite'); const store=new AssuranceStore(filename); return {filename,store,close(){store.close();fs.rmSync(dir,{recursive:true,force:true});}}; }
test('detects an omitted order without Pillow reporting anything', () => {
  const s=snapshot();s.internal=[];const r=reconcileSnapshot(s,1000,50);assert.equal(r.status,'FAIL');assert.equal(r.missing,1);
});
test('cannot turn stale, future, missing, unavailable or model-only evidence green', () => {
  assert.equal(reconcileSnapshot(snapshot(),1100,50).status,'STALE');
  assert.equal(reconcileSnapshot(snapshot(),999,50).status,'FAIL');
  assert.equal(reconcileSnapshot(null,1000,50).status,'NOT_CHECKED');
  assert.equal(reconcileSnapshot({unavailable:true},1000,50).status,'SOURCE_UNAVAILABLE');
  assert.equal(reconcileSnapshot({...snapshot(),origin:'pillow'},1000,50).status,'NOT_CHECKED');
});
test('duplicate identities and money mismatches fail; property order does not', () => {
  const s=snapshot();s.internal.push(s.internal[0]);assert.equal(reconcileSnapshot(s,1000,50).status,'FAIL');
  const m=snapshot();m.internal[0].value.paid=false;assert.equal(reconcileSnapshot(m,1000,50).mismatched,1);
  const k=snapshot();k.authoritative[0].value={a:1,b:2};k.internal[0].value={b:2,a:1};assert.equal(reconcileSnapshot(k,1000,50).status,'PASS');
});
test('durable receipt survives reopening; a missed subsequent cycle is independently overdue', async () => {
  const f=fixture();try {
    const collectors=Object.fromEntries(REQUIRED_DOMAINS.map(d=>[d,async()=>snapshot()]));
    await runAssuranceCycle(f.store,{id:'cycle_1',scheduledAt:1000,collectors,maxAgeMs:50,clock:()=>1000});
    f.store.close();f.store=new AssuranceStore(f.filename);
    assert.equal(inspectAssurance(f.filename,policy).status,'PASS');
    assert.equal(inspectAssurance(f.filename,{...policy,now:1150}).status,'ASSURANCE_OVERDUE');
    assert.throws(()=>f.store.begin('duplicate',1000,1000));
  } finally {f.store.close();fs.rmSync(path.dirname(f.filename),{recursive:true,force:true});}
});
test('started but interrupted cycle is overdue; missing store is not healthy', () => {
  const f=fixture();try {f.store.begin('interrupted',1000,1000);assert.equal(inspectAssurance(f.filename,policy).status,'ASSURANCE_OVERDUE');assert.equal(inspectAssurance(f.filename+'.absent',policy).healthy,false);}finally{f.close();}
});
test('coverage gaps and failed adapters degrade the cycle without inference or writes', async () => {
  const f=fixture();try {
    const r=await runAssuranceCycle(f.store,{id:'partial',scheduledAt:1000,collectors:{runtime:async()=>{throw Error('private provider detail');}},maxAgeMs:50,clock:()=>1000});
    assert.equal(r.healthy,false);assert.equal(r.checks.runtime.status,'SOURCE_UNAVAILABLE');assert.equal(r.checks.workers.status,'NOT_CHECKED');assert.equal(r.inferenceCalls,0);assert.equal(r.commerceWrites,0);assert.equal(r.liveProof,false);
    assert.equal(inspectAssurance(f.filename,policy).status,'DEGRADED');assert.ok(!JSON.stringify(r).includes('private provider detail'));
  }finally{f.close();}
});
test('hung collector is bounded and cannot suppress the independent monitor', async () => {
  const f=fixture();try {const r=await runAssuranceCycle(f.store,{id:'timeout',scheduledAt:1000,collectors:{runtime:()=>new Promise(()=>{})},maxAgeMs:50,clock:()=>1000,timeoutMs:10});assert.equal(r.checks.runtime.status,'SOURCE_UNAVAILABLE');}finally{f.close();}
});
test('late completion does not erase missed deadline and completed receipts cannot be overwritten', async () => {
 const f=fixture();try {f.store.begin('late',1000,1000);const checks=Object.fromEntries(REQUIRED_DOMAINS.map(d=>[d,{status:'PASS'}]));f.store.complete('late',1060,checks);assert.equal(inspectAssurance(f.filename,{...policy,now:1070}).status,'ASSURANCE_OVERDUE');assert.throws(()=>f.store.complete('late',1061,checks));}finally{f.close();}
});

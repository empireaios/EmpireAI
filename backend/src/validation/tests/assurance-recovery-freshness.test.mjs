import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {AssuranceControlPlane} from '../../assurance/control-plane.mjs';

for (const mode of ['missing','stale','future','before-verification','fresh']) {
 test(`recovery requires an observation from the current verification: ${mode}`,async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'work8-verification-'));
  const resource=path.join(root,'resource.json');
  fs.writeFileSync(resource,JSON.stringify({healthy:false,finance:224,commerce:'LOCKED',pillow:'NOT_BORN'}));
  let now=1800000000000,calls=0;
  const w='synthetic:verification-freshness';
  const book={version:'v1',authority:'A',capability:'derived-cache',maxAttempts:1,cooldownMs:0,timeoutMs:100,
   execute:()=>{calls++;const r=JSON.parse(fs.readFileSync(resource));r.healthy=true;fs.writeFileSync(resource,JSON.stringify(r));now+=10;return {healthy:true};},
   verify:()=>{const r=JSON.parse(fs.readFileSync(resource));return {...r,...(mode==='missing'?{}:{observedAt:mode==='stale'?now-180001:mode==='future'?now+1:mode==='before-verification'?now-1:now})};}};
  let cp=new AssuranceControlPlane({root,now:()=>now,revision:'work8-freshness',runbooks:{repair:book}});
  try {
   const incident=cp.observe(w,{id:'cache',capability:'derived-cache',classification:'INJECTED_STALE_VERIFIER',status:'FAILED',summary:'Synthetic resource requires fresh verification',runbookId:'repair',synthetic:true});
   const result=await cp.recover(w,incident.id);
   assert.equal(result.status,mode==='fresh'?'VERIFIED':'FAILED');
   assert.equal(cp.get(w,'incident',incident.id).status,mode==='fresh'?'RECOVERED':'DEGRADED');
   const events=cp.db.prepare('SELECT * FROM cp_events ORDER BY seq').all();
   assert.ok(events.some(e=>e.type==='RECOVERY_RESULT'));
   cp.close();cp=new AssuranceControlPlane({root,now:()=>now,revision:'work8-freshness',runbooks:{repair:book}});
   assert.deepEqual(cp.db.prepare('SELECT * FROM cp_events ORDER BY seq').all(),events);
   assert.equal((await cp.recover(w,incident.id)).status,mode==='fresh'?'NOT_ELIGIBLE':'CIRCUIT_OPEN');
   assert.equal(calls,1);
   assert.deepEqual(JSON.parse(fs.readFileSync(resource)),{healthy:true,finance:224,commerce:'LOCKED',pillow:'NOT_BORN'});
  } finally {cp.close();fs.rmSync(root,{recursive:true,force:true});}
 });
}

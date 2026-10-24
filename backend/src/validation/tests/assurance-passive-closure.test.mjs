import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {AssuranceControlPlane} from '../../assurance/control-plane.mjs';

for(const mode of ['missing','future','pre-fault','pre-latest-fault','fresh'])test(`passive closure requires post-fault evidence: ${mode}`,()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'work8-passive-'));
 const w='synthetic:passive-closure';let now=1800000000000;
 let cp=new AssuranceControlPlane({root,now:()=>now,revision:'passive-exam'});
 const probe={id:'resource',capability:'resource',classification:'INJECTED_RESOURCE_FAILURE',summary:'Isolated passive closure examination',synthetic:true};
 try{
  const first=cp.observe(w,{...probe,status:'FAILED',evidence:{observedAt:now}});
  const firstAt=now;now+=20;cp.observe(w,{...probe,status:'FAILED',evidence:{observedAt:now}});
  const lastAt=now;now+=10;
  const at=mode==='future'?now+1:mode==='pre-fault'?firstAt-1:mode==='pre-latest-fault'?lastAt-1:now;
  cp.observe(w,{...probe,status:'HEALTHY',...(mode==='missing'?{}:{sourceObservedAt:at}),evidence:{resource:'read-only-fixture'}});
  assert.equal(cp.get(w,'incident',first.id).status==='RECOVERED',mode==='fresh');
  if(mode!=='fresh')assert.ok(cp.db.prepare("SELECT 1 FROM cp_events WHERE type='FUNCTION_VERIFICATION_REJECTED'").get());
  const events=cp.db.prepare('SELECT * FROM cp_events ORDER BY seq').all();cp.close();
  cp=new AssuranceControlPlane({root,now:()=>now,revision:'passive-exam'});
  assert.deepEqual(cp.db.prepare('SELECT * FROM cp_events ORDER BY seq').all(),events);
  now+=10;cp.observe(w,{...probe,status:'HEALTHY',evidence:{observedAt:now,resource:'fresh-independent-read'}});
  assert.equal(cp.get(w,'incident',first.id).status,'RECOVERED');
  assert.equal(cp.list(w,'recovery').length,0,'passive verification must not execute repairs');
  assert.equal(cp.list(w,'incident').length,1,'original incident retained');
 }finally{cp.close();fs.rmSync(root,{recursive:true,force:true});}
});

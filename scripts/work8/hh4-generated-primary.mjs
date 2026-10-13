import assert from 'node:assert/strict';
import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
assert.equal(process.env.NODE_ENV,'test');
assert.equal(process.env.EMPIRE_ENGINEERING_TEST_MODE,'true');
const {spawnGeneratedExaminationWorker,requestGeneratedCapture}=await import('../../backend/dist/runtime/work8-generated-worker-adoption.js');
const capability=await spawnGeneratedExaminationWorker(notice=>{
  assert.equal(notice.source,process.env.HH4_SOURCE);
  process.once('SIGUSR2',()=>{void (async()=>{
   const started=performance.now();const held=await requestGeneratedCapture(capability);
   assert.ok(Date.now()<held.expiresAt-250,'HH4_HELD_COPY_MARGIN');
   fs.cpSync(held.directory,'/evidence/held-capture',{recursive:true,errorOnExist:true,force:false});
   assert.ok(Date.now()<held.expiresAt-250,'HH4_HELD_COPY_DEADLINE');
   fs.writeFileSync('/evidence/hh4-held.json',JSON.stringify({...held,copiedAt:Date.now(),requestElapsedMs:performance.now()-started}),{flag:'wx',mode:0o600});
  })().catch(error=>{console.error('HH4_CAPTURE_FAILED',String(error));process.kill(process.pid,'SIGKILL');});});
  fs.writeFileSync('/evidence/hh4-worker-ready.json',JSON.stringify(notice),{flag:'wx',mode:0o600});
});
Object.assign(process.env,{PORT:'4100',HOST:'127.0.0.1',EMPIRE_BRAIN_WORKER_PORT:'4101',FOUNDER_EMAIL:'hh4-owner@example.test',FOUNDER_PASSWORD:'generated-hh4-owner-password',ADMIN_EMAIL:'hh4-admin@example.test',ADMIN_PASSWORD:'generated-hh4-admin-password'});
const {startTier0IsolatedPrimary}=await import('../../backend/dist/runtime/tier0-isolated-primary.js');
try{await startTier0IsolatedPrimary(capability);}catch(error){console.error('HH4_PRIMARY_STARTUP_FAILED',String(error));process.kill(process.pid,'SIGKILL');}

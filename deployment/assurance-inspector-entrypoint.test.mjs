import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {AssuranceStore} from '../backend/src/assurance/independent-assurance.mjs';
const entry=fileURLToPath(new URL('../backend/src/assurance/permanent-inspector.mjs',import.meta.url));

for(const ipc of [false,true])test('actual inspector entrypoint observes existing schema under native isolation '+(ipc?'with parent IPC':'without parent IPC'),{timeout:5000},async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'assurance-entrypoint-'));fs.mkdirSync(path.join(root,'commissioning'));
 const filename=path.join(root,'commissioning','assurance.sqlite'),store=new AssuranceStore(filename);store.close();
 const library=process.env.ASSURANCE_ISOLATION_LIBRARY;assert.ok(library&&fs.statSync(library).isFile());
 // The exact unchanged native constructor runs before this test-only import.
 // Exercise denial inside the actual inspector process, without relying on a
 // parent /proc PID view (which can belong to a different PID namespace).
 const policyCheck='import {spawnSync} from "node:child_process"; if(spawnSync(process.execPath,["-e",""]).error?.code!=="EPERM")throw Error("Native descendant denial absent");';
 const child=spawn(process.execPath,['--import=data:text/javascript,'+encodeURIComponent(policyCheck),entry],{env:{PATH:process.env.PATH,RAILWAY_VOLUME_MOUNT_PATH:root,LD_PRELOAD:library},stdio:['ignore','pipe','pipe',...(ipc?['ipc']:[])]});
 let stdout='',stderr='';const messages=[];if(ipc)child.on('message',m=>messages.push(m));child.stderr.on('data',chunk=>stderr+=chunk);
 const exit=new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(code,signal)=>resolve({code,signal}));});
 const timer=setTimeout(()=>child.kill('SIGKILL'),4000);
 try{
  await new Promise((resolve,reject)=>{child.once('error',reject);child.stdout.on('data',chunk=>{stdout+=chunk;if(stdout.includes('\n'))resolve();});child.once('exit',()=>{if(!stdout)reject(Error('Actual inspector exited without report: '+stderr));});});
  const report=JSON.parse(stdout.split('\n')[0]);assert.equal(report.event,'independent_assurance_watchdog');assert.equal(report.status,'ASSURANCE_OVERDUE');assert.equal(report.healthy,false);
  const heartbeat=JSON.parse(fs.readFileSync(filename+'.watchdog'));assert.equal(heartbeat.status,'ASSURANCE_OVERDUE');
  if(ipc){const isReady=m=>m.protocol==='work8-assurance-discrepancy-readback-v1'&&m.action==='ready';if(!messages.some(isReady))await new Promise((resolve,reject)=>{const observed=m=>{if(isReady(m)){child.off('message',observed);resolve();}};child.on('message',observed);child.once('exit',()=>reject(Error('Inspector exited without IPC reader readiness')));});}
  const started=performance.now();child.kill('SIGTERM');const result=await exit;assert.deepEqual(result,{code:0,signal:null});assert.ok(performance.now()-started<1000);
 }finally{clearTimeout(timer);if(child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await exit;}fs.rmSync(root,{recursive:true,force:true});}
});

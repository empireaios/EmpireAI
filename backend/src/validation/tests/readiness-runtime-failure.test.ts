import assert from 'node:assert/strict';
import {test} from 'node:test';
import Fastify from 'fastify';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {getExecutiveContinuityHealth,startExecutiveContinuityWatchdog,stopExecutiveContinuityWatchdogForTesting} from '../../runtime/executive-continuity-watchdog.js';
import {registerWorkerApplicationReadinessRoute} from '../../runtime/application-readiness.js';
import {registerTier0ReadinessRoute} from '../../runtime/tier0-isolated-primary.js';

test('runtime failures deny worker and primary readiness without hiding liveness or inventing recovery',async()=>{
 const worker=Fastify(),primary=Fastify();
 let redis=true,lifecycle='running';
 let safety={watchdogEnabled:true,watchdogRunning:true,alerts:[] as string[],lastFlushError:null as string|null};
 worker.get('/health/live',async()=>({process:'running'}));
 registerWorkerApplicationReadinessRoute(worker,{
  assessAuthReadiness:()=>({ready:true,status:'ready',checks:[],blockers:[]}),
  probeRedisConnectivity:async()=>redis,redisMode:'connected',redisRequired:true,
  pillowEnabled:true,pillowRequired:true,getPillowStatus:()=>({lifecycle,health:'Idle',lastError:null}),
  runtimeSafetyRequired:true,getRuntimeSafety:()=>safety,
 });
 registerTier0ReadinessRoute(primary,{
  probeWorkerReady:async()=>{const r=await worker.inject('/health/ready');return {ok:r.statusCode===200,reachable:true,ms:0,body:r.json()};},
  probePrimarySessionStore:async()=>true,sessionStoreMode:'redis',
 });
 const check=async(code:number,reason?:string)=>{
  const r=await worker.inject('/health/ready');assert.equal(r.statusCode,code,r.body);
  assert.equal((await primary.inject('/health/ready')).statusCode,code);
  assert.equal((await worker.inject('/health/live')).statusCode,200);
  if(reason)assert.match(JSON.stringify(r.json().blockers),new RegExp(reason));
 };
 try{
  await check(200);
  redis=false;await check(503,'Redis');redis=true;
  lifecycle='failed';await check(503,'lifecycle');lifecycle='running';
  safety.watchdogRunning=false;safety.alerts=['watchdog_worker_exit_1'];await check(503,'watchdog');
  safety.watchdogRunning=true;safety.alerts=[];await check(200);
  safety.lastFlushError='synthetic persistence failure';await check(503,'persistence');
  // A healthy watchdog cannot clear an outstanding durable-write failure.
  await check(503,'persistence');safety.lastFlushError=null;await check(200);
  safety.alerts=['heartbeat_age_ms=25000'];await check(503,'heartbeat');
  safety.alerts=['graceful_recovery_requested'];await check(503,'recovery');
  safety.alerts=['sqlite_persist_pending','sqlite_flush_duration_ms=6000'];await check(200);
 }finally{await primary.close();await worker.close();}
});

test('a real failed watchdog worker prevents readiness and missing safety probes fail closed',async()=>{
 const directory=mkdtempSync(path.join(tmpdir(),'readiness-failed-watchdog-'));
 const workerFile=path.join(directory,'failed.cjs');writeFileSync(workerFile,'throw new Error("synthetic watchdog failure");');
 let probeMode='live';const app=Fastify();
 registerWorkerApplicationReadinessRoute(app,{
  assessAuthReadiness:()=>({ready:true,status:'ready',checks:[],blockers:[]}),
  probeRedisConnectivity:async()=>true,redisMode:'connected',redisRequired:true,
  pillowEnabled:true,pillowRequired:true,getPillowStatus:()=>({lifecycle:'running',health:'Idle',lastError:null}),
  runtimeSafetyRequired:true,getRuntimeSafety:()=>{
   if(probeMode==='throw')throw Error('synthetic probe failure');
   const h=getExecutiveContinuityHealth();return {...h,lastFlushError:null};
  },
 });
 try{
  startExecutiveContinuityWatchdog({workerFile});
  for(let i=0;i<100&&!getExecutiveContinuityHealth().alerts.some(a=>a.startsWith('watchdog_worker_'));i++)await new Promise(resolve=>setTimeout(resolve,10));
  assert.ok(getExecutiveContinuityHealth().alerts.some(a=>a.startsWith('watchdog_worker_')));
  const failed=await app.inject('/health/ready');assert.equal(failed.statusCode,503);assert.match(failed.body,/watchdog/);
  probeMode='throw';const unavailable=await app.inject('/health/ready');assert.equal(unavailable.statusCode,503);assert.match(unavailable.body,/Runtime safety probe failed/);
 }finally{stopExecutiveContinuityWatchdogForTesting();await app.close();rmSync(directory,{recursive:true,force:true});}
 const missing=Fastify();
 registerWorkerApplicationReadinessRoute(missing,{
  assessAuthReadiness:()=>({ready:true,status:'ready',checks:[],blockers:[]}),
  probeRedisConnectivity:async()=>true,redisMode:'connected',redisRequired:true,
  pillowEnabled:true,pillowRequired:true,getPillowStatus:()=>({lifecycle:'running',health:'Idle',lastError:null}),runtimeSafetyRequired:true,
 });
 try{const r=await missing.inject('/health/ready');assert.equal(r.statusCode,503);assert.match(r.body,/Runtime safety probe unavailable/);}finally{await missing.close();}
});

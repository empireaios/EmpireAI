import {createRequire} from 'node:module';
const {installObserverParticipant}=createRequire(import.meta.url)('../../../deployment/observer-capture.cjs');
const capture=installObserverParticipant();
import fs from 'node:fs';
import path from 'node:path';
import {createStorageCollector,createEvidenceFreshnessCollector} from './storage-collector.mjs';
import {runSafeLiveProbe} from './safe-live-probe.mjs';
import {runSafeDiscrepancyProbe} from './safe-discrepancy-probe.mjs';
import {createWorkerCollector,createInspectorCollector,createSpendingCollector} from './internal-collectors.mjs';
import Redis from 'ioredis';
import { AssuranceStore,runAssuranceCycle } from './independent-assurance.mjs';
import { createRuntimeCollector } from './runtime-collector.mjs';
import { assurancePaths,collectDurableOmissions } from './live-sources.mjs';

process.once('disconnect',()=>process.kill(process.pid,'SIGTERM'));

const intervalMs=300000,graceMs=120000;
const paths=assurancePaths(process.env.RAILWAY_VOLUME_MOUNT_PATH);
let store,redis,runtime,workers,scheduler,spending,persistence,freshness;
let stopping=false;for(const s of ['SIGTERM','SIGINT'])process.on(s,()=>{stopping=true;});
await capture.run(async()=>{
store=new AssuranceStore(paths.database);fs.chmodSync(paths.database,0o600);
redis=new Redis(process.env.REDIS_URL,{maxRetriesPerRequest:1,connectTimeout:5000,lazyConnect:true,enableOfflineQueue:false});
redis.on('error',()=>{console.error(JSON.stringify({event:'assurance_redis_unavailable',scope:'pillow-omissions'}));});
try{await redis.connect();}catch{console.error(JSON.stringify({event:'assurance_redis_connect_failed',remainingCollectorsContinue:true}));}
try{await runSafeLiveProbe();}catch{console.error(JSON.stringify({event:'safe_assurance_probe_failed',inferenceCalls:0,productionRecordsMutated:0}));}
try{await runSafeDiscrepancyProbe(process.env.RAILWAY_VOLUME_MOUNT_PATH);}catch{console.error(JSON.stringify({event:'safe_assurance_discrepancy_probe_failed',inferenceCalls:0,productionRecordsMutated:0}));}
runtime=createRuntimeCollector({origin:process.env.ASSURANCE_RUNTIME_ORIGIN,expectedRevision:process.env.RAILWAY_GIT_COMMIT_SHA});
workers=createWorkerCollector({origin:process.env.ASSURANCE_RUNTIME_ORIGIN});
scheduler=createInspectorCollector(paths.database+'.watchdog');
spending=createSpendingCollector(process.env.RAILWAY_VOLUME_MOUNT_PATH+'/commissioning/openai-october-2026.sqlite',store);
persistence=createStorageCollector(path.dirname(paths.reasoning));
freshness=createEvidenceFreshnessCollector(path.dirname(paths.reasoning));
});
capture.ready();
while(!stopping){
  const ran=await capture.run(async()=>{
  const now=Date.now(),slot=Math.floor(now/intervalMs)*intervalMs;
  // Start only inside the tolerance window; inspector will report missed slots.
  if(now-slot<graceMs && !store.db.prepare('SELECT id FROM assurance_cycles WHERE scheduled_at=?').get(slot)){
    try{
      const receipt=await runAssuranceCycle(store,{id:'cycle_'+slot,scheduledAt:slot,maxAgeMs:graceMs,timeoutMs:10000,collectors:Object.fromEntries(Object.entries({runtime,workers,scheduler,'authority-spending':spending,'evidence-freshness':freshness,'persistence-backups-recovery':persistence,'pillow-omissions':()=>collectDurableOmissions({redis,filename:paths.reasoning,resolutionDirectory:path.dirname(paths.reasoning)})}).map(([name,collect])=>[name,signal=>capture.track(()=>collect(signal))]))});
      console.log(JSON.stringify({event:'independent_assurance_cycle',slot,...receipt}));
    }catch{console.error(JSON.stringify({event:'independent_assurance_cycle_failed',slot}));}
  }
  });
  if(ran&&process.connected)process.send({type:'assurance_progress'},()=>{});
  await new Promise(r=>setTimeout(r,1000));
}
redis.disconnect();store.close();

// Release the referenced parent IPC channel after orderly observer shutdown.
if(process.connected)process.disconnect();

import fs from 'node:fs';
import {runSafeLiveProbe} from './safe-live-probe.mjs';
import {runSafeDiscrepancyProbe} from './safe-discrepancy-probe.mjs';
import {createWorkerCollector,createInspectorCollector,createSpendingCollector} from './internal-collectors.mjs';
import Redis from 'ioredis';
import { AssuranceStore,runAssuranceCycle } from './independent-assurance.mjs';
import { createRuntimeCollector } from './runtime-collector.mjs';
import { assurancePaths,collectDurableOmissions } from './live-sources.mjs';

const intervalMs=300000,graceMs=120000;
const paths=assurancePaths(process.env.RAILWAY_VOLUME_MOUNT_PATH);
const store=new AssuranceStore(paths.database);fs.chmodSync(paths.database,0o600);
const redis=new Redis(process.env.REDIS_URL,{maxRetriesPerRequest:1,connectTimeout:5000,lazyConnect:true,enableOfflineQueue:false});
await redis.connect();
try{await runSafeLiveProbe();}catch{console.error(JSON.stringify({event:'safe_assurance_probe_failed',inferenceCalls:0,productionRecordsMutated:0}));}
try{await runSafeDiscrepancyProbe(process.env.RAILWAY_VOLUME_MOUNT_PATH);}catch{console.error(JSON.stringify({event:'safe_assurance_discrepancy_probe_failed',inferenceCalls:0,productionRecordsMutated:0}));}
let stopping=false;for(const s of ['SIGTERM','SIGINT'])process.on(s,()=>{stopping=true;});
const runtime=createRuntimeCollector({origin:process.env.ASSURANCE_RUNTIME_ORIGIN,expectedRevision:process.env.RAILWAY_GIT_COMMIT_SHA});
const workers=createWorkerCollector({origin:process.env.ASSURANCE_RUNTIME_ORIGIN});
const scheduler=createInspectorCollector(paths.database+'.watchdog');
const spending=createSpendingCollector(process.env.RAILWAY_VOLUME_MOUNT_PATH+'/commissioning/openai-october-2026.sqlite',store);
while(!stopping){
  const now=Date.now(),slot=Math.floor(now/intervalMs)*intervalMs;
  // Start only inside the tolerance window; inspector will report missed slots.
  if(now-slot<graceMs && !store.db.prepare('SELECT id FROM assurance_cycles WHERE scheduled_at=?').get(slot)){
    try{
      const receipt=await runAssuranceCycle(store,{id:'cycle_'+slot,scheduledAt:slot,maxAgeMs:graceMs,timeoutMs:10000,collectors:{runtime,workers,scheduler,'authority-spending':spending,'pillow-omissions':()=>collectDurableOmissions({redis,filename:paths.reasoning})}});
      console.log(JSON.stringify({event:'independent_assurance_cycle',slot,...receipt}));
    }catch{console.error(JSON.stringify({event:'independent_assurance_cycle_failed',slot}));}
  }
  await new Promise(r=>setTimeout(r,1000));
}
redis.disconnect();store.close();

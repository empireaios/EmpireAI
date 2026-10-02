import fs from 'node:fs';
import Redis from 'ioredis';
import { AssuranceStore,runAssuranceCycle } from './independent-assurance.mjs';
import { createRuntimeCollector } from './runtime-collector.mjs';
import { assurancePaths,collectDurableOmissions } from './live-sources.mjs';

const intervalMs=300000,graceMs=120000;
const paths=assurancePaths(process.env.RAILWAY_VOLUME_MOUNT_PATH);
const store=new AssuranceStore(paths.database);fs.chmodSync(paths.database,0o600);
const redis=new Redis(process.env.REDIS_URL,{maxRetriesPerRequest:1,connectTimeout:5000,lazyConnect:true,enableOfflineQueue:false});
await redis.connect();
let stopping=false;for(const s of ['SIGTERM','SIGINT'])process.on(s,()=>{stopping=true;});
const runtime=createRuntimeCollector({origin:process.env.ASSURANCE_RUNTIME_ORIGIN,expectedRevision:process.env.RAILWAY_GIT_COMMIT_SHA});
while(!stopping){
  const now=Date.now(),slot=Math.floor(now/intervalMs)*intervalMs;
  // Start only inside the tolerance window; inspector will report missed slots.
  if(now-slot<graceMs && !store.db.prepare('SELECT id FROM assurance_cycles WHERE scheduled_at=?').get(slot)){
    try{
      const receipt=await runAssuranceCycle(store,{id:'cycle_'+slot,scheduledAt:slot,maxAgeMs:graceMs,timeoutMs:10000,collectors:{runtime,'pillow-omissions':()=>collectDurableOmissions({redis,filename:paths.reasoning})}});
      console.log(JSON.stringify({event:'independent_assurance_cycle',slot,...receipt}));
    }catch{console.error(JSON.stringify({event:'independent_assurance_cycle_failed',slot}));}
  }
  await new Promise(r=>setTimeout(r,1000));
}
redis.disconnect();store.close();

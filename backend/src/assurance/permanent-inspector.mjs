import { assurancePaths } from './live-sources.mjs';
import {runInspectorPass} from './inspector-cycle.mjs';
import {setTimeout as delay} from 'node:timers/promises';
const {database}=assurancePaths(process.env.RAILWAY_VOLUME_MOUNT_PATH);
const shutdown=new AbortController();
let stopping=false;for(const s of ['SIGTERM','SIGINT'])process.on(s,()=>{stopping=true;shutdown.abort();});
while(!stopping){
  try{
    const verdict=runInspectorPass(database);
    console.log(JSON.stringify({event:'independent_assurance_watchdog',...verdict}));
  }catch{
    console.log(JSON.stringify({event:'independent_assurance_watchdog',status:'SOURCE_UNAVAILABLE',healthy:false,observerFailed:true,heartbeatRenewed:false}));
  }
  await delay(30000,undefined,{signal:shutdown.signal}).catch(error=>{if(error.name!=='AbortError')throw error;});
}

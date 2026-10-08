import path from 'node:path';
import {AssuranceControlPlane,inspectControlPlaneMonitor} from './control-plane.mjs';
import { assurancePaths } from './live-sources.mjs';
import {runInspectorPass} from './inspector-cycle.mjs';
import {setTimeout as delay} from 'node:timers/promises';
const {database}=assurancePaths(process.env.RAILWAY_VOLUME_MOUNT_PATH);
const shutdown=new AbortController();
let stopping=false;for(const s of ['SIGTERM','SIGINT'])process.on(s,()=>{stopping=true;shutdown.abort();});
let controlPlane=null;
try{if(process.env.RAILWAY_GIT_COMMIT_SHA)controlPlane=new AssuranceControlPlane({root:path.dirname(database),revision:process.env.RAILWAY_GIT_COMMIT_SHA});}catch{}
while(!stopping){
  if(controlPlane){try{
    inspectControlPlaneMonitor(controlPlane);
  }catch{console.error(JSON.stringify({event:'assurance_control_plane_supervision_failed'}));}}

  try{
    const verdict=runInspectorPass(database);
    console.log(JSON.stringify({event:'independent_assurance_watchdog',...verdict}));
  }catch{
    console.log(JSON.stringify({event:'independent_assurance_watchdog',status:'SOURCE_UNAVAILABLE',healthy:false,observerFailed:true,heartbeatRenewed:false}));
  }
  await delay(30000,undefined,{signal:shutdown.signal}).catch(error=>{if(error.name!=='AbortError')throw error;});
}

controlPlane?.close();

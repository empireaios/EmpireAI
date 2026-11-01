import {createRequire} from 'node:module';
const {installObserverParticipant}=createRequire(import.meta.url)('../../../deployment/observer-capture.cjs');
const capture=installObserverParticipant();
import path from 'node:path';
import {AssuranceControlPlane,inspectControlPlaneMonitor} from './control-plane.mjs';
import { assurancePaths } from './live-sources.mjs';
import {runInspectorPass} from './inspector-cycle.mjs';
import {waitForAssuranceSchema} from './schema-readiness.mjs';
import {setTimeout as delay} from 'node:timers/promises';
const root=process.env.RAILWAY_VOLUME_MOUNT_PATH;
const {database}=assurancePaths(root);
const shutdown=new AbortController();
let stopping=false;for(const s of ['SIGTERM','SIGINT'])process.on(s,()=>{stopping=true;shutdown.abort();});
process.once('disconnect',()=>{stopping=true;shutdown.abort();});
let controlPlane=null;
try{if(process.env.RAILWAY_GIT_COMMIT_SHA)controlPlane=new AssuranceControlPlane({root:path.dirname(database),revision:process.env.RAILWAY_GIT_COMMIT_SHA});}catch{}
capture.ready();
const {installDiscrepancyReader}=createRequire(import.meta.url)('../../../deployment/assurance-discrepancy-readback.cjs');
// Standalone watchdog execution has no parent IPC. It must retain its existing
// observation behavior; optional discrepancy readback remains unavailable.
const closeDiscrepancyReader=process.connected?installDiscrepancyReader({root,capture}):()=>{};
while(!stopping){
  const ran=await capture.run(async()=>{
  if(controlPlane){try{
    inspectControlPlaneMonitor(controlPlane);
  }catch{console.error(JSON.stringify({event:'assurance_control_plane_supervision_failed'}));}}

  try{
    await waitForAssuranceSchema(database,{signal:shutdown.signal});
    const verdict=runInspectorPass(database);
    console.log(JSON.stringify({event:'independent_assurance_watchdog',...verdict}));
  }catch(error){
    console.log(JSON.stringify({event:'independent_assurance_watchdog',status:'SOURCE_UNAVAILABLE',healthy:false,observerFailed:true,heartbeatRenewed:false,failureCode:typeof error?.code==='string'?error.code:'INSPECTOR_PASS_FAILED'}));
  }
  });
  if(ran&&process.connected)process.send({type:'assurance_progress'},()=>{});
  await delay(30000,undefined,{signal:shutdown.signal}).catch(error=>{if(error.name!=='AbortError')throw error;});
}

closeDiscrepancyReader();
controlPlane?.close();

// Release the referenced parent IPC channel after orderly observer shutdown.
if(process.connected)process.disconnect();

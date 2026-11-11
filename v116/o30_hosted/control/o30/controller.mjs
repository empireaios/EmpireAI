import {createHash,createHmac} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {recoverReceipts} from './recovery.mjs';
const require=createRequire(import.meta.url);
export const CONTROLLER_SOURCE=Object.freeze({supervisor:'e49baca21653562b3c00532907762027a4782473c14ba12b0d4fca9719daec21',capture:'c9513c42c917b774b605a7d2e5cd454d01d7cc88dcd7508bf341cfed8272bc1b',discrepancy:'06458c2b2eecfda41708729c0d7ba4f19dc37c913a0c71e3f4e9d15049a3139f'});
const hash=b=>createHash('sha256').update(b).digest('hex');
const components=new Set(['permanent-worker.mjs','permanent-inspector.mjs']);
const faults=new Set(['assurance_restart_quarantined','assurance_process_unavailable','assurance_process_exit']);
// Pure source binding and receipt projection are reusable by a sender-free diagnostic.
// Neither grants Campaign authority, starts a supervisor, signs an owner ACK or sends.
export async function verifySupervisorSource(supervisorPath=fileURLToPath(new URL('./vendor/assurance-supervisor.cjs',import.meta.url))){
 const path=resolve(supervisorPath),directory=dirname(path);
 // Hash the exact file that require(path) will load, including alternate names.
 if(hash(await readFile(path))!==CONTROLLER_SOURCE.supervisor)throw Error('Supervisor identity mismatch');
 for(const [name,pin] of [['assurance-supervisor.cjs',CONTROLLER_SOURCE.supervisor],['observer-capture.cjs',CONTROLLER_SOURCE.capture],['assurance-discrepancy-readback.cjs',CONTROLLER_SOURCE.discrepancy]]){
  if(hash(await readFile(join(directory,name)))!==pin)throw Error('Supervisor identity mismatch');
 }
 const {superviseAssurance}=require(path);
 if(typeof superviseAssurance!=='function')throw Error('Supervisor API unavailable');
 return {path,superviseAssurance};
}
export function createWatchdogFaultReceipt({event,campaignId,observerId,targetOrigin,receivedAt,reference}){
 if(!faults.has(event?.event)||!components.has(event.component)||!Number.isFinite(receivedAt)||!Number.isFinite(reference))throw Error('Invalid watchdog source receipt');
 return {campaign:campaignId,kind:'fault',incidentId:campaignId,observedAt:new Date(receivedAt).toISOString(),faultAt:new Date(reference).toISOString(),evidenceRef:'controller/fault-source',observerId,component:event.component,watchdogEvent:event.event,reason:event.reason??(event.event==='assurance_process_exit'?'PROCESS_EXIT':'PROCESS_UNAVAILABLE'),referenceEvent:event.reason==='NO_PROGRESS'?'LAST_PROGRESS_RECEIVED':event.event==='assurance_process_exit'?'PROCESS_EXIT_CALLBACK':'PROCESS_UNAVAILABLE_CALLBACK',targetOrigin,supervisorSha256:CONTROLLER_SOURCE.supervisor};
}
function signed(event,secret,now){
 if(!secret?.startsWith('whsec_'))throw Error('Observer binding unavailable');
 const raw=JSON.stringify(event),id='watchdog-fault',ts=String(Math.floor(now/1000));
 return [raw,{'svix-id':id,'svix-timestamp':ts,'svix-signature':'v1,'+createHmac('sha256',Buffer.from(secret.slice(6),'base64')).update(`${id}.${ts}.${raw}`).digest('base64')}];
}
// Explicit invocation only: importing this module never starts a supervisor or sends.
// This is a supervisor-event bridge, not an independent whole-host heartbeat monitor.
export async function startWatchdogController({campaign,supervisorPath=fileURLToPath(new URL('./vendor/assurance-supervisor.cjs',import.meta.url)),runtimeRoot,isolatedOrigin,env={},spawnImpl=spawn,clock=Date.now,monotonic=()=>performance.now()}){
 campaign.gate();
 const a=campaign.approval;
 if(a.controllerAllowed!==true||a.isolatedTargetOrigin!==isolatedOrigin||!Number.isSafeInteger(a.maxControllerLifetimeMs)||a.maxControllerLifetimeMs<=0||a.maxControllerLifetimeMs>1800000)throw Error('Controller operating binding absent');
 if(a.schedulerAllowed===true&&(!Number.isSafeInteger(a.schedulerIntervalMs)||a.schedulerIntervalMs<100||a.schedulerIntervalMs>60000))throw Error('Invalid scheduler interval');
 const target=new URL(isolatedOrigin);
 if(target.protocol!=='https:'||target.username||target.password||target.pathname!=='/'||target.search||target.hash||target.port||target.origin.includes('empireai-locked-runtime-production'))throw Error('Explicit isolated target required');
 if(!runtimeRoot)throw Error('Retained runtime root required');
 await Promise.all([...components].map(c=>readFile(join(runtimeRoot,'backend/src/assurance',c))));
 const {superviseAssurance}=await verifySupervisorSource(supervisorPath);
 const startedWall=clock(),startedMono=monotonic(),progress=new Map();
 let stopped=false,failed=false,stopSupervisor=()=>{},queue=Promise.resolve(),pending=0,interval;
 const now=()=>{
  const wall=clock(),elapsed=monotonic()-startedMono;
  if(elapsed<0||Math.abs((wall-startedWall)-elapsed)>2000)throw Error('Controller clock discontinuity');
  return wall;
 };
 const stop=()=>{if(stopped)return;stopped=true;clearTimeout(lifetime);clearInterval(interval);stopSupervisor();};
 const enqueue=task=>{
  if(stopped||failed)return;
  if(++pending>8){failed=true;stop();return;}
  // Attach a rejection handler immediately so synchronous supervisor callbacks cannot
  // create an unhandled rejection or silently retry a failed provider attempt.
  queue=queue.then(task).catch(()=>{failed=true;stop();}).finally(()=>pending--);
 };
 const lifetime=setTimeout(stop,a.maxControllerLifetimeMs);
 const deliver=async source=>{
  await recoverReceipts(campaign);
  await campaign.observation(...signed(source,campaign.observerSecret,now()));
  if(stopped||monotonic()-startedMono>=a.maxControllerLifetimeMs){stop();throw Error('Controller stopped before dispatch');}
  return campaign.dispatch('fault');
 };
 // Restart continues exactly the retained source identity and the burned phase guard.
 let prior;try{prior=await campaign.get('controller/fault-source');}catch{stop();throw Error('Controller state unavailable');}
 try{
  const startRecord={campaign:campaign.manifest.id,targetOrigin:target.origin,supervisorSha256:CONTROLLER_SOURCE.supervisor,startedAt:new Date(startedWall).toISOString()};
  const firstStart=await campaign.store.create(campaign.path('controller/started'),startRecord);
  const retainedStart=await campaign.get('controller/started');
  if(!retainedStart||retainedStart.campaign!==startRecord.campaign||retainedStart.targetOrigin!==target.origin||retainedStart.supervisorSha256!==CONTROLLER_SOURCE.supervisor||(firstStart&&retainedStart.startedAt!==startRecord.startedAt))throw Error('Controller start identity conflict');
  // The retained supervisor restarts its own no-progress timer. Without a durable
  // fault reference, restarting it would silently reset the detection deadline.
  if(!firstStart&&!prior)throw Error('Pre-fault progress continuity unknown; independent rebaseline required');
 }catch{stop();throw Error('Controller continuity unavailable; no timer reset authorised');}

 if(prior){
  try{await deliver(prior);}catch{stop();throw Error('Controller resume refused or uncertain');}
 }
 const runTick=async()=>{
  if(stopped)return;
  if(now()>=Date.parse(a.expiresAt)||monotonic()-startedMono>=a.maxControllerLifetimeMs){stop();return;}
  campaign.gate();
  await recoverReceipts(campaign);
  const incident=await campaign.get('observations/incident');
  if(!incident)return;
  const fault=await campaign.get('fault/reservation');
  if(!fault)return;
  const recovery=await campaign.get('observations/recovery');
  if(recovery){
   if(!await campaign.get('recovery/reservation')){
    if(stopped)return;
    await campaign.dispatch('recovery');
   }
   return;
  }
  if(await campaign.get('observations/ack')||await campaign.get('escalation/reservation'))return;
  const t=campaign.manifest.timing;
  const decision=t.referenceEventVersion==='O30-PROSPECTIVE-V1'?await campaign.get('fault/decision'):null;
  const origin=Date.parse(t.referenceEventVersion==='O30-PROSPECTIVE-V1'?decision?.committedAt:incident.observedAt);
  if(!Number.isFinite(origin))throw Error('Escalation origin unavailable');
  if(now()<origin+t.acknowledgementMs)return;
  if(now()>origin+t.acknowledgementMs+t.escalationMs){
   const key='controller/missed-escalation';
   await campaign.store.create(campaign.path(key),{status:'MISSED_DEADLINE',phase:'escalation',deadline:new Date(origin+t.acknowledgementMs+t.escalationMs).toISOString(),observedAt:new Date(now()).toISOString()});
   throw Error('Escalation deadline missed; no late retry');
  }
  if(stopped)return;
  await campaign.dispatch('escalation');
 };
 const tick=async()=>{
  if(stopped)throw Error('Controller stopped');
  if(a.schedulerAllowed!==true)throw Error('Scheduler operating binding absent');
  enqueue(runTick);await queue;
  if(failed)throw Error('Controller failed closed; no automatic retry');
 };
 const trackedSpawn=(command,args,options)=>{
  const component=args[0]?.split('/').at(-1);
  const at=now();progress.set(component,{at,monotonic:monotonic()});
  const child=spawnImpl(command,args,options);
  child.on('message',message=>{try{if(message?.type==='assurance_progress'&&components.has(component))progress.set(component,{at:now(),monotonic:monotonic()});}catch{failed=true;stop();}});
  return child;
 };
 const onEvent=event=>{
  if(!faults.has(event.event)||!components.has(event.component)||stopped)return;
  let receivedAt;try{receivedAt=now();}catch{failed=true;stop();return;}const last=progress.get(event.component);
  const reference=event.reason==='NO_PROGRESS'?last?.at:receivedAt;
  if(!Number.isFinite(reference)){failed=true;stop();return;}
  const source=createWatchdogFaultReceipt({event,campaignId:campaign.manifest.id,observerId:a.observerId,targetOrigin:target.origin,receivedAt,reference});
  enqueue(async()=>{
   if(stopped)return;
   // First fault defines this one-incident examination. Concurrent or subsequent
   // supervisor notices cannot rewrite its source chronology.
   await campaign.store.create(campaign.path('controller/fault-source'),source);
   const retained=await campaign.get('controller/fault-source');
   if(!retained||retained.campaign!==source.campaign||retained.targetOrigin!==target.origin||retained.supervisorSha256!==CONTROLLER_SOURCE.supervisor)throw Error('Controller source conflict');
   await deliver(retained);
  });
 };
 try{
  stopSupervisor=superviseAssurance({cwd:resolve(runtimeRoot),env:{...env,ASSURANCE_RUNTIME_ORIGIN:target.origin},spawnImpl:trackedSpawn,onEvent,clock:now});
  if(stopped)stopSupervisor();
 }catch{stop();throw Error('Supervisor startup refused');}
 if(a.schedulerAllowed===true){
  if(!stopped)interval=setInterval(()=>{void tick().catch(()=>{failed=true;stop();});},a.schedulerIntervalMs);
 }
 return {stop,tick,async drain(){await queue;if(failed)throw Error('Controller failed closed; no automatic retry');},status:()=>({stopped,failed,pending,source:CONTROLLER_SOURCE.supervisor}),attachRuntime:child=>{if(stopped)throw Error('Controller stopped');stopSupervisor.attachRuntime(child);}};
}

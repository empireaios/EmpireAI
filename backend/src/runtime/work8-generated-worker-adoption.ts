import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {performance} from 'node:perf_hooks';
const require=createRequire(import.meta.url);
export type GeneratedWorkerAdoption=Readonly<{examination:'NEW_GENERATED_WORKER'}>;
type RootIdentity={path:string;dev:number;ino:number};
type State={child:ChildProcess;pid:number;start:string;source:string;runId:string;volume:RootIdentity;capture:RootIdentity;redisPort:number;used:boolean;admitted:boolean;ready:boolean;captureRequested:boolean;pending?:{resolve:(notice:Readonly<Record<string,unknown>>)=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>;sentAt:number}};
const states=new WeakMap<GeneratedWorkerAdoption,State>();
/** Trusted entry handles SIGTERM by killing its Redis before exiting. Preserve
 * a bounded forced stop if that cleanup cannot complete; outer cohort remains
 * the final independent no-survivor authority. */
function terminateGeneratedChild(child:ChildProcess){
 if(child.exitCode!==null||child.signalCode!==null)return;
 const forced=setTimeout(()=>child.kill('SIGKILL'),250);forced.unref();
 child.once('exit',()=>clearTimeout(forced));
 child.kill('SIGTERM');
}

function isolated(){
 assert.equal(process.env.NODE_ENV,'test');assert.equal(process.env.EMPIRE_ENGINEERING_TEST_MODE,'true');
 for(const name of ['RAILWAY_DEPLOYMENT_ID','RAILWAY_ENVIRONMENT','RAILWAY_ENVIRONMENT_NAME','VERCEL'])assert.ok(!process.env[name],'EXAM_DEPLOYMENT_REFUSED');
 for(const [name,value]of Object.entries(process.env))if(value&&/(?:API_KEY|ACCESS_TOKEN|SECRET_ACCESS_KEY|PROXY)$/i.test(name))throw Error('EXAM_EXTERNAL_CREDENTIAL');
 assert.equal(fs.readFileSync('/proc/net/route','utf8').trim().split('\n').length,1);
 assert.ok(fs.readFileSync('/proc/net/ipv6_route','utf8').trim().split('\n').every(row=>!row||row.trim().endsWith('lo')));
}
const startTime=(pid:number)=>fs.readFileSync('/proc/'+pid+'/stat','utf8').split(') ').at(-1)!.split(' ')[19]!;
function rootIdentity(filename:string):RootIdentity{assert.equal(fs.realpathSync(filename),filename);const st=fs.lstatSync(filename);assert.ok(st.isDirectory()&&!st.isSymbolicLink());return {path:filename,dev:st.dev,ino:st.ino};}
function live(s:State){isolated();assert.equal(s.child.pid,s.pid);assert.equal(s.child.exitCode,null);assert.equal(s.child.signalCode,null);assert.equal(s.child.connected,true);assert.equal(startTime(s.pid),s.start);for(const root of [s.volume,s.capture])assert.deepEqual(rootIdentity(root.path),root);}
/** Factory alone mints authority. No caller root/PID/entrypoint is accepted. */
export async function spawnGeneratedExaminationWorker(onReady?:(notice:Readonly<Record<string,unknown>>)=>void):Promise<GeneratedWorkerAdoption>{
 isolated();for(const name of ['DATABASE_PATH','RAILWAY_VOLUME_MOUNT_PATH','SHADOW_CEO_DATA_DIR','EMPIRE_DATA_DIR'])assert.ok(!process.env[name],'EXAM_PRECONFIGURED_ROOT_REFUSED');
 const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
 const source=require(path.join(repo,'deployment/runtime-revision.cjs')).resolveRuntimeRevision(repo,undefined) as string;assert.match(source,/^[a-f0-9]{40}$/);
 const entry=path.join(repo,'scripts/work8/hh4-generated-worker.mjs');assert.equal(fs.realpathSync(entry),entry);
 const child=spawn(process.execPath,[entry],{stdio:['ignore','inherit','inherit','ipc'],env:{PATH:process.env.PATH,NODE_ENV:'test',EMPIRE_ENGINEERING_TEST_MODE:'true',HH4_SOURCE:source,HOME:'/tmp',TMPDIR:'/tmp'}});
 try{
  const message=await new Promise<Record<string,unknown>>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('EXAM_ROOT_HANDSHAKE_TIMEOUT')),10000);const done=(error?:Error,value?:Record<string,unknown>)=>{clearTimeout(timer);child.off('error',failed);child.off('exit',exited);child.off('message',received);error?reject(error):resolve(value!);};const failed=(error:Error)=>done(error),exited=()=>done(Error('EXAM_WORKER_DIED_BEFORE_HANDSHAKE'));const received=(value:unknown)=>{const v=value as Record<string,unknown>;if(v?.event!=='hh4-new-root')return done(Error('EXAM_BAD_HANDSHAKE'));done(undefined,v);};child.once('error',failed);child.once('exit',exited);child.once('message',received);});
  assert.equal(message.source,source);assert.match(String(message.runId),/^[a-f0-9-]{36}$/);assert.ok(Number.isSafeInteger(message.redisPort)&&Number(message.redisPort)>1024&&Number(message.redisPort)<65536);
  const volume=rootIdentity(String(message.volumeRoot)),capture=rootIdentity(String(message.captureRoot)),run=path.dirname(volume.path);
  assert.equal(path.dirname(run),fs.realpathSync(os.tmpdir()));assert.ok(path.basename(run).startsWith('work8-generated-capture-'));assert.equal(volume.path,path.join(run,'volume'));assert.equal(capture.path,path.join(run,'capture'));assert.deepEqual(fs.readdirSync(volume.path),[]);assert.deepEqual(fs.readdirSync(capture.path),[]);assert.deepEqual(fs.readdirSync(run).sort(),['capture','volume']);assert.equal(fs.statSync(run).uid,process.getuid!());assert.equal(fs.statSync(run).mode&0o777,0o700);
  const capability=Object.freeze({examination:'NEW_GENERATED_WORKER' as const}),s:State={child,pid:child.pid!,start:startTime(child.pid!),source,runId:String(message.runId),volume,capture,redisPort:Number(message.redisPort),used:false,admitted:false,ready:false,captureRequested:false};live(s);
  // Validate empty roots and actual child before preparing infrastructure.
  // Redis may now start; index and business writers still await final admission.
  await new Promise<void>((resolve,reject)=>{
   let settled=false;
   const done=(error?:Error)=>{if(settled)return;settled=true;clearTimeout(timer);child.off('message',receive);child.off('exit',exited);child.off('error',failed);child.off('disconnect',disconnected);error?reject(error):resolve();};
   const receive=(value:unknown)=>{try{live(s);assert.deepEqual(value,{event:'hh4-infrastructure-ready',runId:s.runId,source:s.source,redisPort:s.redisPort});done();}catch(error){done(error instanceof Error?error:Error(String(error)));}};
   const exited=()=>done(Error('EXAM_INFRASTRUCTURE_WORKER_EXIT')),failed=(error:Error)=>done(error),disconnected=()=>done(Error('EXAM_INFRASTRUCTURE_DISCONNECTED'));
   const timer=setTimeout(()=>done(Error('EXAM_INFRASTRUCTURE_TIMEOUT')),10000);
   child.once('message',receive);child.once('exit',exited);child.once('error',failed);child.once('disconnect',disconnected);
   try{child.send({action:'hh4-prepare-infrastructure',runId:s.runId,source:s.source},error=>{if(error)done(error);});}catch(error){done(error instanceof Error?error:Error(String(error)));}
  });
  live(s);states.set(capability,s);
  const terminalCapture=(error:Error)=>{if(s.pending){clearTimeout(s.pending.timer);s.pending.reject(error);s.pending=undefined;}terminateGeneratedChild(child);};
  for(const event of ['exit','error','disconnect'] as const)child.once(event,()=>{if(s.pending)terminalCapture(Error('EXAM_CAPTURE_WORKER_'+event.toUpperCase()));});
  let readyReported=false;
  child.on('message',value=>{const v=value as Record<string,unknown>;
   if(v?.event==='hh4-new-root'||v?.event==='hh4-infrastructure-ready'){terminateGeneratedChild(child);return;}
   if(v?.event==='hh4-failed'){if(v.runId===s.runId&&v.source===s.source)terminalCapture(Error('EXAM_WORKER_CAPTURE_FAILED: '+String(v.error)));else terminalCapture(Error('EXAM_UNBOUND_CAPTURE_FAILURE'));return;}
   if(v?.event==='hh4-held'){
    try{live(s);const pending=s.pending;assert.ok(pending&&s.captureRequested&&s.ready,'EXAM_UNSOLICITED_HELD');
     assert.equal(v.runId,s.runId);assert.equal(v.source,s.source);const notice=v.notice as Record<string,unknown>;
     assert.match(String(notice.runId),/^[a-f0-9-]{36}$/);assert.equal(notice.directory,path.join(s.capture.path,'capture'));assert.match(String(notice.digest),/^[a-f0-9]{64}$/);assert.equal(notice.bootAllowed,false);assert.equal(notice.completeLiveState,false);
     assert.ok(Number.isSafeInteger(notice.expiresAt));const remaining=Number(notice.expiresAt)-Date.now();assert.ok(remaining>250&&remaining<=5000,'EXAM_HELD_DEADLINE');assert.ok(performance.now()-pending.sentAt<30000,'EXAM_CAPTURE_RESPONSE_DEADLINE');
     clearTimeout(pending.timer);s.pending=undefined;pending.resolve(Object.freeze({...notice,scopeRunId:notice.runId,runId:s.runId,source:s.source,workerPid:s.pid,workerStartTicks:s.start,receivedAt:Date.now(),remainingMs:remaining}));
    }catch(error){terminalCapture(error instanceof Error?error:Error(String(error)));}return;
   }
   if(v?.event!=='hh4-worker-ready')return;
   try{live(s);assert.equal(s.admitted,true);assert.equal(readyReported,false);assert.equal(v.runId,s.runId);assert.equal(v.source,s.source);assert.equal(v.stage,'ACTUAL_INDEX_STARTUP_COMPLETE');readyReported=true;s.ready=true;onReady?.(Object.freeze({...v,workerPid:s.pid,workerStartTicks:s.start}));}
   catch(error){console.error('HH4_READY_RELAY_FAILED',String(error));terminateGeneratedChild(child);}
  });
  Object.assign(process.env,{RAILWAY_VOLUME_MOUNT_PATH:volume.path,DATABASE_PATH:path.join(volume.path,'commissioning','empireai-brain.db'),SHADOW_CEO_DATA_DIR:path.join(volume.path,'shadow'),REDIS_URL:'redis://127.0.0.1:'+s.redisPort,REDIS_OPTIONAL:'false',EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1'});
  return capability;
 }catch(error){terminateGeneratedChild(child);throw error;}
}
/** Called only by actual Tier0 before it opens stores or admits writers. */
export function consumeGeneratedWorker(capability:GeneratedWorkerAdoption){
 const s=states.get(capability);assert.ok(s&&!s.used,'EXAM_UNKNOWN_OR_CONSUMED');live(s);assert.equal(process.env.RAILWAY_VOLUME_MOUNT_PATH,s.volume.path);s.used=true;
 return Object.freeze({child:s.child,runId:s.runId,source:s.source,
  admit(){live(s);assert.equal(s.admitted,false);s.admitted=true;s.child.send({action:'hh4-admit',runId:s.runId,source:s.source});},
  terminal(error:unknown):never{process.send?.({event:'hh4-terminal-cohort-failure',runId:s.runId,error:String(error)});try{terminateGeneratedChild(s.child);}finally{process.kill(process.pid,'SIGKILL');}throw Error('EXAM_TERMINATION_FAILED');}
 });
}

/** Fixed examination entry only. No path, PID or serialized scope is accepted. */
export function requestGeneratedCapture(capability:GeneratedWorkerAdoption):Promise<Readonly<Record<string,unknown>>>{
 const s=states.get(capability);assert.ok(s&&s.used&&s.admitted&&s.ready&&!s.captureRequested,'EXAM_CAPTURE_NOT_READY_OR_USED');live(s);s.captureRequested=true;
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{s.pending=undefined;terminateGeneratedChild(s.child);reject(Error('EXAM_CAPTURE_RESPONSE_TIMEOUT'));},30000);
  s.pending={resolve,reject,timer,sentAt:performance.now()};
  s.child.send({action:'hh4-capture',runId:s.runId,source:s.source},error=>{if(error&&s.pending){clearTimeout(timer);s.pending=undefined;terminateGeneratedChild(s.child);reject(error);}});
 });
}

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {once} from 'node:events';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {verifySupervisorSource,createWatchdogFaultReceipt,CONTROLLER_SOURCE} from './o30/controller.mjs';
import {requireOperatingControls} from './o30/runtime-policy.mjs';

// This is a real-process, sender-free component examination. No Campaign is
// constructed; no progress, clock, native timer, datastore or child is mocked.
const app='/app',evidence='/evidence',root='/tmp/v116-o30-volume',redisRoot='/tmp/v116-o30-redis';
const expectedSource='6c1e63ba20619ee480742fd87dc810ca93152e22';
const id='V116_O30_NATIVE_TIMERS_'+randomUUID();
const sha=b=>createHash('sha256').update(b).digest('hex');
const at=()=>({utc:new Date().toISOString(),wallMs:Date.now(),monotonicMs:performance.now()});
const bootId=fs.readFileSync('/proc/sys/kernel/random/boot_id','utf8').trim();assert.match(bootId,/^[a-f0-9-]{36}$/);
function processIdentity(pid){const raw=fs.readFileSync('/proc/'+pid+'/stat','utf8'),fields=raw.slice(raw.lastIndexOf(')')+2).trim().split(/\s+/);const startTicks=Number(fields[19]);assert.ok(Number.isSafeInteger(startTicks)&&startTicks>0);return{pid,bootId,startTicks};}
const sourceInputs=JSON.parse(fs.readFileSync('/control/source-inputs.json','utf8'));
const report={schema:'v116-o30-authentic-native-timing-v1',scenarioId:id,status:'FAIL_CLOSED',sourceCommit:expectedSource,bootId,probeIdentity:processIdentity(process.pid),started:at(),nativeTimersUnchanged:{worker:600000,inspector:90000},originalDetectionBounds:{worker:660000,inspector:120000,processExit:30000},fullO30CampaignStarted:false,fullO30Accepted:false,actualOwnerImported:false,productionAccess:false,messagesSent:0,providerCalls:0,ownerACK:false,healthyRuntimeClaim:false};
const journalPath=path.join(evidence,'native-event-journal.jsonl');const journal=fs.openSync(journalPath,'wx',0o600);
let journalBytes=0,stop,redis,failed,deadlineTimer,startupTimer,finished=false,barrierScheduled=false;
const children=[],events=[],faults=[];const pending=new Map();let resolveDone,rejectDone;
const done=new Promise((resolve,reject)=>{resolveDone=resolve;rejectDone=reject;});
done.catch(()=>{}); // preserve any early output failure until the explicit await
function record(kind,body={}){const row={sequence:events.length+1,kind,...at(),...body};const line=JSON.stringify(row)+'\n';assert.ok(journalBytes+Buffer.byteLength(line)<=1048576,'JOURNAL_SIZE_LIMIT');fs.writeSync(journal,line);fs.fsyncSync(journal);journalBytes+=Buffer.byteLength(line);events.push(row);return row;}
function abort(error){if(failed||finished)return;failed=error;rejectDone(error);}
function attachOutput(child,label,max=1048576){
 const filename=path.join(evidence,label+'.log'),fd=fs.openSync(filename,'wx',0o600);let bytes=0,closed=false;
 const handle=chunk=>{try{const room=Math.max(0,max-bytes);if(room)fs.writeSync(fd,chunk.subarray(0,room));bytes+=Math.min(room,chunk.length);if(chunk.length>room)abort(Error('CHILD_OUTPUT_LIMIT:'+label));}catch(error){abort(error);}};
 child.stdout?.on('data',handle);child.stderr?.on('data',handle);child.once('close',()=>{if(!closed){fs.fsyncSync(fd);fs.closeSync(fd);closed=true;}});
 return()=>({filename:path.basename(filename),bytes});
}
function maybeStopAfterAcceptedProgress(){
 if(barrierScheduled||children.length!==2||children.some(x=>!x.lastProgress))return;
 barrierScheduled=true;
 // Run after all listeners on the genuine IPC event have completed. The native
 // supervisor's own listener has accepted and armed its unchanged timer.
 setImmediate(()=>{try{
  assert.ok(!failed&&children.every(x=>x.child.exitCode===null&&x.child.connected));
  clearTimeout(startupTimer);
  for(const entry of children){
   assert.ok(entry.lastProgress&&entry.nativeListenerPrecedesObserver);
   assert.deepEqual(processIdentity(entry.child.pid),entry.identity);
   const sent=entry.child.kill('SIGSTOP');assert.equal(sent,true);
   entry.stopSignal=record('fault_injected_SIGSTOP',{component:entry.component,pid:entry.child.pid,lastAcceptedProgress:entry.lastProgress,signalDelivered:true});
  }
 }catch(error){abort(error);}});
}
function actualSpawn(command,args,options){
 assert.equal(command,process.execPath);assert.equal(options.cwd,app);
 const component=path.basename(args[0]);assert.ok(['permanent-worker.mjs','permanent-inspector.mjs'].includes(component));
 assert.equal(args[0],'backend/src/assurance/'+component);assert.equal(options.env.RAILWAY_VOLUME_MOUNT_PATH,root);
 assert.equal(options.env.ASSURANCE_RUNTIME_ORIGIN,'https://127.0.0.1');assert.equal(options.env.RAILWAY_GIT_COMMIT_SHA,expectedSource);
 assert.ok(!children.some(x=>x.component===component),'Unexpected native restart; quarantine must remain final');
 const child=spawn(command,args,{...options,stdio:['ignore','pipe','pipe','ipc']});
 const identity=processIdentity(child.pid);
 const entry={child,component,pid:child.pid,identity,spawned:record('actual_child_spawn',{component,identity,command,args}),progressCount:0,lastProgress:null,stopSignal:null,osStopped:null,quarantine:null,exitObservation:null,nativeExit:null,nativeListenerPrecedesObserver:false};children.push(entry);entry.output=attachOutput(child,component.replace('.mjs',''));
 // This observer sees the OS child exit before the supervisor receives the same
 // ChildProcess exit event. It does not synthesize, delay or suppress that event.
 child.once('exit',(code,signal)=>{entry.exitObservation=record('actual_child_exit',{component,identity,code,signal});});
 child.once('error',error=>abort(Error('ACTUAL_CHILD_SPAWN_FAILED:'+component+':'+error.message)));
 queueMicrotask(()=>{
  entry.nativeListenerPrecedesObserver=child.listenerCount('message')>=2;
  child.on('message',message=>{try{
   if(message?.type!=='assurance_progress')return;
   assert.ok(entry.nativeListenerPrecedesObserver&&!entry.quarantine);
   assert.deepEqual(processIdentity(child.pid),identity);
   entry.progressCount++;
   entry.lastProgress=record('authentic_native_IPC_progress_accepted',{component,identity,childConnected:child.connected,nativeListenerPrecedesObserver:true});
   maybeStopAfterAcceptedProgress();
  }catch(error){abort(error);}});
 });
 return child;
}
function onSupervisorEvent(event){try{
 const entry=children.find(x=>x.component===event.component);assert.ok(entry);
 const observation=record('actual_supervisor_event',{event,component:entry.component,pid:entry.child.pid});
 if(event.event==='assurance_restart_quarantined'){
  assert.equal(event.reason,'NO_PROGRESS');assert.equal(event.monitoringCoverage,'LOST');assert.ok(entry.lastProgress&&entry.stopSignal&&entry.osStopped,'GENUINE_PROGRESS_AND_OS_STOP_REQUIRED');
  const elapsed=observation.monotonicMs-entry.lastProgress.monotonicMs;const worker=entry.component==='permanent-worker.mjs';
  const native=worker?600000:90000,bound=worker?660000:120000;
  assert.ok(elapsed>=native-1000&&elapsed<=bound,'NATIVE_NO_PROGRESS_TIMING_BOUND:'+elapsed);
  entry.quarantine={observation,elapsedSinceLastProgressMs:elapsed,nativeThresholdMs:native,approvedBoundMs:bound};
  const fault=createWatchdogFaultReceipt({event,campaignId:id,observerId:'V116_REAL_PROCESS_TIMING_OBSERVER',targetOrigin:'https://127.0.0.1',receivedAt:observation.wallMs,reference:entry.lastProgress.wallMs});faults.push(fault);record('source_bound_fault_projection',{fault});
 }else if(event.event==='assurance_process_exit'){
  assert.ok(entry.quarantine&&entry.exitObservation,'UNEXPECTED_EXIT_BEFORE_NATIVE_NO_PROGRESS_QUARANTINE');assert.equal(event.signal,'SIGKILL');assert.equal(entry.exitObservation.signal,'SIGKILL');assert.equal(entry.exitObservation.code,null);
  const elapsed=observation.monotonicMs-entry.exitObservation.monotonicMs;assert.ok(elapsed>=0&&elapsed<=30000);
  entry.nativeExit={observation,elapsedFromOSExitObservationMs:elapsed,approvedBoundMs:30000};
  faults.push(createWatchdogFaultReceipt({event,campaignId:id,observerId:'V116_REAL_PROCESS_TIMING_OBSERVER',targetOrigin:'https://127.0.0.1',receivedAt:observation.wallMs,reference:entry.exitObservation.wallMs}));
  if(children.length===2&&children.every(x=>x.quarantine&&x.nativeExit))resolveDone();
 }else throw Error('UNEXPECTED_NATIVE_SUPERVISOR_EVENT:'+event.event);
}catch(error){abort(error);}}
try{
 report.stage='verify_exact_source_and_full_campaign_refusal';assert.equal(process.versions.node,'22.23.2');
 for(const [relative,digest]of Object.entries(sourceInputs.appSHA256))assert.equal(sha(fs.readFileSync(path.join(app,relative))),digest,relative);
 for(const [relative,digest]of Object.entries(sourceInputs.controlSHA256))assert.equal(sha(fs.readFileSync(path.join('/control',relative))),digest,relative);
 let refused=false;try{requireOperatingControls({},null,JSON.parse(fs.readFileSync('/control/o30/operating-controls.json','utf8')));}catch(error){refused=error.message==='Operating controls unproven; deployment/transmission refused';}assert.equal(refused,true);report.fullCampaignOperatingGuardRefused=true;
 const {superviseAssurance}=await verifySupervisorSource();report.supervisorPins=CONTROLLER_SOURCE;
 assert.ok(!fs.existsSync(root)&&!fs.existsSync(redisRoot),'Fresh empty test roots required');fs.mkdirSync(root,{mode:0o700});fs.mkdirSync(path.join(root,'commissioning'),{mode:0o700});fs.mkdirSync(redisRoot,{mode:0o700});report.initialCanonicalVolumeEmpty=true;
 report.stage='start_actual_private_redis';
 redis=spawn('/usr/bin/redis-server',['--bind','127.0.0.1','--port','6379','--dir',redisRoot,'--save','','--appendonly','no','--protected-mode','yes','--maxmemory','128mb','--maxmemory-policy','noeviction'],{env:{PATH:'/usr/bin:/bin'},stdio:['ignore','pipe','pipe']});const redisOutput=attachOutput(redis,'redis',262144);
 const Redis=createRequire('/app/backend/package.json')('ioredis');const client=new Redis({host:'127.0.0.1',port:6379,maxRetriesPerRequest:0,retryStrategy:()=>null,lazyConnect:true});client.on('error',()=>{});
 try{const end=performance.now()+10000;for(;;){try{await client.connect();assert.equal(await client.ping(),'PONG');assert.equal(await client.dbsize(),0);break;}catch(error){if(performance.now()>=end)throw error;await new Promise(r=>setTimeout(r,100));}}report.redis={version:await client.info('server'),initialDBSize:0,pid:redis.pid,output:redisOutput()};}finally{client.disconnect();}
 assert.ok(!failed,'EARLY_REDIS_OUTPUT_FAILURE');report.stage='real_supervisor_startup_and_authenticated_progress';
 deadlineTimer=setTimeout(()=>abort(Error('NATIVE_COMPONENT_MAXIMUM_850000MS')),850000);startupTimer=setTimeout(()=>abort(Error('AUTHENTIC_NATIVE_PROGRESS_NOT_ESTABLISHED_WITHIN120000MS')),120000);
 stop=superviseAssurance({cwd:app,env:{PATH:'/node/bin:/usr/bin:/bin',NODE_OPTIONS:'--max-old-space-size=256',RAILWAY_VOLUME_MOUNT_PATH:root,RAILWAY_GIT_COMMIT_SHA:expectedSource,REDIS_URL:'redis://127.0.0.1:6379',ASSURANCE_RUNTIME_ORIGIN:'https://127.0.0.1'},spawnImpl:actualSpawn,onEvent:onSupervisorEvent});
 const osObserver=setInterval(()=>{for(const entry of children){if(entry.stopSignal&&!entry.osStopped&&!entry.exitObservation){try{const status=fs.readFileSync('/proc/'+entry.child.pid+'/status','utf8'),state=status.match(/^State:\s+(.+)$/m)?.[1];if(state?.startsWith('T'))entry.osStopped=record('independent_OS_stop_observed',{component:entry.component,pid:entry.child.pid,state});}catch{}}}},50);
 try{await done;}finally{clearInterval(osObserver);}
 finished=true;clearTimeout(deadlineTimer);clearTimeout(startupTimer);stop();
 assert.equal(children.length,2);assert.ok(children.every(x=>x.child.exitCode!==null||x.child.signalCode!==null));
 report.stage='seal_stopped_native_volume';
 const sealed=path.join(evidence,'sealed-state');fs.mkdirSync(sealed,{mode:0o700});const files=[];
 for(const name of fs.readdirSync(path.join(root,'commissioning')).sort()){
  const src=path.join(root,'commissioning',name),stat=fs.lstatSync(src);assert.ok(stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1&&stat.size<=2097152,'BOUNDED_REGULAR_NATIVE_FILE');const dst=path.join(sealed,name);fs.copyFileSync(src,dst,fs.constants.COPYFILE_EXCL);files.push({name,bytes:stat.size,sha256:sha(fs.readFileSync(dst))});
 }
 assert.ok(files.reduce((n,x)=>n+x.bytes,0)<=4194304,'SEALED_NATIVE_STATE_LIMIT');report.nativeFiles=files;
 // SQLite may touch SHM while reading WAL. Inspect a separate copy and retain
 // the exact stopped original SQLite/WAL/SHM bytes in the sealed evidence.
 const inspection='/tmp/v116-o30-inspection';fs.cpSync(sealed,inspection,{recursive:true,errorOnExist:true,force:false});
 const database=path.join(inspection,'assurance.sqlite');assert.ok(fs.existsSync(database));const db=new DatabaseSync(database,{readOnly:true,allowExtension:false});try{assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');report.assuranceSQLite={integrity:'ok',tables:db.prepare("SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name").all().map(x=>x.name),readOnly:true,inspectionCopy:true,afterBothNativeWritersExited:true};}finally{db.close();}
 for(const file of files)assert.equal(sha(fs.readFileSync(path.join(sealed,file.name))),file.sha256,'SEALED_SOURCE_BYTES_CHANGED');
 const end=at();report.wallVsMonotonicDriftMs=(end.wallMs-report.started.wallMs)-(end.monotonicMs-report.started.monotonicMs);assert.ok(Math.abs(report.wallVsMonotonicDriftMs)<=2000,'CLOCK_DISCONTINUITY');
 report.assertions={O30_14:'PASS_SCOPED_NATIVE_WORKER_NO_PROGRESS',O30_15:'PASS_SCOPED_NATIVE_INSPECTOR_NO_PROGRESS',O30_16:'PASS_SCOPED_NATIVE_PROCESS_EXIT_OBSERVATION',wholeO30:'NOT_PROVEN'};report.status='PASS_SCOPED_REAL_NATIVE_TIMING';
}catch(error){report.firstFailure={stage:report.stage,name:error.name,message:String(error.message)};process.exitCode=1;}
finally{
 clearTimeout(deadlineTimer);clearTimeout(startupTimer);stop?.();
 for(const entry of children)if(entry.child.exitCode===null&&entry.child.signalCode===null){try{entry.child.kill('SIGCONT');entry.child.kill('SIGKILL');}catch{}}
 await Promise.all(children.map(({child})=>child.exitCode!==null||child.signalCode!==null?Promise.resolve():Promise.race([once(child,'exit'),new Promise(r=>setTimeout(r,3000))])));
 if(redis&&redis.exitCode===null&&redis.signalCode===null){redis.kill('SIGTERM');await Promise.race([once(redis,'exit'),new Promise(r=>setTimeout(r,3000))]);if(redis.exitCode===null&&redis.signalCode===null){redis.kill('SIGKILL');await Promise.race([once(redis,'exit'),new Promise(r=>setTimeout(r,3000))]);}}
 report.children=children.map(({child,output,...entry})=>({...entry,output:output(),finalExitCode:child.exitCode,finalExitSignal:child.signalCode}));report.faultReceipts=faults;report.finished=at();report.elapsedMs=report.finished.monotonicMs-report.started.monotonicMs;report.allNativeChildrenStopped=children.every(x=>x.child.exitCode!==null||x.child.signalCode!==null);report.redisStopped=!redis||redis.exitCode!==null||redis.signalCode!==null;
 if(!report.allNativeChildrenStopped||!report.redisStopped){report.status='FAIL_CLOSED';process.exitCode=1;}
 record('probe_final',{status:report.status,firstFailure:report.firstFailure??null});fs.closeSync(journal);report.journalSHA256=sha(fs.readFileSync(journalPath));
 fs.writeFileSync(path.join(evidence,'native-timing-result.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({status:report.status,elapsedMs:report.elapsedMs,firstFailure:report.firstFailure??null}));
}

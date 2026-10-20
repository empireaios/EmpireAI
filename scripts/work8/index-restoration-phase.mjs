import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {once} from 'node:events';
import {randomUUID} from 'node:crypto';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export function processIdentity(pid){try{const fields=fs.readFileSync(`/proc/${pid}/stat`,'utf8').split(') ').slice(1).join(') ').trim().split(/\s+/);return {pid,startTicks:fields[19],state:fields[0]};}catch(error){if(error.code==='ENOENT'||error.code==='ESRCH')return null;throw error;}}
export function validateIndexHealth(value){const c=value?.continuity;assert.equal(c?.watchdogEnabled,true);assert.equal(c.watchdogRunning,true);assert.equal(c.healthy,true);assert.ok(Number.isFinite(c.lastHeartbeatAgeMs)&&c.lastHeartbeatAgeMs>=0&&c.lastHeartbeatAgeMs<22500);assert.deepEqual(c.alerts,[]);return c;}
export async function examineRestoredIndex({repo,deadline,originalSession,redis,manifest,inspectionOwner,onDiagnostic=()=>{}}){
 assert.equal(process.env.NODE_ENV,'test');assert.equal(process.env.EMPIRE_ENGINEERING_TEST_MODE,'true');assert.equal(process.env.MISSION_AUTHORITY_EXECUTOR_ENABLED,'false');
 const port=await new Promise((resolve,reject)=>{const s=createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
 const capability=randomUUID();
 const child=spawn(process.execPath,[path.join(repo,'scripts/work8/index-restoration-launcher.mjs'),capability],{env:{...process.env,PORT:String(port),HOST:'127.0.0.1'},stdio:['ignore','inherit','inherit','ipc']});
 let exited=false,exitCode=null,spawnError;child.once('error',error=>{spawnError=error;});child.once('exit',code=>{exited=true;exitCode=code;});
 let identity;const receipt={mode:'ACTUAL_INDEX_ENGINEERING_FENCED',watchdogKind:'node:worker_threads.Worker',uniqueWatchdogTidMapped:false,productionAmazonContinuationsExamined:false,globalWriterMembershipProven:false};
 const get=async(route,headers={})=>{assert.ok(Date.now()<deadline,'ORIGINAL_INDEX_STARTUP_DEADLINE');return fetch(`http://127.0.0.1:${port}${route}`,{headers,signal:AbortSignal.timeout(Math.max(1,Math.min(2000,deadline-Date.now())))});};
 let failure,flushRequested=false,flushAck=null,flushError=null;
 child.on('message',message=>{if(message?.source!==process.env.RAILWAY_GIT_COMMIT_SHA||message?.capability!==capability)return;if(message.event==='restored-index-persisted'){const {capability:_private,...ack}=message;flushAck=ack;}if(message.event==='restored-index-persist-failed')flushError=String(message.error);});
 try{
  await once(child,'spawn');identity=processIdentity(child.pid);assert.ok(identity,'INDEX_PROCESS_IDENTITY_UNAVAILABLE');assert.match(identity.startTicks,/^\d+$/,'INDEX_START_IDENTITY_INVALID');receipt.identity=identity;
  let health;
  for(;;){assert.ok(Date.now()<deadline,'ORIGINAL_INDEX_STARTUP_DEADLINE');if(spawnError)throw spawnError;assert.equal(exited,false,'INDEX_EXITED_BEFORE_READY');
   try{const [watchdog,pillow]=await Promise.all([get('/health/executive-continuity'),get('/api/pillow/status',{authorization:'Bearer '+originalSession.token})]);
    const watchdogBody=await watchdog.json(),pillowBody=await pillow.json();
    receipt.lastPoll={at:Date.now(),watchdogStatus:watchdog.status,pillowStatus:pillow.status,continuity:watchdogBody.continuity??null,pillowLifecycle:pillowBody.status?.lifecycle??null,flushRequested,flushAck,flushError};onDiagnostic(receipt);
    assert.equal(watchdog.status,200);assert.equal(pillow.status,200);assert.equal(pillowBody.status.lifecycle,'running');
    if(flushError)throw Error('TARGET_CRITICAL_PERSIST_FAILED: '+flushError);
    if(!flushRequested){flushRequested=true;child.send({action:'persist-restored-index-once',capability,source:process.env.RAILWAY_GIT_COMMIT_SHA});}
    if(!flushAck){await pause(100);continue;}
    health=validateIndexHealth(watchdogBody);break;
   }catch(error){receipt.lastPollFailure=String(error);onDiagnostic(receipt);if(flushError||exited||Date.now()>=deadline)throw error;await pause(100);}
  }
  receipt.continuity=health;receipt.criticalPersist=flushAck;receipt.readinessQualification='HEALTHY_AFTER_EXPLICIT_TARGET_CRITICAL_PERSIST';onDiagnostic(receipt);
  receipt.threadInventory=fs.readdirSync(`/proc/${child.pid}/task`).map(tid=>{const raw=fs.readFileSync(`/proc/${child.pid}/task/${tid}/stat`,'utf8'),fields=raw.slice(raw.lastIndexOf(') ')+2).trim().split(/\s+/);return {tid:Number(tid),startTicks:fields[19]};});
  assert.ok(receipt.threadInventory.length>1,'WATCHDOG_THREAD_MEMBERSHIP_UNAVAILABLE');assert.equal(processIdentity(child.pid)?.startTicks,identity.startTicks);
  for(const headers of [{authorization:'Bearer '+originalSession.token},{cookie:'empireai_session='+originalSession.token}]){const response=await get('/auth/me',headers);assert.equal(response.status,200);const {platformIdentity,...actual}=(await response.json()).user;const {token,expiresAt,createdAt,...expected}=originalSession;assert.deepEqual(actual,expected);}
  assert.equal((await get('/auth/me',{authorization:'Bearer forged'})).status,401);
  assert.equal((await get('/api/pillow/mission-runtime',{authorization:'Bearer '+originalSession.token})).status,403,'ORIGINAL_WORKSPACE_MUST_NOT_GAIN_MISSION_AUTHORITY');
  const raw=await redis.get('empireai:session:'+originalSession.token);assert.deepEqual(JSON.parse(raw),originalSession);
  const ttl=await redis.pttl('empireai:session:'+originalSession.token);assert.ok(ttl>0&&ttl<=Date.parse(originalSession.expiresAt)-Date.now()+1000);
  assert.equal(await redis.get(manifest.redisIdentity.ownerKey),inspectionOwner);assert.equal(await redis.hget(manifest.redisIdentity.metaKey,'paused'),'1');
  receipt.originalSessionAuthenticated=true;receipt.originalMissionScopeDenied=true;receipt.queueAdmissionRemainsFenced=true;
 }catch(error){failure=error;}
 finally{
  if(!exited&&identity){
   const current=processIdentity(child.pid);
   if(current?.startTicks!==identity.startTicks){receipt.cleanupRequiresOuterContainment=true;failure??=Error('INDEX_PROCESS_IDENTITY_CHANGED');}
   else{const event=once(child,'exit');child.kill('SIGTERM');let timer;await Promise.race([event,new Promise(resolve=>{timer=setTimeout(resolve,Math.max(1,Math.min(5000,deadline-Date.now())));})]);clearTimeout(timer);if(!exited){const retained=processIdentity(child.pid);if(retained?.startTicks===identity.startTicks){child.kill('SIGKILL');await event;}else receipt.cleanupRequiresOuterContainment=true;failure??=Error('INDEX_GRACEFUL_CLEANUP_DEADLINE');}}
  }
  if(!identity&&child.pid&&!exited)receipt.cleanupRequiresOuterContainment=true;
  receipt.exitCode=exitCode;receipt.indexProcessStopped=!child.pid||processIdentity(child.pid)===null;
  if(!receipt.indexProcessStopped){receipt.cleanupRequiresOuterContainment=true;failure??=Error('INDEX_CONTAINMENT_UNPROVEN');}
  if(exitCode!==0)failure??=spawnError??Error('INDEX_EXIT_NOT_CLEAN');
 }
 if(failure){failure.indexReceipt=receipt;throw failure;}return receipt;
}

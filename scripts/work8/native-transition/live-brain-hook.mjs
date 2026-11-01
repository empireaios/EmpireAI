// Isolated examination instrumentation, loaded by a source-gated read-only index
// overlay after the real application initializes. No endpoint or authority grant.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {getDatabase,getActiveDatabasePath} from '/app/backend/dist/brain/database.js';
import {withQuiescedSqliteSave} from '/app/backend/dist/brain/quiesced-sqlite-save.js';
import {withDrainedWork8Background} from '/app/backend/dist/runtime/work8-background-capture.js';
import {logicalLiveBrainStore,liveBrainSchemaSha256,observeLiveBrain,sha256,canonicalJson} from './live-brain-observation.mjs';
import {independentBrainReadback,assertBrainLogicalEquality} from './independent-brain-readback.mjs';
const base='/data/work8-exam/native-transition/live-brain';
const requests=path.join(base,'requests'),receipts=path.join(base,'receipts');
const modulePath='/app/backend/dist/brain/database.js';
const expectedDatabasePath='/data/work8-exam/native-transition/volume/commissioning/empireai-brain.db';
const safeFailure=error=>({code:/^[A-Z][A-Z0-9_]{0,99}$/.test(String(error?.code))?error.code:'LIVE_BRAIN_CAPTURE_FAILED',assertion:(String(error?.message).match(/^[A-Z][A-Z0-9_]{3,119}$/)||[])[0]??null,sourceFrames:(String(error?.stack).match(/(?:live-brain-hook|live-brain-observation|independent-brain-readback)\.mjs:\d+:\d+/g)||[]).slice(0,8),rawErrorOrRecordsRetained:false,...(error?.safePrivateHandoff?{privateHandoff:error.safePrivateHandoff}:{})});
function privateWrite(name,value){
 let operation='VALIDATE_PRIVATE_RECEIPT';try{
 assert.match(name,/^[a-z-]+\.json$/);const target=path.join(receipts,name),pending=target+'.pending',bytes=Buffer.from(canonicalJson(value));assert.ok(bytes.length<=1048576,'LIVE_BRAIN_RECEIPT_BOUND');
 operation='CREATE_PRIVATE_RECEIPT_0600';const fd=fs.openSync(pending,fs.constants.O_RDWR|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);
 try{operation='SET_PRIVATE_MODE_WHILE_OWNED';fs.fchmodSync(fd,0o600);operation='WRITE_PRIVATE_RECEIPT';fs.writeFileSync(fd,bytes);operation='SYNC_PRIVATE_RECEIPT';fs.fsyncSync(fd);operation='VERIFY_PRIVATE_RECEIPT_METADATA';const st=fs.fstatSync(fd);assert.equal(st.uid,65534);assert.equal(st.gid,65534);assert.equal(st.mode&0o777,0o600);assert.equal(st.size,bytes.length);}finally{fs.closeSync(fd);}
 operation='VERIFY_PRIVATE_RECEIPT_CHECKSUM';assert.equal(sha256(fs.readFileSync(pending)),sha256(bytes));operation='PUBLISH_PRIVATE_RECEIPT';fs.renameSync(pending,target);const dir=fs.openSync(receipts,fs.constants.O_RDONLY|fs.constants.O_DIRECTORY);try{operation='SYNC_PRIVATE_RECEIPT_DIRECTORY';fs.fsyncSync(dir);}finally{fs.closeSync(dir);}
 }catch(error){const meta={};try{const st=fs.lstatSync(receipts);Object.assign(meta,{uid:st.uid,gid:st.gid,mode:st.mode&0o777});}catch{}error.safePrivateHandoff={operation,errno:/^[A-Z0-9_]+$/.test(String(error?.code))?error.code:'CONTRACT_ASSERTION',effectiveUid:process.geteuid(),effectiveGid:process.getegid(),parent:meta,capabilities:processState().capabilities,rawPathOrContentsRetained:false};console.error('WORK8_LIVE_BRAIN_CHANNEL_FAILURE '+JSON.stringify(safeFailure(error)));throw error;}
}
function processState(){
 const text=fs.readFileSync('/proc/self/status','utf8'),fields=Object.fromEntries(text.split('\n').filter(x=>x.includes(':')).map(x=>[x.slice(0,x.indexOf(':')),x.slice(x.indexOf(':')+1).trim()]));
 const startTicks=fs.readFileSync('/proc/self/stat','utf8').split(') ')[1].split(' ')[19];
 assert.equal(fields.CapEff,'0000000000000000','BRAIN_EFFECTIVE_CAPABILITIES_CHANGED');assert.equal(fields.NoNewPrivs,'1','BRAIN_NO_NEW_PRIVILEGES_REQUIRED');
 return {pid:process.pid,startTicks,uid:process.geteuid(),gid:process.getegid(),capabilities:Object.fromEntries(['CapInh','CapPrm','CapEff','CapBnd','CapAmb'].map(k=>[k,fields[k]])),noNewPrivileges:true,seccomp:fields.Seccomp};
}
export async function installLiveBrainObservation(application){
 assert.equal(process.versions.node,'22.23.2');assert.equal(process.env.EMPIRE_ROLE,'brain-worker');assert.equal(process.geteuid(),65534);assert.equal(process.getegid(),65534);
 assert.equal(process.env.WORK8_REAL_GRAPH,'1');assert.equal(process.env.EMPIRE_RUNTIME_PROFILE,'LOCKED_COMMISSIONING_V1');assert.equal(process.env.DATABASE_PATH,expectedDatabasePath);assert.equal(getActiveDatabasePath(),expectedDatabasePath);
 assert.equal(typeof application.withDrainedLocalAdmission,'function');assert.equal(typeof application.brain?.taskQueue?.withPausedSharedProcessing,'function');assert.equal(application.app.server.listening,true,'LIVE_BRAIN_APPLICATION_NOT_LISTENING');
 for(const [dir,uid,gid,mode] of [[requests,0,65534,0o750],[receipts,65534,65534,0o700]]){const st=fs.lstatSync(dir);assert.ok(st.isDirectory()&&!st.isSymbolicLink());assert.equal(fs.realpathSync(dir),dir);assert.equal(st.uid,uid);assert.equal(st.gid,gid);assert.equal(st.mode&0o777,mode);}
 const db=getDatabase(),readyAt=new Date().toISOString(),instanceId=randomUUID(),source=process.env.RAILWAY_GIT_COMMIT_SHA,generation=process.env.EMPIRE_GENERATION,identity=processState();
 assert.equal(db.closed,false);assert.equal(db.inMemory,false);assert.equal(db.filePath,expectedDatabasePath);assert.ok(db.mutationRevision>0);assert.equal(db.captureWriteFence,false);
 assert.match(source,/^[a-f0-9]{40}$/);assert.match(generation,/^[a-f0-9-]{36}$/);assert.match(process.env.WORK8_MEMBERSHIP_ID,/^[a-f0-9-]{36}$/);
 const ready={schema:'work8-v30-live-brain-ready-v1',readyAt,instanceId,source,generation,identity,membershipId:process.env.WORK8_MEMBERSHIP_ID,moduleSha256:sha256(fs.readFileSync(modulePath)),entrySha256:sha256(fs.readFileSync('/app/backend/dist/index.js')),diskPresentAtReady:fs.existsSync(expectedDatabasePath),initializedMutationRevision:db.mutationRevision,actualApplicationInitialized:true};
 privateWrite('ready.json',ready);
 const options={cachedDatabase:getDatabase,expectedDatabasePath,generation,source,modulePath,readyAt,instanceId};
 const guarded=callback=>withDrainedWork8Background(()=>application.brain.taskQueue.withPausedSharedProcessing(()=>application.withDrainedLocalAdmission(callback,15000),15000),15000);
 async function capture(){
  return guarded(()=>{
   assert.equal(getDatabase(),db);const before={logicalStore:logicalLiveBrainStore(db),schemaObjectsSha256:liveBrainSchemaSha256(db)},revision=db.mutationRevision;
   // No asynchronous yield between synchronous pre-save observation and the
   // existing same-instance helper acquiring its write fence.
   return withQuiescedSqliteSave(db,()=>{
    const live=observeLiveBrain(db,options),saved=independentBrainReadback(expectedDatabasePath);assert.equal(db.mutationRevision,revision,'BRAIN_LOGICAL_REVISION_CHANGED_BY_PERSIST');
    assertBrainLogicalEquality(before,{...live,schemaObjectsSha256:live.attestation.schemaObjectsSha256});assertBrainLogicalEquality(live,saved);
    const st=fs.lstatSync(expectedDatabasePath);assert.equal(st.uid,65534);assert.equal(st.gid,65534);assert.equal(st.mode&0o777,0o600);
    return {...live,preSaveLogicalSha256:sha256(canonicalJson(before.logicalStore)),preSaveSchemaSha256:before.schemaObjectsSha256,preSaveMutationRevision:revision,independentExport:{sha256:saved.exportSha256,bytes:saved.bytes,uid:st.uid,gid:st.gid,mode:'0600'},sourceBoundAdmission:'BRAIN_LOCAL_HTTP_BACKGROUND_SHARED_QUEUE_AND_SQLJS_ONLY',otherProcessesAndStoresRemainSeparatelyVerified:true};
   });
  });
 }
 let handled=false,timer;
 async function consume(){
  if(handled||!fs.existsSync(path.join(requests,'request.json')))return;handled=true;clearInterval(timer);
  const result={schema:'work8-v30-live-brain-capture-v1',status:'FAIL',ready,rawRecordsRetained:false,checks:[]};
  try{
   const requestPath=path.join(requests,'request.json'),st=fs.lstatSync(requestPath);assert.ok(st.isFile()&&!st.isSymbolicLink()&&st.nlink===1&&st.size<2048);assert.equal(st.uid,0);assert.equal(st.gid,65534);assert.equal(st.mode&0o777,0o440);
   const request=JSON.parse(fs.readFileSync(requestPath,'utf8'));assert.deepEqual(Object.keys(request).sort(),['generation','mode','requestId','schema','source'].sort());assert.equal(request.schema,'work8-v30-live-brain-request-v1');assert.equal(request.source,source);assert.equal(request.generation,generation);assert.match(request.requestId,/^[a-f0-9-]{36}$/);assert.ok(['PREFLIGHT','BASELINE'].includes(request.mode));result.requestId=request.requestId;result.mode=request.mode;
   assert.deepEqual(processState(),identity,'LIVE_BRAIN_PROCESS_IDENTITY_CHANGED');assert.equal(getDatabase(),db);
   if(request.mode==='PREFLIGHT'){assert.equal(ready.diskPresentAtReady,false,'DELAYED_BRAIN_EXPORT_NOT_REPRODUCED');assert.equal(fs.existsSync(expectedDatabasePath),false,'PREFLIGHT_DISK_PRESENT_BEFORE_LIVE_CAPTURE');}
   const first=await capture();assert.equal(db.captureWriteFence,false,'LIVE_BRAIN_SUCCESS_FENCE_NOT_RELEASED');result.checks.push('ACTUAL_INITIALIZED_CACHED_BRAIN_CAPTURE','LIVE_PRE_SAVE_EQUALS_LIVE_POST_SAVE','INDEPENDENT_EXPORT_EQUALS_LIVE_BASELINE','SUCCESS_FENCE_RELEASED');
   if(request.mode==='PREFLIGHT'){
    await assert.rejects(guarded(()=>withQuiescedSqliteSave(db,()=>{throw Object.assign(new Error('EXPECTED_CAPTURE_CALLBACK_REFUSAL'),{code:'EXPECTED_CAPTURE_CALLBACK_REFUSAL'});})),error=>error.code==='EXPECTED_CAPTURE_CALLBACK_REFUSAL');assert.equal(db.captureWriteFence,false,'LIVE_BRAIN_FAILURE_FENCE_NOT_RELEASED');
    const afterFailure=await capture();assertBrainLogicalEquality(first,{...afterFailure,schemaObjectsSha256:afterFailure.attestation.schemaObjectsSha256});assert.equal(db.captureWriteFence,false);result.checks.push('EXPECTED_CALLBACK_FAILURE_EXPLICIT','FAILURE_FENCE_RELEASED','REENTRY_AFTER_FAILURE_PRESERVES_SAME_LIVE_STATE');
   }
   result.capture=first;result.finalIdentity=processState();assert.deepEqual(result.finalIdentity,identity);result.status=request.mode==='PREFLIGHT'?'PASS_ACTUAL_NATIVE_LIVE_BRAIN_PREFLIGHT':'PASS_ACTUAL_LIVE_BRAIN_BASELINE';
  }catch(error){result.failure=safeFailure(error);result.fenceReleased=db.captureWriteFence===false;}
  privateWrite('capture.json',result);
 }
 timer=setInterval(()=>{void consume().catch(error=>{try{privateWrite('channel-failure.json',safeFailure(error));}catch{}});},50);timer.unref();
}

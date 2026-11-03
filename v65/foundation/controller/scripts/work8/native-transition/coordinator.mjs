import {createChildDiagnosticCollector} from './child-diagnostic-collector.mjs';
import {emitNativeFailure,sanitizeNativeRecord} from './native-diagnostic.mjs';
import {writeControlPrivate} from './private-exchanges.mjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {once} from 'node:events';
import {verifyStoragePreflight} from './storage-preflight.mjs';
import {preparePathContract} from '/app/scripts/work8/o33-permissions.mjs';
const require=createRequire('/app/backend/package.json'),Redis=require('ioredis');
const {MembershipJournal,processIdentity}=require('/app/deployment/runtime-membership-controller.cjs');
const {resolveRuntimeRevision}=require('/app/deployment/runtime-revision.cjs');
const sha=x=>createHash('sha256').update(x).digest('hex'),pause=ms=>new Promise(r=>setTimeout(r,ms));
const source=process.env.EXPECTED_BACKEND,deadline=Date.now()+600000,evidence='/evidence',control='/control';
const receipt={schema:'work8-native-transition-runtime-v1',status:'FAIL',source,actualNativeApplication:false,productionAccess:false,wholeRowsAccepted:[]};
let drainStartedAtMs=null,drainCompletedAtMs=null;
let runtime,paths,output='',drained=false,lastHealth={},brainReady,brainCaptureDone=false,causalStage='NATIVE_COORDINATOR_SETUP',firstNativeFailure=null,runtimeClosed=Promise.resolve();
function retainFirst(value){if(firstNativeFailure)return;firstNativeFailure=sanitizeNativeRecord(value);write('first-native-failure.json',firstNativeFailure);console.error('WORK8_NATIVE_FIRST_FAILURE '+JSON.stringify(firstNativeFailure));}
const childDiagnostics=createChildDiagnosticCollector(retainFirst);
const brainChannel='/data/work8-exam/native-transition/live-brain';
const overlay=JSON.parse(fs.readFileSync('/examination/live-brain-overlay.json','utf8'));
assert.equal(sha(fs.readFileSync('/app/backend/dist/index.js')),overlay.overlaySha256,'LIVE_BRAIN_INDEX_OVERLAY_CHANGED');
function boundedText(text,limit=1048576){const bytes=Buffer.from(text);if(bytes.length<=limit)return text;let cut=bytes.subarray(0,limit).toString('utf8');if(Buffer.byteLength(cut)>limit)cut=cut.slice(0,-1);return cut;}
function safe(text){const values=[process.env.FOUNDER_PASSWORD,process.env.ADMIN_PASSWORD,process.env.SESSION_SECRET,process.env.REDIS_URL];try{values.push(new URL(process.env.REDIS_URL).password);}catch{}for(const value of values)if(value)text=text.split(value).join('[REDACTED]');return text.replace(/Bearer\s+[^\s"<>]+/gi,'Bearer [REDACTED]').replace(/empireai_session=[^;\s"<>]+/g,'empireai_session=[REDACTED]').replace(/("(?:token|password|secret|nonce|authorization)"\s*:\s*")[^"]*(")/gi,'$1[REDACTED]$2');}
function write(name,value){const bytes=JSON.stringify(value,null,2)+'\n';assert.ok(Buffer.byteLength(bytes)<=16384,'DIAGNOSTIC_RECEIPT_SIZE_BOUND');const target=path.join(evidence,name),temp=target+'.tmp';fs.writeFileSync(temp,bytes);fs.renameSync(temp,target);}
function signal(name,value={ok:true}){return writeControlPrivate(name,JSON.stringify(value),control,evidence);}
function readNativeReceipt(name,maxBytes=1048576){
 assert.ok(['ready.json','capture.json','channel-failure.json'].includes(name));const target=path.join(brainChannel,'receipts',name),before=fs.lstatSync(target);assert.ok(before.isFile()&&!before.isSymbolicLink()&&before.nlink===1&&before.size<=maxBytes);assert.equal(fs.realpathSync(target),target);assert.equal(before.uid,65534);assert.equal(before.gid,65534);assert.equal(before.mode&0o777,0o600);
 const fd=fs.openSync(target,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{const held=fs.fstatSync(fd);assert.equal(held.dev,before.dev);assert.equal(held.ino,before.ino);const bytes=fs.readFileSync(fd);assert.equal(bytes.length,before.size);const after=fs.lstatSync(target);assert.equal(after.dev,before.dev);assert.equal(after.ino,before.ino);assert.equal(after.size,before.size);return JSON.parse(bytes.toString('utf8'));}finally{fs.closeSync(fd);}
}
function census(){const j=new MembershipJournal(paths.journal);try{return j.read();}finally{j.close();}}
// Persist a bounded, source-bound observation before the host's cleanup-inclusive 245-second
// startup bound. This is evidence collection, never an alternate ready predicate.
function startupMetadata(){
 const policy={path:'/run/empire-policy/control.json'};
 try{const s=fs.lstatSync(policy.path);Object.assign(policy,{uid:s.uid,gid:s.gid,mode:s.mode&0o777,nlink:s.nlink,isFile:s.isFile(),realpathMatches:fs.realpathSync(policy.path)===policy.path});}catch(e){policy.error=String(e.code||'POLICY_METADATA_UNAVAILABLE');}
 let roles=[];try{const db=new DatabaseSync(paths.journal,{readOnly:true,timeout:0,allowExtension:false});try{roles=db.prepare("SELECT record,state FROM members WHERE state<>'TERMINATED'").all().map(row=>{const m=JSON.parse(row.record);return {role:m.role,state:row.state,uid:m.uid,source:m.source};});}finally{db.close();}}catch{}
 return {source,at:new Date().toISOString(),node:process.versions.node,operatorUid:process.getuid(),childRunning:runtime?.exitCode===null,policy,roles};
}
async function observeHealth(port){
 try{
  const r=await fetch('http://127.0.0.1:'+port+'/health/ready',{signal:AbortSignal.timeout(2000)}),text=await r.text();assert.ok(Buffer.byteLength(text)<=32768,'HEALTH_BODY_SIZE_BOUND');const j=JSON.parse(text),body={};
  for(const k of ['ready','status','brain','process','workerOnline','workerReady','sessionStore','ownerWriteRestriction'])if(['string','boolean','number'].includes(typeof j[k]))body[k]=typeof j[k]==='string'?safe(j[k]).slice(0,300):j[k];
  if(j.pillow&&typeof j.pillow==='object'){body.pillow={};for(const k of ['enabled','ready','lifecycle','lastError'])if(['string','boolean'].includes(typeof j.pillow[k]))body.pillow[k]=typeof j.pillow[k]==='string'?safe(j.pillow[k]).slice(0,1000):j.pillow[k];}
  return {status:r.status,body,matched:r.ok&&j.ready===true&&j.ownerWriteRestriction==='RELEASED'};
 }catch(e){return {error:safe(String(e)).slice(0,300),matched:false};}
}
async function until(fn,label,phaseDeadline=deadline){for(;;){assert.ok(Date.now()<Math.min(deadline,phaseDeadline),label);if(runtime?.exitCode!==null&&runtime?.exitCode!==undefined&&!drained){await Promise.race([runtimeClosed,pause(1000)]);childDiagnostics.finish();throw Error('ACTUAL_RUNTIME_EXITED');}const value=await fn();assert.ok(Date.now()<Math.min(deadline,phaseDeadline),label);if(value)return;await pause(50);}}
async function drain(){if(drained||!runtime)return;const members=census().members.filter(m=>m.state!=='TERMINATED');
 if(runtime.exitCode!==null||runtime.signalCode!==null){for(const m of members){const now=processIdentity(m.pid);assert.ok(!now||now.startTicks!==m.startTicks||now.state==='Z','FAILED_RUNTIME_LEFT_LIVE_MEMBER');}drained=true;receipt.failedRuntimeHasNoLiveRecordedMembers=true;return;}
 const guard=members.find(m=>m.role==='containment-guard');assert.ok(guard);const exit=once(runtime,'exit');drainStartedAtMs=Date.now();process.kill(guard.pid,'SIGTERM');const hard=setTimeout(()=>runtime.kill('SIGKILL'),25000);try{const [code,signal]=await exit;assert.equal(code,0);assert.equal(signal,null);for(const m of members){const now=processIdentity(m.pid);assert.ok(!now||now.startTicks!==m.startTicks||now.state==='Z');}drained=true;drainCompletedAtMs=Date.now();receipt.actualNativeWritersDrained=true;}finally{clearTimeout(hard);}}
process.on('SIGTERM',()=>{void drain().catch(()=>{}).finally(()=>process.exit(1));});
try{
 write('last-startup-observation.json',{...startupMetadata(),phase:'BOOTSTRAP'});
 assert.equal(process.versions.node,'22.23.2');assert.equal(process.getuid(),0);assert.match(source,/^[a-f0-9]{40}$/);assert.equal(resolveRuntimeRevision('/app',source),source);
 const u=new URL(process.env.REDIS_URL);assert.equal(u.hostname,'transition-redis');assert.equal(u.pathname,'/0');assert.ok(u.password);
 write('last-startup-observation.json',{...startupMetadata(),phase:'FRESH_REDIS_READINESS',redisHost:u.hostname,redisDb:0});
 const redis=new Redis(u.href,{maxRetriesPerRequest:0,retryStrategy:()=>null});let redisIdentity;
 try{assert.equal(await redis.ping(),'PONG');assert.equal(await redis.dbsize(),0);redisIdentity={host:u.hostname,port:Number(u.port||6379),db:0,runId:(await redis.info('server')).match(/^run_id:([a-f0-9]{40})\r?$/m)?.[1]};assert.match(redisIdentity.runId,/^[a-f0-9]{40}$/);}finally{redis.disconnect();}
 const p=preparePathContract('/data/work8-exam/native-transition'),storage=fs.statSync(p.volume),generation=randomUUID();
 const cutover={schema:'runtime-cutover-v1',proofReferences:['FRESH_PRIVATE_NONPRODUCTION_VOLUME_AND_REDIS_FOR_DISTINCT_VERSION_EXAMINATION'],reviewReceipt:'WORK8_DISTINCT_VERSION_NO_PRODUCTION_CUTOVER',storage:{root:p.volume,dev:storage.dev,ino:storage.ino},redis:redisIdentity,compatibleSources:[source],priorWriterDisposition:'EXCLUDED_BY_REVIEWED_OPERATING_TRANSITION',redisDisposition:'EXCLUSIVE_COHORT_CAPABILITY_REVIEWED'};
 const bytes=JSON.stringify(cutover),digest=sha(bytes);fs.writeFileSync(path.join(p.authority,'cutover-'+digest+'.json'),bytes,{flag:'wx',mode:0o644});
 const file=path.join(p.authority,'generation.sqlite'),db=new DatabaseSync(file);db.exec('PRAGMA journal_mode=DELETE;CREATE TABLE authority(id INTEGER PRIMARY KEY,version INTEGER,generation TEXT,cutover_digest TEXT,sources TEXT,epoch INTEGER);CREATE TABLE transitions(previous_generation TEXT,next_generation TEXT,cutover_digest TEXT,at TEXT);');db.prepare('INSERT INTO authority VALUES(1,1,?,?,?,1)').run(generation,digest,JSON.stringify([source]));db.close();fs.chmodSync(file,0o644);const identity=fs.statSync(file);
 paths={...p,journal:path.join(p.operator,'journal.sqlite')};
 fs.mkdirSync(brainChannel,{mode:0o755});
 for(const [name,uid,gid,mode] of [['requests',0,65534,0o750],['receipts',65534,65534,0o700]]){const target=path.join(brainChannel,name);fs.mkdirSync(target,{mode});fs.chmodSync(target,mode);fs.chownSync(target,uid,gid);}

 const env={PATH:'/usr/local/bin:/usr/bin:/bin',TMPDIR:p.temporary,VISUAL_MEMORY_STORAGE_ROOT:path.relative('/app',p.visual),SESSION_CONTINUITY_STORAGE_ROOT:path.relative('/app',p.session),EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',RAILWAY_VOLUME_MOUNT_PATH:p.volume,DATABASE_PATH:path.join(p.volume,'commissioning/empireai-brain.db'),RAILWAY_GIT_COMMIT_SHA:source,REDIS_URL:u.href,EMPIRE_LOCKED_REDIS_HOST:u.hostname,PORT:'43100',FOUNDER_EMAIL:'owner@work8.invalid',ADMIN_EMAIL:'admin@work8.invalid',FOUNDER_PASSWORD:process.env.FOUNDER_PASSWORD,ADMIN_PASSWORD:process.env.ADMIN_PASSWORD,SESSION_SECRET:process.env.SESSION_SECRET,WORK8_CONTROLLER_JOURNAL_PATH:paths.journal,WORK8_RUNTIME_UID:'65534',WORK8_RUNTIME_GID:'65534',WORK8_WRITER_ISOLATION_LIBRARY:'/native/runtime-writer-isolation.so',WORK8_WRITER_ISOLATION_SHA256:fs.readFileSync('/native/native.sha256','utf8').trim(),EMPIRE_GENERATION_DIRECTORY:p.authority,EMPIRE_GENERATION:generation,EMPIRE_CUTOVER_DIGEST:digest,EMPIRE_GENERATION_DEVICE:String(identity.dev),EMPIRE_GENERATION_INODE:String(identity.ino),EMPIRE_OWNER_WRITE_POLICY:'/run/empire-policy/control.json',INTELLIGENCE_ENABLED:'false',INTELLIGENCE_DISABLED:'true',CORS_ORIGIN:'http://localhost:43117'};
 write('native-storage-preflight.json',verifyStoragePreflight(p,env,source));
 causalStage='NATIVE_APPLICATION_SPAWN';const startupDeadline=Date.now()+210000;
 runtime=spawn(process.execPath,['/app/deployment/locked-runtime.cjs'],{env,stdio:['ignore','pipe','pipe']});runtimeClosed=new Promise(resolve=>runtime.once('close',resolve));
 write('last-startup-observation.json',{...startupMetadata(),startupDeadline:new Date(startupDeadline).toISOString(),phase:'spawned'});
 for(const [name,stream] of [['stdout',runtime.stdout],['stderr',runtime.stderr]])stream.on('data',b=>{output+=b;childDiagnostics.push(name,b.toString('utf8'));if(Buffer.byteLength(output)>1048576){const failure=Error('DIAGNOSTIC_SIZE_BOUND');retainFirst(emitNativeFailure(failure,causalStage,'NATIVE_COORDINATOR_LIFECYCLE',{},'NATIVE_COORDINATOR'));runtime.kill('SIGTERM');throw failure;}});
 causalStage='NATIVE_APPLICATION_READINESS';
 await until(async()=>{const [primary,worker]=await Promise.all([observeHealth(43100),observeHealth(43101)]);lastHealth={primary,worker};write('last-startup-observation.json',{...startupMetadata(),phase:'READINESS_POLL',startupDeadline:new Date(startupDeadline).toISOString(),...lastHealth});return primary.matched;},'ACTUAL_NATIVE_STARTUP_DEADLINE',startupDeadline);
 causalStage='NATIVE_MEMBERSHIP_CENSUS';const expectedRoles=['assurance-inspector','assurance-worker','brain-worker','containment-guard','native-mission-lock-holder','primary','work8-domain-lock-holder'];
 await until(()=>{write('last-startup-observation.json',{...startupMetadata(),phase:'ROLE_CENSUS',startupDeadline:new Date(startupDeadline).toISOString(),...lastHealth});try{return JSON.stringify(census().members.filter(m=>m.state!=='TERMINATED').map(m=>m.role).sort())===JSON.stringify(expectedRoles);}catch{return false;}},'ACTUAL_NATIVE_ROLE_STARTUP',startupDeadline);
 const members=census().members.filter(m=>m.state!=='TERMINATED');assert.deepEqual(members.map(m=>m.role).sort(),expectedRoles);
 assert.ok(members.every(m=>m.source===source&&m.generation===generation));
 const nativeStoragePropagation=[];
 // Read child environment only inside the privileged examination process. Retain
 // exactly the two non-secret path settings, never the full environment bytes.
 for(const member of members.filter(m=>['primary','brain-worker'].includes(m.role))){
  const before=processIdentity(member.pid);assert.ok(before&&before.startTicks===member.startTicks&&before.state!=='Z'&&before.uids.every(id=>id===65534)&&before.gids.every(id=>id===65534));assert.equal(member.uid,65534);
  const entries=fs.readFileSync('/proc/'+member.pid+'/environ','utf8').split('\0'),bindings={};
  for(const [key,target] of [['VISUAL_MEMORY_STORAGE_ROOT',p.visual],['SESSION_CONTINUITY_STORAGE_ROOT',p.session]]){
   const match=entries.find(value=>value.startsWith(key+'='));assert.ok(match,'NATIVE_STORAGE_SETTING_NOT_PROPAGATED');
   const value=match.slice(key.length+1);assert.equal(value,env[key]);assert.equal(path.join('/app',value),target);bindings[key]={value,resolvedRoot:target};
  }
  const after=processIdentity(member.pid);assert.ok(after&&after.startTicks===before.startTicks&&after.state!=='Z');
  nativeStoragePropagation.push({role:member.role,source:member.source,uid:member.uid,bindings});
 }
 assert.equal(nativeStoragePropagation.length,2);
 for(const root of [p.visual,p.session]){const st=fs.lstatSync(root);assert.ok(st.isDirectory()&&!st.isSymbolicLink());assert.equal(fs.realpathSync(root),root);assert.equal(st.uid,65534);assert.equal(st.gid,65534);assert.equal(st.mode&0o022,0);}
 write('native-storage-child-bindings.json',{source,generation,roles:nativeStoragePropagation,actualNativeRootsPresent:true,fullEnvironmentRetained:false,wholeRowsAccepted:[]});
 causalStage='NATIVE_BRAIN_HOOK_READY';const brainMember=members.find(m=>m.role==='brain-worker');assert.equal(brainMember.entrySha256,overlay.overlaySha256,'ADMITTED_BRAIN_ENTRY_OVERLAY_CHANGED');
 await until(()=>fs.existsSync(path.join(brainChannel,'receipts/ready.json')),'LIVE_BRAIN_HOOK_READY_REQUIRED',startupDeadline);
 const readyPath=path.join(brainChannel,'receipts/ready.json'),readyStat=fs.lstatSync(readyPath);assert.equal(readyStat.uid,65534);assert.equal(readyStat.gid,65534);assert.equal(readyStat.mode&0o777,0o600);assert.ok(readyStat.size<=16384);
 brainReady=readNativeReceipt('ready.json',16384);assert.equal(brainReady.source,source);assert.equal(brainReady.generation,generation);assert.equal(brainReady.identity.pid,brainMember.pid);assert.equal(brainReady.identity.startTicks,String(brainMember.startTicks));assert.equal(brainReady.membershipId,brainMember.id);assert.equal(brainReady.entrySha256,overlay.overlaySha256);assert.equal(brainReady.actualApplicationInitialized,true);
 write('live-brain-ready.json',brainReady);
 receipt.actualNativeApplication=true;receipt.runtimeRoles=members.map(m=>({role:m.role,source:m.source,entrySha256:m.entrySha256,uid:m.uid}));
 write('actual-runtime-ready.json',{source,generation,volume:p.volume,redisRunId:redisIdentity.runId,actualNativeApplication:true,syntheticOwnerOnly:true});signal('runtime-ready.json');
 await until(async()=>{
  if(!brainCaptureDone&&fs.existsSync(path.join(control,'capture-live-brain.json'))){
   causalStage='NATIVE_BRAIN_CAPTURE_REQUEST';brainCaptureDone=true;const command=JSON.parse(fs.readFileSync(path.join(control,'capture-live-brain.json'),'utf8'));assert.ok(['PREFLIGHT','BASELINE'].includes(command.mode));
   const request={schema:'work8-v30-live-brain-request-v1',requestId:randomUUID(),source,generation,mode:command.mode};
   const target=path.join(brainChannel,'requests/request.json'),pending=target+'.pending',fd=fs.openSync(pending,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);
   try{fs.writeFileSync(fd,JSON.stringify(request));fs.fchmodSync(fd,0o440);fs.fsyncSync(fd);fs.fchownSync(fd,0,65534);}finally{fs.closeSync(fd);}fs.renameSync(pending,target);
   await until(()=>fs.existsSync(path.join(brainChannel,'receipts/capture.json'))||fs.existsSync(path.join(brainChannel,'receipts/channel-failure.json')),'LIVE_BRAIN_CAPTURE_COMPLETION_REQUIRED',Date.now()+60000);
   if(fs.existsSync(path.join(brainChannel,'receipts/channel-failure.json'))){const failure=readNativeReceipt('channel-failure.json',16384);retainFirst(failure);write('live-brain-channel-failure.json',sanitizeNativeRecord(failure));throw Error('LIVE_BRAIN_PRIVATE_CHANNEL_FAILED');}
   const capturedPath=path.join(brainChannel,'receipts/capture.json'),capturedStat=fs.lstatSync(capturedPath);assert.equal(capturedStat.uid,65534);assert.equal(capturedStat.gid,65534);assert.equal(capturedStat.mode&0o777,0o600);assert.ok(capturedStat.size<=1048576);
   const captured=readNativeReceipt('capture.json');if(captured.failure)retainFirst(captured.failure);assert.equal(captured.requestId,request.requestId);assert.equal(captured.mode,command.mode);assert.deepEqual(captured.ready,brainReady);
   const member=census().members.find(m=>m.role==='brain-worker'&&m.state!=='TERMINATED');assert.ok(member);const actual=processIdentity(member.pid);assert.ok(actual&&actual.startTicks===member.startTicks&&actual.state!=='Z');assert.equal(member.pid,brainReady.identity.pid);assert.equal(String(member.startTicks),brainReady.identity.startTicks);assert.equal(member.entrySha256,overlay.overlaySha256);
   const {capture,...safeCaptured}=captured;write('live-brain-capture.json',{...safeCaptured,capture:capture&&{...capture,logicalStore:undefined},independentMembershipMatched:true});
   const expected=command.mode==='PREFLIGHT'?'PASS_ACTUAL_NATIVE_LIVE_BRAIN_PREFLIGHT':'PASS_ACTUAL_LIVE_BRAIN_BASELINE';assert.equal(captured.status,expected,'LIVE_BRAIN_CAPTURE_FAILED');assert.equal(capture.attestation.sameCachedInstance,true);assert.equal(capture.attestation.runtimeGeneration,generation);assert.equal(capture.attestation.source,source);
   signal('live-brain-baseline.json',capture);signal('live-brain-captured.json',{status:expected,requestId:request.requestId,source,generation,entrySha256:overlay.overlaySha256,logicalStoreSha256:capture.attestation.logicalStoreSha256,schemaObjectsSha256:capture.attestation.schemaObjectsSha256});
  }
  return fs.existsSync(path.join(control,'stop-runtime.json'));
 },'TRANSITION_CONTROL_DEADLINE');causalStage='NATIVE_ORDERLY_DRAIN';assert.ok(brainCaptureDone,'LIVE_BRAIN_CAPTURE_REQUIRED_BEFORE_DRAIN');await drain();assert.equal(receipt.actualNativeWritersDrained,true,'ACTUAL_ORDERLY_NATIVE_DRAIN_REQUIRED');assert.ok(Number.isSafeInteger(drainStartedAtMs)&&Number.isSafeInteger(drainCompletedAtMs)&&drainCompletedAtMs>=drainStartedAtMs,'ACTUAL_DRAIN_INTERVAL_REQUIRED');const drainObservation={schema:'work8-v62-native-drain-observation-v1',volume:p.volume,source,generation,actualNativeWritersDrained:receipt.actualNativeWritersDrained===true,startedAtMs:drainStartedAtMs,completedAtMs:drainCompletedAtMs};write('native-drain-observation.json',drainObservation);signal('runtime-drained.json',drainObservation);
 await until(()=>fs.existsSync(path.join(control,'readback-complete.json')),'INDEPENDENT_READBACK_DEADLINE');receipt.status='PASS_TECHNICAL_RUNTIME_ONLY';
}catch(error){if(!firstNativeFailure)retainFirst(emitNativeFailure(error,causalStage,'NATIVE_COORDINATOR_LIFECYCLE',{moduleInitialized:brainReady?true:null,applicationInitialized:receipt.actualNativeApplication===true?true:null,captureRequestReached:brainCaptureDone?true:null},'NATIVE_COORDINATOR'));receipt.failure=firstNativeFailure;throw error;}
finally{try{await drain();}catch{receipt.shutdownFailure=true;receipt.status='FAIL';}write('native-runtime-result.json',receipt);fs.writeFileSync(path.join(evidence,'sanitized-runtime.log'),JSON.stringify({schema:'work8-v31-runtime-output-metadata-v1',rawOutputSha256:sha(output),rawOutputBytes:Buffer.byteLength(output),firstNativeFailure,rawOutputRetained:false})+'\n');}

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {once} from 'node:events';
import {preparePathContract} from '/app/scripts/work8/o33-permissions.mjs';
const require=createRequire('/app/backend/package.json'),Redis=require('ioredis');
const {MembershipJournal,processIdentity}=require('/app/deployment/runtime-membership-controller.cjs');
const {resolveRuntimeRevision}=require('/app/deployment/runtime-revision.cjs');
const sha=x=>createHash('sha256').update(x).digest('hex'),pause=ms=>new Promise(r=>setTimeout(r,ms));
const source=process.env.EXPECTED_BACKEND,deadline=Date.now()+600000,evidence='/evidence',control='/control';
const receipt={schema:'work8-native-transition-runtime-v1',status:'FAIL',source,actualNativeApplication:false,productionAccess:false,wholeRowsAccepted:[]};
let runtime,paths,output='',drained=false,lastHealth={};
function boundedText(text,limit=1048576){const bytes=Buffer.from(text);if(bytes.length<=limit)return text;let cut=bytes.subarray(0,limit).toString('utf8');if(Buffer.byteLength(cut)>limit)cut=cut.slice(0,-1);return cut;}
function safe(text){const values=[process.env.FOUNDER_PASSWORD,process.env.ADMIN_PASSWORD,process.env.SESSION_SECRET,process.env.REDIS_URL];try{values.push(new URL(process.env.REDIS_URL).password);}catch{}for(const value of values)if(value)text=text.split(value).join('[REDACTED]');return text.replace(/Bearer\s+[^\s"<>]+/gi,'Bearer [REDACTED]').replace(/empireai_session=[^;\s"<>]+/g,'empireai_session=[REDACTED]').replace(/("(?:token|password|secret|nonce|authorization)"\s*:\s*")[^"]*(")/gi,'$1[REDACTED]$2');}
function write(name,value){const bytes=JSON.stringify(value,null,2)+'\n';assert.ok(Buffer.byteLength(bytes)<=16384,'DIAGNOSTIC_RECEIPT_SIZE_BOUND');const target=path.join(evidence,name),temp=target+'.tmp';fs.writeFileSync(temp,bytes);fs.renameSync(temp,target);}
function signal(name,value={ok:true}){const temp=path.join(control,name+'.tmp');fs.writeFileSync(temp,JSON.stringify(value),{mode:0o644});fs.renameSync(temp,path.join(control,name));}
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
async function until(fn,label,phaseDeadline=deadline){for(;;){assert.ok(Date.now()<Math.min(deadline,phaseDeadline),label);if(runtime?.exitCode!==null&&runtime?.exitCode!==undefined&&!drained)throw Error('ACTUAL_RUNTIME_EXITED');const value=await fn();assert.ok(Date.now()<Math.min(deadline,phaseDeadline),label);if(value)return;await pause(50);}}
async function drain(){if(drained||!runtime)return;const members=census().members.filter(m=>m.state!=='TERMINATED');
 if(runtime.exitCode!==null||runtime.signalCode!==null){for(const m of members){const now=processIdentity(m.pid);assert.ok(!now||now.startTicks!==m.startTicks||now.state==='Z','FAILED_RUNTIME_LEFT_LIVE_MEMBER');}drained=true;receipt.failedRuntimeHasNoLiveRecordedMembers=true;return;}
 const guard=members.find(m=>m.role==='containment-guard');assert.ok(guard);const exit=once(runtime,'exit');process.kill(guard.pid,'SIGTERM');const hard=setTimeout(()=>runtime.kill('SIGKILL'),25000);try{const [code,signal]=await exit;assert.equal(code,0);assert.equal(signal,null);for(const m of members){const now=processIdentity(m.pid);assert.ok(!now||now.startTicks!==m.startTicks||now.state==='Z');}drained=true;receipt.actualNativeWritersDrained=true;}finally{clearTimeout(hard);}}
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
 const env={PATH:'/usr/local/bin:/usr/bin:/bin',TMPDIR:p.temporary,EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',RAILWAY_VOLUME_MOUNT_PATH:p.volume,DATABASE_PATH:path.join(p.volume,'commissioning/empireai-brain.db'),RAILWAY_GIT_COMMIT_SHA:source,REDIS_URL:u.href,EMPIRE_LOCKED_REDIS_HOST:u.hostname,PORT:'43100',FOUNDER_EMAIL:'owner@work8.invalid',ADMIN_EMAIL:'admin@work8.invalid',FOUNDER_PASSWORD:process.env.FOUNDER_PASSWORD,ADMIN_PASSWORD:process.env.ADMIN_PASSWORD,SESSION_SECRET:process.env.SESSION_SECRET,WORK8_CONTROLLER_JOURNAL_PATH:paths.journal,WORK8_RUNTIME_UID:'65534',WORK8_RUNTIME_GID:'65534',WORK8_WRITER_ISOLATION_LIBRARY:'/native/runtime-writer-isolation.so',WORK8_WRITER_ISOLATION_SHA256:fs.readFileSync('/native/native.sha256','utf8').trim(),EMPIRE_GENERATION_DIRECTORY:p.authority,EMPIRE_GENERATION:generation,EMPIRE_CUTOVER_DIGEST:digest,EMPIRE_GENERATION_DEVICE:String(identity.dev),EMPIRE_GENERATION_INODE:String(identity.ino),EMPIRE_OWNER_WRITE_POLICY:'/run/empire-policy/control.json',INTELLIGENCE_ENABLED:'false',INTELLIGENCE_DISABLED:'true',CORS_ORIGIN:'http://localhost:43117'};
 const startupDeadline=Date.now()+210000;
 runtime=spawn(process.execPath,['/app/deployment/locked-runtime.cjs'],{env,stdio:['ignore','pipe','pipe']});
 write('last-startup-observation.json',{...startupMetadata(),startupDeadline:new Date(startupDeadline).toISOString(),phase:'spawned'});
 for(const stream of [runtime.stdout,runtime.stderr])stream.on('data',b=>{output+=b;fs.writeFileSync(path.join(evidence,'sanitized-runtime.log'),boundedText(safe(output)));if(Buffer.byteLength(output)>1048576){runtime.kill('SIGTERM');throw Error('DIAGNOSTIC_SIZE_BOUND');}});
 await until(async()=>{const [primary,worker]=await Promise.all([observeHealth(43100),observeHealth(43101)]);lastHealth={primary,worker};write('last-startup-observation.json',{...startupMetadata(),phase:'READINESS_POLL',startupDeadline:new Date(startupDeadline).toISOString(),...lastHealth});return primary.matched;},'ACTUAL_NATIVE_STARTUP_DEADLINE',startupDeadline);
 const expectedRoles=['assurance-inspector','assurance-worker','brain-worker','containment-guard','native-mission-lock-holder','primary','work8-domain-lock-holder'];
 await until(()=>{write('last-startup-observation.json',{...startupMetadata(),phase:'ROLE_CENSUS',startupDeadline:new Date(startupDeadline).toISOString(),...lastHealth});try{return JSON.stringify(census().members.filter(m=>m.state!=='TERMINATED').map(m=>m.role).sort())===JSON.stringify(expectedRoles);}catch{return false;}},'ACTUAL_NATIVE_ROLE_STARTUP',startupDeadline);
 const members=census().members.filter(m=>m.state!=='TERMINATED');assert.deepEqual(members.map(m=>m.role).sort(),expectedRoles);
 assert.ok(members.every(m=>m.source===source&&m.generation===generation));receipt.actualNativeApplication=true;receipt.runtimeRoles=members.map(m=>({role:m.role,source:m.source,entrySha256:m.entrySha256,uid:m.uid}));
 write('actual-runtime-ready.json',{source,generation,volume:p.volume,redisRunId:redisIdentity.runId,actualNativeApplication:true,syntheticOwnerOnly:true});signal('runtime-ready.json');
 await until(()=>fs.existsSync(path.join(control,'stop-runtime.json')),'TRANSITION_CONTROL_DEADLINE');await drain();signal('runtime-drained.json',{volume:p.volume});
 await until(()=>fs.existsSync(path.join(control,'readback-complete.json')),'INDEPENDENT_READBACK_DEADLINE');receipt.status='PASS_TECHNICAL_RUNTIME_ONLY';
}catch(error){receipt.failure=String(error?.code||'RUNTIME_TRANSITION_FAILURE');receipt.safeMessage=safe(String(error)).slice(0,500);throw error;}
finally{try{await drain();}catch{receipt.shutdownFailure=true;receipt.status='FAIL';}write('native-runtime-result.json',receipt);fs.writeFileSync(path.join(evidence,'sanitized-runtime.log'),boundedText(safe(output)));}

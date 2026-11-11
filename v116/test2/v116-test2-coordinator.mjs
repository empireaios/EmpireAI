import {publishNativeReceipts,publishHandoffCompletion} from './native-evidence-handoff.mjs';
import {activeOrderPreparationAndUpgrade} from './v116-test2-business.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash,randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {once} from 'node:events';
import {inspectCaptureReadiness} from './o33-capture-readiness.mjs';
import {readPendingState,validatePendingState} from './pending-restoration.mjs';
import {validateIndexHealth} from './index-restoration-phase.mjs';
import {mkdir,readableEvidence,preparePathContract,ownedTree} from './o33-permissions.mjs';
// Operator owns inactive materialization/infrastructure only. All application
// writers are the actual compiled entries admitted through locked-runtime.
const require=createRequire(import.meta.url),repo=path.resolve(import.meta.dirname,'../..');
const {MembershipJournal,processIdentity}=require('../../deployment/runtime-membership-controller.cjs');
const generation=require('../../deployment/runtime-generation.cjs'),recovery=require('../../deployment/work8-recovery-set.cjs');
const {LAYOUT,materializeRuntimeInspection}=require('../../deployment/work8-runtime-inspection-layout.cjs');
const contract=require('../../deployment/o33-path-contract.cjs');
const Redis=createRequire(path.join(repo,'backend/package.json'))('ioredis');
const sha=b=>createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const source=process.env.WORK8_SOURCE_SHA,evidence=process.env.WORK8_EVIDENCE_DIR,active=[];
const technicalAuthority='f1170d9351861402fac03c99b9eb829c1d05941546c085bfcae4790b8a26add3',policyFile='/data/work8-exam/v116-test2-owner-policy.json';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function durable(file,value,mode=0o600){const fd=fs.openSync(file,'wx',mode);try{fs.writeFileSync(fd,JSON.stringify(value,null,2));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}const d=fs.openSync(path.dirname(file),'r');try{fs.fsyncSync(d);}finally{fs.closeSync(d);}}

function sealedTree(dir){for(const name of fs.readdirSync(dir)){const f=path.join(dir,name),s=fs.lstatSync(f);assert.ok(!s.isSymbolicLink());if(s.isDirectory())sealedTree(f);else{assert.ok(s.isFile()&&s.nlink===1);fs.chownSync(f,0,0);const fd=fs.openSync(f,'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}}fs.chownSync(dir,0,0);fs.chmodSync(dir,0o500);const fd=fs.openSync(dir,'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
async function until(fn,deadline,label){for(;;){assert.ok(Date.now()<deadline,label);const value=await fn();assert.ok(Date.now()<deadline,label);if(value)return value;await pause(20);}}
function live(record){const p=processIdentity(record.pid);return p&&p.state!=='Z'&&p.startTicks===record.startTicks;}
function view(c){const j=new MembershipJournal(c.journal);try{return j.read();}finally{j.close();}}
const roles=['assurance-inspector','assurance-worker','brain-worker','containment-guard','primary','native-mission-lock-holder','work8-domain-lock-holder'].sort();
function census(c){const v=view(c),members=v.members.filter(m=>m.state!=='TERMINATED');assert.deepEqual(members.map(m=>m.role).sort(),roles);for(const m of members){assert.equal(m.source,source);assert.equal(m.generation,c.generation);assert.ok(live(m));if(m.role!=='containment-guard')assert.equal(m.uid,65534);}return {revision:v.revision,members};}
async function redisIdentity(url){const u=new URL(url);assert.equal(u.password,'work8-synthetic-only');assert.ok(['journal-redis','target-redis'].includes(u.hostname));assert.equal(u.pathname,'/0');const r=new Redis(url,{maxRetriesPerRequest:0,retryStrategy:()=>null});try{assert.equal(await r.ping(),'PONG');const runId=(await r.info('server')).match(/^run_id:([a-f0-9]{40})\r?$/m)?.[1];assert.match(runId??'',/^[a-f0-9]{40}$/);return {host:u.hostname,port:Number(u.port||6379),db:0,runId};}finally{r.disconnect();}}
function prepare(name,redis){
 const {base,volume,operator,authority}=preparePathContract(path.join('/data/work8-exam',name));const st=fs.statSync(volume),epoch=randomUUID();
 const cutover={schema:'runtime-cutover-v1',proofReferences:['FRESH_PRIVATE_ISOLATED_VOLUME_AND_REDIS_NO_OPERATING_HISTORY'],reviewReceipt:'O33_ISOLATED_EPOCH_NOT_PRODUCTION_CUTOVER',storage:{root:volume,dev:st.dev,ino:st.ino},redis,compatibleSources:[source],priorWriterDisposition:'EXCLUDED_BY_REVIEWED_OPERATING_TRANSITION',redisDisposition:'EXCLUSIVE_COHORT_CAPABILITY_REVIEWED'};
 const bytes=JSON.stringify(cutover),digest=sha(bytes);fs.writeFileSync(path.join(authority,'cutover-'+digest+'.json'),bytes,{flag:'wx',mode:0o644});
 const file=path.join(authority,'generation.sqlite'),db=new DatabaseSync(file);db.exec('PRAGMA journal_mode=DELETE; CREATE TABLE authority(id INTEGER PRIMARY KEY,version INTEGER,generation TEXT,cutover_digest TEXT,sources TEXT,epoch INTEGER); CREATE TABLE transitions(previous_generation TEXT,next_generation TEXT,cutover_digest TEXT,at TEXT);');db.prepare('INSERT INTO authority VALUES(1,1,?,?,?,1)').run(epoch,digest,JSON.stringify([source]));db.close();fs.chmodSync(file,0o644);return {base,volume,operator,authority,generation:epoch,digest,identity:fs.statSync(file),journal:path.join(operator,'journal.sqlite'),redis,primary:path.join(volume,'commissioning/empireai-brain.db')};
}
function networkProof(c){const p=read('/network-proof.json');assert.equal(p.source,source);assert.equal(p.internal,true);assert.deepEqual(p.attachedNetworkIds,[p.networkId]);assert.ok(p.containerId.startsWith(os.hostname()));assert.equal(p.privileged,false);assert.equal(p.readonlyRootfs,true);assert.equal(p.noPublishedPorts,true);const value={networkId:p.networkId,internal:true,containerId:p.containerId,networkNamespace:fs.readlinkSync('/proc/self/ns/net'),attachedNetworkIds:p.attachedNetworkIds};const file=path.join(c.operator,'network-proof.json');if(!fs.existsSync(file))durable(file,value,0o444);assert.deepEqual(read(file),value);return {networkProofFile:file,networkProofSha256:sha(fs.readFileSync(file))};}
function grant(c,mode,expiresAt,pending){const nonce=randomUUID(),resultDirectory=path.join(c.operator,nonce);mkdir(resultDirectory,0,0o700);const volume=fs.statSync(c.volume),file=path.join(c.operator,nonce+'.json');const value={schema:'work8-isolated-application-v1',source,generation:c.generation,nonce,mode,volume:{root:c.volume,dev:volume.dev,ino:volume.ino},redis:c.redis,expiresAt,captureDirectory:path.join(c.base,'capture/point'),resultDirectory,...networkProof(c),...(pending?{pending:{...pending,source,capability:nonce,authorization:'FRESH_GENERATED_SINGLE_READONLY_EXAMINATION'}}:{})};durable(file,value,0o444);return {file,value};}
function env(c,g){return {PATH:'/usr/local/bin:/usr/bin:/bin',TMPDIR:contract.paths(c.base).temporary,EMPIRE_OWNER_WRITE_POLICY:policyFile,INTELLIGENCE_ENABLED:'false',INTELLIGENCE_DISABLED:'true',VISUAL_MEMORY_STORAGE_ROOT:path.relative(repo,contract.nativeRoot(c.volume,'visual')),SESSION_CONTINUITY_STORAGE_ROOT:path.relative(repo,contract.nativeRoot(c.volume,'session')),EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',RAILWAY_VOLUME_MOUNT_PATH:c.volume,DATABASE_PATH:c.primary,RAILWAY_GIT_COMMIT_SHA:source,REDIS_URL:'redis://:work8-synthetic-only@'+c.redis.host+':'+c.redis.port+'/0',EMPIRE_LOCKED_REDIS_HOST:c.redis.host,PORT:'43100',FOUNDER_EMAIL:'hh4-owner@example.test',ADMIN_EMAIL:'hh4-admin@example.test',FOUNDER_PASSWORD:'generated-hh4-owner-password',ADMIN_PASSWORD:'generated-hh4-admin-password',SESSION_SECRET:'synthetic-session-credential-000003333',WORK8_CONTROLLER_JOURNAL_PATH:c.journal,WORK8_RUNTIME_UID:'65534',WORK8_RUNTIME_GID:'65534',WORK8_WRITER_ISOLATION_LIBRARY:process.env.WORK8_WRITER_ISOLATION_LIBRARY,WORK8_WRITER_ISOLATION_SHA256:process.env.WORK8_WRITER_ISOLATION_SHA256,EMPIRE_GENERATION_DIRECTORY:c.authority,EMPIRE_GENERATION:c.generation,EMPIRE_CUTOVER_DIGEST:c.digest,EMPIRE_GENERATION_DEVICE:String(c.identity.dev),EMPIRE_GENERATION_INODE:String(c.identity.ino),WORK8_ISOLATED_APPLICATION_GRANT:g.file};}
function launch(c,g,label){let output='';const startedAt=Date.now();const child=spawn(process.execPath,[path.join(repo,'deployment/locked-runtime.cjs')],{env:env(c,g),stdio:['ignore','pipe','pipe']});child.stdout.on('data',b=>{output+=b;if(output.length>4194304)child.kill('SIGTERM');});child.stderr.on('data',b=>{output+=b;if(output.length>4194304)child.kill('SIGTERM');});const v={c,g,child,label,startedAt,output:()=>output};active.push(v);return v;}
async function event(run,name,deadline){return until(()=>{const failure=path.join(run.g.value.resultDirectory,'failure.json');if(fs.existsSync(failure))throw Error(JSON.stringify(read(failure)));if(run.child.exitCode!==null)throw Error('APPLICATION_EXIT_BEFORE_'+name+' '+run.output());const file=path.join(run.g.value.resultDirectory,name+'.json');if(!fs.existsSync(file))return null;const r=read(file);assert.equal(r.source,source);assert.equal(r.generation,run.c.generation);return r;},deadline,'ORIGINAL_'+name.toUpperCase()+'_DEADLINE');}
async function health(run,original,deadline){
 return until(async()=>{
  if(run.child.exitCode!==null)throw Error('INDEX_EXITED_BEFORE_READY');
  const observation={source,at:Date.now()};
  try{
   const get=(port,route,headers={})=>fetch('http://127.0.0.1:'+port+route,{headers,signal:AbortSignal.timeout(Math.max(1,Math.min(2000,deadline-Date.now())))});
   // The real worker readiness predicate must pass; retain its blocker payload
   // so a primary proxy refusal cannot hide the underlying auth/storage gate.
   const worker=await get(43101,'/health/ready');
   observation.worker={status:worker.status,body:await worker.json()};
   assert.equal(worker.status,200);assert.equal(observation.worker.body.ready,true);
   assert.equal(observation.worker.body.pillow.enabled,true);assert.equal(observation.worker.body.pillow.ready,true);
   assert.equal(observation.worker.body.pillow.lifecycle,'running');
   const [watchdog,pillow]=await Promise.all([get(43100,'/health/executive-continuity'),get(43100,'/api/pillow/status',{authorization:'Bearer '+original.token})]);
   observation.primary={watchdogStatus:watchdog.status,pillowStatus:pillow.status};
   assert.equal(watchdog.status,200);assert.equal(pillow.status,200);
   assert.equal((await pillow.json()).status.lifecycle,'running');
   const verified=validateIndexHealth(await watchdog.json());
   observation.captureInventory=inspectCaptureReadiness({volume:run.c.volume,startedAt:run.startedAt});
   assert.equal(observation.captureInventory.ready,true,'MANDATORY_CAPTURE_INVENTORY_NOT_READY');
   fs.writeFileSync(path.join(evidence,run.label+'-last-readiness.json'),JSON.stringify({...observation,verified:true}));
   return verified;
  }catch(error){fs.writeFileSync(path.join(evidence,run.label+'-last-readiness.json'),JSON.stringify({...observation,error:String(error)}));return null;}
 },deadline,'ORIGINAL_INDEX_STARTUP_DEADLINE');
}
async function drain(run){const members=census(run.c).members,guard=members.find(m=>m.role==='containment-guard');const exited=once(run.child,'exit');process.kill(guard.pid,'SIGTERM');const timer=setTimeout(()=>run.child.kill('SIGTERM'),20000);try{const [code,signal]=await exited;assert.equal(code,0,run.output());assert.equal(signal,null);assert.ok(members.every(m=>!live(m)),'DRAINED_GROUP_HAS_WRITER');assert.ok(view(run.c).members.filter(m=>m.role!=='containment-guard').every(m=>m.state==='TERMINATED'));}finally{clearTimeout(timer);fs.writeFileSync(path.join(evidence,run.label+'.log'),run.output());}}
function nextGeneration(c){const prior=c.generation,next=randomUUID();generation.transition({root:c.authority,expectedGeneration:prior,nextGeneration:next,cutoverDigest:c.digest,expectedDevice:c.identity.dev,expectedInode:c.identity.ino});c.generation=next;return prior;}
function dataHashes(c){const rows=[];for(const name of ['commissioning','finance','commerce','pillow-visual-memory','pillow-session-continuity']){const walk=d=>{for(const n of fs.readdirSync(d).sort()){const f=path.join(d,n),st=fs.lstatSync(f);assert.ok(!st.isSymbolicLink());if(st.isDirectory())walk(f);else rows.push([path.relative(c.volume,f),sha(fs.readFileSync(f))]);}};walk(path.join(c.volume,name));}return rows;}
async function redisDumps(c){const r=new Redis('redis://:work8-synthetic-only@'+c.redis.host+':'+c.redis.port+'/0',{maxRetriesPerRequest:0,retryStrategy:()=>null});try{const keys=(await r.keys('*')).sort();assert.ok(keys.length<1000);const rows=[];for(const key of keys)rows.push([key,sha(await r.dumpBuffer(key))]);return rows;}finally{r.disconnect();}}
async function refusePrior(c,g,prior,label){
 const before=dataHashes(c),beforeJournal=view(c),beforeRedis=await redisDumps(c),current=c.generation;
 const inputs={root:c.authority,expectedGeneration:prior,expectedSource:source,cutoverDigest:c.digest,expectedDevice:c.identity.dev,expectedInode:c.identity.ino,volumeRoot:c.volume,redisUrl:'redis://:work8-synthetic-only@'+c.redis.host+':'+c.redis.port+'/0'};
 assert.throws(()=>generation.acquireOperatorGuardLease(inputs),/RUNTIME_GENERATION_AUTHORITY_REFUSED/);
 c.generation=prior;const r=launch(c,g,label);c.generation=current;
 const [code]=await Promise.race([once(r.child,'exit'),pause(5000).then(()=>{throw Error('STALE_ADMISSION_TIMEOUT');})]);
 assert.notEqual(code,0);assert.match(r.output(),/Parent-loss guard refused startup/);assert.deepEqual(dataHashes(c),before);assert.deepEqual(view(c),beforeJournal);assert.deepEqual(await redisDumps(c),beforeRedis);
 durable(path.join(evidence,label+'-refusal.json'),{source,prior,current,firstFailure:'RUNTIME_GENERATION_AUTHORITY_REFUSED',guardRefused:true,journalUnchanged:true,canonicalDataUnchanged:true,redisDumpsUnchanged:true});
 fs.writeFileSync(path.join(evidence,label+'.log'),r.output());
}

function tables(file){const db=new DatabaseSync(file,{readOnly:true});try{return Object.fromEntries(db.prepare("SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name").all().map(({name})=>[name,sha(JSON.stringify(db.prepare('SELECT * FROM "'+name.replaceAll('"','""')+'"').all().map(x=>JSON.stringify(x)).sort()))]));}finally{db.close();}}

const receipt={source,scope:'V116_A2_21_ACTIVE_ORDER_UPGRADE',status:'FAIL',productionAccess:false,genuineOwnerEvidence:false,wholeRowAccepted:false,acceptedRows:[],originalPredicate:'Prepare a new application/UX version while additional simulated orders arrive. Deploy the new compatible version in isolation and prove all committed orders remain visible.'};
let stage='exact-input-and-authority';
try{
 assert.equal(process.getuid(),0);assert.equal(process.versions.node,'22.23.2');assert.equal(source,'6c1e63ba20619ee480742fd87dc810ca93152e22');assert.ok(evidence);assert.equal(require('../../deployment/runtime-revision.cjs').resolveRuntimeRevision(repo,source),source);
 assert.equal(sha(fs.readFileSync('/technical-authority.json')),technicalAuthority);durable(policyFile,{schema:1,mode:'RELEASED',approvalSha256:technicalAuthority,expiresAt:new Date(Date.now()+420000).toISOString()},0o444);
 stage='original-native-source-startup';const sourceRedis=await redisIdentity(process.env.WORK8_MEMBERSHIP_REDIS_URL),c=prepare('source',sourceRedis),deadline=Date.now()+180000,g=grant(c,'source',deadline),run=launch(c,g,'source');
 const ready=await event(run,'ready',deadline),inventory=ready.inventory;assert.equal(inventory.source,source);assert.equal(inventory.classification,'LABELLED_SYNTHETIC_INITIALIZATION');assert.equal(inventory.externalEffects,0);assert.equal(inventory.paidInference,0);const sourceHealth=await health(run,inventory.originalSession,deadline),initialCensus=census(c);
 durable(path.join(evidence,'test2-native-startup.json'),{source,generation:c.generation,originalDeadline:deadline,health:sourceHealth,census:initialCensus,syntheticOwnerOnly:true,captureRequested:false});
 stage='native-active-order-upgrade';receipt.business=await activeOrderPreparationAndUpgrade({deadline,evidence,policyFile,technicalAuthority,source,onStage:value=>{stage=value;},assertSameBackend:()=>{const current=census(c);for(const prior of initialCensus.members){const next=current.members.find(m=>m.role===prior.role);assert.equal(next.pid,prior.pid);assert.equal(next.startTicks,prior.startTicks);assert.equal(next.generation,prior.generation);}}});
 stage='native-writer-drain-and-independent-sqlite-readback';await drain(run);
 const file=path.join(c.volume,'commerce/runtime.sqlite'),db=new DatabaseSync(file,{readOnly:true});try{assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');const rows=db.prepare('SELECT record FROM commerce_runtime_receipts WHERE workspace=? ORDER BY mission,version').all(receipt.business.twinWorkspace);assert.equal(rows.length,20);const records=rows.map(row=>{const r=JSON.parse(row.record);const {digest,...body}=r;assert.equal(sha(JSON.stringify(body)),digest);return r;});for(const shown of receipt.business.presented.records){const actual=records.filter(r=>r.missionId===shown.missionId);assert.equal(actual.length,10);assert.deepEqual(actual.map(r=>({id:r.id,version:r.version,digest:r.digest})),shown.history.map(r=>({id:r.id,version:r.version,digest:r.digest})));const final=actual.at(-1);assert.equal(final.digest,shown.receiptDigest);assert.equal(final.version,shown.version);assert.deepEqual(Object.keys(final.state.orders).sort(),shown.orders.map(o=>o.orderId).sort());const financial=db.prepare('SELECT record,digest FROM work8_sim_finance_events WHERE workspace=? AND mission=? ORDER BY sequence').all(receipt.business.twinWorkspace,shown.missionId);assert.equal(financial.length,shown.finance.events.length);financial.forEach((row,index)=>{const actual=JSON.parse(row.record);assert.equal(sha(JSON.stringify(actual)),row.digest);for(const [key,value]of Object.entries(shown.finance.events[index]))assert.deepEqual(actual[key],value);});}durable(path.join(evidence,'test2-independent-sqlite-readback.json'),{integrity:'ok',selectedReceiptCount:rows.length,receiptRowsSHA256:sha(JSON.stringify(rows)),allPresentedHistoryAndOrdersMatch:true,readOnly:true,writersDrained:true});}finally{db.close();}
 receipt.status='PASS_AWAITING_INDEPENDENT_A2_21_REVIEW';receipt.assertions={newCandidatePreparedWhileNativeOrdersCommitted:true,exactRetainedCompatibleFrontendDeployed:true,everyCommittedOrderVisible:true,committedHistoryAndFinancePreserved:true,sameSevenNativeProcessesAcrossUpgrade:true,independentFinalSQLiteReadback:true,noA5LifecycleRerun:true,noGenuineOwnerOrProductionClaim:true};
}catch(error){receipt.firstFailure={stage,name:error.name,message:String(error.message)};process.exitCode=1;}
finally{
 for(const run of active)if(run.child.exitCode===null)try{await drain(run);}catch(error){receipt.cleanupFailure=String(error);run.child.kill('SIGKILL');process.exitCode=1;}
 if(fs.existsSync(policyFile))fs.unlinkSync(policyFile);receipt.policyRemoved=!fs.existsSync(policyFile);receipt.finishedAt=Date.now();durable(path.join(evidence,'v116-test2-result.json'),receipt);try{const handoff=publishNativeReceipts(evidence);publishHandoffCompletion(evidence,handoff);}catch(error){receipt.evidenceHandoffFailure=String(error);process.exitCode=1;}console.log(JSON.stringify({scope:receipt.scope,status:receipt.evidenceHandoffFailure?'FAIL_EVIDENCE_HANDOFF':receipt.status,firstFailure:receipt.firstFailure,evidenceHandoffFailure:receipt.evidenceHandoffFailure}));
}

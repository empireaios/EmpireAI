import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createServer} from 'node:net';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
function tableDigests(file){const db=new DatabaseSync(file,{readOnly:true});try{const out={};for(const {name}of db.prepare("SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name").all()){const rows=db.prepare('SELECT * FROM "'+name.replaceAll('"','""')+'"').all().map(r=>JSON.stringify(r,(_k,v)=>typeof v==='bigint'?String(v):v)).sort();out[name]={count:rows.length,sha256:sha(JSON.stringify(rows))};}return out;}finally{db.close();}}
function auditRows(file){const db=new DatabaseSync(file,{readOnly:true});try{const rows=db.prepare('SELECT * FROM audit_logs ORDER BY id').all().map(row=>({...row}));assert.ok(rows.length<=1000&&Buffer.byteLength(JSON.stringify(rows))<=1048576,'BOUNDED_SYNTHETIC_AUDIT_EVIDENCE_REQUIRED');return rows;}finally{db.close();}}
const require=createRequire(import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
export function validateRestorationAuthorization({source,held,verification,inventory}){
 assert.match(source,/^[a-f0-9]{40}$/);assert.equal(held.source,source);assert.equal(verification.source,source);
 assert.equal(verification.held.digest,held.digest);assert.equal(verification.verificationAfterContainment,true);
 assert.equal(verification.containment.after.State.Running,false);assert.equal(verification.containment.after.State.Pid,0);
 assert.equal(verification.containment.noRestart,true);assert.deepEqual(verification.containment.survivors,[]);
 assert.equal(inventory.source,source);assert.equal(inventory.classification,'LABELLED_SYNTHETIC_INITIALIZATION');
 assert.equal(inventory.workspace,'synthetic:hh4');assert.equal(inventory.externalEffects,0);assert.equal(inventory.paidInference,0);
 assert.equal(inventory.originalSession.workspaceId,inventory.workspace);assert.equal(inventory.originalSession.email,'hh4-owner@example.test');
 assert.equal(held.bootAllowed,false);assert.equal(held.completeLiveState,false);
}
/** Generated, isolated application-graph examination only. Never promotes the
 * original inspection manifest or imports historical approval authority. */
export async function examineApplicationGraph({source,evidence='/evidence',directory='/capture',resultFile='/results/application-graph-result.json',mode='graph'}){
 assert.ok(['graph','index'].includes(mode),'RESTORATION_MODE_REQUIRED');
 const read=name=>JSON.parse(fs.readFileSync(path.join(evidence,name),'utf8'));
 const held=read('container-evidence/hh4-held.json'),inventory=read('container-evidence/hh4-worker-ready.json').inventory;
 validateRestorationAuthorization({source,held,inventory,verification:read('held-capture-external-verification.json')});
 const repo=fs.realpathSync(path.resolve(import.meta.dirname,'../..'));
 require('../../deployment/runtime-revision.cjs').resolveRuntimeRevision(repo,source);
 // Reuse the existing generated capability's kernel/network/credential checks.
 const {createGeneratedCaptureScope}=await import('../../backend/dist/runtime/work8-generated-capture-hold.js');
 const scope=createGeneratedCaptureScope({timeoutMs:5000,onHeld:()=>assert.fail('NO_NEW_CAPTURE')});
 const root=scope.volumeRoot,runDirectory=path.dirname(root),deadline=Date.now()+180000;
 assert.equal(fs.realpathSync(runDirectory),runDirectory);assert.match(path.basename(runDirectory),/^work8-generated-capture-/);assert.equal(fs.statSync(runDirectory).mode&0o777,0o700);assert.equal(fs.statSync(runDirectory).uid,process.getuid());assert.equal(path.dirname(scope.captureRoot),runDirectory);
 for(const external of [evidence,directory,path.dirname(resultFile)])assert.ok(external!==runDirectory&&!external.startsWith(runDirectory+path.sep));
 const runIdentity=fs.statSync(runDirectory);
 const recovery=require('../../deployment/work8-recovery-set.cjs');
 const manifest=recovery.verifyRuntimeRecoverySet({directory,digest:held.digest});assert.equal(manifest.sourceCommit,source);
 for(const key of ['visualMemoryDigest','sessionContinuityDigest','executiveDecisionJournalDigest'])assert.ok(manifest[key],'AUXILIARY_CAPTURE_REQUIRED');
 const {LAYOUT,materializeRuntimeInspection}=require('../../deployment/work8-runtime-inspection-layout.cjs');
 const sealed=path.join(path.dirname(root),'inspection');materializeRuntimeInspection({directory,digest:held.digest,destination:sealed});
 // This separate generated target preserves the immutable inspection receipt.
 fs.cpSync(sealed,root,{recursive:true,errorOnExist:true,force:false});
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'INSPECTION_ONLY.json'))).bootAllowed,false);
 const preboot={},beforeTables={};for(const [id,relative]of Object.entries(LAYOUT)){const original=fs.readFileSync(path.join(directory,id,'checkpoint.db')),target=fs.readFileSync(path.join(root,relative));assert.ok(target.equals(original));preboot[id]=sha(target);beforeTables[id]=tableDigests(path.join(root,relative));}
 const beforeAudit=mode==='index'?auditRows(path.join(root,LAYOUT.brain)):null;
 const journal=JSON.parse(fs.readFileSync(path.join(directory,'executive-decisions.json')));
 // The application reads its static repository journal path: a nonempty journal
 // needs a separately reviewed binding, never silently ignore or activate it.
 const boundJournal=path.join(repo,'docs/governance/digital-soul/executive-decision-records.jsonl');
 assert.ok(journal.file,'PRESENT_JOURNAL_REQUIRED');assert.ok(fs.readFileSync(boundJournal).equals(Buffer.from(journal.file.bytes,'base64')),'RESTORED_JOURNAL_BINDING_MISMATCH');
 assert.equal(fs.statSync(boundJournal).mode&0o777,journal.file.mode);
 assert.throws(()=>fs.openSync(boundJournal,'a'),error=>error.code==='EROFS'||error.code==='EACCES','JOURNAL_MUST_REMAIN_READONLY');
 const port=await new Promise((resolve,reject)=>{const s=createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const port=s.address().port;s.close(()=>resolve(port));});});
 // Capture the port before closing (Node clears address on close).
 assert.ok(Number.isInteger(port),'ISOLATED_REDIS_PORT_REQUIRED');
 let server,redis,application,failure;const hardDeadline=setTimeout(()=>{try{fs.writeFileSync(resultFile,JSON.stringify({schema:'WORK8_APPLICATION_GRAPH_RESTORATION_V1',source,digest:held.digest,status:'FAIL',error:'ORIGINAL_APPLICATION_STARTUP_DEADLINE',cleanupRequiresOuterContainment:true}),{flag:'wx',mode:0o600});}finally{console.error('APPLICATION_RESTORATION_HARD_DEADLINE');process.exit(1);}},Math.max(1,deadline-Date.now()));hardDeadline.unref();const receipt={schema:'WORK8_APPLICATION_GRAPH_RESTORATION_V1',source,digest:held.digest,status:'FAIL',mode,preboot,operationalRestoration:false,authorityImported:false,sourceManifestBootAllowed:false,paidInference:0,externalEffects:0,globalWriterTopology:false,protectedCustody:false,originalRequirementsAccepted:[]};
 try{
  const redisDir=path.join(root,'redis');fs.mkdirSync(redisDir,{mode:0o700});
  server=spawn('/usr/bin/redis-server',['--bind','127.0.0.1','--port',String(port),'--dir',redisDir,'--save','','--appendonly','yes','--appendfsync','always'],{stdio:['ignore','pipe','inherit']});
  await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('RESTORE_REDIS_START_TIMEOUT')),10000);server.once('error',reject);server.once('exit',()=>reject(Error('RESTORE_REDIS_EXIT')));server.stdout.on('data',b=>{out+=String(b);if(out.includes('Ready to accept connections')){clearTimeout(timer);resolve();}});});
  Object.assign(process.env,{RAILWAY_VOLUME_MOUNT_PATH:root,DATABASE_PATH:path.join(root,LAYOUT.brain),SHADOW_CEO_DATA_DIR:path.join(root,'shadow'),REDIS_URL:'redis://127.0.0.1:'+port,REDIS_OPTIONAL:'false',EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',MISSION_AUTHORITY_EXECUTOR_ENABLED:'false',RAILWAY_GIT_COMMIT_SHA:source,EMPIRE_ROLE:'brain-worker',EMPIRE_TIER0_ISOLATION:'false',FOUNDER_EMAIL:'hh4-owner@example.test',FOUNDER_PASSWORD:'generated-hh4-owner-password',ADMIN_EMAIL:'hh4-admin@example.test',ADMIN_PASSWORD:'generated-hh4-admin-password'});
  for(const [key,relative]of [['VISUAL_MEMORY_STORAGE_ROOT','visual-memory-inspection/visual-memory'],['SESSION_CONTINUITY_STORAGE_ROOT','session-continuity']])process.env[key]=path.relative(repo,path.join(root,relative));
  const Redis=createRequire(path.join(repo,'backend/package.json'))('ioredis');redis=new Redis({host:'127.0.0.1',port});await redis.ping();
  const runId=(await redis.info('server')).match(/^run_id:([a-f0-9]{40})\r?$/m)?.[1];assert.ok(runId);
  const {restoreWork8RedisInspection}=await import('../../backend/dist/runtime/work8-recovery-capture.js');
  const restored=await restoreWork8RedisInspection({directory,digest:held.digest,mode:'inspection-only',expectedCaptureOwner:manifest.redisIdentity.owner,expectedSource:manifest.redisIdentity,expectedTarget:{runId,db:0}},redis);
  if(mode==='graph'){
  const {buildApp}=await import('../../backend/dist/app.js');application=await buildApp({startWorkers:false,startScheduler:false,earlyListen:false});
  await application.app.ready();
  const {getPillowHost}=await import('../../backend/dist/orchestration/pillow-host/pillow-host.js');const host=getPillowHost();
  while(host.getStatus().lifecycle!=='running'){assert.ok(Date.now()<deadline,'ORIGINAL_APPLICATION_STARTUP_DEADLINE');await new Promise(r=>setTimeout(r,100));}
  const original=inventory.originalSession;assert.deepEqual(await application.brain.sessionStore.get(original.token),original);
  for(const headers of [{authorization:'Bearer '+original.token},{cookie:'empireai_session='+original.token}]){const response=await application.app.inject({method:'GET',url:'/auth/me',headers});assert.equal(response.statusCode,200);const {platformIdentity,...user}=response.json().user;const {token,expiresAt,createdAt,...expected}=original;assert.deepEqual(user,expected);}
  const ttl=await redis.pttl('empireai:session:'+original.token);assert.ok(ttl>0&&ttl<=Date.parse(original.expiresAt)-Date.now()+1000,'SESSION_LIFETIME_EXTENDED');
  assert.equal((await application.app.inject({method:'GET',url:'/auth/me',headers:{authorization:'Bearer forged'}})).statusCode,401);
  assert.equal(await redis.get(manifest.redisIdentity.ownerKey),restored.owner);assert.equal(await application.brain.taskQueue.queue.isPaused(),true);
  assert.equal(host.getMissionAuthorityExecutionDiagnostics().enabled,false,'MISSION_REPLAY_MUST_REMAIN_DISABLED');
  assert.deepEqual(tableDigests(path.join(root,LAYOUT.execution)),beforeTables.execution,'PENDING_EXECUTION_CHANGED_WITHOUT_AUTHORITY');
  assert.deepEqual(host.getMissionRuntimeHistory(),inventory.domains.missions.publicReadback,'MISSION_HISTORY_CHANGED');
  const {FinancialCentre}=await import('../../backend/dist/finance/financial-centre.js');const finance=new FinancialCentre(path.join(root,LAYOUT.financialEvidence));try{assert.deepEqual(finance.entries(inventory.workspace),inventory.domains.financialEvidence.publicReadback);}finally{finance.close();}
  }else{
   const {examineRestoredIndex}=await import('./index-restoration-phase.mjs');
   receipt.index=await examineRestoredIndex({repo,deadline,originalSession:inventory.originalSession,redis,manifest,inspectionOwner:restored.owner,onDiagnostic:diagnostic=>fs.writeFileSync(path.join(path.dirname(resultFile),'index-last-poll.json'),JSON.stringify({source,digest:held.digest,diagnostic},null,2),{mode:0o600})});
   for(const id of ['missions','execution','financialEvidence','liveCostCentre'])assert.deepEqual(tableDigests(path.join(root,LAYOUT[id])),beforeTables[id],id+'_INDEX_RECORDS_CHANGED');
   const afterAudit=auditRows(path.join(root,LAYOUT.brain)),prior=new Map(beforeAudit.map(row=>[row.id,row])),after=new Map(afterAudit.map(row=>[row.id,row]));
   const changedOrRemoved=beforeAudit.filter(row=>JSON.stringify(after.get(row.id))!==JSON.stringify(row));
   const addedRows=afterAudit.filter(row=>!prior.has(row.id));
   const auditDelta={source,digest:held.digest,scope:'SYNTHETIC_GENERATED_TARGET_AUDIT_ROWS',sourceRowCount:beforeAudit.length,targetRowCount:afterAudit.length,existingRowsUnchanged:changedOrRemoved.length===0,changedOrRemoved,addedRows,classification:'INDEPENDENT_REVIEW_REQUIRED_NO_AUTOMATIC_ALLOWLIST'};
   fs.writeFileSync(path.join(path.dirname(resultFile),'index-audit-row-delta.json'),JSON.stringify(auditDelta,null,2),{flag:'wx',mode:0o600});
   receipt.auditDelta={existingRowsUnchanged:auditDelta.existingRowsUnchanged,addedCount:addedRows.length,evidence:'index-audit-row-delta.json'};
   assert.equal(changedOrRemoved.length,0,'CAPTURED_AUDIT_HISTORY_CHANGED');
  }
  const {listExecutiveDecisionRecords}=await import('../../pillow/dist/digital-soul/decision-record.js');
  assert.deepEqual(await listExecutiveDecisionRecords(repo),Buffer.from(journal.file.bytes,'base64').toString().split('\n').filter(x=>x.trim()).map(x=>JSON.parse(x)));
  assert.ok(fs.readFileSync(boundJournal).equals(Buffer.from(journal.file.bytes,'base64')));
  recovery.verifyRuntimeRecoverySet({directory,digest:held.digest});
  receipt.targetTableChanges=[];for(const [id,relative]of Object.entries(LAYOUT)){const after=tableDigests(path.join(root,relative));for(const name of new Set([...Object.keys(beforeTables[id]),...Object.keys(after)])){if(JSON.stringify(beforeTables[id][name])!==JSON.stringify(after[name]))receipt.targetTableChanges.push({store:id,table:name,before:beforeTables[id][name]??null,after:after[name]??null,attribution:'APPLICATION_STARTUP_OR_READBACK_REQUIRES_INDEPENDENT_CLASSIFICATION'});}}
  receipt.status=receipt.targetTableChanges.length?'AWAITING_INDEPENDENT_MUTATION_CLASSIFICATION':(mode==='index'?'PASS_SCOPED_INDEX_WATCHDOG_ONLY':'PASS_SCOPED_APPLICATION_GRAPH_ONLY');receipt.originalSessionAuthenticated=true;receipt.missionAndFinancialHistoryPreserved=true;receipt.queueAdmissionRemainsFenced=true;receipt.indexWatchdogAndAmazonContinuationsExamined=false;receipt.indexWatchdogExamined=mode==='index';receipt.pendingReplay='REUSE_ACCEPTED_SEPARATE_PROCESS_PROOF_NOT_REEXAMINED';
 }catch(error){failure=error;receipt.error=String(error);if(error.indexReceipt)receipt.index=error.indexReceipt;}
 finally{try{await application?.shutdown();}catch(error){failure??=error;receipt.status='FAIL';receipt.shutdownError=String(error);}redis?.disconnect();if(server&&server.exitCode===null){const exited=once(server,'exit');server.kill('SIGKILL');await exited;}if(!receipt.index?.cleanupRequiresOuterContainment)clearTimeout(hardDeadline);receipt.redisProcessStopped=true;fs.writeFileSync(resultFile,JSON.stringify(receipt,null,2),{flag:'wx',mode:0o600});assert.equal(fs.realpathSync(runDirectory),runDirectory);const current=fs.statSync(runDirectory);assert.equal(current.dev,runIdentity.dev);assert.equal(current.ino,runIdentity.ino);if(!receipt.index?.cleanupRequiresOuterContainment)fs.rmSync(runDirectory,{recursive:true,force:true});}
 if(failure)throw failure;return receipt;
}
export function prepareRestoredJournal({directory,digest,destination}){
 const recovery=require('../../deployment/work8-recovery-set.cjs');const manifest=recovery.verifyRuntimeRecoverySet({directory,digest});assert.ok(manifest.executiveDecisionJournalDigest);const snapshot=JSON.parse(fs.readFileSync(path.join(directory,'executive-decisions.json')));assert.ok(snapshot.file);return require('../../deployment/work8-session-continuity-recovery.cjs').materializeExecutiveDecisionJournal({snapshot,destination});
}
if(process.argv[1]===import.meta.filename)examineApplicationGraph({source:process.argv[2],mode:process.argv[3]??'graph',resultFile:process.argv[3]==='index'?'/results/index-restoration-result.json':'/results/application-graph-result.json'}).catch(error=>{console.error(error);process.exitCode=1;});

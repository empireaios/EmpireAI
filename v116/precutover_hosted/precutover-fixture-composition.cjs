'use strict';
// Fixture-only composition for the unchanged original precutover observations.
// No production data, genuine owner assertion, provider credential or live action.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');
const SOURCE='6c1e63ba20619ee480742fd87dc810ca93152e22';
const IMAGE='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0';
const TECHNICAL_AUTHORITY='f1170d9351861402fac03c99b9eb829c1d05941546c085bfcae4790b8a26add3';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
function durable(file,value,mode=0o444){const fd=fs.openSync(file,'wx',mode);try{fs.writeFileSync(fd,JSON.stringify(value,null,2)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}const dir=fs.openSync(path.dirname(file),'r');try{fs.fsyncSync(dir);}finally{fs.closeSync(dir);}}
function create({root,repo,output,source}){
 const contract=require(path.join(repo,'deployment/o33-path-contract.cjs'));
 const {files}=require(path.join(repo,'deployment/locked-state-bundle.cjs'));
 const {MembershipJournal,processIdentity,protectedPath}=require(path.join(repo,'deployment/runtime-membership-controller.cjs'));
 const {prepareWriterIsolation}=require(path.join(repo,'deployment/runtime-writer-isolation.cjs'));
 const contexts=new Map(),events=[];
 const policy=path.join(root,'technical-fixture-policy.json');
 const library=process.env.WORK8_WRITER_ISOLATION_LIBRARY,librarySHA256=process.env.WORK8_WRITER_ISOLATION_SHA256;
 let permissions,initialized=false,launches=0;
 const receipt={schema:'v116-original-precutover-fixture-composition-v1',source,originalAssertionsChanged:false,productionAccess:false,genuineOwnerEvidence:false,providerCredentials:0,events};
 function assertQuiescent(c){
  const journal=new MembershipJournal(c.journal);let view;try{view=journal.read();}finally{journal.close();}
  for(const member of view.members){const current=processIdentity(member.pid);assert.ok(!current||current.startTicks!==member.startTicks||current.state==='Z','OFFLINE_FIXTURE_WRITER_STILL_PRESENT');}
  const db=new DatabaseSync(path.join(c.authority,'generation.sqlite'),{timeout:0});try{db.exec('BEGIN EXCLUSIVE; ROLLBACK;');}finally{db.close();}
  assert.ok(!fs.existsSync(c.journal+'.emergency'),'OFFLINE_FIXTURE_EMERGENCY_REFUSED');
  return {journalRevision:view.revision,registeredProcesses:view.members.length,allRegisteredProcessesAbsent:true,exclusiveGenerationLockVerified:true};
 }
 async function initialize(){
  assert.equal(process.getuid(),0,'DISTINCT_OPERATOR_REQUIRED');assert.equal(source,SOURCE);assert.equal(process.versions.node,'22.23.2');
  assert.equal(fs.realpathSync(root),root);assert.match(root,/^\/data\/precutover-[A-Za-z0-9]+$/);assert.equal(fs.statSync(root).uid,0);assert.deepEqual(fs.readdirSync(root),[]);
  assert.equal(fs.realpathSync(repo),'/app');assert.equal(require(path.join(repo,'deployment/runtime-revision.cjs')).resolveRuntimeRevision(repo,source),source);
  const isolation=read('/precutover-isolation-proof.json');
  assert.equal(isolation.schema,'v116-precutover-isolation-v1');assert.equal(isolation.source,source);assert.equal(isolation.imageId,IMAGE);assert.ok(isolation.containerId.startsWith(os.hostname()));
  assert.equal(isolation.networkMode,'none');assert.equal(isolation.readOnlyRootfs,true);assert.equal(isolation.privileged,false);assert.equal(isolation.noPublishedPorts,true);assert.equal(isolation.productionVolumesAttached,false);
  // The outer controller verifies actual inspect metadata; this is its bound readback.
  receipt.isolationProofSHA256=hash(fs.readFileSync('/precutover-isolation-proof.json'));
  assert.equal(hash(fs.readFileSync('/technical-authority.json')),TECHNICAL_AUTHORITY);
  prepareWriterIsolation({library,sha256:librarySHA256,operatorUid:0});
  permissions=await import(path.join(repo,'scripts/work8/o33-permissions.mjs'));
  permissions.mkdir(root,0,0o755);protectedPath(root,0);
  durable(policy,{schema:1,mode:'RELEASED',approvalSha256:TECHNICAL_AUTHORITY,expiresAt:new Date(Date.now()+900000).toISOString()});
  receipt.authorityScope='V116_GENERATED_ISOLATED_TECHNICAL_FIXTURE_ONLY_NOT_OWNER_ACCEPTANCE';
  receipt.writerIsolationSHA256=librarySHA256;initialized=true;
 }
 async function bindLaunch(env,redis){
  assert.ok(initialized);assert.ok(++launches<=2,'ORIGINAL_TWO_APPLICATION_STARTS_ONLY');
  const label=launches===1?'source':'restored';
  const volume=path.join(root,launches===1?'source-volume':'restore/application');
  assert.equal(env.RAILWAY_VOLUME_MOUNT_PATH,volume);assert.equal(env.DATABASE_PATH,path.join(volume,'commissioning/empireai-brain.db'));
  const redisURL=new URL(env.REDIS_URL);assert.equal(redisURL.hostname,'127.0.0.1');assert.equal(redisURL.pathname,'/0');assert.ok(redisURL.password.length>=24);assert.equal(await redis.ping(),'PONG');
  const runId=(await redis.info('server')).match(/^run_id:([a-f0-9]{40})\r?$/m)?.[1];assert.match(runId??'',/^[a-f0-9]{40}$/);
  if(label==='source'){assert.deepEqual(fs.readdirSync(volume),[]);assert.equal(await redis.dbsize(),0);}
  else{assert.ok(fs.existsSync(path.join(root,'source-volume.quarantined')));assert.ok(fs.existsSync(path.join(root,'source-redis.quarantined')));permissions.mkdir(path.join(root,'restore'),0,0o755);}
  const before=files(volume);
  permissions.mkdir(volume,0,0o755);
  for(const relative of contract.RUNTIME_DIRECTORIES){const dir=path.join(volume,relative);if(!fs.existsSync(dir))permissions.mkdir(dir,65534,0o700);else{assert.equal(fs.lstatSync(dir).uid,0);fs.chmodSync(dir,0o700);permissions.ownedTree(dir,65534);}}
  assert.deepEqual(files(volume),before,'RESTORED_DATA_BYTES_CHANGED_BY_OWNERSHIP_PREPARATION');
  const operator=path.join(root,'operator-'+label),temporary=path.join(root,'tmp-'+label),authority=path.join(volume,label==='source'?'authority':'authority-restored');
  assert.ok(!fs.existsSync(operator)&&!fs.existsSync(temporary)&&!fs.existsSync(authority));
  permissions.mkdir(operator,0,0o700);permissions.mkdir(temporary,65534,0o700);permissions.mkdir(authority,0,0o755);permissions.mkdir(path.join(authority,'members'),65534,0o700);
  const storage=fs.statSync(volume),generation=crypto.randomUUID();
  const cutover={schema:'runtime-cutover-v1',proofReferences:['V116_REVIEWED_ORIGINAL_PRECUTOVER_ISOLATED_FIXTURE',label==='source'?'FRESH_PRIVATE_VOLUME_AND_LOOPBACK_REDIS':'EXACT_ORIGINAL_BUNDLE_RESTORED_WITH_SOURCE_ROOTS_QUARANTINED'],reviewReceipt:'V116_PRECUTOVER_TECHNICAL_FIXTURE_NOT_PRODUCTION_CUTOVER',storage:{root:volume,dev:storage.dev,ino:storage.ino},redis:{host:'127.0.0.1',port:Number(redisURL.port),db:0,runId},compatibleSources:[source],priorWriterDisposition:'EXCLUDED_BY_REVIEWED_OPERATING_TRANSITION',redisDisposition:'EXCLUSIVE_COHORT_CAPABILITY_REVIEWED'};
  const bytes=JSON.stringify(cutover),digest=hash(bytes);fs.writeFileSync(path.join(authority,'cutover-'+digest+'.json'),bytes,{flag:'wx',mode:0o644});
  const file=path.join(authority,'generation.sqlite'),db=new DatabaseSync(file);db.exec('PRAGMA journal_mode=DELETE; CREATE TABLE authority(id INTEGER PRIMARY KEY,version INTEGER,generation TEXT,cutover_digest TEXT,sources TEXT,epoch INTEGER); CREATE TABLE transitions(previous_generation TEXT,next_generation TEXT,cutover_digest TEXT,at TEXT);');db.prepare('INSERT INTO authority VALUES(1,1,?,?,?,1)').run(generation,digest,JSON.stringify([source]));db.close();fs.chmodSync(file,0o644);
  const identity=fs.statSync(file),journal=path.join(operator,'journal.sqlite'),c={label,volume,authority,generation,journal};contexts.set(generation,c);
  events.push({phase:'prepared-'+label,generation,cutoverDigest:digest,redisRunId:runId,source,originalDataFileCount:before.length,originalDataSHA256:hash(JSON.stringify(before)),originalDataBytesPreserved:true,oldAuthorityCopiedAsHistory:label==='restored',newAuthorityExplicit:true,runtimeUid:65534,operatorUid:0});
  return {...env,ASSURANCE_RUNTIME_ORIGIN:'https://work8-isolated.invalid',EMPIRE_OWNER_WRITE_POLICY:policy,INTELLIGENCE_ENABLED:'false',INTELLIGENCE_DISABLED:'true',TMPDIR:temporary,
   VISUAL_MEMORY_STORAGE_ROOT:path.relative(repo,contract.nativeRoot(volume,'visual')),SESSION_CONTINUITY_STORAGE_ROOT:path.relative(repo,contract.nativeRoot(volume,'session')),
   WORK8_CONTROLLER_JOURNAL_PATH:journal,WORK8_RUNTIME_UID:'65534',WORK8_RUNTIME_GID:'65534',WORK8_WRITER_ISOLATION_LIBRARY:library,WORK8_WRITER_ISOLATION_SHA256:librarySHA256,
   EMPIRE_GENERATION_DIRECTORY:authority,EMPIRE_GENERATION:generation,EMPIRE_CUTOVER_DIGEST:digest,EMPIRE_GENERATION_DEVICE:String(identity.dev),EMPIRE_GENERATION_INODE:String(identity.ino)};
 }
 function offlineShadowEnvironment(env){
  const c=contexts.get(env.EMPIRE_GENERATION);assert.ok(c);events.push({phase:'offline-shadow-'+c.label,...assertQuiescent(c)});
  // This is the original offline three-API fixture seed/read, after full native
  // drain. It is not a normal runtime entrypoint or a membership admission.
  const childEnv={...env,LD_PRELOAD:library};delete childEnv.NODE_OPTIONS;delete childEnv.NODE_PATH;delete childEnv.LD_AUDIT;
  return childEnv;
 }
 function offlineShadowCode(code){
  const imports=[
   ["import {openShadowCeoRepository} from './backend/dist/orchestration/shadow-ceo/repository.js';","const {openShadowCeoRepository}=await import('./backend/dist/orchestration/shadow-ceo/repository.js');"],
   ["import {persistRequestOwner,getRequestOwner} from './backend/dist/orchestration/shadow-ceo-integration/request-owner.js';","const {persistRequestOwner,getRequestOwner}=await import('./backend/dist/orchestration/shadow-ceo-integration/request-owner.js');"],
   ["import {attemptExternalActionAndPersist,listBlockedActions} from './backend/dist/orchestration/shadow-ceo-authority/index.js';","const {attemptExternalActionAndPersist,listBlockedActions}=await import('./backend/dist/orchestration/shadow-ceo-authority/index.js');"]
  ];
  for(const [original,replacement] of imports){assert.equal(code.split(original).length,2);code=code.replace(original,replacement);}
  const prefix="import assert from 'node:assert/strict';";assert.ok(code.startsWith(prefix));
  return code.replace(prefix,prefix+"import fs from 'node:fs';assert.equal(process.getuid(),65534);assert.equal(process.getgid(),65534);const status=fs.readFileSync('/proc/self/status','utf8');assert.match(status,/^CapEff:\\s+0+$/m);assert.match(status,/^NoNewPrivs:\\s+1$/m);assert.match(status,/^Seccomp:\\s+2$/m);");
 }
 function finish(originalPassed){
  if(fs.existsSync(policy))fs.unlinkSync(policy);receipt.policyRemoved=!fs.existsSync(policy);receipt.originalPassed=originalPassed;receipt.launches=launches;receipt.wholeRowAccepted=false;
  durable(path.join(output,'fixture-composition.json'),receipt,0o644);
 }
 return {initialize,bindLaunch,offlineShadowEnvironment,offlineShadowCode,finish};
}
module.exports={create,SOURCE,IMAGE,TECHNICAL_AUTHORITY};

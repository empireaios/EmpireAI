'use strict';
// Composition of existing verifiers; no runtime boot, authority import or source writes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');const {DatabaseSync}=require('node:sqlite');
const {verifySystem,selectSystemPoint}=require('./work8-system-vault.cjs');
const {verifyCheckpoint}=require('./legacy-checkpoint-capture.cjs');
const {verifyLegacyShadowDisk}=require('./legacy-shadow-state-capture.cjs');
const {MARKERS,captureLifecycleMarkers,verifyLifecycleMarkers}=require('./work8-lifecycle-markers.cjs');
const {verifySessionContinuitySnapshot,verifyExecutiveDecisionJournalSnapshot}=require('./work8-session-continuity-recovery.cjs');
const names=['system','brain','missions','execution','shadow'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function canonical(p){assert.ok(path.isAbsolute(p));assert.equal(fs.realpathSync(p),p);}
function read(file){canonical(file);assert.ok(fs.statSync(file).size<=65536);return JSON.parse(fs.readFileSync(file,'utf8'));}
function sync(dir){const fd=fs.openSync(dir,'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
function durableTree(dir){for(const name of fs.readdirSync(dir)){const file=path.join(dir,name),s=fs.lstatSync(file);if(s.isDirectory())durableTree(file);else{assert.ok(s.isFile()&&s.nlink===1);const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}}sync(dir);}
function validateParts(parts,sourceCommit){
 assert.deepEqual(Object.keys(parts).sort(),[...names].sort());const times=[];
 for(const name of names){const p=parts[name];canonical(p.directory);
  if(name==='system'){const m=verifySystem({directory:p.directory,digest:p.digest});assert.equal(m.sourceCommit,sourceCommit);times.push(Date.parse(m.capturedAt));}
  else if(name==='shadow'){verifyLegacyShadowDisk(p.directory,p.digest);const m=read(path.join(p.directory,'manifest.json'));assert.equal(m.sourceCommit,sourceCommit);assert.ok(m.entries.every(e=>e.present),'SHADOW_COVERAGE_INCOMPLETE');times.push(Date.parse(m.capturedAt));}
  else {verifyCheckpoint({directory:p.directory,manifestSha256:p.digest});const m=read(path.join(p.directory,'manifest.json'));assert.equal(m.source.commit,sourceCommit);times.push(Date.parse(m.capturedAt));
   if(name==='missions'||name==='execution'){const db=new DatabaseSync(pathToFileURL(path.join(p.directory,'checkpoint.db')).href+'?immutable=1',{readOnly:true,allowExtension:false});
    try{assert.equal(db.prepare('PRAGMA application_id').get().application_id,name==='missions'?0x454d5352:0x454d4558);assert.equal(db.prepare('PRAGMA user_version').get().user_version,name==='missions'?3:1);
     assert.deepEqual(db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(x=>x.name),name==='missions'?['mission_snapshot']:['execution_events','execution_jobs','execution_meta']);
    }finally{db.close();}}
  }
 }
 assert.ok(times.every(Number.isFinite));return {earliest:new Date(Math.min(...times)).toISOString(),latest:new Date(Math.max(...times)).toISOString(),captureWindowMs:Math.max(...times)-Math.min(...times)};
}
function createRecoverySet({parts,destination,sourceCommit,frontendRevision,parentDigest=null}){
 assert.match(sourceCommit,/^[a-f0-9]{40}$/);assert.match(frontendRevision,/^[a-f0-9]{40}$/);assert.ok(parentDigest===null||/^[a-f0-9]{64}$/.test(parentDigest));
 canonical(path.dirname(destination));assert.equal(path.resolve(destination),destination);const timing=validateParts(parts,sourceCommit);
 for(const p of Object.values(parts))assert.ok(destination!==p.directory&&!destination.startsWith(p.directory+path.sep),'NESTED_VAULT_REFUSED');
 fs.mkdirSync(destination,{mode:0o700});sync(path.dirname(destination));
 const saved={};for(const name of names){fs.cpSync(parts[name].directory,path.join(destination,name),{recursive:true,errorOnExist:true,force:false});saved[name]={directory:path.join(destination,name),digest:parts[name].digest};}
 durableTree(destination);validateParts(saved,sourceCommit);
 const manifest={schema:'WORK8_COMPOSED_RECOVERY_SET_V1',sourceCommit,frontendRevision,sourceRevisionsIndependentlyVerified:false,parentDigest,capturedAt:timing.latest,...timing,
  parts:Object.fromEntries(names.map(name=>[name,{digest:parts[name].digest}])),bootAllowed:false,authority:'HISTORICAL_ONLY_DO_NOT_BOOT',completeLiveState:false,
  remaining:['Global quiescence','Redis/pending RAM','Protected off-host retention','Governed runtime reactivation']};
 const bytes=JSON.stringify(manifest),fd=fs.openSync(path.join(destination,'recovery-set.json'),'wx',0o600);try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}sync(destination);
 return {directory:destination,digest:sha(bytes),manifest};
}
function verifyRecoverySet({directory,digest}){
 canonical(directory);assert.match(digest,/^[a-f0-9]{64}$/);const file=path.join(directory,'recovery-set.json');canonical(file);assert.ok(fs.statSync(file).size<=65536);
 const bytes=fs.readFileSync(file);assert.equal(sha(bytes),digest);const m=JSON.parse(bytes);assert.equal(m.schema,'WORK8_COMPOSED_RECOVERY_SET_V1');
 assert.equal(m.bootAllowed,false);assert.equal(m.completeLiveState,false);assert.equal(m.authority,'HISTORICAL_ONLY_DO_NOT_BOOT');
 assert.deepEqual(fs.readdirSync(directory).sort(),[...names,'recovery-set.json'].sort());assert.deepEqual(Object.keys(m.parts).sort(),[...names].sort());
 const timing=validateParts(Object.fromEntries(names.map(name=>[name,{directory:path.join(directory,name),digest:m.parts[name].digest}])),m.sourceCommit);
 assert.equal(m.capturedAt,timing.latest);assert.equal(m.earliest,timing.earliest);assert.equal(m.captureWindowMs,timing.captureWindowMs);return m;
}
const selectRecoveryPoint=args=>selectSystemPoint(args,verifyRecoverySet);
module.exports={createRecoverySet,verifyRecoverySet,selectRecoveryPoint};

// Integrated runtime inventory uses the existing checkpoint verifier. The caller
// holds application fences; this format deliberately does NOT attest global quiescence.
const RUNTIME_IDS=[...Object.keys(require('./work8-system-vault.cjs').STORES),'brain','missions','execution','shadow'];
function verifyVisualMemorySnapshot(value) {
 assert.ok(value&&value.schema==='VISUAL_MEMORY_INSPECTION_V1'&&value.operationalRestoreAvailable===false&&path.isAbsolute(value.sourceStoragePath));
 assert.ok(Array.isArray(value.files)&&value.files.length<=10001);
 const names=new Set();let total=0;
 for(const file of value.files){assert.ok(file&&typeof file.path==='string'&&(file.path==='index.json'||/^records\/[-a-zA-Z0-9_.]+\.json$/.test(file.path)));assert.ok(!names.has(file.path));names.add(file.path);assert.ok(Number.isSafeInteger(file.mode)&&file.mode>=0&&file.mode<=0o777);assert.equal(typeof file.bytes,'string');const bytes=Buffer.from(file.bytes,'base64');assert.equal(bytes.toString('base64'),file.bytes);total+=bytes.length;assert.ok(total<=33554432);JSON.parse(bytes.toString('utf8'));}
 return value;
}
async function captureRuntimeRecoverySet({root,primaryPath,shadowPath,authorityFile,requestOwnersFile,destination,sourceCommit,frontendRevision,captureId,captureRedis,captureRedisIdentity,captureObserverWatchdog=false,captureRepositoryLifecycle=false,visualMemorySnapshot,sessionContinuitySnapshot,executiveDecisionJournalSnapshot,controllerMembershipReceipt}) {
 canonical(root); canonical(path.dirname(destination));
 assert.equal(path.resolve(destination),destination);assert.ok(!destination.startsWith(root+path.sep));
 assert.match(sourceCommit,/^[a-f0-9]{40}$/);assert.match(frontendRevision,/^[a-f0-9]{40}$/);assert.match(captureId,/^[a-f0-9-]{36}$/);
 const membership=controllerMembershipReceipt===undefined?undefined:require('./runtime-membership-receipt.cjs').validateMembershipReceipt(controllerMembershipReceipt,sourceCommit);
 const inventory={...Object.fromEntries(Object.entries(require('./work8-system-vault.cjs').STORES).map(([id,relative])=>[id,path.join(root,relative)])),brain:primaryPath,missions:primaryPath+'.missions.sqlite',execution:primaryPath+'.mission-execution.sqlite',shadow:shadowPath};
 const json={authority:authorityFile,requestOwners:requestOwnersFile};
 if(captureObserverWatchdog){json.assuranceWatchdog=path.join(root,'commissioning/assurance.sqlite.watchdog');assert.ok(!fs.existsSync(json.assuranceWatchdog+'.tmp'),'OBSERVER_WATCHDOG_UNSETTLED');}
 for(const file of [...Object.values(inventory),...Object.values(json)]) {canonical(file);const s=fs.lstatSync(file);assert.ok(s.isFile()&&s.nlink===1,'MANDATORY_STORE_UNSAFE');}
 assert.equal(new Set([...Object.values(inventory),...Object.values(json)]).size,captureObserverWatchdog?16:15,'ALIASED_STORE');
 fs.mkdirSync(destination,{mode:0o700});
 const staging=path.join(destination,'staging');fs.mkdirSync(staging,{mode:0o700});
 const stores={};
 try {
  for(const [id,file] of Object.entries(inventory)) {
   const copy=path.join(staging,id+'.db');
   // WAL has committed records outside the main file. DELETE-mode sources are
   // exclusively locked by the separate holder, so copy their stable main file.
   const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW),header=Buffer.alloc(20);
   try{assert.equal(fs.readSync(fd,header,0,20,0),20);}finally{fs.closeSync(fd);}
   assert.equal(header.subarray(0,16).toString(),'SQLite format 3\0');
   if(header[18]===2) {
    const db=new DatabaseSync(file,{readOnly:true,allowExtension:false});
    try{await require('node:sqlite').backup(db,copy);}finally{db.close();}
    const normalized=new DatabaseSync(copy,{allowExtension:false});try{normalized.exec('PRAGMA journal_mode=DELETE');}finally{normalized.close();}
   } else {assert.equal(header[18],1);assert.ok(!fs.existsSync(file+'-journal'),'ACTIVE_JOURNAL');fs.copyFileSync(file,copy);}
   stores[id]=require('./legacy-checkpoint-capture.cjs').captureCheckpoint({source:copy,destination:path.join(destination,id),sourceCommit}).manifestSha256;
  }
  const jsonDigests={};
  for(const [id,file] of Object.entries(json)){const size=fs.statSync(file).size;if(id==='assuranceWatchdog')assert.ok(size>0&&size<=65536,'OBSERVER_WATCHDOG_SIZE');const bytes=fs.readFileSync(file);const value=JSON.parse(bytes);if(id==='assuranceWatchdog')assert.ok(Number.isSafeInteger(value.observedAt)&&value.observedAt>0&&typeof value.status==='string','OBSERVER_WATCHDOG_SCHEMA');assert.ok(value&&typeof value==='object'&&!Array.isArray(value));fs.writeFileSync(path.join(destination,id+'.json'),bytes,{flag:'wx',mode:0o600});jsonDigests[id]=sha(bytes);}
  let visualMemoryDigest;
  if(visualMemorySnapshot!==undefined){verifyVisualMemorySnapshot(visualMemorySnapshot);const bytes=JSON.stringify(visualMemorySnapshot);fs.writeFileSync(path.join(destination,'visual-memory.json'),bytes,{flag:'wx',mode:0o600});visualMemoryDigest=sha(bytes);}
  let sessionContinuityDigest;
  if(sessionContinuitySnapshot!==undefined){verifySessionContinuitySnapshot(sessionContinuitySnapshot);const bytes=JSON.stringify(sessionContinuitySnapshot);fs.writeFileSync(path.join(destination,'session-continuity.json'),bytes,{flag:'wx',mode:0o600});sessionContinuityDigest=sha(bytes);}
  let executiveDecisionJournalDigest;
  if(executiveDecisionJournalSnapshot!==undefined){verifyExecutiveDecisionJournalSnapshot(executiveDecisionJournalSnapshot);const bytes=JSON.stringify(executiveDecisionJournalSnapshot);fs.writeFileSync(path.join(destination,'executive-decisions.json'),bytes,{flag:'wx',mode:0o600});executiveDecisionJournalDigest=sha(bytes);}
  const lifecycleMarkers=captureRepositoryLifecycle?captureLifecycleMarkers(root,destination):undefined;
  const redisIdentity=captureRedisIdentity?await captureRedisIdentity():undefined;
  const legacyCaptureStartedAt=Date.now();const snapshot=await captureRedis();
  // Legacy inspection callbacks still return arrays. Actual runtime capture uses
  // Redis TIME from the same Lua execution as DUMP/PTTL, never a pre-await clock.
  const redis=Array.isArray(snapshot)?snapshot:snapshot?.rows;
  const redisCapturedAt=Array.isArray(snapshot)?legacyCaptureStartedAt:snapshot?.capturedAt;
  assert.ok(Array.isArray(redis));assert.ok(Number.isSafeInteger(redisCapturedAt)&&redisCapturedAt>0,'REDIS_SNAPSHOT_TIME_INVALID');
  if(captureRedisIdentity)assert.deepEqual(await captureRedisIdentity(),redisIdentity);
  const redisBytes=JSON.stringify(redis);fs.writeFileSync(path.join(destination,'redis.json'),redisBytes,{flag:'wx',mode:0o600});
  if(lifecycleMarkers)verifyLifecycleMarkers(root,lifecycleMarkers,true);
  fs.rmSync(staging,{recursive:true});
  let controllerMembershipDigest;
  if(membership){const bytes=JSON.stringify(membership);fs.writeFileSync(path.join(destination,'controller-membership.json'),bytes,{flag:'wx',mode:0o600});controllerMembershipDigest=sha(bytes);}
  const manifest={...(controllerMembershipDigest?{controllerMembershipDigest}:{}),schema:'WORK8_RUNTIME_RECOVERY_SET_V1',captureId,sourceCommit,frontendRevision,capturedAt:new Date().toISOString(),stores,json:jsonDigests,...(visualMemoryDigest?{visualMemoryDigest}:{}),...(sessionContinuityDigest?{sessionContinuityDigest}:{}),...(executiveDecisionJournalDigest?{executiveDecisionJournalDigest}:{}),...(lifecycleMarkers?{lifecycleMarkers}:{}),redisDigest:sha(redisBytes),redisCapturedAt,...(redisIdentity?{redisIdentity}:{}),bootAllowed:false,completeLiveState:false,authority:'HISTORICAL_ONLY_DO_NOT_BOOT',remaining:['Redis producers outside Brain queue are not globally fenced','Executive watchdog and Amazon continuation coverage unproven','Protected independent custody and restoration unproven']};
  fs.writeFileSync(path.join(destination,'runtime-recovery.pending.json'),JSON.stringify(manifest),{flag:'wx',mode:0o600});durableTree(destination);
  const result={directory:destination,digest:sha(JSON.stringify(manifest)),manifest};verifyRuntimeRecoverySet(result,true);return result;
 } catch(error){fs.rmSync(path.join(destination,'runtime-recovery.json'),{force:true});throw error;}
}
function verifyRuntimeRecoverySet({directory,digest},allowProvisional=false) {
 canonical(directory);assert.match(digest,/^[a-f0-9]{64}$/);const manifestName=allowProvisional?'runtime-recovery.pending.json':'runtime-recovery.json';const manifestFile=path.join(directory,manifestName);canonical(manifestFile);assert.ok(fs.statSync(manifestFile).size<=65536);const bytes=fs.readFileSync(manifestFile);assert.equal(sha(bytes),digest);
 const m=JSON.parse(bytes);assert.equal(m.schema,'WORK8_RUNTIME_RECOVERY_SET_V1');assert.match(m.sourceCommit,/^[a-f0-9]{40}$/);assert.match(m.frontendRevision,/^[a-f0-9]{40}$/);assert.match(m.captureId,/^[a-f0-9-]{36}$/);assert.equal(m.bootAllowed,false);assert.equal(m.completeLiveState,false);assert.equal(m.authority,'HISTORICAL_ONLY_DO_NOT_BOOT');
 assert.deepEqual(Object.keys(m.stores).sort(),[...RUNTIME_IDS].sort());
 if(Object.hasOwn(m,'lifecycleMarkers'))verifyLifecycleMarkers(directory,m.lifecycleMarkers);
 assert.deepEqual(fs.readdirSync(directory).sort(),[...RUNTIME_IDS,...(Object.hasOwn(m,'controllerMembershipDigest')?['controller-membership.json']:[]),...(Object.hasOwn(m,'executiveDecisionJournalDigest')?['executive-decisions.json']:[]),...(Object.hasOwn(m,'sessionContinuityDigest')?['session-continuity.json']:[]),...(Object.hasOwn(m,'visualMemoryDigest')?['visual-memory.json']:[]),...(Object.hasOwn(m,'lifecycleMarkers')?Object.keys(MARKERS).map(id=>id+'.initialized'):[]),'authority.json','requestOwners.json',...(Object.hasOwn(m.json,'assuranceWatchdog')?['assuranceWatchdog.json']:[]),'redis.json',manifestName].sort());
 for(const id of RUNTIME_IDS){verifyCheckpoint({directory:path.join(directory,id),manifestSha256:m.stores[id]});const part=read(path.join(directory,id,'manifest.json'));assert.equal(part.source.commit,m.sourceCommit);}
 const jsonIds=Object.hasOwn(m.json,'assuranceWatchdog')?['assuranceWatchdog','authority','requestOwners']:['authority','requestOwners'];
 assert.deepEqual(Object.keys(m.json).sort(),jsonIds);
 for(const id of jsonIds){const file=path.join(directory,id+'.json');canonical(file);if(id==='assuranceWatchdog')assert.ok(fs.statSync(file).size>0&&fs.statSync(file).size<=65536,'OBSERVER_WATCHDOG_SIZE');assert.equal(sha(fs.readFileSync(file)),m.json[id]);JSON.parse(fs.readFileSync(file,'utf8'));}
 if(Object.hasOwn(m,'visualMemoryDigest')){const file=path.join(directory,'visual-memory.json');canonical(file);const st=fs.lstatSync(file);assert.ok(st.isFile()&&st.nlink===1&&st.size<=50000000);const bytes=fs.readFileSync(file);assert.equal(sha(bytes),m.visualMemoryDigest);verifyVisualMemorySnapshot(JSON.parse(bytes));}
 if(Object.hasOwn(m,'sessionContinuityDigest')){const file=path.join(directory,'session-continuity.json');canonical(file);const st=fs.lstatSync(file);assert.ok(st.isFile()&&st.nlink===1&&st.size<=12000000);const bytes=fs.readFileSync(file);assert.equal(sha(bytes),m.sessionContinuityDigest);verifySessionContinuitySnapshot(JSON.parse(bytes));}
 if(Object.hasOwn(m,'executiveDecisionJournalDigest')){const file=path.join(directory,'executive-decisions.json');canonical(file);const st=fs.lstatSync(file);assert.ok(st.isFile()&&st.nlink===1&&st.size<=50000000);const bytes=fs.readFileSync(file);assert.equal(sha(bytes),m.executiveDecisionJournalDigest);verifyExecutiveDecisionJournalSnapshot(JSON.parse(bytes));}
 if(Object.hasOwn(m,'controllerMembershipDigest')){assert.match(m.controllerMembershipDigest,/^[a-f0-9]{64}$/);const file=path.join(directory,'controller-membership.json');canonical(file);const st=fs.lstatSync(file);assert.ok(st.isFile()&&st.nlink===1&&st.size<=65536);const bytes=fs.readFileSync(file);assert.equal(sha(bytes),m.controllerMembershipDigest);require('./runtime-membership-receipt.cjs').validateMembershipReceipt(JSON.parse(bytes),m.sourceCommit);}
 const redisFile=path.join(directory,'redis.json');canonical(redisFile);assert.equal(sha(fs.readFileSync(redisFile)),m.redisDigest);const rows=JSON.parse(fs.readFileSync(redisFile,'utf8'));assert.ok(Array.isArray(rows));
 const keys=new Set();for(const row of rows){assert.equal(typeof row.key,'string');assert.equal(typeof row.dump,'string');assert.ok(Number.isSafeInteger(row.ttl)&&row.ttl>=-1);assert.ok(!keys.has(row.key));keys.add(row.key);}
 return m;
}
function finalizeRuntimeRecoverySet(result) {
 verifyRuntimeRecoverySet(result,true);assert.ok(!fs.existsSync(path.join(result.directory,'runtime-recovery.json')));fs.renameSync(path.join(result.directory,'runtime-recovery.pending.json'),path.join(result.directory,'runtime-recovery.json'));sync(result.directory);verifyRuntimeRecoverySet(result);return result;
}
function materializeVisualMemoryInspection({directory,digest,destination}) {
 const manifest=verifyRuntimeRecoverySet({directory,digest});
 assert.ok(Object.hasOwn(manifest,'visualMemoryDigest'),'VISUAL_MEMORY_CAPTURE_REQUIRED');
 const snapshot=verifyVisualMemorySnapshot(JSON.parse(fs.readFileSync(path.join(directory,'visual-memory.json'),'utf8')));
 canonical(path.dirname(destination));assert.equal(path.resolve(destination),destination);
 assert.ok(destination!==directory&&!destination.startsWith(directory+path.sep));
 assert.ok(destination!==snapshot.sourceStoragePath&&!destination.startsWith(snapshot.sourceStoragePath+path.sep));
 // All validation precedes exclusive target creation. Never use recorded source
 // paths as destinations or overwrite an existing target. No application boot.
 fs.mkdirSync(destination,{mode:0o700});
 try {
  const target=path.join(destination,'visual-memory');fs.mkdirSync(target,{mode:0o700});fs.mkdirSync(path.join(target,'records'),{mode:0o700});
  for(const file of snapshot.files){const output=path.join(target,file.path);fs.writeFileSync(output,Buffer.from(file.bytes,'base64'),{flag:'wx',mode:file.mode});fs.chmodSync(output,file.mode);assert.equal(fs.readFileSync(output).toString('base64'),file.bytes);assert.equal(fs.statSync(output).mode&0o777,file.mode);}
  fs.writeFileSync(path.join(destination,'INSPECTION_ONLY.json'),JSON.stringify({bootAllowed:false,noExecutionAuthority:true,sourceDigest:digest,visualMemoryDigest:manifest.visualMemoryDigest}),{flag:'wx',mode:0o600});
  durableTree(destination);sync(path.dirname(destination));return {directory:destination,visualMemoryPath:target,digest:manifest.visualMemoryDigest,bootAllowed:false};
 }catch(error){fs.rmSync(destination,{recursive:true,force:true});throw error;}
}
function stageRuntimeRecoveryInspection({directory,digest,destination}) {
 verifyRuntimeRecoverySet({directory,digest});canonical(path.dirname(destination));assert.equal(path.resolve(destination),destination);assert.ok(!destination.startsWith(directory+path.sep));
 fs.mkdirSync(destination,{mode:0o700});const copy=path.join(destination,'sealed-evidence');fs.cpSync(directory,copy,{recursive:true,errorOnExist:true,force:false});verifyRuntimeRecoverySet({directory:copy,digest});
 if(Object.hasOwn(verifyRuntimeRecoverySet({directory:copy,digest}),'visualMemoryDigest'))materializeVisualMemoryInspection({directory:copy,digest,destination:path.join(destination,'visual-memory-inspection')});
 require('./work8-runtime-inspection-layout.cjs').materializeRuntimeInspection({directory:copy,digest,destination:path.join(destination,'runtime-inspection')});
 fs.writeFileSync(path.join(destination,'INSPECTION_ONLY.json'),JSON.stringify({bootAllowed:false,noExecutionAuthority:true,digest}),{flag:'wx',mode:0o600});durableTree(destination);return {directory:destination,digest,bootAllowed:false};
}
Object.assign(module.exports,{materializeVisualMemoryInspection,verifyVisualMemorySnapshot,captureRuntimeRecoverySet,verifyRuntimeRecoverySet,finalizeRuntimeRecoverySet,stageRuntimeRecoveryInspection});


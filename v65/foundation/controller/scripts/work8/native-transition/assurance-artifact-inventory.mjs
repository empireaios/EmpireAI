// Supplemental current-source inventory for the existing independent readback.
// The caller must hold the unchanged whole-application capture fence while
// invoking this module. It grants no health or whole-row acceptance by itself.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';

const revision='6c1e63ba20619ee480742fd87dc810ca93152e22';
const uuid='[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const probe=new RegExp('^assurance-probe-('+uuid+')\\.sqlite$');
const proof=new RegExp('^assurance-discrepancy-proof-v2-('+uuid+')\\.json$');
const sha=x=>createHash('sha256').update(x).digest('hex');
const json=x=>JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v);
const q=x=>'"'+x.replaceAll('"','""')+'"';

function openFile(file,maxBytes){
 const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
 try{const s=fs.fstatSync(fd);assert.ok(s.isFile()&&s.nlink===1&&s.size<=maxBytes,'ASSURANCE_ARTIFACT_FILE_REFUSED');return {fd,stat:s};}catch(e){fs.closeSync(fd);throw e;}
}
function stable(file,before){
 const s=fs.lstatSync(file);assert.ok(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&s.dev===before.dev&&s.ino===before.ino&&s.size===before.size&&s.mtimeMs===before.mtimeMs,'ASSURANCE_ARTIFACT_CHANGED_DURING_READ');
}
function database(file,expected){
 const {fd,stat}=openFile(file,4*1024*1024);let db;
 try{
  for(const suffix of ['-wal','-journal'])if(fs.existsSync(file+suffix))assert.equal(fs.lstatSync(file+suffix).size,0,'ASSURANCE_PROBE_UNCOMMITTED');
  db=new DatabaseSync('/proc/self/fd/'+fd,{readOnly:true,allowExtension:false,timeout:1000});
  db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF; BEGIN');
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
  const row=db.prepare("SELECT receipt FROM assurance_cycles WHERE id='discrepancy' AND completed_at IS NOT NULL").get();
  assert.equal(typeof row?.receipt,'string');assert.equal(sha(row.receipt),expected,'ASSURANCE_PROOF_DATABASE_DIGEST_MISMATCH');
  const receipt=JSON.parse(row.receipt);
  assert.equal(receipt.schema,'independent-assurance-cycle-v1');assert.equal(receipt.healthy,false);assert.equal(receipt.liveProof,false);
  for(const [domain,status] of Object.entries({runtime:'FAIL',workers:'SOURCE_UNAVAILABLE',scheduler:'STALE','authority-spending':'FAIL'}))assert.equal(receipt.checks?.[domain]?.status,status);
  const tables={};const definitions=db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_schema ORDER BY type,name").all();assert.ok(definitions.length<=2000);
  for(const {name,sql} of definitions.filter(x=>x.type==='table')){
   const rows=db.prepare('SELECT * FROM '+q(name)+' LIMIT 50001').all();assert.ok(rows.length<=50000);
   const hashes=rows.map(r=>sha(json(r))).sort();tables[name]={schemaSha256:sha(sql||''),count:rows.length,logicalSha256:sha(json(hashes))};
  }
  db.exec('COMMIT');stable(file,stat);
  return {tables,schemaSha256:sha(json(definitions)),logicalSha256:sha(json(tables))};
 }finally{db?.close();fs.closeSync(fd);}
}

function completedProof(file,id){
 const {fd,stat}=openFile(file,65536);let bytes,body;
 try{bytes=fs.readFileSync(fd);body=JSON.parse(bytes);stable(file,stat);}finally{fs.closeSync(fd);}
 assert.equal(body.schema,'isolated-assurance-discrepancy-v2');assert.equal(body.revision,revision);
 assert.equal(body.isolatedSyntheticSource,true);assert.equal(body.productionRecordsMutated,0);assert.equal(body.inferenceCalls,0);assert.equal(body.commerceWrites,0);assert.equal(body.pillowSelfReportUsed,false);
 for(const [key,value] of Object.entries({runtimeDiscrepancy:'FAIL',unavailableCollector:'SOURCE_UNAVAILABLE',staleEvidence:'STALE',authorityDiscrepancy:'FAIL',interruptedCycle:'ASSURANCE_OVERDUE',missedCycle:'ASSURANCE_OVERDUE',reopenedInIndependentProcess:true,freshProcessRestart:false}))assert.equal(body.checks?.[key],value);
 const r=body.readback;assert.equal(r.challenge,id);assert.match(r.receiptDigest,/^[0-9a-f]{64}$/);
 assert.ok(Number.isSafeInteger(r.writerPid)&&r.writerPid>0&&Number.isSafeInteger(r.readerPid)&&r.readerPid>0&&r.writerPid!==r.readerPid);
 assert.equal(r.scope,'existing-independent-process-committed-readback');assert.equal(r.freshProcessRestart,false);

 return {proof:{bytes:bytes.length,sha256:sha(bytes)},receiptDigest:r.receiptDigest};
}

export function captureAssuranceArtifacts(root){
 const dir=path.resolve(root,'commissioning');assert.equal(fs.realpathSync(dir),dir);
 const names=fs.readdirSync(dir).sort(),probes=new Map(),proofs=new Map();assert.ok(names.length<=20000);
 for(const name of names){
  let m;
  if(m=name.match(probe)){probes.set(m[1],name);continue;}
  if(m=name.match(proof)){proofs.set(m[1],name);continue;}
  if(name.startsWith('assurance-probe-')){
   const base=name.replace(/-(wal|shm|journal)$/,'');
   assert.ok(base!==name&&probe.test(base),'UNDECLARED_ASSURANCE_PROBE_FILE');
   const s=fs.lstatSync(path.join(dir,name));
   assert.ok(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&s.size<=4*1024*1024,'ASSURANCE_SIDECAR_REFUSED');
   assert.ok(names.includes(base),'ORPHAN_ASSURANCE_SIDECAR');
   if(!name.endsWith('-shm'))assert.equal(s.size,0,'ASSURANCE_PROBE_UNCOMMITTED');
  }
  if(name.startsWith('assurance-discrepancy-proof-v2-'))assert.fail('UNDECLARED_ASSURANCE_PROOF_FILE');
 }
 assert.ok(probes.size>0&&probes.size<=64,'CURRENT_ASSURANCE_PROBE_REQUIRED');
 assert.deepEqual([...probes.keys()].sort(),[...proofs.keys()].sort(),'ASSURANCE_PROBE_PROOF_PAIR_MISSING');
 const artifacts={};
 for(const id of [...probes.keys()].sort()){
  const completed=completedProof(path.join(dir,proofs.get(id)),id);
  artifacts[id]={proof:completed.proof,database:database(path.join(dir,probes.get(id)),completed.receiptDigest)};
 }
 return {schema:'work8-v61-current-assurance-artifact-inventory-v1',source:revision,artifacts,rawRowsRetained:false};
}

export function compareAssuranceArtifacts(baseline,current){
 assert.equal(current.schema,baseline.schema);assert.equal(current.source,baseline.source);
 for(const [id,prior] of Object.entries(baseline.artifacts))assert.deepEqual(current.artifacts[id],prior,'COMMITTED_ASSURANCE_PROBE_OR_PROOF_CHANGED');
 return {preserved:Object.keys(baseline.artifacts).length,added:Object.keys(current.artifacts).filter(id=>!(id in baseline.artifacts)).length,classification:'SOURCE_DEFINED_DIAGNOSTIC_ARTIFACTS_NO_HEALTH_ACCEPTANCE'};
}

// Before the coordinator permits the first capture, wait for the application's
// already-running Assurance initializer to finish publishing its immutable pair.
// This read-only prerequisite does not hold or replace the whole-app capture
// fence, does not assert health, and does not confer A5 acceptance. The original
// full inventory and later independent preservation comparisons remain strict.
export function createAssuranceStartupPrerequisite(root){
 const completed=new Map();
 return ()=>{
  const dir=path.resolve(root,'commissioning');
  let directory;try{directory=fs.lstatSync(dir);}catch(error){if(error?.code==='ENOENT')return null;throw error;}
  assert.ok(directory.isDirectory()&&!directory.isSymbolicLink(),'ASSURANCE_ARTIFACT_FILE_REFUSED');
  assert.equal(fs.realpathSync(dir),dir);
  const names=fs.readdirSync(dir).sort(),probes=new Map(),proofs=new Map();assert.ok(names.length<=20000);
  for(const name of names){
   let match;
   if(match=name.match(probe)){probes.set(match[1],name);continue;}
   if(match=name.match(proof)){proofs.set(match[1],name);continue;}
   if(name.startsWith('assurance-probe-')){
    const base=name.replace(/-(wal|shm|journal)$/,'');
    assert.ok(base!==name&&probe.test(base),'UNDECLARED_ASSURANCE_PROBE_FILE');
    const st=fs.lstatSync(path.join(dir,name));
    assert.ok(st.isFile()&&!st.isSymbolicLink()&&st.nlink===1&&st.size<=4*1024*1024,'ASSURANCE_SIDECAR_REFUSED');
    assert.ok(names.includes(base),'ORPHAN_ASSURANCE_SIDECAR');
   }
   if(name.startsWith('assurance-discrepancy-proof-v2-'))assert.fail('UNDECLARED_ASSURANCE_PROOF_FILE');
  }
  assert.ok(probes.size<=64,'CURRENT_ASSURANCE_PROBE_REQUIRED');
  for(const name of probes.values()){const st=fs.lstatSync(path.join(dir,name));assert.ok(st.isFile()&&!st.isSymbolicLink()&&st.nlink===1&&st.size<=4*1024*1024,'ASSURANCE_ARTIFACT_FILE_REFUSED');}
  for(const id of proofs.keys())assert.ok(probes.has(id),'ASSURANCE_PROBE_PROOF_PAIR_MISSING');
  for(const id of completed.keys())assert.ok(probes.has(id)&&proofs.has(id),'COMMITTED_ASSURANCE_PROBE_OR_PROOF_CHANGED');
  for(const [id,name] of proofs){
   let published;
   try{published=completedProof(path.join(dir,name),id);}
   catch(error){
    // writeFileSync publishes a proof only after the database is committed and
    // independently read back. A first concurrent partial write may finish;
    // an already observed completed proof must never become partial or change.
    const inProgress=error instanceof SyntaxError||error?.message==='ASSURANCE_ARTIFACT_CHANGED_DURING_READ';
    if(inProgress&&!completed.has(id))continue;
    throw error;
   }
   const current={proof:published.proof,database:database(path.join(dir,probes.get(id)),published.receiptDigest)};
   if(completed.has(id))assert.deepEqual(current,completed.get(id),'COMMITTED_ASSURANCE_PROBE_OR_PROOF_CHANGED');
   else completed.set(id,current);
  }
  if(probes.size===0||completed.size!==probes.size||proofs.size!==probes.size)return null;
  // Re-run the unchanged complete inventory, including sidecar, integrity,
  // schema, source, independent-reader and committed-receipt digest assertions.
  const inventory=captureAssuranceArtifacts(root);
  assert.deepEqual(inventory.artifacts,Object.fromEntries([...completed].sort(([a],[b])=>a.localeCompare(b))),'COMMITTED_ASSURANCE_PROBE_OR_PROOF_CHANGED');
  return {schema:'work8-v99-assurance-startup-prerequisite-v1',status:'READY_REQUIRED_IMMUTABLE_ASSURANCE_ARTIFACTS_ONLY',source:inventory.source,pairCount:completed.size,logicalSha256:sha(json(inventory)),readOnly:true,wholeApplicationSnapshot:false,healthAcceptance:false,wholeRowsAccepted:[],rawRowsRetained:false};
 };
}

// Metadata only: no raw assertion text, filesystem path, row or protected value.
export function safeAssuranceStartupFailure(error){
 const codes=new Set(['ASSURANCE_ARTIFACT_FILE_REFUSED','ASSURANCE_ARTIFACT_CHANGED_DURING_READ','ASSURANCE_PROBE_UNCOMMITTED','ASSURANCE_PROOF_DATABASE_DIGEST_MISMATCH','UNDECLARED_ASSURANCE_PROBE_FILE','ASSURANCE_SIDECAR_REFUSED','ORPHAN_ASSURANCE_SIDECAR','UNDECLARED_ASSURANCE_PROOF_FILE','CURRENT_ASSURANCE_PROBE_REQUIRED','ASSURANCE_PROBE_PROOF_PAIR_MISSING','COMMITTED_ASSURANCE_PROBE_OR_PROOF_CHANGED']);
 const errnos=new Set(['ENOENT','EACCES','EPERM','ELOOP','ENOTDIR','EISDIR','EIO','EBUSY']);
 const classes=new Set(['AssertionError','SyntaxError','TypeError','RangeError','Error']);
 const firstLine=String(error?.message??'').split('\n')[0];
 const sourceFrames=[...String(error?.stack??'').matchAll(/(?:^|[\s/(])assurance-artifact-inventory\.mjs:([0-9]{1,6}):([0-9]{1,6})(?=[)\s]|$)/gm)].slice(0,8).map(m=>'assurance-artifact-inventory.mjs:'+m[1]+':'+m[2]);
 return {schema:'work8-v99-safe-assurance-startup-failure-v1',firstFailure:true,operation:'VALIDATE_REQUIRED_IMMUTABLE_ASSURANCE_ARTIFACTS',code:codes.has(firstLine)?firstLine:error?.code==='ERR_SQLITE_ERROR'?'ASSURANCE_SQLITE_READ_REFUSED':'ASSURANCE_PROOF_CONTRACT_REFUSED',errorClass:classes.has(error?.name)?error.name:'Error',errno:errnos.has(error?.code)?error.code:null,sourceFrames,sourceSHA256:sha(fs.readFileSync(new URL(import.meta.url))),rawOutputRetained:false,rawRecordsRetained:false};
}

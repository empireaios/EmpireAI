'use strict';
/** Cold file materialization only. The caller independently pins the complete
 * inventory contract and source identity. This validates bytes/coverage against
 * that contract; it cannot prove writer exclusion, source quarantine, Redis
 * restoration, operational readiness or protected custody. No runtime calls. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const {pathToFileURL}=require('node:url');
const SCHEMA='WORK8_COLD_STATE_MANIFEST_V1',CLOSED='.work8-cold-state.json';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const equal=(a,b)=>assert.deepEqual(a,b,'COLD_STATE_CONTRACT_MISMATCH');
function canonical(p){assert.ok(path.isAbsolute(p)&&path.resolve(p)===p,'COLD_STATE_CANONICAL_PATH');assert.equal(fs.realpathSync(p),p,'COLD_STATE_SYMLINK');}
function relative(p){assert.ok(typeof p==='string'&&p.length>0&&p.length<1024&&!p.includes('\\')&&!p.includes('\0')&&!path.isAbsolute(p)&&p.split('/').every(s=>s&&s!=='.'&&s!=='..'),'COLD_STATE_RELATIVE_PATH');assert.notEqual(p,CLOSED,'COLD_STATE_RESERVED_PATH');}
function absent(p){try{fs.lstatSync(p);return false;}catch(error){if(error.code==='ENOENT')return true;throw error;}}
function sync(p){const fd=fs.openSync(p,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
function fileBytes(p,max=268435456){canonical(p);const stat=fs.lstatSync(p);assert.ok(stat.isFile()&&stat.nlink===1&&stat.size<=max,'COLD_STATE_UNSAFE_FILE');const fd=fs.openSync(p,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{const actual=fs.fstatSync(fd);assert.ok(actual.dev===stat.dev&&actual.ino===stat.ino,'COLD_STATE_SOURCE_CHANGED');return fs.readFileSync(fd);}finally{fs.closeSync(fd);}}
function planInventory(contract){
 assert.match(contract.sourceCommit,/^[a-f0-9]{40}$/);assert.match(contract.frontendRevision,/^[a-f0-9]{40}$/);
 assert.ok(Array.isArray(contract.entries)&&contract.entries.length>0&&contract.entries.length<=10000,'COLD_STATE_INVENTORY_REQUIRED');
 assert.ok(Array.isArray(contract.directories),'COLD_STATE_DIRECTORIES_REQUIRED');
 const ids=new Set(),paths=new Set();
 for(const e of contract.entries){assert.match(e.id,/^[a-zA-Z0-9_-]{1,100}$/);relative(e.target);assert.ok(['sqlite','json','redis','bytes'].includes(e.kind));assert.ok(!ids.has(e.id)&&!paths.has(e.target),'COLD_STATE_DUPLICATE');ids.add(e.id);paths.add(e.target);}
 const dirs=new Set();for(const d of contract.directories){relative(d);assert.ok(!dirs.has(d)&&!paths.has(d),'COLD_STATE_PATH_COLLISION');dirs.add(d);}
 for(const p of [...paths,...dirs])for(let parent=path.posix.dirname(p);parent!=='.';parent=path.posix.dirname(parent))assert.ok(!paths.has(parent),'COLD_STATE_PATH_COLLISION');
 return [...contract.entries].sort((a,b)=>a.id.localeCompare(b.id));
}
function validatePayload(kind,bytes,file){
 if(kind==='json'||kind==='redis'){
  const value=JSON.parse(bytes);assert.ok(value&&typeof value==='object','COLD_STATE_JSON');
  if(kind==='redis'){
   assert.ok(Array.isArray(value),'COLD_STATE_REDIS');const keys=new Set();
   for(const row of value){assert.ok(typeof row.key==='string'&&typeof row.dump==='string'&&Number.isSafeInteger(row.ttl)&&row.ttl>=-1,'COLD_STATE_REDIS_ROW');
    for(const s of [row.key,row.dump])assert.equal(Buffer.from(s,'base64').toString('base64'),s,'COLD_STATE_REDIS_ENCODING');assert.ok(!keys.has(row.key),'COLD_STATE_REDIS_DUPLICATE');keys.add(row.key);}
  }
 }
 if(kind==='sqlite'){
  assert.equal(bytes.subarray(0,16).toString(),'SQLite format 3\0','COLD_STATE_SQLITE');assert.equal(bytes[18],1,'COLD_STATE_SQLITE_MUST_BE_SEALED_DELETE_MODE');
  const db=new DatabaseSync(pathToFileURL(file).href+'?immutable=1',{readOnly:true,allowExtension:false});
  try{equal(db.prepare('PRAGMA integrity_check').all().map(r=>r.integrity_check),['ok']);}finally{db.close();}
 }
}
function verifyColdState({directory,digest,contract}){
 canonical(directory);assert.match(digest,/^[a-f0-9]{64}$/);const expected=planInventory(contract);
 const bytes=fileBytes(path.join(directory,'cold-state.json'),1048576);assert.equal(sha(bytes),digest,'COLD_STATE_MANIFEST_DIGEST');const m=JSON.parse(bytes);
 assert.equal(m.schema,SCHEMA,'COLD_STATE_COMPLETE_MANIFEST_REQUIRED');assert.equal(m.inventoryComplete,true,'COLD_STATE_INCOMPLETE');assert.equal(m.bootAllowed,false);assert.equal(m.noExecutionAuthority,true);
 equal(m.sourceCommit,contract.sourceCommit);equal(m.frontendRevision,contract.frontendRevision);
 assert.ok(Array.isArray(m.entries));equal(m.entries.map(({id,target,kind})=>({id,target,kind})).sort((a,b)=>a.id.localeCompare(b.id)),expected);
 equal([...m.directories].sort(),[...contract.directories].sort());
 equal(fs.readdirSync(directory).sort(),['cold-state.json','payload']);canonical(path.join(directory,'payload'));
 equal(fs.readdirSync(path.join(directory,'payload')).sort(),m.entries.map(e=>e.id).sort());
 for(const e of m.entries){assert.match(e.sha256,/^[a-f0-9]{64}$/);assert.ok(Number.isSafeInteger(e.size)&&e.size>=0);const file=path.join(directory,'payload',e.id),b=fileBytes(file);assert.equal(b.length,e.size,'COLD_STATE_SIZE');assert.equal(sha(b),e.sha256,'COLD_STATE_DIGEST');validatePayload(e.kind,b,file);}
 return m;
}
function materializeColdState({directory,digest,contract,destination}){
 const m=verifyColdState({directory,digest,contract});const parent=path.dirname(destination);canonical(parent);assert.equal(path.resolve(destination),destination);
 assert.ok(destination!==directory&&!destination.startsWith(directory+path.sep)&&!directory.startsWith(destination+path.sep),'COLD_STATE_SOURCE_TARGET_ALIAS');
 const parentStat=fs.statSync(parent);assert.equal(parentStat.uid,process.getuid(),'COLD_STATE_PARENT_OWNER');assert.equal(parentStat.mode&0o077,0,'COLD_STATE_PARENT_PRIVATE');
 assert.ok(absent(destination),'COLD_STATE_TARGET_NOT_FRESH');
 const lock=destination+'.restore-lock';fs.mkdirSync(lock,{mode:0o700});const lockIdentity=fs.lstatSync(lock);let stage,renamed=false;
 try{
  stage=fs.mkdtempSync(path.join(parent,'.work8-cold-stage-'));fs.chmodSync(stage,0o700);
  for(const d of m.directories)fs.mkdirSync(path.join(stage,d),{recursive:true,mode:0o700});
  for(const e of m.entries){const target=path.join(stage,e.target);fs.mkdirSync(path.dirname(target),{recursive:true,mode:0o700});const b=fileBytes(path.join(directory,'payload',e.id));assert.equal(sha(b),e.sha256,'COLD_STATE_SOURCE_CHANGED');fs.writeFileSync(target,b,{flag:'wx',mode:0o600});sync(target);validatePayload(e.kind,fileBytes(target),target);}
  // Recheck the pinned complete inventory after copying, before any final path exists.
  verifyColdState({directory,digest,contract});
  const receipt={schema:'WORK8_COLD_STATE_MATERIALIZED_V1',digest,sourceCommit:m.sourceCommit,frontendRevision:m.frontendRevision,inventoryCompleteRelativeToPinnedContract:true,bootAllowed:false,noExecutionAuthority:true,redisActivated:false,sourceQuarantineProven:false};
  fs.writeFileSync(path.join(stage,CLOSED),JSON.stringify(receipt),{flag:'wx',mode:0o600});sync(path.join(stage,CLOSED));
  const flush=p=>{for(const name of fs.readdirSync(p)){const child=path.join(p,name);if(fs.lstatSync(child).isDirectory())flush(child);}sync(p);};flush(stage);
  assert.ok(absent(destination),'COLD_STATE_TARGET_NOT_FRESH');fs.renameSync(stage,destination);renamed=true;sync(parent);
  return {directory:destination,receipt};
 }catch(error){if(stage)fs.rmSync(renamed?destination:stage,{recursive:true,force:true});throw error;}
 finally{const current=fs.lstatSync(lock);assert.ok(current.isDirectory()&&current.dev===lockIdentity.dev&&current.ino===lockIdentity.ino,'COLD_STATE_LOCK_IDENTITY_CHANGED');fs.rmdirSync(lock);sync(parent);}
}
module.exports={verifyColdState,materializeColdState};

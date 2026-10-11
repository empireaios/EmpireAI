'use strict';
// Composition of existing verifiers; no runtime boot, authority import or source writes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');const {DatabaseSync}=require('node:sqlite');
const {verifySystem,selectSystemPoint}=require('./work8-system-vault.cjs');
const {verifyCheckpoint}=require('./legacy-checkpoint-capture.cjs');
const {verifyLegacyShadowDisk}=require('./legacy-shadow-state-capture.cjs');
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

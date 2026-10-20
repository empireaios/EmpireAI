'use strict';
// Fresh inspection layout only: never imports execution authority or boots an app.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const {STORES}=require('./work8-system-vault.cjs');
const {MARKERS}=require('./work8-lifecycle-markers.cjs');
const LAYOUT=Object.freeze({...STORES,brain:'brain/brain.sqlite',missions:'brain/brain.sqlite.missions.sqlite',execution:'brain/brain.sqlite.mission-execution.sqlite',shadow:'shadow/shadow-ceo.db'});
function syncTree(dir){for(const name of fs.readdirSync(dir)){const file=path.join(dir,name);if(fs.lstatSync(file).isDirectory())syncTree(file);else{const fd=fs.openSync(file,'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}}const fd=fs.openSync(dir,'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
function materializeRuntimeInspection({directory,digest,destination}) {
 const recovery=require('./work8-recovery-set.cjs');
 const manifest=recovery.verifyRuntimeRecoverySet({directory,digest});
 assert.equal(path.resolve(destination),destination);assert.equal(fs.realpathSync(path.dirname(destination)),path.dirname(destination));
 assert.ok(destination!==directory&&!destination.startsWith(directory+path.sep),'NESTED_INSPECTION_REFUSED');
 // Retain all bytes in memory before target creation. Copying the sealed files
 // later would leave a validation-to-copy race. Authority remains sealed only.
 const entries=Object.entries(LAYOUT).map(([id,relative])=>{const bytes=fs.readFileSync(path.join(directory,id,'manifest.json'));assert.equal(sha(bytes),manifest.stores[id]);return {relative,source:path.join(directory,id,'checkpoint.db'),digest:JSON.parse(bytes).file.sha256};});
 if(manifest.lifecycleMarkers)for(const [id,relative]of Object.entries(MARKERS))entries.push({relative,source:path.join(directory,id+'.initialized'),digest:manifest.lifecycleMarkers[id]});
 // This bounded offline adapter retains the complete SQL corpus in memory.
 // A 572MB primary requires at least that plus other stores and runtime headroom.
 const retained=entries.map(entry=>{const fd=fs.openSync(entry.source,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{const stat=fs.fstatSync(fd);assert.ok(stat.isFile()&&stat.nlink===1);const bytes=fs.readFileSync(fd);assert.equal(sha(bytes),entry.digest,'CAPTURE_CHANGED_DURING_READ');return {...entry,bytes,mode:stat.mode&0o777};}finally{fs.closeSync(fd);}});
 fs.mkdirSync(destination,{mode:0o700});
 try {
  for(const entry of retained){const file=path.join(destination,entry.relative);fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});const fd=fs.openSync(file,'wx',entry.mode);try{fs.writeFileSync(fd,entry.bytes);fs.fchmodSync(fd,entry.mode);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}assert.ok(fs.readFileSync(file).equals(entry.bytes));assert.equal(fs.statSync(file).mode&0o777,entry.mode);}
  if(manifest.visualMemoryDigest)recovery.materializeVisualMemoryInspection({directory,digest,destination:path.join(destination,'visual-memory-inspection')});
  const receipt={schema:'WORK8_RUNTIME_INSPECTION_LAYOUT_V1',sourceDigest:digest,sourceCommit:manifest.sourceCommit,layout:LAYOUT,bootAllowed:false,noExecutionAuthority:true,authorityImported:false,redisRestored:false,completeOperationalRestore:false};
  fs.writeFileSync(path.join(destination,'INSPECTION_ONLY.json'),JSON.stringify(receipt),{flag:'wx',mode:0o600});
  syncTree(destination);const parent=fs.openSync(path.dirname(destination),'r');try{fs.fsyncSync(parent);}finally{fs.closeSync(parent);}
  return {directory:destination,...receipt};
 }catch(error){fs.rmSync(destination,{recursive:true,force:true});throw error;}
}
module.exports={LAYOUT,materializeRuntimeInspection};

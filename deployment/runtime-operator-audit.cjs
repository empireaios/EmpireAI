'use strict';
const fs=require('node:fs'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const {protectedPath}=require('./runtime-membership-controller.cjs');
const {recordContainment}=require('./containment-audit.cjs');
function initializeAuditFence(journal,{initialize=false}={}){
 const file=journal+'.audit-fence.sqlite';if(fs.existsSync(file)){protectedPath(file,process.getuid());return;}
 if(!initialize)throw Error('AUDIT_FENCE_MISSING');
 const fd=fs.openSync(file,'wx',0o600);fs.closeSync(fd);const db=new DatabaseSync(file);db.exec('PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; CREATE TABLE audit_scope(version INTEGER NOT NULL); INSERT INTO audit_scope VALUES(1)');db.close();
}
function openAuditFence(journal){
 const file=journal+'.audit-fence.sqlite';protectedPath(file,process.getuid());const db=new DatabaseSync(file,{timeout:0});db.exec('BEGIN');const rows=db.prepare('SELECT version FROM audit_scope').all();if(rows.length!==1||rows[0].version!==1||db.prepare('PRAGMA journal_mode').get().journal_mode!=='delete'){db.close();throw Error('AUDIT_FENCE_SCHEMA');}
 return ()=>{db.exec('ROLLBACK');db.close();};
}
async function recordOperatorContainment(env,receipt){
 const journal=env.WORK8_CONTROLLER_JOURNAL_PATH;if(!journal)return false;let marker,db;
 try{
  protectedPath(path.dirname(journal),process.getuid());
  marker=await fs.promises.open(journal+'.emergency','wx',0o600);await marker.writeFile(JSON.stringify({schema:1,source:env.RAILWAY_GIT_COMMIT_SHA,generation:env.EMPIRE_GENERATION,event:receipt.event,at:receipt.at})+'\n');await marker.sync();await marker.close();marker=null;
  const directory=await fs.promises.open(path.dirname(journal),'r');try{await directory.sync();}finally{await directory.close();}
  protectedPath(journal+'.audit-fence.sqlite',process.getuid());
  db=new DatabaseSync(journal+'.audit-fence.sqlite',{timeout:0});db.exec('BEGIN EXCLUSIVE');const rows=db.prepare('SELECT version FROM audit_scope').all();if(rows.length!==1||rows[0].version!==1||db.prepare('PRAGMA journal_mode').get().journal_mode!=='delete')throw Error('AUDIT_FENCE_SCHEMA');
  return await recordContainment(env,receipt);
 }catch{return false;}finally{try{await marker?.close();}catch{}try{db?.exec('ROLLBACK');}catch{}try{db?.close();}catch{}}
}
module.exports={initializeAuditFence,openAuditFence,recordOperatorContainment};

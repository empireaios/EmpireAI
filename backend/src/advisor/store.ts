import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { digest,parseCommunication,routeCommunication } from './package.js';
/** Dedicated internal records, following the existing native SQLite durability convention.
 * Never opens the sql.js business database for writing or changes mission snapshot format. */
export class AdvisorStore {
 constructor(readonly filename:string){}
 use<T>(fn:(db:DatabaseSync)=>T):T{
  if(!path.isAbsolute(this.filename)||fs.realpathSync(path.dirname(this.filename))!==path.dirname(this.filename))throw Error('Store unavailable');
  if(!fs.existsSync(this.filename))fs.closeSync(fs.openSync(this.filename,'wx',0o600));
  const stat=fs.lstatSync(this.filename);
  if(!stat.isFile()||stat.nlink!==1||fs.realpathSync(this.filename)!==this.filename||stat.size>64*1024*1024)throw Error('Store unavailable');
  const db=new DatabaseSync(this.filename,{allowExtension:false,timeout:100});
  try{
   const id=db.prepare('PRAGMA application_id').get()?.application_id;
   if(id===0x45414757&&db.prepare('PRAGMA user_version').get()?.user_version!==1)throw Error('Store version unsupported');
   if(id!==0&&id!==0x45414757)throw Error('Store identity invalid');
   if(id===0&&db.prepare("SELECT name FROM sqlite_schema WHERE type='table'").all().length)throw Error('Store identity invalid');
   db.exec(`PRAGMA trusted_schema=OFF; PRAGMA synchronous=EXTRA; PRAGMA max_page_count=16384;
    CREATE TABLE IF NOT EXISTS communications(id TEXT PRIMARY KEY,workspace TEXT NOT NULL,owner TEXT NOT NULL,hash TEXT NOT NULL,created TEXT NOT NULL,package TEXT NOT NULL,handler TEXT NOT NULL,status TEXT NOT NULL,result TEXT NOT NULL,request_id TEXT) STRICT;
    CREATE INDEX IF NOT EXISTS communication_workspace ON communications(workspace,created,id);
    CREATE TABLE IF NOT EXISTS access_audit(id INTEGER PRIMARY KEY,at TEXT NOT NULL,actor TEXT NOT NULL,operation TEXT NOT NULL,target TEXT NOT NULL,outcome TEXT NOT NULL) STRICT;
    CREATE TABLE IF NOT EXISTS oauth_clients(id TEXT PRIMARY KEY,redirect TEXT NOT NULL,created INTEGER NOT NULL) STRICT;
    CREATE TABLE IF NOT EXISTS oauth_codes(hash TEXT PRIMARY KEY,client TEXT NOT NULL,redirect TEXT NOT NULL,challenge TEXT NOT NULL,owner TEXT NOT NULL,workspace TEXT NOT NULL,expires INTEGER NOT NULL) STRICT;
    CREATE TABLE IF NOT EXISTS oauth_tokens(hash TEXT PRIMARY KEY,client TEXT NOT NULL,owner TEXT NOT NULL,workspace TEXT NOT NULL,expires INTEGER NOT NULL) STRICT;
    PRAGMA application_id=1161906007; PRAGMA user_version=1;`);
   return fn(db);
  }finally{db.close();}
 }
 audit(actor:string,operation:string,target:string,outcome:string){this.use(db=>db.prepare('INSERT INTO access_audit(at,actor,operation,target,outcome) VALUES(?,?,?,?,?)').run(new Date().toISOString(),actor.slice(0,100),operation.slice(0,80),target.slice(0,180),outcome.slice(0,80)));}
 list(workspace:string,after='',limit=20){return this.use(db=>db.prepare('SELECT id,created,handler,status,result,request_id FROM communications WHERE workspace=? AND id>? ORDER BY id LIMIT ?').all(workspace,after,limit));}
 get(workspace:string,id:string){return this.use(db=>db.prepare('SELECT id,owner,hash,created,package,handler,status,result,request_id FROM communications WHERE workspace=? AND id=?').get(workspace,id));}
 import(workspace:string,owner:string,value:unknown){
  const p=parseCommunication(value),serialized=JSON.stringify(p),hash=digest(serialized),route=routeCommunication(p);
  return this.use(db=>{
   db.exec('BEGIN IMMEDIATE');
   try{
    const prior=db.prepare('SELECT id,workspace,hash FROM communications WHERE id=?').get(p.id);
    if(prior){if(prior.workspace!==workspace||prior.hash!==hash)throw Error('INVALID_PACKAGE');db.exec('COMMIT');return {id:p.id,code:'ALREADY_IMPORTED',created:false};}
    db.prepare('INSERT INTO communications VALUES(?,?,?,?,?,?,?,?,?,NULL)').run(p.id,workspace,owner,hash,new Date().toISOString(),serialized,route.handler,route.status,JSON.stringify({code:route.code,grantsAuthority:false,externalEffect:false,source:'KING_ADVISOR',provenance:'owner-imported untrusted artifact; not owner endorsement',synthetic:p.synthetic}));
    db.exec('COMMIT');return {id:p.id,code:route.code,created:true};
   }catch(error){if(db.isTransaction)db.exec('ROLLBACK');throw error;}
  });
 }
 result(workspace:string,id:string,status:string,result:unknown,requestId:string|null=null){this.use(db=>db.prepare('UPDATE communications SET status=?,result=?,request_id=? WHERE workspace=? AND id=?').run(status,JSON.stringify(result),requestId,workspace,id));}
}

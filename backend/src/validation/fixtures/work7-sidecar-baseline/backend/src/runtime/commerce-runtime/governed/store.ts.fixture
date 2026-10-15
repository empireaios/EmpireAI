import type {DomainEntity} from './entities.js';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {Actor,Command,EntityKind} from './contracts.js';
export const digest=(v:unknown):string=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export type Receipt={id:string;missionId:string;workspace:string;version:number;at:string;actor:Actor;command:Command;requestDigest:string;previous:string;state:Record<string,unknown>;entities:DomainEntity[];digest:string;classification:'SYNTHETIC';externalEffects:0};
/** Native sidecar for the existing runtime's governed evidence extension. Never opens/replaces Brain or finance stores. */
export class GovernedCommerceStore {
 readonly db:DatabaseSync;
 constructor(readonly filename:string){
  if(filename!==':memory:'){
   fs.mkdirSync(path.dirname(filename),{recursive:true,mode:0o700});
   if(fs.realpathSync(path.dirname(filename))!==path.dirname(filename))throw Error('UNSAFE_COMMERCE_PATH');
   if(fs.existsSync(filename)&&(!fs.lstatSync(filename).isFile()||fs.realpathSync(filename)!==filename))throw Error('UNSAFE_COMMERCE_PATH');
   if(fs.existsSync(filename+'.initialized')&&!fs.existsSync(filename))throw Error('COMMERCE_JOURNAL_MISSING');
  }
  const initialized=filename!==':memory:'&&fs.existsSync(filename+'.initialized');
  if(initialized&&fs.statSync(filename).size<100)throw Error('COMMERCE_JOURNAL_CORRUPT');
  this.db=new DatabaseSync(filename,{allowExtension:false,timeout:1000});
  if(initialized){try{if(this.db.prepare('PRAGMA application_id').get()?.application_id!==1162038605||this.db.prepare('PRAGMA user_version').get()?.user_version!==1||this.db.prepare('PRAGMA quick_check').get()?.quick_check!=='ok'||!this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='commerce_runtime_receipts'").get()||!this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='commerce_runtime_tasks'").get())throw Error('COMMERCE_JOURNAL_CORRUPT');}catch{this.db.close();throw Error('COMMERCE_JOURNAL_CORRUPT');}}

  this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA trusted_schema=OFF; PRAGMA max_page_count=65536;
   PRAGMA application_id=1162038605; PRAGMA user_version=1;
   CREATE TABLE IF NOT EXISTS commerce_runtime_receipts(workspace TEXT NOT NULL,mission TEXT NOT NULL,version INTEGER NOT NULL,id TEXT NOT NULL,record TEXT NOT NULL,PRIMARY KEY(workspace,mission,version),UNIQUE(workspace,id));
   CREATE TRIGGER IF NOT EXISTS immutable_commerce_update BEFORE UPDATE ON commerce_runtime_receipts BEGIN SELECT RAISE(ABORT,'IMMUTABLE_COMMERCE_RECEIPT'); END;
   CREATE TRIGGER IF NOT EXISTS immutable_commerce_delete BEFORE DELETE ON commerce_runtime_receipts BEGIN SELECT RAISE(ABORT,'IMMUTABLE_COMMERCE_RECEIPT'); END;
   CREATE TABLE IF NOT EXISTS commerce_runtime_tasks(workspace TEXT NOT NULL,id TEXT NOT NULL,mission TEXT NOT NULL,record TEXT NOT NULL,version INTEGER NOT NULL,PRIMARY KEY(workspace,id));`);
  if(filename!==':memory:'){fs.chmodSync(filename,0o600);if(!fs.existsSync(filename+'.initialized')){const f=fs.openSync(filename+'.initialized','wx',0o600);try{fs.writeSync(f,'Governed commerce evidence; never reset');fs.fsyncSync(f);}finally{fs.closeSync(f);}}}
 }
 close(){this.db.close();}
 history(workspace:string,mission:string):Receipt[]{
  const rows=this.db.prepare('SELECT record FROM commerce_runtime_receipts WHERE workspace=? AND mission=? ORDER BY version').all(workspace,mission);
  let previous='',version=0;return rows.map(row=>{const r=JSON.parse(String(row.record)) as Receipt;const {digest:actual,...body}=r;if(r.workspace!==workspace||r.missionId!==mission||r.previous!==previous||r.version!==++version||digest(body)!==actual)throw Error('COMMERCE_JOURNAL_CORRUPT');previous=actual;return r;});
 }
 missions(workspace:string){return this.db.prepare('SELECT DISTINCT mission FROM commerce_runtime_receipts WHERE workspace=? ORDER BY mission LIMIT 200').all(workspace).map(r=>{const h=this.history(workspace,String(r.mission));return h.at(-1)!;});}
 transaction<T>(fn:()=>T):T{this.db.exec('BEGIN IMMEDIATE');try{const r=fn();this.db.exec('COMMIT');return r;}catch(e){if(this.db.isTransaction)this.db.exec('ROLLBACK');throw e;}}
 insert(r:Receipt){this.db.prepare('INSERT INTO commerce_runtime_receipts VALUES(?,?,?,?,?)').run(r.workspace,r.missionId,r.version,r.id,JSON.stringify(r));}
 prior(workspace:string,id:string){const row=this.db.prepare('SELECT record FROM commerce_runtime_receipts WHERE workspace=? AND id=?').get(workspace,id);return row?JSON.parse(String(row.record)) as Receipt:null;}
}

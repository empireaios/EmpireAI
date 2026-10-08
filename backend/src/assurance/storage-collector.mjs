import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';

export function createStorageCollector(directory,clock=Date.now) {
 return async()=>{
  const files=['assurance.sqlite','intelligence.sqlite','pillow-request-receipts.sqlite','pillow-reasoning.sqlite','pillow-institutional.sqlite','communications.sqlite','openai-october-2026.sqlite'];
  const internal=[];
  for(const name of files){
   const filename=path.join(directory,name),stat=fs.lstatSync(filename);
   if(!stat.isFile()||stat.nlink!==1||fs.realpathSync(filename)!==filename||stat.size>128*1024*1024)throw Error('Storage identity or bound invalid');
   const db=new DatabaseSync(filename,{readOnly:true,allowExtension:false,timeout:500});
   try{db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF');internal.push({id:name,value:db.prepare('PRAGMA quick_check').get()?.quick_check==='ok'});}finally{db.close();}
  }
  const now=clock();return {origin:'independent-adapter',source:'Read-only SQLite integrity; backup and restore remain unverified',evidenceId:'storage-'+now,observedAt:now,authoritative:files.map(id=>({id,value:true})),internal};
 };
}

export function createEvidenceFreshnessCollector(directory,clock=Date.now) {
 return async()=>{
  const filename=path.join(directory,'intelligence.sqlite'),stat=fs.lstatSync(filename);
  if(!stat.isFile()||fs.realpathSync(filename)!==filename||stat.size>128*1024*1024)throw Error('Evidence source invalid');
  const db=new DatabaseSync(filename,{readOnly:true,allowExtension:false,timeout:500});
  const authoritative=[],internal=[],now=clock();
  try{
   db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF; BEGIN');
   const rows=db.prepare("SELECT id,body FROM objects WHERE workspace=? AND kind='health' LIMIT 101").all('ws_empire_1');
   if(rows.length>100)throw Error('Evidence inventory bound');
   for(const row of rows){
    const h=JSON.parse(row.body);if(!h.evidenceId)continue;
    const raw=db.prepare("SELECT body FROM objects WHERE workspace=? AND kind='evidence' AND id=?").get('ws_empire_1',h.evidenceId);
    const e=raw?JSON.parse(raw.body):null;
    // Check that saved health's last-good claim has an exact coherent source.
    // Historical expiry stays disclosed in capability health, not silently renewed.
    const observed=Date.parse(e?.observedAt),expiry=Date.parse(e?.staleAfter);
    authoritative.push({id:row.id,value:true});
    internal.push({id:row.id,value:Boolean(e&&e.capabilityId===row.id&&e.observedAt===h.lastGoodAt&&Number.isFinite(observed)&&observed<=now&&Number.isFinite(expiry)&&expiry>observed)});
   }
  }finally{if(db.isTransaction)db.exec('ROLLBACK');db.close();}
  if(!authoritative.length)return null;
  return {origin:'independent-adapter',source:'Saved last-good timestamps vs exact dated evidence; current expiry independently reported by capability probes',evidenceId:'freshness-binding-'+now,observedAt:now,authoritative,internal};
 };
}

import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';

// Read stores directly, independently of Pillow's own reports and caches.
// Scope is explicit: completed requests in the preceding 15 minutes, excluding
// the most recent 30 seconds to avoid racing the history commit.
export async function collectDurableOmissions({ redis, filename, now = Date.now() }) {
  const stat=fs.lstatSync(filename);
  if(!stat.isFile() || stat.nlink!==1 || stat.size>32*1024*1024 || fs.realpathSync(filename)!==filename) throw Error('Unsafe reasoning source');
  const keys=new Set();let cursor='0',pages=0;
  do {
    const result=await redis.scan(cursor,'MATCH','pillow:chatreq:v2:*','COUNT',100);
    cursor=result[0];for(const key of result[1])keys.add(key);
    if(++pages>100 || keys.size>10000)throw Error('Request inventory exceeds bound');
  }while(cursor!=='0');
  const db=new DatabaseSync(filename,{readOnly:true,allowExtension:false,timeout:1000});
  const authoritative=[],internal=[],bindings=new Set();let inspected=0,unbound=0;
  try {
    db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF; BEGIN');
    if(db.prepare('PRAGMA quick_check').get()?.quick_check!=='ok')throw Error('Reasoning source invalid');
    for(const key of keys){
      const raw=await redis.get(key);if(raw===null)throw Error('Inventory changed during collection');
      if(Buffer.byteLength(raw)>1024*1024)throw Error('Request exceeds bound');
      const r=JSON.parse(raw);
      if(r.status!=='COMPLETED')continue;
      // Delivery reads update updatedAt; only the immutable completion receipt
      // defines this window. Raw Redis retains exact result bytes in resultJson.
      const at=Date.parse(r.observability?.resultPersistedAt);
      if(!Number.isFinite(at)||at>now)throw Error('Request timestamp unavailable');
      if(at>now-30000 || at<now-900000)continue;
      if(r.workspaceId!=='ws_empire_1')continue;
      const result=Object.hasOwn(r,'resultJson')?JSON.parse(r.resultJson):r.finalResult;
      if(key!=='pillow:chatreq:v2:'+r.requestId || typeof r.sessionId!=='string' || typeof result?.message!=='string')throw Error('Request identity invalid');
      if(typeof result.transcriptRequestId!=='string'||!result.transcriptRequestId){unbound++;continue;}
      const transcriptId=result.transcriptRequestId;
      const binding=r.sessionId+'\0'+transcriptId;
      if(bindings.has(binding)||transcriptId.length>200||(result.sessionId!==undefined&&result.sessionId!==r.sessionId))throw Error('Transcript binding invalid or reused');
      bindings.add(binding);
      const row=db.prepare('SELECT turns FROM transcripts WHERE workspace=? AND session=?').get(r.workspaceId,r.sessionId);
      const turns=row?JSON.parse(row.turns):[];
      if(!Array.isArray(turns)||turns.length>48)throw Error('History invalid');
      // A full retained window can have intentionally evicted an older turn.
      if(turns.length===48 && !turns.some(t=>t.requestId===transcriptId))throw Error('History retention prevents complete comparison');
      const digest=s=>createHash('sha256').update(s).digest('hex');
      authoritative.push({id:r.requestId,value:digest(result.message)});
      const matches=turns.filter(t=>t.role==='assistant'&&t.requestId===transcriptId);
      if(matches.length>1)throw Error('Duplicate delivered answer');
      if(matches.length===1){if(typeof matches[0].content!=='string')throw Error('Malformed delivery');internal.push({id:r.requestId,value:digest(matches[0].content)});}
      inspected++;
    }
    db.exec('COMMIT');
    if(!inspected&&!unbound)return null;
    return {origin:'independent-adapter',source:'Redis durable requests vs SQLite transcripts; completed 30s–15m window',evidenceId:'durable-omissions-'+now,observedAt:now,authoritative,internal,scopeComplete:unbound===0,unbound};
  }finally{if(db.isTransaction)db.exec('ROLLBACK');db.close();}
}

export function assurancePaths(root){
  if(!root||!path.isAbsolute(root)||fs.realpathSync(root)!==root)throw Error('Canonical volume required');
  return {database:path.join(root,'commissioning','assurance.sqlite'),reasoning:path.join(root,'commissioning','pillow-reasoning.sqlite')};
}

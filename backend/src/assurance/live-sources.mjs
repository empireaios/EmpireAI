import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import {readDeliveryResolutions} from './delivery-resolution.mjs';

// Read stores directly, independently of Pillow's own reports and caches.
// Completed answers use a 15 minute comparison window. Terminal delivery failures
// remain in scope for the entire retained durable request inventory: quiet time
// must not turn a failed owner interaction into a successful delivery.
export async function collectDurableOmissions({ redis, filename, resolutionDirectory, now = Date.now() }) {
  const stat=fs.lstatSync(filename);
  if(!stat.isFile() || stat.nlink!==1 || stat.size>32*1024*1024 || fs.realpathSync(filename)!==filename) throw Error('Unsafe reasoning source');
  const keys=new Set();let cursor='0',pages=0;
  do {
    const result=await redis.scan(cursor,'MATCH','pillow:chatreq:v2:*','COUNT',100);
    if(!Array.isArray(result)||result.length!==2||typeof result[0]!=='string'||!/^\d+$/.test(result[0])||!Array.isArray(result[1])||result[1].some(k=>typeof k!=='string'||!k.startsWith('pillow:chatreq:v2:')))throw Error('Request inventory malformed');
    cursor=result[0];for(const key of result[1])keys.add(key);
    if(++pages>100 || keys.size>10000)throw Error('Request inventory exceeds bound');
  }while(cursor!=='0');
  const db=new DatabaseSync(filename,{readOnly:true,allowExtension:false,timeout:1000});
  const authoritative=[],internal=[],bindings=new Set(),resolved=[];let inspected=0,unbound=0,pending=0;
  const resolve = resolutionDirectory ? readDeliveryResolutions(resolutionDirectory,'ws_empire_1',now) : () => null;
  try {
    db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF; BEGIN');
    if(db.prepare('PRAGMA quick_check').get()?.quick_check!=='ok')throw Error('Reasoning source invalid');
    // Validate the independent source even when no requests are eligible.
    db.prepare('SELECT turns FROM transcripts WHERE workspace=? AND session=?').get('ws_empire_1','');
    for(const key of keys){
      const raw=await redis.get(key);if(raw===null)throw Error('Inventory changed during collection');
      if(Buffer.byteLength(raw)>1024*1024)throw Error('Request exceeds bound');
      const r=JSON.parse(raw);
      if(!r||typeof r.workspaceId!=='string'||!r.workspaceId||typeof r.requestId!=='string'||!r.requestId||key!=='pillow:chatreq:v2:'+r.requestId||typeof r.sessionId!=='string'||!r.sessionId)throw Error('Request identity invalid');
      if(r.workspaceId!=='ws_empire_1')continue;
      if(!['RECEIVED','ACCEPTED','RUNNING','RETRYABLE','COMPLETED','FAILED_FATAL','FAILED'].includes(r.status))throw Error('Request status invalid');
      if(r.status==='FAILED_FATAL'||r.status==='FAILED'){
        if(key!=='pillow:chatreq:v2:'+r.requestId || typeof r.requestId!=='string' || !r.requestId || typeof r.sessionId!=='string' || !r.sessionId)throw Error('Failed request identity invalid');
        const failedAt=Date.parse(r.updatedAt);
        if(!Number.isFinite(failedAt)||failedAt>now)throw Error('Failed request timestamp unavailable');
        // A provider receipt, rejection diagnostic, or error message is not an
        // owner answer. Do not use liveness or a historical certification here.
        const resolution=resolve(r);
        authoritative.push({id:r.requestId,value:resolution?'historical-failure-resolution-verified':'owner-answer-delivered'});
        internal.push({id:r.requestId,value:resolution?'historical-failure-resolution-verified':'terminal-application-delivery-failure'});
        if(resolution)resolved.push(resolution);
        inspected++;
        continue;
      }
      if(r.status!=='COMPLETED'){pending++;continue;}
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
    const inventory={complete:true,pages,retainedKeys:keys.size,eligible:inspected,unbound,pending,windowStart:now-900000,windowEnd:now-30000,terminalFailureScope:'ALL_RETAINED',keyDigest:createHash('sha256').update(JSON.stringify([...keys].sort())).digest('hex'),sqliteIntegrity:'ok'};
    return {origin:'independent-adapter',source:'Redis durable requests vs SQLite transcripts; terminal failures independently checked against bound successor closures',evidenceId:'durable-omissions-'+now,observedAt:now,authoritative,internal,scopeComplete:unbound===0,inventory,unbound,historicalFailuresResolved:resolved.length,resolutionDigest:createHash('sha256').update(JSON.stringify(resolved)).digest('hex')};
  }finally{if(db.isTransaction)db.exec('ROLLBACK');db.close();}
}

export function assurancePaths(root){
  if(!root||!path.isAbsolute(root)||fs.realpathSync(root)!==root)throw Error('Canonical volume required');
  return {database:path.join(root,'commissioning','assurance.sqlite'),reasoning:path.join(root,'commissioning','pillow-reasoning.sqlite')};
}

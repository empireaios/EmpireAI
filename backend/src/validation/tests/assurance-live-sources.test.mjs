import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {collectDurableOmissions} from '../../assurance/live-sources.mjs';
import {reconcileSnapshot} from '../../assurance/independent-assurance.mjs';

test('independent durable sources detect missing delivery without modifying sources',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'assurance-source-')),filename=path.join(dir,'reasoning.sqlite'),now=1000000;
  const db=new DatabaseSync(filename);db.exec('CREATE TABLE transcripts(workspace TEXT,session TEXT,turns TEXT)');
  db.prepare('INSERT INTO transcripts VALUES(?,?,?)').run('ws_empire_1','s',JSON.stringify([]));db.close();
  const before=fs.readFileSync(filename);
  const row={requestId:'r',sessionId:'s',workspaceId:'ws_empire_1',updatedAt:new Date(now-60000).toISOString(),status:'COMPLETED',finalResult:{message:'Persisted reply'}};
  row.observability={resultPersistedAt:row.updatedAt};row.finalResult.transcriptRequestId='host-r';
  const redis={scan:async()=>['0',['pillow:chatreq:v2:r']],get:async()=>JSON.stringify(row)};
  try{
    const snap=await collectDurableOmissions({redis,filename,now});
    const verdict=reconcileSnapshot(snap,now,120000);
    assert.equal(verdict.status,'FAIL');assert.equal(verdict.missing,1);assert.deepEqual(fs.readFileSync(filename),before);
    await assert.rejects(collectDurableOmissions({redis:{...redis,get:async()=>null},filename,now}));
    // A delivery read must not move the immutable completion time.
    row.updatedAt=new Date(now).toISOString();
    assert.equal(reconcileSnapshot(await collectDurableOmissions({redis,filename,now}),now,120000).missing,1);
    row.observability.resultPersistedAt=new Date(now-1000).toISOString();
    assert.deepEqual(await collectDurableOmissions({redis,filename,now}),null);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('production resultJson and distinct transcript IDs join without fabricated legacy coverage',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'assurance-binding-')),filename=path.join(dir,'reasoning.sqlite'),now=2000000;
 const db=new DatabaseSync(filename);db.exec('CREATE TABLE transcripts(workspace TEXT,session TEXT,turns TEXT)');
 db.prepare('INSERT INTO transcripts VALUES(?,?,?)').run('ws_empire_1','s',JSON.stringify([{role:'assistant',requestId:'host-id',content:'Exact answer'}]));db.close();
 const result={message:'Exact answer',transcriptRequestId:'host-id',sessionId:'s'};
 const row={requestId:'durable-id',sessionId:'s',workspaceId:'ws_empire_1',status:'COMPLETED',updatedAt:new Date(now).toISOString(),observability:{resultPersistedAt:new Date(now-60000).toISOString()},finalResult:{message:'Non-authoritative Lua representation'},resultJson:JSON.stringify(result)};
 const redis={scan:async()=>['0',['pillow:chatreq:v2:durable-id']],get:async()=>JSON.stringify(row)};
 const check=async()=>reconcileSnapshot(await collectDurableOmissions({redis,filename,now}),now,120000);
 try{
  const before=fs.readFileSync(filename);assert.equal((await check()).status,'PASS');assert.deepEqual(fs.readFileSync(filename),before);
  row.resultJson=JSON.stringify({...result,message:'Corrupted answer'});assert.equal((await check()).status,'FAIL');
  row.resultJson=JSON.stringify({message:'Exact answer'});const legacy=await check();assert.equal(legacy.status,'NOT_CHECKED');assert.equal(legacy.unbound,1);assert.equal(legacy.missing,0);
  row.resultJson=JSON.stringify(result);row.observability.resultPersistedAt=new Date(now-1000000).toISOString();assert.equal(await collectDurableOmissions({redis,filename,now}),null);
  row.observability.resultPersistedAt=new Date(now+1).toISOString();await assert.rejects(collectDurableOmissions({redis,filename,now}));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

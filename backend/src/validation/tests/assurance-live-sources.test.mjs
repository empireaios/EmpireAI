import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {collectDurableOmissions} from '../../assurance/live-sources.mjs';
import {reconcileSnapshot} from '../../assurance/independent-assurance.mjs';

test('provider success followed by application rejection remains a delivery failure during quiet periods',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'assurance-terminal-')),filename=path.join(dir,'reasoning.sqlite'),now=20000000;
 const db=new DatabaseSync(filename);db.exec('CREATE TABLE transcripts(workspace TEXT,session TEXT,turns TEXT)');db.close();
 const rows=Array.from({length:7},(_,i)=>({requestId:'failed-'+i,sessionId:'s',workspaceId:'ws_empire_1',status:'FAILED_FATAL',updatedAt:new Date(now-7200000).toISOString(),brainResult:{providerStatus:'success'},failureClass:'CONSTITUTIONAL_GATE_REFUSED',finalResult:{message:'Application error, not an answer'}}));
 const redis={scan:async()=>['0',rows.map(r=>'pillow:chatreq:v2:'+r.requestId)],get:async key=>JSON.stringify(rows.find(r=>key==='pillow:chatreq:v2:'+r.requestId))};
 try{
  const before=fs.readFileSync(filename),sourceBefore=JSON.stringify(rows);
  for(const clock of [now,now+86400000]){
   const verdict=reconcileSnapshot(await collectDurableOmissions({redis,filename,now:clock}),clock,120000);
   assert.equal(verdict.status,'FAIL');assert.equal(verdict.mismatched,7);
  }
  assert.equal(JSON.stringify(rows),sourceBefore);assert.deepEqual(fs.readFileSync(filename),before);
  rows[0].status='FAILED';assert.equal(reconcileSnapshot(await collectDurableOmissions({redis,filename,now}),now,120000).mismatched,7);
  rows[0].updatedAt=new Date(now+1).toISOString();await assert.rejects(collectDurableOmissions({redis,filename,now}));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

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
    assert.equal((await collectDurableOmissions({redis,filename,now})).inventory.eligible,0);
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
  row.resultJson=JSON.stringify(result);row.observability.resultPersistedAt=new Date(now-1000000).toISOString();assert.equal((await collectDurableOmissions({redis,filename,now})).inventory.eligible,0);
  row.observability.resultPersistedAt=new Date(now+1).toISOString();await assert.rejects(collectDurableOmissions({redis,filename,now}));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('complete empty inventories are auditable across quiet cycles and restarts; uncertain sources never pass',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'assurance-empty-')),filename=path.join(dir,'reasoning.sqlite'),now=2000000;
 const db=new DatabaseSync(filename);db.exec('CREATE TABLE transcripts(workspace TEXT,session TEXT,turns TEXT)');db.close();
 const redis={scan:async()=>['0',[]],get:async()=>null};
 try{
  const before=fs.readFileSync(filename);
  for(const clock of [now,now+300000,now+86400000]){
   const snapshot=await collectDurableOmissions({redis,filename,now:clock});
   const verdict=reconcileSnapshot(snapshot,clock,120000);
   assert.equal(verdict.status,'PASS');assert.equal(verdict.authoritativeCount,0);
   assert.equal(verdict.inventory.complete,true);assert.equal(verdict.inventory.pages,1);
   assert.equal(verdict.inventory.eligible,0);assert.equal(verdict.inventory.retainedKeys,0);
   assert.equal(reconcileSnapshot(snapshot,clock+120001,120000).status,'STALE');
  }
  assert.deepEqual(fs.readFileSync(filename),before);
  for(const scan of [async()=>{throw Error('redis down');},async()=>['1',[]],async()=>[0,[]],async()=>['0',null],async()=>['0',['bad']]])await assert.rejects(collectDurableOmissions({redis:{...redis,scan},filename,now}));
  await assert.rejects(collectDurableOmissions({redis,filename:filename+'-missing',now}));
  const other=new DatabaseSync(filename+'-wrong');other.close();
  await assert.rejects(collectDurableOmissions({redis,filename:filename+'-wrong',now}));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('malformed identities and duplicate delivered answers cannot certify an empty or matched window',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'assurance-invalid-')),filename=path.join(dir,'reasoning.sqlite'),now=2000000;
 const db=new DatabaseSync(filename);db.exec('CREATE TABLE transcripts(workspace TEXT,session TEXT,turns TEXT)');
 db.prepare('INSERT INTO transcripts VALUES(?,?,?)').run('ws_empire_1','s',JSON.stringify(Array(2).fill({role:'assistant',requestId:'host-r',content:'answer'})));db.close();
 const row={workspaceId:'ws_empire_1',sessionId:'s',requestId:'r',status:'COMPLETED',observability:{resultPersistedAt:new Date(now-60000).toISOString()},finalResult:{message:'answer',transcriptRequestId:'host-r'}};
 const redis={scan:async()=>['0',['pillow:chatreq:v2:r']],get:async()=>JSON.stringify(row)};
 try{
  await assert.rejects(collectDurableOmissions({redis,filename,now}),/Duplicate/);
  row.observability.resultPersistedAt=new Date(now-1000000).toISOString();row.requestId='wrong';
  await assert.rejects(collectDurableOmissions({redis,filename,now}),/identity/);
  row.requestId='r';row.status='UNKNOWN';await assert.rejects(collectDurableOmissions({redis,filename,now}),/status/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {readPillow,searchPillow} from '../../advisor/pillow-read.js';
import {archivePillowRequest} from '../../runtime/pillow-request-receipts.js';
import type {DurableChatRequest} from '../../runtime/pillow-chat-request-store.js';

test('Pillow newest discovery, chronology, exact complete text, failure state, pagination and links are read-only',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pillow-read-')),dir=path.join(root,'commissioning');fs.mkdirSync(dir);
 const env={root:process.env.RAILWAY_VOLUME_MOUNT_PATH,profile:process.env.EMPIRE_RUNTIME_PROFILE};process.env.RAILWAY_VOLUME_MOUNT_PATH=root;process.env.EMPIRE_RUNTIME_PROFILE='LOCKED_COMMISSIONING_V1';
 const file=path.join(dir,'pillow-reasoning.sqlite'),db=new DatabaseSync(file);
 db.exec('CREATE TABLE transcripts(workspace TEXT,session TEXT,updated TEXT,turns TEXT)');
 const insert=(w:string,s:string,updated:string,turns:unknown[])=>db.prepare('INSERT INTO transcripts VALUES(?,?,?,?)').run(w,s,updated,JSON.stringify(turns));
 const answer='Exact response\n'+ 'complete text '.repeat(8000);
 insert('ws','a-old','2026-10-01T00:00:00Z',[{role:'assistant',content:'Old unrelated',timestamp:'2026-10-01T00:00:00Z',requestId:'old'}]);
 insert('ws','z-new','2026-10-08T01:09:09Z',[
  {role:'assistant',content:answer,timestamp:'2026-10-08T01:09:09Z',requestId:'pcr_good'},
  {role:'user',content:'Commercial Product Candidate #001',timestamp:'2026-10-08T01:09:08Z',requestId:'pcr_good'},
  {role:'user',content:'Failed investigation',timestamp:'2026-10-08T01:09:10Z',requestId:'pcr_failed'},
  {role:'assistant',content:'Provider inference failed',timestamp:'2026-10-08T01:09:11Z',requestId:'pcr_failed'}]);
 insert('other','private','2026-10-09T00:00:00Z',[{role:'assistant',content:'Private secret discussion',requestId:'pcr_private'}]);db.close();
 const rec={inputHash:'synthetic',idempotencyKey:'synthetic',ts:'2026-10-08T01:09:09Z',attemptCount:1,activeWorker:null,brainResult:null,deliveryState:'RETRIEVED',messagePreview:'Synthetic fixture',requestId:'pcr_good',sessionId:'z-new',workspaceId:'ws',createdAt:'2026-10-08T01:09:08Z',updatedAt:'2026-10-08T01:09:09Z',status:'COMPLETED',failureClass:'BRAIN_SUCCESS',finalResult:{message:answer},observability:{resultPersistedAt:'2026-10-08T01:09:09Z'}} as DurableChatRequest;
 archivePillowRequest(rec);archivePillowRequest({...rec,requestId:'pcr_failed',status:'FAILED_FATAL',failureClass:'BRAIN_FATAL',finalResult:null});archivePillowRequest({...rec,workspaceId:'other',requestId:'pcr_private'});
 const intel=new DatabaseSync(path.join(dir,'intelligence.sqlite'));intel.exec('CREATE TABLE jobs(workspace TEXT,body TEXT);CREATE TABLE objects(workspace TEXT,kind TEXT,body TEXT)');
 intel.prepare('INSERT INTO jobs VALUES(?,?)').run('ws',JSON.stringify({id:'job1',requester:'PILLOW:pcr_good',status:'COMPLETED',evidence:['e1']}));
 intel.prepare('INSERT INTO objects VALUES(?,?,?)').run('ws','opportunities',JSON.stringify({id:'op1',evidenceRefs:['e1'],status:'INCOMPLETE'}));intel.close();
 const before=fs.readFileSync(file),receiptBefore=fs.readFileSync(path.join(dir,'pillow-request-receipts.sqlite'));
 try{
  const first=await readPillow(root,'ws',undefined,'',1);assert.equal((first.data as any)[0].session,'z-new');assert.equal(first.coverage.nextAfter,'z-new');assert.equal(first.coverage.complete,false);
  const next=await readPillow(root,'ws',undefined,'z-new',1);assert.equal((next.data as any)[0].session,'a-old');assert.equal(next.coverage.complete,true);
  const since=await readPillow(root,'ws',undefined,'',20,'2026-10-08T00:00:00Z');assert.equal((since.data as any[]).length,1);
  const exact:any=await readPillow(root,'ws','request:pcr_good');assert.equal(exact.data.requests[0].responseText,answer);assert.equal(exact.data.requests[0].completionState,'COMPLETED');assert.equal(exact.data.turns[0].role,'user');assert.equal(exact.data.associations.jobs[0].id,'job1');assert.equal(exact.data.associations.opportunities[0].id,'op1');assert.equal(exact.data.requests[0].responseIntegrity.truncated,false);
  const failed:any=await readPillow(root,'ws','pcr_failed');assert.equal(failed.data.requests[0].completionState,'INCOMPLETE_FAILED');assert.equal(failed.data.requests[0].finalResult,null);assert.equal(failed.data.associations.status,'NO_STORED_LINK');
  const session:any=await readPillow(root,'ws','z-new');assert.equal(session.data.session,'z-new');assert.equal(session.data.requests.length,2);
  assert.equal((await readPillow(root,'ws','request:pcr_private')).status,'UNAVAILABLE');assert.equal((await readPillow(root,'ws','missing')).data,null);
  assert.equal(searchPillow(root,'ws','Commercial Product Candidate #001').results[0]?.id,'pillow:request:pcr_good');assert.equal(searchPillow(root,'ws','Private secret').results.length,0);
  await assert.rejects(readPillow(root,'ws',undefined,'unknown'));
  assert.deepEqual(fs.readFileSync(file),before);assert.deepEqual(fs.readFileSync(path.join(dir,'pillow-request-receipts.sqlite')),receiptBefore);
 }finally{if(env.root===undefined)delete process.env.RAILWAY_VOLUME_MOUNT_PATH;else process.env.RAILWAY_VOLUME_MOUNT_PATH=env.root;if(env.profile===undefined)delete process.env.EMPIRE_RUNTIME_PROFILE;else process.env.EMPIRE_RUNTIME_PROFILE=env.profile;fs.rmSync(root,{recursive:true,force:true});}
});

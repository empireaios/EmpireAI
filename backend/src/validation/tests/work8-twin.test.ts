import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {GovernedCommerceStore} from '../../runtime/commerce-runtime/governed/store.js';
import {Work8TwinSessions} from '../../runtime/commerce-runtime/governed/work8-twin.js';
const p={workspace:'owner-workspace',owner:'owner-one'};
const command=(id:string,action:string,expectedVersion:number)=>({id,action,expectedVersion,sessionId:'twin-one'});
test('durable twin lifecycle survives restart, preserves replay and refuses stale or revoked execution',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'work8-twin-')),file=path.join(dir,'commerce.sqlite');let s=new GovernedCommerceStore(file);
 try{let twin=new Work8TwinSessions(s,()=>100);const created=twin.transition(p,command('create','CREATE',0));assert.equal(created.status,'PAUSED');assert.notEqual(created.twinWorkspace,p.workspace);
 assert.throws(()=>twin.run(p,'twin-one',1,()=>{throw Error('must not run');}),/INACTIVE/);
 twin.transition(p,command('resume','RESUME',1));s.close();s=new GovernedCommerceStore(file);twin=new Work8TwinSessions(s,()=>200);
 assert.deepEqual(twin.transition(p,command('create','CREATE',0)),created);assert.equal(twin.run(p,'twin-one',2,w=>w),created.twinWorkspace);
 twin.transition(p,command('pause','PAUSE',2));assert.throws(()=>twin.run(p,'twin-one',2,()=>1),/INACTIVE/);
 assert.equal(twin.snapshot(p,'twin-one').records.length,0);assert.equal(twin.snapshot(p,'twin-one').coverage,'BOUNDED_PAGE');
 twin.transition(p,command('archive','ARCHIVE',3));assert.throws(()=>twin.transition(p,command('again','RESUME',4)),/TRANSITION/);
 }finally{s.close();fs.rmSync(dir,{recursive:true,force:true});}
});
test('owner and workspace isolation, immutable receipts and idempotency conflicts fail closed',()=>{
 const s=new GovernedCommerceStore(':memory:'),twin=new Work8TwinSessions(s);try{
 twin.transition(p,command('create','CREATE',0));assert.throws(()=>twin.read({...p,owner:'another'},'twin-one'),/OWNER/);assert.throws(()=>twin.read({...p,workspace:'another'},'twin-one'),/NOT_FOUND/);
 assert.throws(()=>twin.transition(p,command('create','RESUME',1)),/IDEMPOTENCY/);assert.throws(()=>twin.transition(p,command('resume','RESUME',7)),/VERSION/);
 assert.throws(()=>s.db.exec('UPDATE work8_twin_events SET version=9'),/IMMUTABLE/);assert.throws(()=>s.db.exec('DELETE FROM work8_twin_events'),/IMMUTABLE/);
 assert.throws(()=>twin.snapshot(p,'twin-one','',101),/PAGE_BOUND/);
 }finally{s.close();}
});
test('failed canonical operation rolls back within active session without replacing lifecycle',()=>{
 const s=new GovernedCommerceStore(':memory:'),twin=new Work8TwinSessions(s);try{
 twin.transition(p,command('create','CREATE',0));twin.transition(p,command('resume','RESUME',1));
 assert.throws(()=>twin.run(p,'twin-one',2,()=>{twin.transition(p,command('pause','PAUSE',2));throw Error('injected failure');}),/injected/);
 assert.equal(twin.read(p,'twin-one').status,'ACTIVE');assert.equal(twin.read(p,'twin-one').version,2);
 }finally{s.close();}
});

test('durable session recovery paginates only the authenticated owner records including archived sessions',()=>{
 const s=new GovernedCommerceStore(':memory:'),twin=new Work8TwinSessions(s);try{
  for(const sessionId of ['a','b','c'])twin.transition(p,{id:'create-'+sessionId,sessionId,action:'CREATE',expectedVersion:0});
  twin.transition({...p,owner:'other'},{id:'create-other',sessionId:'d',action:'CREATE',expectedVersion:0});
  twin.transition(p,{id:'archive',sessionId:'a',action:'ARCHIVE',expectedVersion:1});
  const first=twin.list(p,'',2);assert.deepEqual(first.sessions.map(x=>x.sessionId),['a','b']);assert.equal(first.sessions[0].status,'ARCHIVED');assert.equal(first.next,'b');
  assert.deepEqual(twin.list(p,first.next!,2).sessions.map(x=>x.sessionId),['c']);assert.equal(twin.list(p,'b',2).next,null);
  assert.equal(twin.list({...p,workspace:'other'}).sessions.length,0);assert.throws(()=>twin.list(p,'',101),/PAGE_BOUND/);
 }finally{s.close();}
});

test('twin projection follows existing canonical listing and order receipts and excludes live workspace',async()=>{
 const {GovernedCommerceEngine}=await import('../../runtime/commerce-runtime/governed/engine.js');
 const {acceptanceScenario}=await import('../../runtime/commerce-runtime/governed/scenario.js');
 const s=new GovernedCommerceStore(':memory:'),now=Date.parse('2026-10-11T00:00:00Z'),twin=new Work8TwinSessions(s,()=>now),engine=new GovernedCommerceEngine(s,()=>now);
 try{twin.transition(p,command('create','CREATE',0));twin.transition(p,command('resume','RESUME',1));
 twin.run(p,'twin-one',2,w=>{for(const mission of ['mission-one','mission-two']){const fixture=acceptanceScenario(w,p.owner,now);fixture.steps.forEach((step,i)=>engine.execute(step.actor,{id:mission+'-'+i,missionId:mission,expectedVersion:i,command:step.command}));}});
 const outside=acceptanceScenario(p.workspace,p.owner,now);engine.execute(outside.actors.PROPOSER!,{id:'outside',missionId:'live-record',expectedVersion:0,command:outside.steps[0]!.command});
 const first=twin.snapshot(p,'twin-one','',1);assert.equal(first.records.length,1);assert.equal(first.next,'mission-one');assert.equal(first.records[0].listing?.productId,'cj-product-fixture');assert.equal(Object.keys(first.records[0].orders).length,1);
 const second=twin.snapshot(p,'twin-one',first.next!,1);assert.equal(second.records[0].missionId,'mission-two');assert.equal(second.next,null);assert.equal(second.records[0].sourceClassification,'SYNTHETIC');assert.equal(second.records[0].receiptDigest,s.history(first.session.twinWorkspace,'mission-two').at(-1)!.digest);
 }finally{s.close();}
});

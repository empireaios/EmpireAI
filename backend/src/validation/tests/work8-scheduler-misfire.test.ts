import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {IntelligenceStore} from '../../intelligence/store.js';import {readWork8QueueProbe} from '../../assurance/work8-queue-probe.js';
test('late admitted slot remains degraded across reopen until genuinely timely later admission; failed admission cannot clear it',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'misfire-'));fs.mkdirSync(path.join(root,'commissioning'));const file=path.join(root,'commissioning','intelligence.sqlite'),ws='synthetic:misfire';let now=Date.now();let store=new IntelligenceStore(file,()=>now);store.seed(ws);for(const s of store.schedules(ws))if(s.id!=='empire.state')store.setSchedule(ws,s.id,false);
 try{const original=now;now+=30001;assert.equal(readWork8QueueProbe(root,ws,now).status,'DEGRADED');assert.equal(store.due(ws).length,1);assert.equal(store.due(ws).length,0);const late=store.schedules(ws).find(s=>s.id==='empire.state')!;assert.deepEqual(late.missedSlot,{dueAt:original,admittedAt:now});store=new IntelligenceStore(file,()=>now);assert.equal(readWork8QueueProbe(root,ws,now).status,'DEGRADED');
 const first=store.claim(ws,store.recentJobs(ws,20)[0]!.id)!;first.status='COMPLETED';first.completedAt=new Date(now).toISOString();store.saveJob(ws,first);
 now=Date.parse(late.nextAt);store.use(db=>db.exec("CREATE TRIGGER deny_misfire_admission BEFORE INSERT ON jobs BEGIN SELECT RAISE(ABORT,'EXAM_ABORT'); END;"));assert.throws(()=>store.due(ws),/EXAM_ABORT/);assert.equal(readWork8QueueProbe(root,ws,now).status,'DEGRADED');assert.deepEqual(store.schedules(ws).find(s=>s.id==='empire.state')!.missedSlot,late.missedSlot);
 store.use(db=>db.exec('DROP TRIGGER deny_misfire_admission'));assert.equal(store.due(ws).length,1);assert.equal(readWork8QueueProbe(root,ws,now).status,'HEALTHY');assert.equal(store.schedules(ws).find(s=>s.id==='empire.state')!.missedSlot,undefined);assert.equal(store.recentJobs(ws,20).length,2);
 assert.equal(readWork8QueueProbe(root,ws,now).evidence.thresholdMs,120000);assert.equal(readWork8QueueProbe(root,ws,now).evidence.scheduleThresholdMs,30000);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});


test('persisted scheduler metadata corruption cannot clear a late admission, while original legacy schedules remain readable',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'misfire-metadata-'));fs.mkdirSync(path.join(root,'commissioning'));const ws='synthetic:misfire-metadata',now=Date.now(),store=new IntelligenceStore(path.join(root,'commissioning','intelligence.sqlite'),()=>now);store.seed(ws);for(const s of store.schedules(ws))if(s.id!=='empire.state')store.setSchedule(ws,s.id,false);
 try{
  const original=store.schedules(ws).find(s=>s.id==='empire.state')!,late={dueAt:now-30000,admittedAt:now},timely={dueAt:now-29999,admittedAt:now};
  const read=(metadata:Record<string,unknown>)=>{const body={...original,...metadata};delete (body as any).nextAt;store.use(db=>db.prepare("UPDATE schedules SET body=?,next_at=? WHERE workspace=? AND id='empire.state'").run(JSON.stringify(body),now+60000,ws));return readWork8QueueProbe(root,ws,now);};
  assert.equal(read({}).status,'HEALTHY','original legacy schedule without either field');
  assert.equal(read({lastAdmission:timely}).status,'HEALTHY','valid timely admission');
  assert.equal(read({lastAdmission:late,missedSlot:late}).status,'DEGRADED','late threshold exact boundary');
  const corrupt:Record<string,unknown>[]=[
   {lastAdmission:late}, {missedSlot:late},
   ...[false,null,0,'',[],{},'invalid'].map(lastAdmission=>({lastAdmission})),
   ...[false,null,0,'',[],{},'invalid'].map(missedSlot=>({lastAdmission:late,missedSlot})),
   {lastAdmission:timely,missedSlot:timely},
   {lastAdmission:late,missedSlot:{...late,dueAt:late.dueAt-1}},
   {lastAdmission:{dueAt:now+1,admittedAt:now}},
   {lastAdmission:{dueAt:now,admittedAt:now+1}},
   {lastAdmission:{dueAt:String(now),admittedAt:now}},
   {lastAdmission:{dueAt:now,admittedAt:now+0.5}},
  ];
  for(const metadata of corrupt){const probe=read(metadata);assert.equal(probe.status,'UNAVAILABLE',JSON.stringify(metadata));assert.equal(probe.evidence.reason,'QUEUE_SOURCE_UNVERIFIED');}
  assert.equal(read({lastAdmission:late,missedSlot:late}).status,'DEGRADED','restored canonical metadata retains incident evidence');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

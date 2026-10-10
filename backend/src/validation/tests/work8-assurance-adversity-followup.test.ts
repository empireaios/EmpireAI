import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {IntelligenceStore} from '../../intelligence/store.js';
import {ReadAcquirer} from '../../intelligence/acquisition.js';
import {runIntelligenceJob,startIntelligence} from '../../intelligence/runtime.js';
// @ts-ignore Existing canonical control plane.
import {AssuranceControlPlane} from '../../assurance/control-plane.mjs';
const ws='synthetic:work8:adversity',start=1800000000000;
function input(id:string){return {id,objective:'Isolated injected provider read exam',capabilities:['internet.safety'],subject:{id:'synthetic-organiser',query:'synthetic-organiser',marketplace:'US'},requestLimit:1};}

test('actual read adapter persists 429/503/schema failure, restart backoff and fresh recovery evidence',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'work8-provider-followup-')),filename=path.join(root,'intelligence.sqlite');let now=start,calls=0;let store=new IntelligenceStore(filename,()=>now);
 const responses=[new Response('{}',{status:429,headers:{'retry-after':'60'}}),new Response('{}',{status:503,headers:{'retry-after':'60'}}),new Response('{}',{status:200}),new Response('[]',{status:200})];
 const transport:typeof fetch=async()=>{calls++;return responses.shift()!;};
 const cp=new AssuranceControlPlane({root,now:()=>now,revision:'work8-provider-followup'});let incidentId:string|undefined;
 try{
  for(const [index,expected] of ['HTTP_429','HTTP_503','INVALID_PROVIDER_SHAPE'].entries()){
   store.enqueue(ws,'isolated-exam',input('fault-'+index));const job=await runIntelligenceJob(store,ws,new ReadAcquirer(store,transport),'fault-'+index,false);
   assert.equal(job!.status,'FAILED');assert.equal(job!.failures[0].code,expected);assert.equal(store.recent(ws,'evidence',100).length,0);
   // Reopen both store and acquirer; durable health must prevent another call.
   store=new IntelligenceStore(filename,()=>now);const health=store.get(ws,'health','internet.safety')!;
   const incident=cp.observe(ws,{id:'provider-read',capability:'supplier-research',classification:'PROVIDER_READ_FAILURE',status:'FAILED',synthetic:true,summary:expected,evidence:{jobId:job!.id,failure:health.failure,retryAt:health.retryAt,observedAt:now}});incidentId=incident.id;
   assert.equal((await cp.recover(ws,incident.id)).status,'NO_RUNBOOK');
   const before=calls;store.enqueue(ws,'isolated-exam',input('backoff-'+index));const backoff=await runIntelligenceJob(store,ws,new ReadAcquirer(store,transport),'backoff-'+index,false);
   assert.equal(backoff!.failures[0].code,'BACKOFF_ACTIVE');assert.equal(calls,before);assert.equal(store.get(ws,'health','internet.safety')!.failure,expected);
   now=Date.parse(health.retryAt)+1;
  }
  store.enqueue(ws,'isolated-exam',input('recovered'));const final=await runIntelligenceJob(store,ws,new ReadAcquirer(store,transport),'recovered',false);
  const health=store.get(ws,'health','internet.safety')!,evidence=store.get(ws,'evidence',health.evidenceId)!;
  assert.equal(final!.status,'COMPLETED');assert.equal(health.failure,null);assert.equal(Date.parse(evidence.observedAt),now);assert.equal(evidence.jobId,'recovered');assert.equal(final!.requestsUsed,1);assert.equal(calls,4);
  cp.observe(ws,{id:'provider-read',capability:'supplier-research',classification:'PROVIDER_READ_FAILURE',status:'HEALTHY',synthetic:true,summary:'Fresh injected-transport observation independently reread',evidence:{observedAt:now,jobId:evidence.jobId,digest:evidence.digest}});
  assert.equal(cp.get(ws,'incident',incidentId).status,'RECOVERED');assert.equal(cp.list(ws,'recovery').length,0);assert.equal(cp.list(ws,'incident')[0].recurrence,3);
  assert.equal(store.recentJobs(ws,50).every(j=>j.inferenceCalls===0&&j.commerceEffects===0),true);
 }finally{cp.close();fs.rmSync(root,{recursive:true,force:true});}
});

test('actual expired provider read lease becomes INTERRUPTED on reopen and cannot silently replay',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'work8-read-lease-')),filename=path.join(root,'intelligence.sqlite');let now=start;let store=new IntelligenceStore(filename,()=>now);
 try{store.enqueue(ws,'isolated-exam',input('crashed-read'));const claimed=store.claim(ws,'crashed-read')!;assert.equal(claimed.status,'RUNNING');now+=300001;store=new IntelligenceStore(filename,()=>now);assert.equal(store.claim(ws,'crashed-read'),null);
  const recovered=store.job(ws,'crashed-read')!;assert.equal(recovered.status,'INTERRUPTED');assert.equal(recovered.attempts,1);assert.equal(recovered.requestsUsed,0);assert.equal(recovered.failures[0].code,'PROCESS_INTERRUPTED_RECONCILE_BEFORE_RETRY');assert.equal(store.claim(ws,'crashed-read'),null);assert.equal(store.recent(ws,'evidence').length,0);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('scheduled observation and due advancement commit atomically across failure and reopening',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'work8-scheduler-misfire-')),filename=path.join(root,'intelligence.sqlite');let store=new IntelligenceStore(filename,()=>start);
 try{store.seed(ws);for(const schedule of store.schedules(ws))if(schedule.id!=='empire.state')store.setSchedule(ws,String(schedule.id),false);
  store.use(db=>db.exec("CREATE TRIGGER injected_enqueue_crash BEFORE INSERT ON jobs BEGIN SELECT RAISE(ABORT,'INJECTED_ENQUEUE_CRASH'); END;"));
  assert.throws(()=>store.due(ws),/INJECTED_ENQUEUE_CRASH/);
  store=new IntelligenceStore(filename,()=>start+1);assert.equal(store.recentJobs(ws,50).length,0);
  assert.equal(Date.parse(store.schedules(ws).find(s=>s.id==='empire.state')!.nextAt),start,'failed admission cannot advance schedule');
  store.use(db=>db.exec('DROP TRIGGER injected_enqueue_crash'));
  const due=store.due(ws);assert.equal(due.length,1);assert.equal(due[0]!.id,'empire.state');
  // Process dies immediately after durable transaction, before any worker call.
  store=new IntelligenceStore(filename,()=>start+2);assert.deepEqual(store.due(ws),[]);
  const jobs=store.recentJobs(ws,50);assert.equal(jobs.length,1);assert.equal(jobs[0]!.status,'QUEUED');assert.equal(jobs[0]!.requestsUsed,0);assert.equal(jobs[0]!.requester,'SCHEDULER');
  const schedule=store.schedules(ws).find(s=>s.id==='empire.state')!;assert.equal(schedule.lastJobId,jobs[0]!.id);assert.equal(Date.parse(schedule.nextAt),start+1+900000);assert.equal(store.recent(ws,'evidence').length,0);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('full read queue cannot consume a due slot or create unbounded catch-up',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'work8-scheduler-bound-')),filename=path.join(root,'intelligence.sqlite');const store=new IntelligenceStore(filename,()=>start);
 try{store.seed(ws);for(const schedule of store.schedules(ws))if(schedule.id!=='empire.state')store.setSchedule(ws,String(schedule.id),false);
  for(let i=0;i<20;i++)store.enqueue(ws,'isolated-exam',input('existing-'+i));
  assert.throws(()=>store.due(ws),/QUEUE_BOUND/);assert.equal(store.recentJobs(ws,50).length,20);assert.equal(Date.parse(store.schedules(ws).find(s=>s.id==='empire.state')!.nextAt),start);
  assert.equal(store.recent(ws,'evidence').length,0);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('real scheduler drains a full queue before retrying atomic due admission',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'work8-scheduler-drain-')),filename=path.join(root,'intelligence.sqlite');const store=new IntelligenceStore(filename,()=>start);
 try{store.seed(ws);for(const schedule of store.schedules(ws))if(schedule.id!=='empire.state')store.setSchedule(ws,String(schedule.id),false);
  for(let i=0;i<20;i++)store.enqueue(ws,'isolated-exam',{...input('internal-'+i),capabilities:['empire.state'],subject:{id:'internal-'+i,marketplace:'US'}});
  const stop=startIntelligence(store,ws);await stop();
  assert.equal(store.recentJobs(ws,50).filter(j=>j.status==='COMPLETED').length,4);assert.equal(store.recentJobs(ws,50).filter(j=>j.status==='QUEUED').length,16);
  assert.equal(Date.parse(store.schedules(ws).find(s=>s.id==='empire.state')!.nextAt),start);
  const restart=startIntelligence(new IntelligenceStore(filename,()=>start+1),ws);await restart();
  const scheduled=store.recentJobs(ws,50).filter(j=>j.requester==='SCHEDULER');assert.equal(scheduled.length,1);assert.equal(scheduled[0]!.requestsUsed,0);assert.equal(store.recentJobs(ws,50).every(j=>j.commerceEffects===0&&j.inferenceCalls===0),true);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

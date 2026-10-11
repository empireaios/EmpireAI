import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fixture} from './work8-mission-fixture.js';
import {IntelligenceStore} from '../../intelligence/store.js';
import {qualificationDossier} from '../../intelligence/work8-dossier.js';
import type {Evidence} from '../../intelligence/model.js';
import {GovernedCommerceStore,digest} from '../../runtime/commerce-runtime/governed/store.js';
import {GovernedCommerceEngine} from '../../runtime/commerce-runtime/governed/engine.js';
import {CommerceWorker} from '../../runtime/commerce-runtime/governed/worker.js';
import {DurableSimulatedFinance} from '../../runtime/commerce-runtime/governed/work8-durable-finance.js';
import {Work8TwinSessions} from '../../runtime/commerce-runtime/governed/work8-twin.js';
import {Work8TwinRuntime} from '../../runtime/commerce-runtime/governed/work8-twin-runtime.js';
import {RetainedDiscoveryWorker} from '../../runtime/commerce-runtime/governed/work8-source-discovery.js';
import {activePortfolio} from '../../runtime/commerce-runtime/governed/work8-portfolio.js';
import {prepareReviewedMission,approvePreparedMission,bindPreparedMission} from '../../runtime/commerce-runtime/governed/work8-mission-preparation.js';
import {enrollQualifiedSimulation} from '../../runtime/commerce-runtime/governed/work8-enrollment.js';

test('labelled ten-day discovery, qualification outcomes, twin settlement and portfolio replacement',(t)=>{
 assert.equal(process.env.WORK8_KERNEL_EGRESS,'DENIED');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'w8-discovery-twin-')),p={workspace:'synthetic:daily-integration',owner:'fixture-owner'},sessionId='daily';
 const w='twin_'+digest({...p,sessionId}).slice(0,48);let now=Date.parse('2026-10-11T00:00:00Z');
 t.mock.timers.enable({apis:['Date'],now});
 const intel=new IntelligenceStore(path.join(root,'intel.sqlite'),()=>now),discovery=new RetainedDiscoveryWorker(intel);
 const open=()=>{const store=new GovernedCommerceStore(path.join(root,'commerce.sqlite')),sessions=new Work8TwinSessions(store,()=>now),worker=new CommerceWorker(new GovernedCommerceEngine(store,()=>now));return new Work8TwinRuntime(sessions,worker,new DurableSimulatedFinance(store,worker,()=>now));};
 let runtime=open();const missions:string[]=[],reports:unknown[]=[],prefixes=new Map<string,string[]>(),financialPins=new Map<string,string>();
 try{
 runtime.sessions.transition(p,{id:'create',sessionId,expectedVersion:0,action:'CREATE'});
 runtime.sessions.transition(p,{id:'resume',sessionId,expectedVersion:1,action:'RESUME'});
 const cohort=(label:string)=>{
  const ids=Array.from({length:100},(_,i)=>`fixture-${label}-${i}`),sources=new Map<string,Evidence>();
  for(let page=0;page<10;page++){
   const selected=ids.slice(page*10,page*10+10),facts={response:{list:selected.map(pid=>({pid,productNameEn:'INJECTED TEST ONLY '+pid,sellPrice:'2.48'}))}};
   // LIVE_PROVIDER is an injected protocol field, never actual acquisition evidence.
   const evidence:Evidence={id:'catalog-'+label+'-'+page,capabilityId:'cj.catalog',eye:'SUPPLIER',provider:'CJ',endpoint:'/product/list',subject:{id:'fixture-query',marketplace:'US'},observedAt:new Date(now-1000).toISOString(),retrievedAt:new Date(now-1000).toISOString(),staleAfter:new Date(now+3600000).toISOString(),authenticity:'LIVE_PROVIDER',digest:digest(facts),facts,jobId:'INJECTED_NOT_REAL_SOURCE',quality:[],lineage:[],grantsAuthority:false};
   intel.evidence(w,evidence);for(const id of selected)sources.set(id,evidence);
  }
  let scan=discovery.start(w);while(!['SOURCE_EXHAUSTED','TARGET_REACHED'].includes(scan.status))scan=discovery.tick(w,scan.day,scan.fence);
  assert.equal(scan.newCandidates,100);assert.equal(scan.shortfall,0);assert.equal(scan.qualified,0);assert.equal(scan.externalEffects,0);
  const defer=(productId:string)=>{const source=sources.get(productId)!,pins=[{id:source.id,envelopeDigest:digest(source)}];const d=qualificationDossier((ws,id)=>intel.get(ws,'evidence',id) as Evidence|null,w,{candidateId:'cj:'+productId,productId,subject:{id:productId,marketplace:'US'},evidence:pins,snapshotDigest:digest(pins)},now);assert.equal(d.eligibility.status,'DEFERRED');assert.equal(d.grantsAuthority,false);};
  return {ids,defer};
 };
 const initial=cohort('initial');for(const id of initial.ids)initial.defer(id);now+=86460000;t.mock.timers.setTime(now);
 for(let day=0;day<10;day++){
  const {ids,defer}=cohort(String(day));
  for(const [index,productId] of ids.entries()){
   assert.ok(intel.get(w,'work8_discovery_identity','cj:'+productId));if(index>1){defer(productId);continue;}const f=fixture(w,{now:()=>now,productId,store:intel,sourcePrefix:productId+':'});
   try{
    assert.equal(f.base().eligibility.status,'DEFERRED');
    if(index===1){const review=structuredClone(f.review);review.findings.find(x=>x.kind==='COMPLIANCE')!.value=0;f.save(review);assert.equal(f.projected().eligibility.status,'REJECTED');continue;}
    f.save();const d=f.projected();assert.equal(d.eligibility.status,'QUALIFIED');
    const a={status:'COMPLETED_ASSESSMENT_LINKED',candidateId:d.candidateId,dossierDigest:d.digest,owner:p.owner,candidateBinding:d.sourceBinding,assessmentHash:digest('INJECTED_ASSESSMENT_'+day),requestId:'fixture-request-'+day,investigationId:'fixture-investigation-'+day},resolve=()=>({dossier:f.projected(),assessment:a});
    const prep=prepareReviewedMission(runtime.worker.engine,w,p.owner,{id:'prepare-'+day,candidateId:d.candidateId,dossierDigest:d.digest,simulationOnly:true},resolve,f.read);
    approvePreparedMission(runtime.worker.engine,w,p.owner,{id:'approve-'+day,missionId:prep.missionId,candidateId:d.candidateId,dossierDigest:d.digest,expectedVersion:3,simulationOnly:true,acknowledgeProductApprovalOnly:true},resolve,f.read);
    enrollQualifiedSimulation(runtime.worker,w,p.owner,{id:'enroll-'+day,missionId:prep.missionId,candidateId:d.candidateId,dossierDigest:d.digest,expectedVersion:4,simulationOnly:true,acknowledgeNoActualPayment:true},()=>bindPreparedMission(runtime.store,w,p.owner,prep.missionId,d,a,f.read,now));
    if(day){const prior=missions.at(-1)!,history=runtime.store.history(w,prior);runtime.worker.engine.execute({id:p.owner,workspace:w,role:'OWNER'},{id:'retire-'+day,missionId:prior,expectedVersion:history.at(-1)!.version,command:{type:'retire',reason:'Labelled daily replacement examination'}});assert.equal(activePortfolio(runtime.store,w).activeCount,0);}
    runtime.authority.command(p,{id:'grant-'+day,sessionId,expectedVersion:runtime.authority.read(p,sessionId).version,action:'GRANT',mode:'ONE_HOUR'});
    for(let tick=0;tick<20&&runtime.worker.get(w,'enroll-'+day)!.status!=='COMPLETE';tick++)runtime.cycle();
    assert.equal(runtime.worker.get(w,'enroll-'+day)!.status,'COMPLETE');assert.equal(activePortfolio(runtime.store,w).activeCount,1);missions.push(prep.missionId);
   }finally{f.cleanup();}
  }
  assert.equal(runtime.worker.list(w).length,day+1);now+=86460000;t.mock.timers.setTime(now);
  runtime.authority.command(p,{id:'settle-'+day,sessionId,expectedVersion:runtime.authority.read(p,sessionId).version,action:'GRANT',mode:'ONE_HOUR'});
  for(let tick=0;tick<20;tick++)runtime.cycle();
  for(const mission of missions){const finance=runtime.finance.read(w,mission);assert.equal(finance.status,'COMPLETE_SIMULATION',JSON.stringify({day,mission,finance}));assert.equal(finance.actualCashMovement,0);const pin=digest({source:finance.sourceReceiptDigest,plan:finance.planDigest,financial:finance.financial?.orders});if(financialPins.has(mission))assert.equal(pin,financialPins.get(mission));else financialPins.set(mission,pin);assert.equal(finance.financial?.conserved,true);const history=runtime.store.history(w,mission);assert.ok(history.every(r=>r.externalEffects===0));const prior=prefixes.get(mission)??[];assert.deepEqual(history.slice(0,prior.length).map(r=>r.digest),prior);prefixes.set(mission,history.map(r=>r.digest));}
  const before=digest(runtime.projection(p,sessionId));runtime.store.close();runtime=open();assert.equal(digest(runtime.projection(p,sessionId)),before);assert.equal(activePortfolio(runtime.store,w).activeCount,1);
  reports.push({day:day+1,discovered:100,qualified:1,deferred:98,rejected:1,orders:missions.length,active:1});
 }
 assert.equal(intel.use(db=>db.prepare("SELECT count(*) n FROM objects WHERE workspace=? AND kind='work8_discovery_identity'").get(w)?.n),1100);const reopened=new IntelligenceStore(intel.filename,()=>now);assert.equal(reopened.use(db=>db.prepare("SELECT count(*) n FROM objects WHERE workspace=? AND kind='work8_discovery_identity'").get(w)?.n),1100);assert.equal(reopened.use(db=>db.prepare("SELECT count(*) n FROM objects WHERE workspace=? AND kind='evidence'").get(w)?.n),210);assert.equal(reopened.use(db=>db.prepare('SELECT count(*) n FROM work8_qualification_reviews WHERE workspace=?').get(w)?.n),20);assert.equal(runtime.store.missions(p.workspace).length,0);
 console.log(JSON.stringify({classification:'INJECTED_VIRTUAL_DAYS_NOT_GENUINE_OR_ELAPSED',initialDiscovered:100,initialDeferred:100,reports,externalEffects:0,paidInference:0,actualCashMovement:0}));
 }finally{runtime.store.close();fs.rmSync(root,{recursive:true,force:true});}
});

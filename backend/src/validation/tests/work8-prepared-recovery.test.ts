import test from 'node:test';import assert from 'node:assert/strict';import path from 'node:path';
import {fixture} from './work8-mission-fixture.js';
import {GovernedCommerceStore,digest} from '../../runtime/commerce-runtime/governed/store.js';
import {GovernedCommerceEngine} from '../../runtime/commerce-runtime/governed/engine.js';
import {CommerceWorker} from '../../runtime/commerce-runtime/governed/worker.js';
import {DurableSimulatedFinance} from '../../runtime/commerce-runtime/governed/work8-durable-finance.js';
import {Work8TwinSessions} from '../../runtime/commerce-runtime/governed/work8-twin.js';
import {Work8TwinRuntime} from '../../runtime/commerce-runtime/governed/work8-twin-runtime.js';
import {prepareReviewedMission,approvePreparedMission,bindPreparedMission,readMissionPreparation} from '../../runtime/commerce-runtime/governed/work8-mission-preparation.js';
import {enrollQualifiedSimulation} from '../../runtime/commerce-runtime/governed/work8-enrollment.js';
import {captureTwinCheckpoint,initializeTwinRecoveryTarget,replayTwinCheckpoint} from '../../runtime/commerce-runtime/governed/work8-twin-recovery.js';
test('prepared mission dossier and assessment lineage survive V3 restoration; missing preparation rolls back atomically',()=>{
 assert.equal(process.env.WORK8_KERNEL_EGRESS,'DENIED');const p={workspace:'synthetic:prepared-recovery',owner:'fixture-owner'},sessionId='prepared';
 const w='twin_'+digest({...p,sessionId}).slice(0,48),f=fixture(w);f.save();let now=f.now;
 const open=(name:string)=>{const store=new GovernedCommerceStore(path.join(path.dirname(f.store.filename),name)),sessions=new Work8TwinSessions(store,()=>now),worker=new CommerceWorker(new GovernedCommerceEngine(store,()=>now));return new Work8TwinRuntime(sessions,worker,new DurableSimulatedFinance(store,worker,()=>now));};
 const source=open('source.sqlite'),target=open('target.sqlite'),refused=open('refused.sqlite');
 try{
 source.sessions.transition(p,{id:'create',sessionId,expectedVersion:0,action:'CREATE'});
 const d=f.projected(),a={status:'COMPLETED_ASSESSMENT_LINKED',candidateId:d.candidateId,dossierDigest:d.digest,owner:p.owner,candidateBinding:d.sourceBinding,assessmentHash:digest('INJECTED_NOT_REAL_ASSESSMENT'),requestId:'fixture-request',investigationId:'fixture-investigation'},resolve=()=>({dossier:f.projected(),assessment:a});
 const prep=prepareReviewedMission(source.worker.engine,w,p.owner,{id:'prepare',candidateId:d.candidateId,dossierDigest:d.digest,simulationOnly:true},resolve,f.read);
 approvePreparedMission(source.worker.engine,w,p.owner,{id:'approve',missionId:prep.missionId,candidateId:d.candidateId,dossierDigest:d.digest,expectedVersion:3,simulationOnly:true,acknowledgeProductApprovalOnly:true},resolve,f.read);
 enrollQualifiedSimulation(source.worker,w,p.owner,{id:'enroll',missionId:prep.missionId,candidateId:d.candidateId,dossierDigest:d.digest,expectedVersion:4,simulationOnly:true,acknowledgeNoActualPayment:true},()=>bindPreparedMission(source.store,w,p.owner,prep.missionId,d,a,f.read,now));
 const version={applicationRevision:'a'.repeat(40),configurationDigest:digest({isolated:true})},first=captureTwinCheckpoint(source,p,sessionId,version);
 assert.equal(first.tables.work8_mission_preparations!.length,1);initializeTwinRecoveryTarget(target.store);replayTwinCheckpoint(target,first,first.digest);
 assert.deepEqual(readMissionPreparation(target.store,w,prep.missionId),prep);
 for(let i=0;i<6;i++){const t=source.worker.get(w,'enroll')!;source.worker.tick(w,t.id,t.fence);}source.finance.tick(w);now+=86460000;for(let i=0;i<20;i++)source.finance.tick(w);
 const last=captureTwinCheckpoint(source,p,sessionId,version,first);replayTwinCheckpoint(target,last,last.digest);assert.equal(target.finance.read(w,prep.missionId).status,'COMPLETE_SIMULATION');assert.equal(target.authority.read(p,sessionId).status,'NOT_GRANTED');
 initializeTwinRecoveryTarget(refused.store);const broken=structuredClone(first);broken.tables.work8_mission_preparations=[];const {digest:ignored,...body}=broken;broken.digest=digest(body);
 assert.throws(()=>replayTwinCheckpoint(refused,broken,broken.digest),/PREPARATION_LINEAGE_MISSING/);assert.equal(refused.store.db.prepare('SELECT count(*) n FROM commerce_runtime_receipts').get()?.n,0);assert.equal(refused.store.db.prepare('SELECT count(*) n FROM work8_recovery_checkpoints').get()?.n,0);
 assert.equal(source.store.history(w,prep.missionId).length,10);
 }finally{source.store.close();target.store.close();refused.store.close();f.cleanup();}
});

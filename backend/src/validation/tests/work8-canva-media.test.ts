import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {GovernedCommerceStore,digest} from '../../runtime/commerce-runtime/governed/store.js';
import {GovernedCommerceEngine} from '../../runtime/commerce-runtime/governed/engine.js';
import {CommerceWorker} from '../../runtime/commerce-runtime/governed/worker.js';
import {DurableSimulatedFinance} from '../../runtime/commerce-runtime/governed/work8-durable-finance.js';
import {Work8TwinSessions} from '../../runtime/commerce-runtime/governed/work8-twin.js';
import {Work8TwinRuntime} from '../../runtime/commerce-runtime/governed/work8-twin-runtime.js';
import {Work8CanvaMedia,type CanvaMediaExportPorts} from '../../runtime/commerce-runtime/governed/work8-canva-media.js';
import type {VisualGenerationResult} from '../../orchestration/visual-generation-layer/models/visual-generation-types.js';
const p={workspace:'ws',owner:'owner'},bytes=Buffer.from('intercepted export bytes; no Canva call or genuine image');
function fixture(){
 const store=new GovernedCommerceStore(':memory:'),worker=new CommerceWorker(new GovernedCommerceEngine(store)),sessions=new Work8TwinSessions(store),runtime=new Work8TwinRuntime(sessions,worker,new DurableSimulatedFinance(store,worker));
 sessions.transition(p,{id:'create',sessionId:'exam',expectedVersion:0,action:'CREATE'});
 sessions.transition(p,{id:'resume',sessionId:'exam',expectedVersion:1,action:'RESUME'});
 runtime.admit(p,{id:'cohort',sessionId:'exam',expectedVersion:2,count:2,authorizeLabelledFixtures:true});
 runtime.authority.command(p,{action:'GRANT',id:'grant',sessionId:'exam',expectedVersion:0,mode:'ONE_HOUR'});
 for(let i=0;i<5;i++)runtime.cycle();
 const record=runtime.projection(p,'exam').records[0]!;
 const reference={sessionId:'exam',missionId:record.missionId,receiptDigest:record.receiptDigest};
 const asset={id:'source',url:'https://example.invalid/source.png',kind:'IMAGE',sha256:digest('source'),sourceIdentity:'fixture',rightsEvidence:'Fixture only',rightsStatus:'UNVERIFIED',provenance:'Labelled fixture'};
 runtime.media.command(p,{action:'PROPOSE',id:'source-proposal',reference,expectedVersion:0,instructions:'Fixture source',assets:[asset],editingReceipt:'fixture'});
 const edit=runtime.media.command(p,{action:'REQUEST_EDIT',id:'edit',reference,expectedVersion:1,instructions:'Owner requests crop; adapter does not execute it',assetIds:['source']});
 const request={action:'PREPARE_CANVA_EXPORT_PROPOSAL',id:'export-proposal',reference,expectedVersion:2,editRequestDigest:edit.digest,designId:'design-1',format:'png',expectedExportSha256:createHash('sha256').update(bytes).digest('hex'),rightsEvidence:'Exact exported artifact rights evidence, still unreviewed'};
 const result:VisualGenerationResult={jobId:'job-1',provider:'canva',status:'success',useCase:'media',designId:'design-1',assetIds:[],exportFormat:'png',exportLocation:'https://example.invalid/export.png',errors:[],warnings:[],usageMetadata:{mock:false,providerCostCents:null,operation:'export_design'},createdAt:new Date().toISOString()};
 let calls=0,downloads=0;
 const ports:CanvaMediaExportPorts={companyId:'company',authorize:async binding=>({bindingDigest:digest(binding),expiresAt:Date.now()+60000}),exporter:{exportDesign:async req=>{calls++;assert.equal(req.designId,'design-1');assert.equal(req.workspaceId,p.workspace);return result;}},readArtifact:async url=>{downloads++;assert.equal(url,result.exportLocation);return bytes;}};
 return {store,runtime,request,result,ports,counts:()=>({calls,downloads})};
}

test('Canva export result binds exact edit request, source assets, rights and version; grants no approvals',async()=>{
 const f=fixture();try{
  await assert.rejects(new Work8CanvaMedia(f.runtime.media).prepare(p,f.request),/NOT_CONFIGURED/);
  const event=await new Work8CanvaMedia(f.runtime.media,f.ports).prepare(p,f.request);
  assert.equal(event.version,3);assert.equal(event.assets[0]!.rightsStatus,'UNVERIFIED');assert.equal(event.assets[0]!.rightsEvidence,f.request.rightsEvidence);
  const receipt=JSON.parse(event.editingReceipt!);assert.equal(receipt.editRequestDigest,f.request.editRequestDigest);
  const intent=JSON.parse(String(f.store.db.prepare('SELECT record FROM work8_canva_export_attempts').get()!.record));
  assert.equal(receipt.bindingDigest,digest(intent.binding));assert.equal(intent.binding.request.expectedExportSha256,event.assets[0]!.sha256);
  assert.ok(intent.binding.sourceAssetsDigest);assert.equal(intent.binding.request.rightsEvidence,event.assets[0]!.rightsEvidence);
  const view=f.runtime.media.read(p,f.request.reference);assert.equal(view.current,null);assert.equal(view.externalStatus,'NOT_SUBMITTED');
  assert.throws(()=>f.runtime.media.command(p,{action:'APPROVE_INTERNAL',id:'approve',reference:f.request.reference,expectedVersion:3,batchDigest:event.batchDigest}),/RIGHTS/);
  assert.deepEqual(f.counts(),{calls:1,downloads:1});
 }finally{f.store.close();}
});

test('Canva refuses stale requests, unbound runtime authority and changed export identity without proposal',async()=>{
 for(const mode of ['stale','authority','identity','hash','mock','duplicateId'] as const){const f=fixture();try{
  if(mode==='duplicateId')f.request.id='source-proposal';
  if(mode==='stale')f.request.editRequestDigest='0'.repeat(64);
  if(mode==='authority')f.ports.authorize=async()=>({bindingDigest:'0'.repeat(64),expiresAt:Date.now()+60000});
  if(mode==='identity')f.result.designId='other';if(mode==='hash')f.request.expectedExportSha256='0'.repeat(64);if(mode==='mock')f.result.usageMetadata.mock=true;
  await assert.rejects(new Work8CanvaMedia(f.runtime.media,f.ports).prepare(p,f.request),/STALE|AUTHORITY_DENIED|UNVERIFIED|HASH_MISMATCH|ID_CONFLICT/);
  assert.equal(f.runtime.media.read(p,f.request.reference).version,2);
  if(mode==='stale'||mode==='authority'||mode==='duplicateId')assert.deepEqual(f.counts(),{calls:0,downloads:0});
 }finally{f.store.close();}}
});

test('Canva catches asynchronous version change and reserves unknown outcomes against retry',async()=>{
 for(const phase of ['export','download','unknown'] as const){const f=fixture();try{
  const mutate=()=>f.runtime.media.command(p,{action:'REQUEST_EDIT',id:'new-edit',reference:f.request.reference,expectedVersion:2,instructions:'Changed instructions',assetIds:['source']});
  const original=f.ports.exporter!.exportDesign;
  f.ports.exporter={exportDesign:async req=>{const result=await original(req);if(phase==='unknown')throw Error('UNKNOWN_EXTERNAL_OUTCOME');if(phase==='export')mutate();return result;}};
  const read=f.ports.readArtifact;f.ports.readArtifact=async(url,max)=>{const result=await read(url,max);if(phase==='download')mutate();return result;};
  await assert.rejects(new Work8CanvaMedia(f.runtime.media,f.ports).prepare(p,f.request),/STALE|UNKNOWN_EXTERNAL_OUTCOME/);
  assert.equal(f.runtime.media.read(p,f.request.reference).proposal!.id,'source-proposal');
  if(phase==='unknown'){
   await assert.rejects(new Work8CanvaMedia(f.runtime.media,f.ports).prepare(p,{...f.request,id:'retry'}),/ALREADY_ATTEMPTED/);
   assert.equal(f.counts().calls,1);
  }
  assert.throws(()=>f.store.db.exec('DELETE FROM work8_canva_export_attempts'),/IMMUTABLE/);
 }finally{f.store.close();}}
});

test('Canva rechecks current authority after export and before consuming downloaded bytes',async()=>{
 for(const phase of ['export','download'] as const){const f=fixture();let revoked=false;try{
  f.ports.authorize=async binding=>({bindingDigest:digest(binding),expiresAt:revoked?0:Date.now()+60000});
  const exportDesign=f.ports.exporter!.exportDesign,read=f.ports.readArtifact;
  f.ports.exporter={exportDesign:async req=>{const result=await exportDesign(req);if(phase==='export')revoked=true;return result;}};
  f.ports.readArtifact=async(url,max)=>{const result=await read(url,max);if(phase==='download')revoked=true;return result;};
  await assert.rejects(new Work8CanvaMedia(f.runtime.media,f.ports).prepare(p,f.request),/AUTHORITY_DENIED/);
  assert.equal(f.runtime.media.read(p,f.request.reference).version,2);
  assert.equal(f.counts().downloads,phase==='export'?0:1);
 }finally{f.store.close();}}
});

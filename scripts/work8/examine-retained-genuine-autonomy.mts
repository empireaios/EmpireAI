import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {IntelligenceStore} from '../../../backend/backend/src/intelligence/store.js';
import {digest} from '../../../backend/backend/src/intelligence/model.js';
import {RetainedDiscoveryWorker} from '../../../backend/backend/src/runtime/commerce-runtime/governed/work8-source-discovery.js';
import {advanceWork8Enrichment,readWork8Enrichment} from '../../../backend/backend/src/intelligence/work8-enrichment.js';
import {runIntelligenceJob} from '../../../backend/backend/src/intelligence/runtime.js';

// Examination only: unchanged provider envelopes, existing engine, no provider transport.
const root=path.resolve(process.argv[2]);
const current=JSON.parse(fs.readFileSync(path.join(root,'AUTONOMY-LIVE-1618.json'),'utf8'));
const prior=JSON.parse(fs.readFileSync(path.join(root,'CANONICAL-ACQUISITION-1612.json'),'utf8'));
const sources=[...current.sources,...prior.records].map((x:any)=>x.data).filter((x:any)=>x.capabilityId==='cj.detail');
assert.equal(sources.length,2);
const work=fs.mkdtempSync(path.join(root,'genuine-replay-'));
const filename=path.join(work,'intelligence.sqlite');
const workspace='ws_empire_1',now=Date.now();
let store=new IntelligenceStore(filename,()=>now);
for(const source of sources){assert.equal(source.digest,digest(source.facts));store.evidence(workspace,source);}
const scanner=new RetainedDiscoveryWorker(store);let cp=scanner.start(workspace);
while(cp.cursor<cp.sourceIds.length)cp=scanner.tick(workspace,cp.day,cp.fence);
const transitions:any[]=[];
let attemptedNetwork=0;
const denied={acquire:async()=>{attemptedNetwork++;throw Error('EXAMINATION_NETWORK_FORBIDDEN');}};
for(let i=0;i<8;i++){
 const step=advanceWork8Enrichment(store,workspace);transitions.push(step);
 if(step.status==='NO_NEW_PARENT')break;
 if(step.status==='PENDING')await runIntelligenceJob(store,workspace,denied as any,step.jobs.at(-1).id,false);
 store=new IntelligenceStore(filename,()=>now);
}
const result=readWork8Enrichment(store,workspace);
assert.equal(attemptedNetwork,0);assert.equal(cp.newCandidates,2);
assert.equal(result.parents,2);assert.equal(result.deferred,2);assert.equal(result.qualified,0);
assert(result.candidates.every((x:any)=>x.reasons.includes('VARIANT_SELECTION_REQUIRED')));
assert.equal(transitions.at(-1).status,'NO_NEW_PARENT');
for(const source of sources)assert.equal(digest(store.get(workspace,'evidence',source.id)),digest(source));
const receipt={classification:'SCOPED_RETAINED_GENUINE_EVIDENCE_REPLAY_NOT_HOSTED_ACCEPTANCE',at:new Date(now).toISOString(),sourceHead:'76206d799412a57bea17df1bc476fba33aa04637',sourceIds:sources.map((s:any)=>({id:s.id,digest:s.digest,envelopeDigest:digest(s)})),discovery:cp,transitions,result,store:filename,providerRequests:0,inferenceCalls:0,commerceEffects:0,checks:['Original source envelopes unchanged','Two identities normalized by existing discovery worker','Existing enrichment selected parents and deferred ambiguous variants','Worker proceeded to next parent and exhausted scoped input','State reopened between transitions','No provider, inference or commerce execution'],limitations:['Only two retained detail sources; not the complete live catalog','No genuine commercial qualification or Pillow assessment','No live Console deployment of Work8 candidate']};
fs.writeFileSync(path.join(root,'AUTONOMY-GENUINE-REPLAY.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({parents:result.parents,deferred:result.deferred,qualified:result.qualified,attemptedNetwork,last:transitions.at(-1).status,store:filename}));

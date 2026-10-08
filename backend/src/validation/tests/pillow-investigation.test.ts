import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {IntelligenceStore} from '../../intelligence/store.js';
import {authorizeInvestigation,claimInvestigation,PillowInvestigation} from '../../intelligence/investigation.js';
import {ReadAcquirer} from '../../intelligence/acquisition.js';
import {OpenAIIntegrationLayer} from '@empireai/pillow';
const instruction='Investigate existing product evidence with Four Eyes and report the actual gaps.';
const plan={jobs:[{id:'safety',objective:'Check recall evidence',capabilities:['internet.safety'],subject:{id:'organizer',marketplace:'US'},requestLimit:1,evidenceRefs:[]},{id:'state',objective:'Read internal state',capabilities:['empire.state'],subject:{id:'empire',marketplace:'US'},requestLimit:1,evidenceRefs:[]}]};
function setup(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'investigation-'));return {s:new IntelligenceStore(path.join(dir,'eyes.sqlite')),done:()=>fs.rmSync(dir,{recursive:true,force:true})};}
test('owner grant is exact, isolated, single use and durable',()=>{const x=setup();try{
 authorizeInvestigation(x.s,'owner','king',{id:'mission',instruction});
 assert.equal(claimInvestigation(x.s,'other','r',instruction),null);assert.equal(claimInvestigation(x.s,'owner','r',instruction+' '),null);
 assert.equal(claimInvestigation(x.s,'owner','r',instruction)?.status,'RUNNING');
 assert.throws(()=>claimInvestigation(new IntelligenceStore(x.s.filename),'owner','r',instruction),/CONSUMED/);
 assert.throws(()=>authorizeInvestigation(x.s,'owner','king',{id:'mission',instruction}),/EXISTS/);
 }finally{x.done();}});
test('commissioning returns durable evidence, rejects replay and write/unbounded jobs before execution',async()=>{const x=setup();let reads=0;try{
 authorizeInvestigation(x.s,'owner','king',{id:'mission',instruction});const grant=claimInvestigation(x.s,'owner','r',instruction)!;
 const i=new PillowInvestigation(x.s,'owner',grant,new ReadAcquirer(x.s,async()=>{reads++;return new Response('[]');}));
 await assert.rejects(i.execute({jobs:[{...plan.jobs[0],capabilities:['amazon.publish']}]},1),/AUTHORIZED/);
 await assert.rejects(i.execute({jobs:plan.jobs.map(j=>({...j,requestLimit:12}))},1),/BOUND/);assert.equal(reads,0);
 const result=await i.execute(plan,1);assert.equal(reads,1);assert.ok(result.jobs.every(j=>j.status==='COMPLETED'&&j.requester==='PILLOW:r'));assert.equal(result.evidence.length,2);assert.equal(x.s.jobs('owner').length,2);
 await assert.rejects(i.execute(plan,1),/CONSUMED/);assert.equal(reads,1);
 i.complete('Evidence remains insufficient',{requestKey:'accounted'});const row=new IntelligenceStore(x.s.filename).get('owner','investigations','mission')!;
 assert.equal(row.status,'ASSESSED_PENDING_ACCEPTANCE');assert.equal(row.assessment.evidenceIds.length,2);
 }finally{x.done();}});
const context:any={manifest:{task:'general',repositoryFingerprint:'fixture',paths:[],artifactIds:[]},slices:[],intelligenceSnapshot:{currentMission:null,journeyPosition:null,healthScore:0,healthIssueCount:0}};
const args:any={operationalContext:context,userMessage:instruction,reasoningOnly:true,workspaceId:'owner',correlationId:'one',constitutionalGateAttestation:{passed:true}};
const response=(content:string)=>({provider:'openai' as const,model:'test',content,usage:{promptTokens:3,completionTokens:4,totalTokens:7},provenance:{capability:'reasoning',requestKey:'key',attempts:[]}});
const envelope=JSON.stringify({readOnlyCalls:[{name:'investigate',arguments:plan}]});
test('CEO engine consumes two receipt rounds and aggregates all three accounted calls',async()=>{let calls=0,rounds=0;const keys:string[]=[];
 const engine=new OpenAIIntegrationLayer({listAvailableProviders:()=>['openai'],complete:async r=>{keys.push(r.correlationId);calls++;if(calls>1)assert.match(r.messages.at(-1)!.content,/durable-evidence/);return response(calls<3?envelope:'Assessed durable-evidence: no qualified product.');}});
 const out=await engine.complete({...args,investigation:{context:{},execute:async(_p:unknown,round:number)=>{assert.equal(round,++rounds);return {id:'durable-evidence'};}}});
 assert.equal(calls,3);assert.equal(rounds,2);assert.equal(out.usage?.totalTokens,21);assert.equal(out.provenance?.consultations?.length,3);assert.deepEqual(keys,['one','one:investigation:1','one:investigation:2']);assert.match(out.content,/no qualified product/);
});
test('ordinary reasoning cannot investigate; proposal-only and third tool round fail closed',async()=>{
 let tools=0,calls=0;const tool=async()=>{tools++;return {};};const engine=new OpenAIIntegrationLayer({listAvailableProviders:()=>['openai'],complete:async()=>{calls++;return response(envelope);}});
 await assert.rejects(engine.complete(args),/proposal refused/);assert.equal(tools,0);
 calls=0;await assert.rejects(engine.complete({...args,investigation:{context:{},execute:tool}}),/completed evidence assessment/);assert.equal(calls,3);assert.equal(tools,2);
 const prose=new OpenAIIntegrationLayer({listAvailableProviders:()=>['openai'],complete:async()=>response('I propose research')});await assert.rejects(prose.complete({...args,investigation:{context:{},execute:tool}}),/completed evidence assessment/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
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
test('failed investigation is durably terminal and cannot replay its grant',()=>{const x=setup();try{
 authorizeInvestigation(x.s,'owner','king',{id:'failed-mission',instruction});const grant=claimInvestigation(x.s,'owner','failed-request',instruction)!;
 const investigation=new PillowInvestigation(x.s,'owner',grant);investigation.observe('rejected provider-authored plan',0,{requestKey:'recorded-call'});investigation.fail(new Error('private untrusted diagnostic'));
 const row=new IntelligenceStore(x.s.filename).get('owner','investigations','failed-mission')!;
 assert.equal(row.modelSteps[0].content,'rejected provider-authored plan');assert.equal(row.status,'FAILED');assert.equal(row.failure.stage,'COMMISSIONING');assert.equal(row.failure.requestId,'failed-request');assert.ok(!JSON.stringify(row.failure).includes('private'));
 assert.throws(()=>claimInvestigation(x.s,'owner','new-request',instruction),/CONSUMED/);
 }finally{x.done();}});
test('commissioning returns durable evidence, rejects replay and write/unbounded jobs before execution',async()=>{const x=setup();let reads=0;try{
 authorizeInvestigation(x.s,'owner','king',{id:'mission',instruction});const grant=claimInvestigation(x.s,'owner','r',instruction)!;
 const i=new PillowInvestigation(x.s,'owner',grant,new ReadAcquirer(x.s,async()=>{reads++;return new Response('[]');}));
 await assert.rejects(i.execute({jobs:[{...plan.jobs[0],capabilities:['amazon.publish']}]},1),/AUTHORIZED/);
 await assert.rejects(i.execute({jobs:plan.jobs.map(j=>({...j,requestLimit:12}))},1),/BOUND/);assert.equal(reads,0);
 await assert.rejects(i.execute({jobs:[{...plan.jobs[0],subject:{...plan.jobs[0]!.subject,query:'x'.repeat(121)}}]},1),/120/);assert.equal(reads,0);assert.equal(x.s.jobs('owner').length,0);
 const result=await i.execute(plan,1);assert.equal(reads,1);assert.ok(result.jobs.every(j=>j.status==='COMPLETED'&&j.requester==='PILLOW:r'));assert.equal(result.evidence.length,2);assert.equal(x.s.jobs('owner').length,2);
 await assert.rejects(i.execute(plan,1),/CONSUMED/);assert.equal(reads,1);
 i.complete('Evidence remains insufficient',{requestKey:'accounted'});const row=new IntelligenceStore(x.s.filename).get('owner','investigations','mission')!;
 assert.equal(row.status,'ASSESSED_PENDING_ACCEPTANCE');assert.equal(row.assessment.evidenceIds.length,2);
 }finally{x.done();}});
const context:any={manifest:{task:'general',repositoryFingerprint:'fixture',paths:[],artifactIds:[]},slices:[],intelligenceSnapshot:{currentMission:null,journeyPosition:null,healthScore:0,healthIssueCount:0}};
const args:any={operationalContext:context,userMessage:instruction,reasoningOnly:true,workspaceId:'owner',correlationId:'one',constitutionalGateAttestation:{passed:true}};
const response=(content:string)=>({provider:'openai' as const,model:'test',content,usage:{promptTokens:3,completionTokens:4,totalTokens:7},provenance:{capability:'reasoning',requestKey:'key',attempts:[]}});
const envelope=JSON.stringify({jobs:plan.jobs,answer:''});
const assessment=JSON.stringify({jobs:[],answer:'Assessed durable-evidence: no qualified product.'});
test('CEO engine consumes two receipt rounds and aggregates all three accounted calls',async()=>{let calls=0,rounds=0;const keys:string[]=[];
 const engine=new OpenAIIntegrationLayer({listAvailableProviders:()=>['openai'],complete:async r=>{keys.push(r.correlationId);calls++;assert.equal(r.investigationPhase,['plan','review','assessment'][calls-1]);if(calls>1)assert.match(r.messages.at(-1)!.content,/durable-evidence/);return response(calls<3?envelope:assessment);}});
 const out=await engine.complete({...args,investigation:{context:{},execute:async(_p:unknown,round:number)=>{assert.equal(round,++rounds);return {id:'durable-evidence'};}}});
 assert.equal(calls,3);assert.equal(rounds,2);assert.equal(out.usage?.totalTokens,21);assert.equal(out.provenance?.consultations?.length,3);assert.deepEqual(keys,['one','one:investigation:1','one:investigation:2']);assert.match(out.content,/no qualified product/);
});
test('ordinary reasoning cannot investigate; proposal-only and third tool round fail closed',async()=>{
 let tools=0,calls=0;const tool=async()=>{tools++;return {};};const engine=new OpenAIIntegrationLayer({listAvailableProviders:()=>['openai'],complete:async()=>{calls++;return response(envelope);}});
 const ordinary=new OpenAIIntegrationLayer({listAvailableProviders:()=>['openai'],complete:async()=>response(JSON.stringify({readOnlyCalls:[{name:'investigate',arguments:plan}]}))});await assert.rejects(ordinary.complete(args),/proposal refused/);assert.equal(tools,0);
 calls=0;await assert.rejects(engine.complete({...args,investigation:{context:{},execute:tool}}),/completed evidence assessment/);assert.equal(calls,3);assert.equal(tools,2);
 let observed='';const prose=new OpenAIIntegrationLayer({listAvailableProviders:()=>['openai'],complete:async()=>response('I propose research')});await assert.rejects(prose.complete({...args,investigation:{context:{},execute:tool,observe:(content:string)=>{observed=content;}}}),/output contract/);assert.equal(observed,'I propose research');
});
test('authenticated successor reconciles failed mission and closure requires durable response and all four Eyes',async()=>{
 const {default:Fastify}=await import('fastify');const {registerIntelligence}=await import('../../intelligence/routes.js');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'investigation-route-'));fs.mkdirSync(path.join(dir,'commissioning'));
 const prior={...process.env};Object.assign(process.env,{RAILWAY_VOLUME_MOUNT_PATH:dir,EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',INTELLIGENCE_ENABLED:'false'});
 const s=new IntelligenceStore(path.join(dir,'commissioning','intelligence.sqlite'));
 const transcript=new DatabaseSync(path.join(dir,'commissioning','pillow-reasoning.sqlite'));transcript.exec('CREATE TABLE transcripts(workspace TEXT,session TEXT,updated TEXT,turns TEXT)');transcript.close();
 const receipts=new DatabaseSync(path.join(dir,'commissioning','pillow-request-receipts.sqlite'));receipts.exec('CREATE TABLE receipts(workspace TEXT,request TEXT,updated TEXT,body TEXT)');
 const failed={requestId:'pcr_failed_fixture',workspaceId:'ws_empire_1',sessionId:'session',status:'FAILED_FATAL',failureClass:'BRAIN_FATAL',finalResult:null};const original=JSON.stringify(failed);
 receipts.prepare('INSERT INTO receipts VALUES(?,?,?,?)').run('ws_empire_1',failed.requestId,'2026-10-01',original);
 authorizeInvestigation(s,'ws_empire_1','king',{id:'prior',instruction});claimInvestigation(s,'ws_empire_1',failed.requestId,instruction);
 const app=Fastify();registerIntelligence(app,async(r,p)=>{if(r.headers.authorization!=='Bearer fixture')return p.code(401).send({error:'owner'});r.user={id:'king',workspaceId:'ws_empire_1',role:'founder'} as any;});
 const send=(payload:unknown)=>app.inject({method:'POST',url:'/api/owner/advisor/intelligence',headers:{authorization:'Bearer fixture'},payload:payload as any});
 try{
  assert.equal((await app.inject({method:'POST',url:'/api/owner/advisor/intelligence',payload:{action:'investigation',grant:{id:'next',instruction}}})).statusCode,401);
  assert.equal((await send({action:'investigation',grant:{id:'next',instruction:instruction+' A distinct follow-up.',predecessors:[failed.requestId]}})).statusCode,200);
  assert.equal(s.get('ws_empire_1','investigations','prior')!.status,'FAILED');assert.equal(receipts.prepare('SELECT body FROM receipts WHERE request=?').get(failed.requestId)?.body,original);
  const grant=claimInvestigation(s,'ws_empire_1','pcr_complete_fixture',instruction+' A distinct follow-up.')!;const answer='Evidence insufficient; no product commercially qualified.';
  const row=s.get('ws_empire_1','investigations','next')!;row.rounds=[{status:'RECORDED',deliveredEvidenceIds:['market','supplier','internet','empire']}];s.put('ws_empire_1','investigations','next',row);new PillowInvestigation(s,'ws_empire_1',grant).complete(answer,{requestKey:'accounted'});
  receipts.prepare('INSERT INTO receipts VALUES(?,?,?,?)').run('ws_empire_1','pcr_complete_fixture','2026-10-02',JSON.stringify({requestId:'pcr_complete_fixture',workspaceId:'ws_empire_1',sessionId:'session',status:'COMPLETED',finalResult:{message:answer}}));
  const close={action:'close_investigation',id:'next',advisorRequestId:'pcr_complete_fixture',assessmentHash:s.get('ws_empire_1','investigations','next')!.assessment.sha256};
  assert.equal((await send(close)).statusCode,400);
  for(const eye of ['MARKET','SUPPLIER','INTERNET','EMPIRE'])s.put('ws_empire_1','evidence',eye.toLowerCase(),{id:eye.toLowerCase(),eye,authenticity:eye==='EMPIRE'?'INTERNAL_UNVERIFIED':'LIVE_PROVIDER'});
  assert.equal((await send({...close,assessmentHash:'0'.repeat(64)})).statusCode,400);assert.equal((await send(close)).statusCode,200);
  assert.equal(s.get('ws_empire_1','investigations','next')!.status,'COMPLETE');const old=s.get('ws_empire_1','investigations','prior')!;assert.equal(old.status,'FAILED');assert.equal(old.resolution.missionId,'next');assert.equal(receipts.prepare('SELECT body FROM receipts WHERE request=?').get(failed.requestId)?.body,original);
 }finally{await app.close();receipts.close();for(const k of Object.keys(process.env))if(!(k in prior))delete process.env[k];Object.assign(process.env,prior);fs.rmSync(dir,{recursive:true,force:true});}
});

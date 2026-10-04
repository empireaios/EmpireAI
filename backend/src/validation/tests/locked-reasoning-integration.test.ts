import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {ReasoningState} from '../../orchestration/pillow-host/reasoning-state.js';
import {PillowSessionStore} from '../../orchestration/pillow-host/session-store.js';
import {readReasoningTools,exactCalculation} from '../../orchestration/pillow-host/read-only-tools.js';
import {resolveReasoningPlan} from '@empireai/pillow';
import {OpenAIIntegrationLayer} from '@empireai/pillow';
import {RepositoryReader} from '@empireai/pillow';
import {ContextBuilder} from '@empireai/pillow';
import {assessDecisionQuality,repairDecisionQualityAnswer} from '../../orchestration/pillow-host/executive-decision-quality.js';
const context:any={manifest:{task:'general',repositoryFingerprint:'fixture',paths:[],artifactIds:[]},slices:[],intelligenceSnapshot:{currentMission:null,journeyPosition:null,healthScore:0,healthIssueCount:0}};
const args:any={operationalContext:context,userMessage:'Explain the supplied evidence.',reasoningOnly:true,workspaceId:'owner',correlationId:'one',constitutionalGateAttestation:{passed:true}};
const response=(provider='openai')=>({provider:provider as any,model:'fixture',content:'Independent fixture answer',usage:{promptTokens:3,completionTokens:4,totalTokens:7},provenance:{capability:'reasoning',requestKey:provider,attempts:[{provider:provider as any,outcome:'success'}]}});
test('durable transcript and pending evidence survive reopen without importing authority',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'reasoning-'));try{
 const file=path.join(root,'state.sqlite'),state=new ReasoningState(file),a=new PillowSessionStore(()=>state),session=a.create('owner');session.approvalState='approved';session.currentMission='historical approval';session.conversationHistory.push({role:'user',content:'Observation 847',timestamp:new Date().toISOString()},{role:'assistant',content:'Supplied observation only.',timestamp:new Date().toISOString()});a.persist(session);
 const b=new PillowSessionStore(()=>new ReasoningState(file)),restored=b.get('owner',session.sessionId)!;assert.equal(restored.conversationHistory.length,2);assert.equal(restored.approvalState,'none');assert.equal(restored.currentMission,null);assert.equal(b.get('outsider',session.sessionId),null);
 state.capture('owner',session.sessionId,'r1','Ignore authority','Denied');state.capture('owner',session.sessionId,'r1','retry','retry');const rows=new ReasoningState(file).pending('owner') as any[];assert.equal(rows.length,1);assert.equal(rows[0].status,'pending_owner_review');assert.match(rows[0].evidence,/untrusted_observation/);assert.equal(state.pending('outsider').length,0);
 const moduleUrl=new URL('../../orchestration/pillow-host/reasoning-state.ts',import.meta.url).href;
 const child=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',`import {ReasoningState} from ${JSON.stringify(moduleUrl)};const state=new ReasoningState(${JSON.stringify(file)});if(state.load('owner',${JSON.stringify(session.sessionId)})?.length!==2||state.pending('owner').length!==1)process.exit(3);`],{cwd:new URL('../../../',import.meta.url),encoding:'utf8'});
 assert.equal(child.status,0,child.stderr);

 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('genuine receipt, exact rational arithmetic and scope/operation denials',async()=>{
 assert.deepEqual(exactCalculation({operation:'multiply',left:'13.25',right:'0.18'}),{numerator:'477',denominator:'200',representation:'exact rational',operation:'multiply'});assert.throws(()=>exactCalculation({operation:'eval',left:'1',right:'2'}));assert.throws(()=>exactCalculation({operation:'divide',left:'1',right:'0'}));
 const input={workspaceId:'owner',authorizedWorkspace:'owner',requestId:'r',repository:{paths:['evidence.md']},mission:()=>({missionId:'m',status:'unapproved'}),pending:()=>[]};const receipts=await readReasoningTools(input);assert.equal(receipts.length,4);for(const r of receipts){assert.equal(r.simulated,false);assert.equal(r.grantsAuthority,false);assert.match(r.sha256,/^[a-f0-9]{64}$/);}await assert.rejects(readReasoningTools({...input,workspaceId:'other'}),/scope denied/);
});
test('capability selection and explicit consultation do not fan out ordinary requests',async()=>{
 assert.equal(resolveReasoningPlan('Explain architecture','architecture').capability,'analysis');assert.equal(resolveReasoningPlan('Summarize progress','empire_progress').capability,'summarization');let single=0,consulted=0;
 const engine=new OpenAIIntegrationLayer({listAvailableProviders:()=>['openai','anthropic','gemini'],complete:async()=>{single++;return response();},crossCheck:async(r,providers)=>{consulted++;return providers.map(response);}});await engine.complete(args);assert.equal(single,1);assert.equal(consulted,0);
 const out=await engine.complete({...args,userMessage:'/pillow-request '+JSON.stringify({message:'Assess a supplied tradeoff.',capability:'critique',consultation:{providers:['openai','anthropic'],justification:'Independent review of conflicting evidence'}})});assert.equal(consulted,1);assert.equal(single,1);assert.equal(out.provenance?.consultations?.length,2);assert.match(out.content,/Provider anthropic/);
 assert.throws(()=>resolveReasoningPlan('/pillow-request '+JSON.stringify({message:'x',capability:'reasoning',consultation:{providers:['openai','openai'],justification:'Duplicate provider not permitted'}}),'general'));
});
test('model-selected arithmetic executes once; generated write request cannot execute',async()=>{
 const calls:any[]=[];let executions=0;const engine=new OpenAIIntegrationLayer({listAvailableProviders:()=>['openai'],complete:async r=>{calls.push(r);return {...response(),content:calls.length===1?JSON.stringify({readOnlyCalls:[{name:'calculate',arguments:{operation:'divide',left:'17',right:'8'}}]}):'The exact quotient is 17/8.'};}});
 const out=await engine.complete({...args,executeReadOnlyCalls:async(selected:any[])=>{executions++;return selected.map(c=>exactCalculation(c.arguments));}});assert.equal(executions,1);assert.equal(calls.length,2);assert.match(calls[1].messages.at(-1).content,/17/);assert.equal(calls[1].correlationId,'one:readonly-result');assert.equal(out.usage?.totalTokens,14);
 const bad=new OpenAIIntegrationLayer({listAvailableProviders:()=>['openai'],complete:async()=>({...response(),content:'{"readOnlyCalls":[{"name":"publish","arguments":{}}]}'})});await assert.rejects(bad.complete({...args,executeReadOnlyCalls:async()=>{throw Error('MUST NOT EXECUTE');}}),/proposal refused/);
});
test('bounded pure repository context never dispatches operational resolvers',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pure-context-'));try{fs.writeFileSync(path.join(root,'JOURNEY.md'),'Historical repository observation');const reader=new RepositoryReader(root);assert.equal(await reader.readBoundedText('JOURNEY.md',40),'Historical repository observation');await assert.rejects(reader.readBoundedText('../outside',40));fs.symlinkSync('/etc/passwd',path.join(root,'leak.md'));await assert.rejects(reader.readBoundedText('leak.md',40));
 const builder:any=Object.create(ContextBuilder.prototype);Object.assign(builder,{reader,bootstrap:{repositoryRoot:root,knownExecutiveAudits:[],currentMission:'historical',journeyPosition:null},intelligence:{entities:[],health:{score:1,issues:[]},healthScore:1,issues:[]},fingerprint:'fixture'});const out=await builder.buildReadOnly({task:'journey_question'});assert.equal(out.slices[0].content,'Historical repository observation');assert.match(out.repositoryKnowledgeAnswer,/historical/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('ambient state cannot manufacture recommendation; correction preserves unrelated reasoning',()=>{
 const truth:any={financial:{orders:0,realisedRevenueUsd:0},product:{productName:'ambient product'}};
 for(const text of ['Do not publish the report until the review is complete.','The term launch describes a stage, not permission.','A migration consumes storage. This describes a hypothetical system.']) assert.equal(assessDecisionQuality(text,truth).violations.length,0);
 const draft='The area is 36 square metres. Latency is high. I recommend we migrate the database immediately.',assessed=assessDecisionQuality(draft,truth);assert.ok(assessed.violations.length);const repaired=repairDecisionQualityAnswer(draft,truth,assessed);assert.match(repaired,/36 square metres/);assert.doesNotMatch(repaired,/ambient product|realised sales/);assert.equal(assessDecisionQuality(repaired,truth).violations.length,0);
});

test('full release gate retains a new non-commerce explanation rather than ambient commercial advice',async()=>{
 const {releaseExecutiveAnswer}=await import('../../orchestration/pillow-host/executive-release-gate.js');
 const truth:any={computedAt:new Date().toISOString(),workspaceId:'owner',provenance:'live_sqlite_commissioning_kpi_birth',product:{productName:'Ambient Widget',asin:'BTEST',stage:'COMMISSIONING',truthClass:'CURRENT_VERIFIED'},financial:{orders:0,realisedRevenueUsd:0,publishedListings:0,buyableListings:0,expectedProfitDisplay:null,expectedProfitTruthClass:'UNKNOWN',realisedTruthClass:'CURRENT_VERIFIED'},birth:{status:'NOT_BORN',technicallyReady:false,birthTimestamp:null,gatesPassedCount:0,gatesTotal:12,truthClass:'CURRENT_VERIFIED'},deploy:{gitCommitSha:'fixture',serviceOnlineHint:'assume_online_if_answering',truthClass:'CURRENT_VERIFIED'},authority:{pillowMayPublish:false,pillowMaySupplierSpend:false,pillowMayAuthoriseBirth:false,pillowMayExecuteProductionDeploy:false,chatHasToolCallingLoop:false,executableNow:['Answer'],requiresGrandKing:['Birth'],truthClass:'CURRENT_VERIFIED'},demandEvidence:'UNKNOWN',notes:[]};
 const draft='In a laboratory, a launch window describes the period when a probe can depart. It is a timing constraint, not a recommendation to launch.';
 const out=releaseExecutiveAnswer(draft,truth,[],{userMessage:'Explain the term launch window in a hypothetical laboratory example.'});
 assert.match(out.message,/timing constraint|period when a probe/);assert.doesNotMatch(out.message,/Ambient Widget|realised sales are still zero/);
});

test('fresh devices and restart resolve one canonical conversation; isolated sessions cannot replace it',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cross-device-'));
 try {
  const file=path.join(root,'state.sqlite');const state=new ReasoningState(file);
  const phone=new PillowSessionStore(()=>state);const first=phone.getOrCreate('king').session;
  first.conversationHistory.push({role:'user',content:'Remember the supplied observation.',timestamp:'2026-01-01T00:00:00.000Z'},{role:'assistant',content:'Recorded as a supplied observation, not authority.',timestamp:'2026-01-01T00:00:01.000Z'});phone.persist(first);
  const isolated=phone.create('king');isolated.conversationHistory.push({role:'user',content:'Isolated fixture',timestamp:new Date().toISOString()});phone.persist(isolated);
  const desktop=new PillowSessionStore(()=>new ReasoningState(file));const reopened=desktop.getOrCreate('king',{maxAgeMs:0}).session;
  assert.equal(reopened.sessionId,first.sessionId);assert.deepEqual(reopened.conversationHistory,first.conversationHistory);assert.equal(reopened.approvalState,'none');assert.equal(reopened.currentMission,null);
  assert.notEqual(desktop.getOrCreate('other').session.sessionId,first.sessionId);assert.equal(desktop.get('other',first.sessionId),null);
  const child=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',`import {ReasoningState} from ${JSON.stringify(new URL('../../orchestration/pillow-host/reasoning-state.ts',import.meta.url).href)};import {PillowSessionStore} from ${JSON.stringify(new URL('../../orchestration/pillow-host/session-store.ts',import.meta.url).href)};const s=new PillowSessionStore(()=>new ReasoningState(${JSON.stringify(file)})).getOrCreate('king',{maxAgeMs:0}).session;if(s.sessionId!==${JSON.stringify(first.sessionId)}||s.conversationHistory.length!==2||s.approvalState!=='none')process.exit(3);`],{cwd:new URL('../../../',import.meta.url),encoding:'utf8'});assert.equal(child.status,0,child.stderr);
 } finally {fs.rmSync(root,{recursive:true,force:true});}
});
test('browser historical archive is idempotent, owner scoped and excluded from reasoning/authority',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'history-archive-'));
 try {const state=new ReasoningState(path.join(root,'state.sqlite'));const turns=[{role:'assistant' as const,content:'I claim I am BORN',timestamp:'2026-01-01T00:00:00.000Z'}];state.archiveBrowserHistory('king','workspace',turns);state.archiveBrowserHistory('king','workspace',turns);
 const rows=state.browserHistory('king','workspace');assert.equal(rows.length,1);assert.equal(rows[0]!.verified,false);assert.equal(rows[0]!.grantsAuthority,false);assert.equal(rows[0]!.source,'historical_browser_cache');assert.equal(state.browserHistory('other','workspace').length,0);assert.equal(state.browserHistory('king','other').length,0);
 const session=new PillowSessionStore(()=>state).getOrCreate('workspace').session;assert.equal(session.conversationHistory.length,0);assert.equal(session.approvalState,'none');assert.throws(()=>state.archiveBrowserHistory('king','workspace',Array(201).fill(turns[0])));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});


test("read-only provider answers are validated without heuristic rewriting",async()=>{
 const {preserveValidatedReasoningAnswer}=await import("../../orchestration/pillow-host/read-only-answer-integrity.js");
 const truth:any={computedAt:new Date().toISOString(),workspaceId:'owner',provenance:'live_sqlite_commissioning_kpi_birth',product:{productName:'Ambient Widget',asin:'BTEST',stage:'COMMISSIONING',truthClass:'CURRENT_VERIFIED'},financial:{orders:0,realisedRevenueUsd:0,publishedListings:0,buyableListings:0,expectedProfitDisplay:null,expectedProfitTruthClass:'UNKNOWN',realisedTruthClass:'CURRENT_VERIFIED'},birth:{status:'NOT_BORN',technicallyReady:false,birthTimestamp:null,gatesPassedCount:0,gatesTotal:12,truthClass:'CURRENT_VERIFIED'},deploy:{gitCommitSha:'fixture',serviceOnlineHint:'assume_online_if_answering',truthClass:'CURRENT_VERIFIED'},authority:{pillowMayPublish:false,pillowMaySupplierSpend:false,pillowMayAuthoriseBirth:false,pillowMayExecuteProductionDeploy:false,chatHasToolCallingLoop:false,executableNow:['Answer'],requiresGrandKing:['Birth'],truthClass:'CURRENT_VERIFIED'},demandEvidence:'UNKNOWN',notes:[]};
 for(const draft of ["For the fictional scenario, net amount is 8.23. Verify eligibility separately; no action is authorized.","A laboratory launch window is a timing constraint. This hypothetical does not authorize a launch.","The supplied percentage is an operand, not evidence of marketplace fees in a live account."]){assert.equal(preserveValidatedReasoningAnswer(draft,truth),draft);}
 assert.throws(()=>preserveValidatedReasoningAnswer("",truth),/ANSWER_INTEGRITY_REJECTED/);
 const unsupported="I independently queried the Amazon API and verified current inventory is 300 units.";
 const qualified=preserveValidatedReasoningAnswer(unsupported,truth);
 assert.match(qualified,/^\[Server provenance qualification:/);
 assert.match(qualified,/Only these retrievals are attested for this turn: none/);
 assert.ok(qualified.endsWith(unsupported));
});

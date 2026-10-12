import test from 'node:test';
import {portfolioHealth} from '../../runtime/commerce-runtime/governed/work8-portfolio-health.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {GovernedCommerceStore} from '../../runtime/commerce-runtime/governed/store.js';
import {GovernedCommerceEngine} from '../../runtime/commerce-runtime/governed/engine.js';
import {acceptanceScenario} from '../../runtime/commerce-runtime/governed/scenario.js';
import {canonicalFinanceSource,projectWork8Finance} from '../../runtime/commerce-runtime/governed/work8-finance.js';
import {readWork8MissionPage} from '../../runtime/commerce-runtime/governed/work8-mission-page.js';
import {activePortfolio} from '../../runtime/commerce-runtime/governed/work8-portfolio.js';
import type {Actor,Command} from '../../runtime/commerce-runtime/governed/contracts.js';

// Every source, role invocation and business outcome below is a labelled simulation.
// Software StrategyDecision is not an actual Pillow assessment or real owner decision.
test('simulated outcome review links durably to governed retirement without changing historical finance',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'portfolio-review-link-')),file=path.join(root,'commerce.sqlite');
 let now=Date.parse('2026-10-12T12:00:00Z');const at=new Date(now).toISOString();
 let store=new GovernedCommerceStore(file);let engine=new GovernedCommerceEngine(store,()=>now);
 const f=acceptanceScenario('ws','synthetic-owner',now),mission='labelled-simulation';
 const send=(actor:Actor,command:Command,id:string)=>engine.execute(actor,{id,missionId:mission,expectedVersion:store.history('ws',mission).length,command});
 try{
  for(const [i,step] of f.steps.entries()){
   if(step.command.type==='reverse_outcome')break;
   send(step.actor,step.command,'step-'+i);
   if(i===3)send(f.actors.EXECUTOR!,{type:'publication_intent',capacity:{account:'simulation',marketplace:'US',mode:'NEW_ASIN',asin:null,newAsinRemaining:10,unsoldRemaining:10,requestsPerSecond:5,eligibility:'ELIGIBLE',provenance:f.candidate.offer.provenance}},'publication');
  }
  const history=store.history('ws',mission),review=history.at(-1)!,state=review.state as any;
  assert.equal(review.command.type,'reassess');assert.equal(review.classification,'SYNTHETIC');
  assert.equal(state.decisions.at(-1).health.classification,'SOFTWARE_ADVISORY_ONLY');
  assert.equal(state.decisions.at(-1).health.grantsAuthority,false);
  assert.deepEqual([...new Set(state.decisions.at(-1).health.checks.map((x:any)=>x.evidenceId))],['outcome-30','outcome-60','outcome-90']);
  assert.deepEqual(state.decisions.at(-1).evidenceIds,['outcome-30','outcome-60','outcome-90']);
  assert.ok(state.decisions.at(-1).actions.includes('STOP_EXPANSION_REVIEW_PIVOT'));
  assert.ok(state.decisions.at(-1).actions.includes('REQUALIFY_ECONOMICS'));
  assert.equal(state.paidInference,0);assert.equal(state.externalEffects,0);
  const events=Object.entries({SALE:8000,COGS:1600,FREIGHT:600,REFUND:2000,FEE:0,DUTY:0,DISCOUNT:0}).map(([kind,minor])=>({id:'sim-'+kind,orderId:f.order.orderId,sourceReceiptDigest:review.digest,kind:kind as import('../../runtime/commerce-runtime/governed/work8-finance.js').Work8FinanceEvent['kind'],currency:'SGD',minor,at,classification:'SIMULATION' as const,assumptionRef:'Explicit synthetic zero fee/duty/discount assumptions, not provider facts'}));
  const before=projectWork8Finance(store,'ws',mission,events,at);
  assert.equal(before.orders[0]!.contributionMinor,3800);assert.equal(before.complete,true);assert.equal(before.conserved,true);
  const bad={type:'retire' as const,reason:'Labelled simulation decision linkage',reviewDecisionId:'other-mission-review'};
  assert.throws(()=>send(f.actors.OWNER!,bad,'missing-link'),/PORTFOLIO_REVIEW_DECISION_NOT_FOUND/);
  assert.throws(()=>send(f.actors.PROPOSER!,{...bad,reviewDecisionId:review.id},'forged-owner'),/PORTFOLIO_OWNER_REQUIRED/);
  assert.deepEqual(store.history('ws',mission),history);
  now+=3600000;
  assert.throws(()=>send(f.actors.OWNER!,{...bad,reviewDecisionId:review.id},'expired-link'),/PORTFOLIO_REVIEW_EVIDENCE_INVALID/);now-=3600000;
  const retireEnvelope={id:'linked-retirement',missionId:mission,expectedVersion:history.length,command:{...bad,reviewDecisionId:review.id}};
  const retirement=engine.execute(f.actors.OWNER!,retireEnvelope);
  assert.deepEqual(engine.execute(f.actors.OWNER!,retireEnvelope),retirement);
  assert.throws(()=>engine.execute(f.actors.OWNER!,{...retireEnvelope,command:{...retireEnvelope.command,reviewDecisionId:'changed'}}),/IDEMPOTENCY_CONFLICT/);
  assert.equal((retirement.state as any).retirement.reviewDecisionId,review.id);
  assert.equal(activePortfolio(store,'ws').activeCount,0);
  assert.deepEqual(projectWork8Finance(store,'ws',mission,events,at),before);
  assert.equal(canonicalFinanceSource(store,'ws',mission)!.digest,review.digest);
  assert.deepEqual(store.history('ws',mission).slice(0,-1),history);
  store.close();store=new GovernedCommerceStore(file);engine=new GovernedCommerceEngine(store,()=>now);
  const readback=readWork8MissionPage(store,'ws',{missionId:mission});
  const reopened=readback.missions[0]!.state as any;
  assert.equal(reopened.retirement.reviewDecisionId,reopened.decisions.at(-1).id);
  assert.deepEqual(reopened.decisions.at(-1).evidenceIds,['outcome-30','outcome-60','outcome-90']);
  assert.deepEqual(projectWork8Finance(store,'ws',mission,events,at),before);
  assert.equal(readWork8MissionPage(store,'other',{missionId:mission}).missions.length,0);
 }finally{store.close();fs.rmSync(root,{recursive:true,force:true});}
});

test('reversed review evidence cannot support linkage; legacy unlinked retirement remains valid',()=>{
 const store=new GovernedCommerceStore(':memory:'),now=Date.parse('2026-10-12T12:00:00Z'),engine=new GovernedCommerceEngine(store,()=>now),f=acceptanceScenario('ws','synthetic-owner',now);
 const send=(command:Command,actor=f.actors.OWNER!)=>engine.execute(actor,{id:'c'+store.history('ws','m').length,missionId:'m',expectedVersion:store.history('ws','m').length,command});
 try{
  for(const step of f.steps.slice(0,4))send(step.command,step.actor);
  send({type:'publication_intent',capacity:{account:'simulation',marketplace:'US',mode:'NEW_ASIN',asin:null,newAsinRemaining:10,unsoldRemaining:10,requestsPerSecond:5,eligibility:'ELIGIBLE',provenance:f.candidate.offer.provenance}},f.actors.EXECUTOR!);
  const outcome=f.steps.find(s=>s.command.type==='outcome')!;send(outcome.command,outcome.actor);
  const review=send({type:'reassess'},f.actors.PROPOSER!);
  engine.execute(f.actors.PROPOSER!,{id:'foreign-research',missionId:'foreign',expectedVersion:0,command:{type:'research',candidate:f.candidate}});
  engine.execute(f.actors.PROPOSER!,{id:'foreign-review',missionId:'foreign',expectedVersion:1,command:{type:'reassess'}});
  assert.throws(()=>send({type:'retire',reason:'Synthetic foreign reference',reviewDecisionId:'foreign-review'}),/PORTFOLIO_REVIEW_DECISION_NOT_FOUND/);
  send({type:'reverse_outcome',target:'outcome-30',reason:'Synthetic invalidation'});
  assert.throws(()=>send({type:'retire',reason:'Synthetic linked retirement',reviewDecisionId:review.id}),/PORTFOLIO_REVIEW_EVIDENCE_INVALID/);
  const prior=store.history('ws','m').at(-1)!;
  const retired=send({type:'retire',reason:'Legacy explicit synthetic owner choice'});
  assert.deepEqual((retired.state as any).retirement,{actor:'synthetic-owner',at:new Date(now).toISOString(),reason:'Legacy explicit synthetic owner choice'});
  assert.equal(canonicalFinanceSource(store,'ws','m')!.digest,prior.digest);
 }finally{store.close();}
});

// These use the existing outcome policy thresholds, and are deliberately not model recommendations.
test('health advisory covers six recommendation classes and exposes unknown capital',()=>{
 const f=acceptanceScenario('health','owner',Date.parse('2026-10-12T12:00:00Z'));
 const step=f.steps.find(x=>x.command.type==='outcome')!;
 if(step.command.type!=='outcome')throw Error('fixture missing');
 const good={...step.command.outcome,sales:1,conversion:0.05,margin:10,stockouts:0,deliveryFailures:0,returns:0,restricted:false,cash:100};
 assert.deepEqual(portfolioHealth([good],10).recommendations,['RETAIN']);
 assert.equal(portfolioHealth([good],10).score,100);
 assert.deepEqual(portfolioHealth([],10).recommendations,['OBSERVE']);
 assert.equal(portfolioHealth([],10).score,null);
 const unknown=portfolioHealth([{...good,cash:null}],10);
 assert.equal(unknown.unknownChecks,1);assert.equal(unknown.checks.find(x=>x.check==='capital')!.passed,null);
 assert.deepEqual(unknown.recommendations,['OBSERVE']);
 const bad=portfolioHealth([{...good,sales:0,days:90,conversion:0,margin:-1,stockouts:1,restricted:true}],10);
 assert.deepEqual(new Set(bad.recommendations),new Set(['OBSERVE','IMPROVE','PAUSE','RETIRE','REPLACE']));
 assert.ok(bad.score!<100);assert.equal(bad.grantsAuthority,false);
});

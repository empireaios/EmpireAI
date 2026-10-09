import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {operatingScopeDisposition,scopeHistoryCompatible} from '../../assurance/operating-scope.mjs';import {AssuranceControlPlane} from '../../assurance/control-plane.mjs';import {currentMissionDomains} from '../../assurance/closure-health.mjs';
const now=200000000,iso=n=>new Date(n).toISOString();
function context(){return {profile:'LOCKED_COMMISSIONING_V1',observedAt:now,coverage:{due:now-100000,receipt:{checks:Object.fromEntries(currentMissionDomains.map(d=>[d,{status:'PASS',...(d==='pillow-omissions'?{inventory:{complete:true,pending:0}}:{})}]))}}};}
function provider(){return {id:'provider_configuration',capability:'provider_configuration',classification:'provider_configuration',status:'DEGRADED',summary:'Passive provider receipts; current generation unverified',evidence:{providers:['openai','anthropic','gemini'].map(provider=>({provider,evidenceId:'retained-'+provider,observedAt:iso(now-86400000),retainedResponseVerified:true,status:'DEGRADED',reason:'FUNCTIONAL_EVIDENCE_STALE'}))}};}
function fourEyes(){const c=context();c.schedules=[['amazon.account',86400000],['amazon.catalog',21600000],['cj.catalog',21600000],['internet.safety',86400000],['empire.state',900000]].map(([id,intervalMs])=>({id,intervalMs,enabled:true,lastQueuedAt:iso(now-600000)}));c.activeJobs=0;c.uncertainJobs=0;c.keepa={decision:'PROPOSED',blocksCoreClosure:false};
 const evidence=c.schedules.map(s=>({id:s.id,status:'HEALTHY',lastGoodAt:iso(now-600000),failure:null}));
 for(const id of ['amazon.offers','amazon.fees','amazon.restrictions','cj.detail','cj.stock','cj.freight','internet.research'])evidence.push({id,status:'DEGRADED',reason:'EVIDENCE_STALE',lastGoodAt:iso(now-86400000),failure:null});
 for(const id of ['amazon.requirements','amazon.orders','amazon.advertising','amazon.opportunity','internet.trends','internet.reviews'])evidence.push({id,status:'NOT_CHECKED',reason:'MONITOR_NOT_IMPLEMENTED',failure:null});
 evidence.push({id:'amazon.analytics',status:'EXTERNALLY_BLOCKED',reason:'PROVIDER_ACCESS_UNAVAILABLE',failure:'HTTP_403'},{id:'keepa.history',status:'EXTERNALLY_BLOCKED',reason:'PROVIDER_NOT_CONFIGURED'});
 return {c,p:{id:'four_eyes_reads',capability:'four_eyes_reads',classification:'four_eyes_reads',status:'DEGRADED',summary:'Recorded capability evidence, not commerce certification',evidence}};
}
test('scope disposition preserves stale provider truth and requires all mandatory independent coverage',()=>{
 const p=provider(),c=context();assert.equal(operatingScopeDisposition(p,c,now).work8Certified,false);assert.equal(p.status,'DEGRADED');
 for(const domain of currentMissionDomains){const bad=structuredClone(c);bad.coverage.receipt.checks[domain].status='NOT_CHECKED';assert.equal(operatingScopeDisposition(p,bad,now),null);}
 for(const change of [{profile:'BORN'},{observedAt:now+1},{observedAt:now-90001},{coverage:{due:now}}])assert.equal(operatingScopeDisposition(p,{...c,...change},now),null);
 for(const pending of [1,undefined]){const bad=structuredClone(c);bad.coverage.receipt.checks['pillow-omissions'].inventory.pending=pending;assert.equal(operatingScopeDisposition(p,bad,now),null);}
 for(const change of [{retainedResponseVerified:false},{status:'FAILED'},{reason:'LATEST_CALL_NOT_VERIFIED_COMPLETE'},{observedAt:iso(now+1)},{evidenceId:null}]){const bad=structuredClone(p);Object.assign(bad.evidence.providers[0],change);assert.equal(operatingScopeDisposition(bad,c,now),null);}
 assert.equal(operatingScopeDisposition({...p,id:'other',capability:'other'},c,now),null);
});
test('Four Eyes uses actual recurring cadence while keeping optional and old facts unverified',()=>{
 const {p,c}=fourEyes();assert.ok(operatingScopeDisposition(p,c,now));
 const account=p.evidence.find(r=>r.id==='amazon.account');account.status='DEGRADED';account.reason='EVIDENCE_STALE';account.lastGoodAt=iso(now-12*3600000);assert.ok(operatingScopeDisposition(p,c,now));assert.equal(account.status,'DEGRADED');
 account.lastGoodAt=iso(now-86400000-120001);assert.equal(operatingScopeDisposition(p,c,now),null);
 for(const edit of [x=>x.c.activeJobs=1,x=>x.c.uncertainJobs=1,x=>x.c.keepa.blocksCoreClosure=true,x=>x.c.schedules.pop(),x=>x.c.schedules[0].enabled=false,x=>x.c.schedules[0].lastQueuedAt=iso(now-86400000-120001),x=>x.p.evidence.pop(),x=>x.p.evidence[0].failure='ACQUISITION_FAILED',x=>x.p.evidence.find(r=>r.id==='cj.detail').status='FAILED',x=>x.p.evidence.find(r=>r.id==='amazon.analytics').failure='INVALID_PROVIDER_SHAPE']){const x=fourEyes();edit(x);assert.equal(operatingScopeDisposition(x.p,x.c,now),null);}
});
test('authorized scope reconciliation is durable, preserves original HIGH history, and never resolves uncertain effects',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'scope-lifecycle-'));let cp=new AssuranceControlPlane({root,revision:'old',now:()=>now});
 try{const p=provider();const old=cp.observe('ws',p);await cp.tick('ws');const before=cp.get('ws','incident',old.id);cp.close();cp=new AssuranceControlPlane({root,revision:'new',now:()=>now+1});
 cp.observe('ws',{...p,scopeContext:context()});const closed=cp.get('ws','incident',old.id);assert.equal(closed.status,'CLOSED');assert.equal(closed.severity,'HIGH');for(const k of ['fingerprint','firstAt','lastAt','revision','attempts'])assert.equal(closed[k],before[k]);assert.equal(closed.verifiedAt,undefined);assert.equal(cp.get('ws','probe',p.id).status,'DEGRADED');assert.ok(cp.snapshot('ws').events.some(e=>e.type==='INCIDENT_SCOPE_RECONCILED'));
 const failure=cp.observe('ws',{...p,status:'FAILED'});assert.equal(failure.status,'DETECTED');cp.put('ws','recovery','uncertain',{id:'uncertain',incidentId:failure.id,status:'UNKNOWN'});cp.observe('ws',{...p,scopeContext:context()});assert.equal(cp.get('ws','incident',failure.id).status,'DETECTED');
 cp.close();cp=new AssuranceControlPlane({root,revision:'new',now:()=>now+2});assert.equal(cp.get('ws','incident',old.id).status,'CLOSED');assert.equal(cp.get('ws','incident',failure.id).status,'DETECTED');
 }finally{cp.close();fs.rmSync(root,{recursive:true,force:true});}
});
test('lease and pause retain incident fencing; actual failures remain blocking',()=>{
 for(const setting of ['lease','pause']){const root=fs.mkdtempSync(path.join(os.tmpdir(),'scope-fence-'));const cp=new AssuranceControlPlane({root,revision:'r',now:()=>now});try{const p=provider(),i=cp.observe('ws',p);if(setting==='lease')cp.put('ws','lease','production',{status:'ACTIVE'});else cp.put('ws','setting','pause',{paused:true});cp.observe('ws',{...p,scopeContext:context()});assert.notEqual(cp.get('ws','incident',i.id).status,'CLOSED');}finally{cp.close();fs.rmSync(root,{recursive:true,force:true});}}
});

 test('historical actual failures require later bound functional evidence, not merely a new scope',()=>{
 const p=provider();const event={at:now-1000,body:{probe:{...p,status:'FAILED'}}};
 assert.equal(scopeHistoryCompatible([event],p),false);
 const bad=provider();bad.evidence.providers[0].reason='LATEST_CALL_NOT_VERIFIED_COMPLETE';
 const history=[{at:now-1000,body:{probe:bad}}];assert.equal(scopeHistoryCompatible(history,p),false);
 p.evidence.providers[0].observedAt=iso(now-500);assert.equal(scopeHistoryCompatible(history,p),true);
 p.evidence.providers[0].retainedResponseVerified=false;assert.equal(scopeHistoryCompatible(history,p),false);
 assert.equal(scopeHistoryCompatible([],p),false);assert.equal(scopeHistoryCompatible(Array(5001).fill(event),p),false);
 });

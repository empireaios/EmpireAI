import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createHash} from 'node:crypto';import {DatabaseSync} from 'node:sqlite';
import {historicalGemini as policy,historicalProviderDisposition,historicalProviderHistoryCompatible} from '../../assurance/historical-provider.mjs';
import {readProviderHealth} from '../../assurance/provider-health.mjs';
import {AssuranceControlPlane} from '../../assurance/control-plane.mjs';
import {currentMissionDomains} from '../../assurance/closure-health.mjs';
import {operatingScopeDisposition,scopeHistoryCompatible} from '../../assurance/operating-scope.mjs';
const w=policy.workspace,now=Date.parse('2026-10-09T16:30:00Z');
const key=createHash('sha256').update(w+'\0'+policy.requestId).digest('hex');
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'historical-provider-')),file=path.join(root,'ledger.sqlite'),db=new DatabaseSync(file);
 db.exec('CREATE TABLE calls(id TEXT PRIMARY KEY,timestamp TEXT,model TEXT,reserved_micro_usd INTEGER,status TEXT,usage_json TEXT,estimated_micro_usd INTEGER,provider_response_id TEXT,invoice_actual_micro_usd INTEGER); CREATE TABLE call_providers(call_id TEXT PRIMARY KEY,provider TEXT,request_key TEXT); CREATE TABLE inference_requests(id TEXT PRIMARY KEY,timestamp TEXT); PRAGMA application_id=1162430793; PRAGMA user_version=1;');
 db.prepare('INSERT INTO calls VALUES(?,?,?,?,?,?,?,?,?)').run(policy.callId,policy.timestamp,policy.model,policy.reservedMicroUsd,'failed_uncertain',null,null,null,null);
 db.prepare('INSERT INTO call_providers VALUES(?,?,?)').run(policy.callId,'gemini',key);
 db.prepare('INSERT INTO inference_requests VALUES(?,?)').run(key,'2026-10-02T11:17:14.750Z');
 for(const p of ['openai','anthropic']){db.prepare('INSERT INTO calls VALUES(?,?,?,?,?,?,?,?,?)').run(p,'2026-10-02T08:00:00.000Z','model',100,'usage_recorded',JSON.stringify({inputTokens:1,outputTokens:1,totalTokens:2}),10,p,null);db.prepare('INSERT INTO call_providers VALUES(?,?,?)').run(p,p,p);}
 const row=db.prepare('SELECT c.*,p.provider,p.request_key FROM calls c JOIN call_providers p ON p.call_id=c.id WHERE c.id=?').get(policy.callId),{usage_json,...record}=row;
 const route={schema:'locked-inference-operator-readback-v1',at:'2026-10-02T11:17:59.000Z',requestKey:key,capability:'summarization',attempts:[{provider:'gemini',model:policy.model,outcome:'temporary_refusal',httpStatus:503}],records:[{...record,usage:null,reservationReleased:false}],heldMicroUsd:policy.reservedMicroUsd+200};
 const routeFile=file+'.route-'+key+'.json';fs.writeFileSync(routeFile,JSON.stringify(route));fs.writeFileSync(file+'.initialized','original marker');
 const context={profile:'LOCKED_COMMISSIONING_V1',observedAt:now,coverage:{due:now-1000,receipt:{checks:Object.fromEntries(currentMissionDomains.map(d=>[d,{status:'PASS',...(d==='pillow-omissions'?{inventory:{complete:true,pending:0}}:{})}]))}}};
 const probe=()=>{const evidence=readProviderHealth(file,['openai','anthropic','gemini'],now);return {id:'provider_configuration',capability:'provider_configuration',classification:'provider_configuration',status:evidence.status,summary:'Passive receipts',evidence,scopeContext:context};};
 return {root,file,db,route,routeFile,context,probe,cleanup(){db.close();fs.rmSync(root,{recursive:true,force:true});}};
}
test('exact retained refusal is classified uncertain; original full reservation and evidence remain unchanged',()=>{
 const f=fixture();try{const before=fs.readFileSync(f.file),routeBefore=fs.readFileSync(f.routeFile),p=f.probe(),d=historicalProviderDisposition(w,p,f.context,now);
 assert.equal(d.disposition,'ADMINISTRATIVELY_RESOLVED_HISTORICAL_FAILURE');assert.equal(d.proof.classification,'C_UNCERTAIN_PROVIDER_EXECUTION_OR_FINANCIAL_SETTLEMENT');assert.equal(d.proof.ledger.reserved_micro_usd,288479);
 for(const field of ['providerSuccess','invoiceVerified','reservationReleased'])assert.equal(d[field],false);
 assert.equal(d.financialSettlement,'UNCERTAIN');assert.equal(d.currentProviderHealth,'UNVERIFIED');assert.equal(p.status,'DEGRADED');
 assert.equal(operatingScopeDisposition(p,f.context,now),null);assert.equal(scopeHistoryCompatible([{at:now,body:{probe:p}}],p),false);
 assert.deepEqual(fs.readFileSync(f.file),before);assert.deepEqual(fs.readFileSync(f.routeFile),routeBefore);
 }finally{f.cleanup();}
});
test('missing, corrupt, mismatched, settled, released or unbound historical sources cannot authorize disposition',()=>{
 const mutations=[
 f=>fs.unlinkSync(f.routeFile),f=>fs.writeFileSync(f.routeFile,'invalid'),
 f=>{fs.renameSync(f.routeFile,f.routeFile+'.target');fs.symlinkSync(f.routeFile+'.target',f.routeFile);},
 f=>f.db.prepare('DELETE FROM inference_requests').run(),
 f=>f.db.prepare('UPDATE calls SET reserved_micro_usd=1 WHERE id=?').run(policy.callId),
 f=>f.db.prepare("UPDATE calls SET status='usage_recorded' WHERE id=?").run(policy.callId),
 f=>f.db.prepare('UPDATE calls SET invoice_actual_micro_usd=0 WHERE id=?').run(policy.callId),
 f=>{f.route.attempts[0].httpStatus=200;fs.writeFileSync(f.routeFile,JSON.stringify(f.route));},
 f=>{f.route.records[0].reservationReleased=true;fs.writeFileSync(f.routeFile,JSON.stringify(f.route));},
 f=>{f.route.records[0].id='other';fs.writeFileSync(f.routeFile,JSON.stringify(f.route));},
 f=>{f.route.requestKey='other';fs.writeFileSync(f.routeFile,JSON.stringify(f.route));},
 ];
 for(const mutate of mutations){const f=fixture();try{mutate(f);const p=f.probe();assert.equal(historicalProviderDisposition(w,p,f.context,now),null);}finally{f.cleanup();}}
});
test('all seven current monitoring domains, omission completeness and current source truth remain mandatory',()=>{
 const f=fixture();try{for(const domain of currentMissionDomains){const c=structuredClone(f.context);c.coverage.receipt.checks[domain].status='FAIL';assert.equal(historicalProviderDisposition(w,f.probe(),c,now),null);}
 for(const edit of [c=>c.coverage.receipt.checks['pillow-omissions'].inventory.pending=1,c=>c.coverage.receipt.checks['pillow-omissions'].inventory.complete=false,c=>c.observedAt=now-90001,c=>c.coverage.due=now-420001,c=>c.profile='BORN']){const c=structuredClone(f.context);edit(c);assert.equal(historicalProviderDisposition(w,f.probe(),c,now),null);}
 for(const edit of [p=>p.evidence.providers.pop(),p=>p.evidence.providers[0].reason='LATEST_CALL_NOT_VERIFIED_COMPLETE',p=>p.evidence.providers[0].status='FAILED',p=>p.status='FAILED',p=>p.evidence.providers[2].evidenceId='new-call']){const p=f.probe();edit(p);assert.equal(historicalProviderDisposition(w,p,f.context,now),null);}
 assert.equal(historicalProviderDisposition('other-workspace',f.probe(),f.context,now),null);
 }finally{f.cleanup();}
});
test('administrative lifecycle retains immutable HIGH incident identity and history; new genuine failure creates a blocking incident',()=>{
 const f=fixture();let cp=new AssuranceControlPlane({root:f.root,revision:'old',now:()=>now});try{
 const p=f.probe(),i=cp.observe(w,{...p,scopeContext:undefined}),before=cp.get(w,'incident',i.id);
 const events=cp.db.prepare('SELECT * FROM cp_events ORDER BY seq').all();cp.close();cp=new AssuranceControlPlane({root:f.root,revision:'new',now:()=>now+1});cp.observe(w,p);
 const closed=cp.get(w,'incident',i.id);assert.equal(closed.status,'CLOSED');assert.equal(closed.severity,'HIGH');assert.equal(closed.verifiedAt,undefined);
 for(const k of ['id','fingerprint','firstAt','lastAt','revision','recurrence','attempts'])assert.equal(closed[k],before[k]);
 assert.deepEqual(cp.db.prepare('SELECT * FROM cp_events WHERE seq<=? ORDER BY seq').all(events.at(-1).seq),events);
 assert.throws(()=>cp.db.prepare('DELETE FROM cp_events').run(),/IMMUTABLE_EVENT/);
 assert.equal(cp.get(w,'probe',p.id).status,'DEGRADED');assert.equal(cp.snapshot(w).summary.activeIncidents,0);
 f.db.prepare('INSERT INTO calls VALUES(?,?,?,?,?,?,?,?,?)').run('new-failure','2026-10-09T16:29:00.000Z',policy.model,100,'failed_uncertain',null,null,null,null);f.db.prepare('INSERT INTO call_providers VALUES(?,?,?)').run('new-failure','gemini','new-request');
 const failure=cp.observe(w,f.probe());assert.equal(failure.status,'DETECTED');assert.notEqual(failure.id,i.id);assert.equal(failure.severity,'HIGH');assert.equal(cp.snapshot(w).summary.activeIncidents,1);
 assert.equal(f.db.prepare('SELECT reserved_micro_usd FROM calls WHERE id=?').get(policy.callId).reserved_micro_usd,288479);
 }finally{cp.close();f.cleanup();}
});
test('unknown recoveries, historical current faults, incomplete history, release leases and pause remain blocking',()=>{
 for(const mode of ['UNKNOWN','RUNNING','history','lease','pause']){const f=fixture(),cp=new AssuranceControlPlane({root:f.root,revision:'r',now:()=>now});try{
 const p=f.probe(),old=structuredClone(p);delete old.scopeContext;if(mode==='history')old.evidence.providers[0].reason='LATEST_CALL_NOT_VERIFIED_COMPLETE';const i=cp.observe(w,old);
 if(['UNKNOWN','RUNNING'].includes(mode))cp.put(w,'recovery','r',{id:'r',incidentId:i.id,status:mode});
 if(mode==='lease')cp.put(w,'lease','production',{status:'ACTIVE'});if(mode==='pause')cp.put(w,'setting','pause',{paused:true});
 cp.observe(w,p);assert.notEqual(cp.get(w,'incident',i.id).status,'CLOSED');assert.ok(cp.snapshot(w).summary.activeIncidents>0);
 }finally{cp.close();f.cleanup();}}
 assert.equal(historicalProviderHistoryCompatible([]),false);assert.equal(historicalProviderHistoryCompatible([{body:{probe:{}}}]),false);
 const f=fixture();try{assert.equal(historicalProviderHistoryCompatible(Array(5001).fill({body:{probe:f.probe()}})),false);}finally{f.cleanup();}
});

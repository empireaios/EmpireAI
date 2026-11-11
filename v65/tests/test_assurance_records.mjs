import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {cpRecord,checkCp,checkNewCp,classifyAttempts,recoveryActivity,checkRecoveryActivity} from '../foundation/controller/scripts/work8/native-transition/assurance-records.mjs';
const digest=x=>createHash('sha256').update(x).digest('hex');
const context={incidentKeySha256:digest('synthetic-test-incident'),readbackPhase:'returned',checkerSha256:digest('synthetic-checker-test-only')};
const missing=Symbol('missing');
function row(attempts=0,changes={}){
 const body={id:'test-incident',firstAt:10,lastAt:10,recurrence:1,status:'DETECTED',attempts,...changes};
 if(attempts===missing)delete body.attempts;
 return cpRecord({kind:'incident',body:JSON.stringify(body)});
}
function rejected(fn,code){let result;try{fn();}catch(e){result=e;}assert.ok(result);if(code)assert.equal(result.message.split('\n')[0],code);return result;}
test('valid numeric zero incident and unchanged existing incident remain accepted',()=>{
 const initial=row();checkCp(initial,structuredClone(initial),context);checkNewCp(initial,context);
 checkCp(initial,row(0,{lastAt:20,recurrence:2}),context);
});
test('valid unchanged historical positive attempts survive incident recurrence',()=>{
 const prior=row(1),next=row(1,{lastAt:20,recurrence:2});
 checkCp(prior,next,context);assert.equal(next.attempts,1);
});
test('missing null and wrong-type attempts reject without coercion',()=>{
 for(const value of [missing,null,'0',false,[],{},-1,0.5]){
  const prior=row(value),next=row(value,{lastAt:20,recurrence:2});
  rejected(()=>checkCp(prior,next,context),'INVALID_RECOVERY_ATTEMPT_COUNTER');rejected(()=>checkCp(prior,prior,{...context,readbackPhase:'normal'}),'INVALID_RECOVERY_ATTEMPT_COUNTER');rejected(()=>checkNewCp(prior,context),'INVALID_RECOVERY_ATTEMPT_COUNTER');
 }
});
test('genuine new recovery attempt changes identity and remains rejected first',()=>{
 const e=rejected(()=>checkCp(row(0),row(1,{lastAt:20,recurrence:2}),context),'NEW_RECOVERY_ATTEMPT');
 assert.equal(e.assuranceContext.identityEqual,false);assert.equal(e.assuranceContext.priorClass,'NUMERIC_ZERO');assert.equal(e.assuranceContext.observedClass,'POSITIVE_INTEGER');
});
test('new incident requires strict numeric zero',()=>{
 checkNewCp(row(0),context);for(const value of [1,2,100])rejected(()=>checkNewCp(row(value),context),'NEW_RECOVERY_ATTEMPT');
});
test('NORMAL RECOVERY NORMAL_RETURN consistent recurrence preserves counter',()=>{
 const normal=row(0),recovery=row(0,{lastAt:20,recurrence:2,status:'UNRESOLVED'}),returned=row(0,{lastAt:30,recurrence:3,status:'UNRESOLVED'});
 checkCp(normal,recovery,{...context,readbackPhase:'recovery'});checkCp(normal,returned,context);checkCp(recovery,returned,context);
});
test('deletion authority mutation time regression and lifecycle reversal reject',()=>{
 rejected(()=>checkCp(row(),null,context),'CONTROL_PLANE_RECORD_DELETED');
 rejected(()=>checkCp(row(),row(0,{id:'changed'}),context),'CONTROL_PLANE_IDENTITY_CHANGED');
 rejected(()=>checkCp(row(),row(0,{lastAt:1}),context),'CONTROL_PLANE_TIME_REGRESSED');
 rejected(()=>checkCp(row(0,{status:'UNRESOLVED'}),row(0,{status:'DETECTED',lastAt:20}),context));
});
test('diagnostic contains hashes and closed classifications but no incident content',()=>{
 const canary='PRIVATE_TEST_INCIDENT_CONTENT';const prior=row(3,{secret:canary}),next=row(4,{secret:canary,lastAt:20});
 const d=rejected(()=>checkCp(prior,next,context),'NEW_RECOVERY_ATTEMPT').assuranceContext;
 assert.equal(d.incidentKeySha256,context.incidentKeySha256);assert.equal(d.checkerSha256,context.checkerSha256);
 assert.equal(d.priorBodySha256,prior.bodySha256);assert.equal(d.observedBodySha256,next.bodySha256);
 assert.equal(d.rawIncidentRetained,false);assert.equal(d.applicationAcceptance,false);assert.ok(!JSON.stringify(d).includes(canary));
});
test('classification does not serialize collection members arbitrary objects or text',()=>{
 const cases=[[undefined,'MISSING'],[null,'NULL'],[[],'EMPTY_COLLECTION'],[[{secret:'PRIVATE'}],'NONEMPTY_COLLECTION'],[0,'NUMERIC_ZERO'],[-0,'NEGATIVE_ZERO'],[1,'POSITIVE_INTEGER'],[-1,'NEGATIVE_NUMBER'],[Infinity,'NONFINITE_NUMBER'],[NaN,'NONFINITE_NUMBER'],[0.5,'NONINTEGER_NUMBER'],[2**53,'OUT_OF_SAFE_RANGE'],['PRIVATE','WRONG_TYPE'],[{},'WRONG_TYPE']];
 for(const [value,want] of cases)assert.equal(classifyAttempts(value).classification,want);
});

test('raw negative-zero JSON fails strict zero and preserves its classification',()=>{
 const prior=cpRecord({kind:'incident',body:'{"id":"i","firstAt":10,"lastAt":10,"recurrence":1,"status":"DETECTED","attempts":-0}'});
 const next={...prior,bodySha256:digest('changed-body'),at:20,recurrence:2};
 const e=rejected(()=>checkCp(prior,next,context),'INVALID_RECOVERY_ATTEMPT_COUNTER');
 assert.equal(e.assuranceContext.observedClass,'NEGATIVE_ZERO');
});

test('all valid historical counts stay identical; increase and decrease both reject',()=>{
 for(const n of [0,1,3,10,Number.MAX_SAFE_INTEGER]){
  const prior=row(n);checkCp(prior,prior,{...context,readbackPhase:'normal'});checkCp(prior,row(n,{lastAt:20,recurrence:2}),context);
  if(n>0)rejected(()=>checkCp(prior,row(n-1),context),'NEW_RECOVERY_ATTEMPT');
  if(n<Number.MAX_SAFE_INTEGER)rejected(()=>checkCp(prior,row(n+1),context),'NEW_RECOVERY_ATTEMPT');
 }
 for(const n of [NaN,Infinity,-Infinity,Number.MAX_SAFE_INTEGER+1]){const prior={...row(),attempts:n};rejected(()=>checkCp(prior,prior,context),'INVALID_RECOVERY_ATTEMPT_COUNTER');}
});
test('historical recovered incidents preserve identity and reject changed ownership/revision',()=>{
 const prior=row(2,{status:'RECOVERED',owner:'test-owner',revision:'test-r1'});checkCp(prior,structuredClone(prior),context);
 rejected(()=>checkCp(prior,row(2,{status:'RECOVERED',owner:'different',revision:'test-r1'}),context),'CONTROL_PLANE_IDENTITY_CHANGED');
 rejected(()=>checkCp(prior,row(2,{status:'RECOVERED',owner:'test-owner',revision:'test-r2'}),context),'CONTROL_PLANE_IDENTITY_CHANGED');
});
const event=(seq,type,body='private-event-canary')=>({seq,workspace:'private-workspace-canary',at:seq,type,body});
test('original admission/result history preserved while observation events append',()=>{
 const rows=[event(1,'RECOVERY_ADMITTED'),event(2,'RECOVERY_RESULT')];
 const a=recoveryActivity(rows);const b=recoveryActivity([...rows,event(3,'INCIDENT_OBSERVED')]);
 checkRecoveryActivity(a,b,context);assert.equal(a.RECOVERY_ADMITTED.length,1);assert.equal(a.RECOVERY_RESULT.length,1);
});
test('new admission and reconciliation result rejected even if counter or net rows reset',()=>{
 const rows=[event(1,'RECOVERY_ADMITTED'),event(2,'RECOVERY_RESULT')];const before=recoveryActivity(rows);
 for(const type of ['RECOVERY_ADMITTED','RECOVERY_RESULT']){
  const e=rejected(()=>checkRecoveryActivity(before,recoveryActivity([...rows,event(3,type)]),context),'NEW_RECOVERY_ACTIVITY');
  assert.equal(e.assuranceActivityContext.eventType,type);assert.equal(e.assuranceActivityContext.priorCount,1);assert.equal(e.assuranceActivityContext.observedCount,2);
  assert.ok(!JSON.stringify(e.assuranceActivityContext).includes('canary'));
 }
});
test('recovery history deletion mutation and duplicate substitution rejected',()=>{
 const rows=[event(1,'RECOVERY_ADMITTED'),event(2,'RECOVERY_RESULT')],before=recoveryActivity(rows);
 for(const changed of [rows.slice(1),[rows[0],event(2,'RECOVERY_RESULT','altered')],[rows[0],rows[0],rows[1]]]){
  rejected(()=>checkRecoveryActivity(before,recoveryActivity(changed),context),'NEW_RECOVERY_ACTIVITY');
 }
});
test('both count and recovery event preservation hold across all three phases',()=>{
 const rows=[event(1,'RECOVERY_ADMITTED'),event(2,'RECOVERY_RESULT')],baseline=recoveryActivity(rows),normal=row(1,{status:'UNRESOLVED'});
 for(const [i,phase] of ['normal','recovery','returned'].entries()){
  checkCp(normal,row(1,{status:'UNRESOLVED',lastAt:10+i,recurrence:1+i}),{...context,readbackPhase:phase});
  checkRecoveryActivity(baseline,recoveryActivity([...rows,event(3+i,'INCIDENT_OBSERVED')]),{...context,readbackPhase:phase});
 }
});

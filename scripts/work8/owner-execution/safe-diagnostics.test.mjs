import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {operationFor,summarizeResponse,summarizeFailure} from './safe-diagnostics.mjs';

test('configured hostname aligns Next initURL with Chromium origin',()=>{
  const runner=fs.readFileSync(new URL('./run-hosted.sh',import.meta.url),'utf8');
  const hostname=runner.match(/--env HOSTNAME=([^\s]+)/)?.[1];
  assert.equal(hostname,'localhost');
  // Source-contract model of retained Next16.2.9 attachRequestMeta and adapter;
  // this is not a server or hosted examination result.
  assert.equal(new URL('/api/owner/advisor/memory',`http://${hostname}:43117`).origin,'http://localhost:43117');
  assert.notEqual(new URL('/api/owner/advisor/memory','http://0.0.0.0:43117').origin,'http://localhost:43117');
  assert.match(runner,/--network "container:\$web"/);
});
test('diagnostics distinguish BFF-origin, memory refusal and post-persist audit failures',()=>{
  assert.equal(summarizeResponse('FIXTURE_WRITE',403,{error:'Same-origin request required'}).errorKind,'BFF_ORIGIN_REJECTED');
  assert.equal(summarizeResponse('FIXTURE_WRITE',400,{error:'Memory command refused: schema, provenance, reference or version conflict'}).errorKind,'MEMORY_COMMAND_REFUSED');
  assert.equal(summarizeResponse('FIXTURE_WRITE',503,{error:'Memory record persisted but audit confirmation unavailable; reconcile the same command'}).errorKind,'MEMORY_AUDIT_UNAVAILABLE_AFTER_PERSIST');
});
test('response diagnostics expose bounded shape, never arbitrary body values',()=>{
  const secret='NEVER_PUBLISH_THIS_SECRET';
  const summary=summarizeResponse(secret,200,{error:secret,password:secret,result:{id:secret,created:true},data:{id:secret,version:0,events:[],note:secret},grantsAuthority:false});
  assert.equal(summary.operation,'OTHER');assert.equal(summary.resultIdType,'string');assert.equal(summary.created,true);assert.equal(summary.recordVersion,0);assert.equal(summary.eventCount,0);
  assert.equal(JSON.stringify(summary).includes(secret),false);
  assert.equal(summarizeResponse('MEMORY_READ',200,{data:{version:Infinity,events:'not-array'}}).recordVersion,null);
});
test('exception diagnostics discard arbitrary messages and names',()=>{
  assert.deepEqual(summarizeFailure(Error('NEW_FIXTURE_REQUIRED')),{code:'NEW_FIXTURE_REQUIRED',exceptionType:'Error'});
  const secret='Bearer private-session-value';
  assert.equal(JSON.stringify(summarizeFailure({name:secret,message:secret})).includes(secret),false);
  assert.equal(summarizeFailure(Error(secret)).code,'UNCLASSIFIED_EXCEPTION');
});
test('operation labels exclude query values and login payload',()=>{
  assert.equal(operationFor('/api/auth/login',{password:'private'}),'AUTH_LOGIN');
  assert.equal(operationFor('/api/owner/advisor/read?domain=memory&id=private'),'MEMORY_READ');
  assert.equal(operationFor('/api/owner/advisor/memory',{action:'synthetic_experience'}),'FIXTURE_WRITE');
});
test('non-JSON responses retain status without response text',()=>{
  const r=summarizeResponse('FIXTURE_WRITE',502,undefined,false);
  assert.equal(r.status,502);assert.equal(r.jsonParsed,false);assert.equal(r.bodyType,'undefined');
});
test('recorded-DEFER UI predicate cannot pass merely because reason is empty',()=>{
  // Exact DecisionCard source: busy || Boolean(item.ownerDecision) || note.trim().length<3.
  const sourcePredicate=(busy,ownerDecision,note)=>busy||Boolean(ownerDecision)||note.trim().length<3;
  const validNote='Synthetic readback only; do not submit a second decision.';
  assert.equal(sourcePredicate(false,null,validNote),false);
  assert.equal(sourcePredicate(false,{decision:'DEFER'},validNote),true);
  const harness=fs.readFileSync(new URL('./checks.mjs',import.meta.url),'utf8');
  assert.equal((harness.match(/getByLabel\('Decision reason', \{exact:true\}\)\.fill\('Synthetic readback only; do not submit a second decision\.'\);\n    requireCheck\(await card.getByRole/g)||[]).length,2);
});

import assert from 'node:assert/strict';
import {test} from 'node:test';
import {GeneratedStartupProtocol} from '../../runtime/work8-generated-startup-protocol.js';
const runId='11111111-1111-4111-8111-111111111111',source='a'.repeat(40);
const prepare={action:'hh4-prepare-infrastructure',runId,source},admit={action:'hh4-admit',runId,source};
test('HH4 permits infrastructure before final admission without resetting original deadline',()=>{
 let clock=0;const p=new GeneratedStartupProtocol(runId,source,()=>clock);
 p.prepare(prepare);clock=10000;p.infrastructureReady();assert.equal(p.remaining(),5000);p.admit(admit);
 assert.throws(()=>p.admit(admit));assert.throws(()=>p.prepare(prepare));
});
test('HH4 refuses early admission, duplicate preparation and forged transition identity',()=>{
 const p=new GeneratedStartupProtocol(runId,source);assert.throws(()=>p.admit(admit));assert.throws(()=>p.infrastructureReady());
 for(const bad of [{...prepare,runId:'22222222-2222-4222-8222-222222222222'},{...prepare,source:'b'.repeat(40)},{...prepare,grantsAuthority:true},admit])assert.throws(()=>p.prepare(bad));
 p.prepare(prepare);assert.throws(()=>p.prepare(prepare));assert.throws(()=>p.admit(admit));p.infrastructureReady();
 assert.throws(()=>p.admit({...admit,source:'b'.repeat(40)}));assert.throws(()=>p.admit({...admit,runId:'other'}));p.admit(admit);
});
test('HH4 original deadline cannot be extended by Redis readiness or delayed admission',()=>{
 let clock=0;const p=new GeneratedStartupProtocol(runId,source,()=>clock);p.prepare(prepare);clock=14999;p.infrastructureReady();clock=15000;assert.throws(()=>p.admit(admit),/HH4_ADOPTION_TIMEOUT/);
 const q=new GeneratedStartupProtocol(runId,source,()=>clock);q.prepare(prepare);clock+=15000;assert.throws(()=>q.infrastructureReady(),/HH4_ADOPTION_TIMEOUT/);
});

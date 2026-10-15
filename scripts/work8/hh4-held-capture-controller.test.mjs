import test from 'node:test';
import assert from 'node:assert/strict';
import {validateHeldReceipt,validateContainmentDeadline} from './hh4-held-capture-controller.mjs';
const source='a'.repeat(40),runId='11111111-1111-1111-1111-111111111111';
const ready={runId,workerPid:2,workerStartTicks:'77'};
const held={...ready,source,scopeRunId:'22222222-2222-2222-2222-222222222222',directory:'/tmp/work8-generated-capture-abc/capture/capture',digest:'b'.repeat(64),bootAllowed:false,completeLiveState:false,receivedAt:1000,copiedAt:1010,expiresAt:5999,remainingMs:5000};
test('original hold expiry cannot be refreshed by receipt or controller',()=>{
 validateHeldReceipt(held,ready,source,900,1020);
 assert.throws(()=>validateHeldReceipt(held,ready,source,900,5999),/HH4_HOLD_EXPIRED/);
 assert.throws(()=>validateHeldReceipt({...held,expiresAt:7000},ready,source,900,1020),/HH4_ORIGINAL_HOLD_BOUND/);
 assert.throws(()=>validateHeldReceipt({...held,receivedAt:800},ready,source,900,1020),/HH4_STALE_RECEIPT/);
});
test('source, worker identity, fixed path and no-boot flags remain mandatory',()=>{
 for(const change of [{source:'c'.repeat(40)},{workerStartTicks:'78'},{directory:'/tmp/other/capture'},{bootAllowed:true},{completeLiveState:true},{scopeRunId:undefined}])assert.throws(()=>validateHeldReceipt({...held,...change},ready,source,900,1020));
});
test('containment must finish before hold expires, with no survivors or restart',()=>{
 const receipt={containedAt:5000,containedMonotonicMs:250,survivors:[],after:{State:{Running:false,Pid:0}},noRestart:true};
 validateContainmentDeadline(receipt,held,200,1020);
 assert.throws(()=>validateContainmentDeadline({...receipt,containedAt:5999},held,200,1020),/HH4_CONTAINMENT_AFTER_HOLD/);
 assert.throws(()=>validateContainmentDeadline({...receipt,containedMonotonicMs:199},held,200,1020),/HH4_CONTAINMENT_CLOCK/);
 assert.throws(()=>validateContainmentDeadline({...receipt,survivors:[{pid:5}]},held,200,1020));
});

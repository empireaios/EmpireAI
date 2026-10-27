import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifyWrongOwnerEvidence} from './wrong-owner-check.mjs';

function fixture() {
  return {authenticated:{email:'admin@work8.invalid', role:'admin', workspaceId:'ws_empire_1'}, ownerEmail:'owner@work8.invalid', forbidden:['executive_read','memory_read','defer_write'].map(action=>({action,status:403,error:'Owner access required'})), beforeDigest:'a'.repeat(64), afterDigest:'a'.repeat(64)};
}
test('accepts exact authenticated non-owner gate refusals and unchanged history',()=>{
  const result=verifyWrongOwnerEvidence(fixture());
  assert.equal(result.status,'PASS');
  assert.equal(result.otherWorkspaceOrOtherFounderTested,false);
});
test('rejects anonymous denial and incidental403 as evidence of owner gate',()=>{
  for(const modify of [e=>e.forbidden[0].status=401,e=>e.forbidden[2].error='Same-origin request required',e=>e.forbidden[1].error='Origin denied']){
    const evidence=fixture();modify(evidence);assert.throws(()=>verifyWrongOwnerEvidence(evidence));
  }
});
test('rejects founder, owner alias, foreign workspace and missing probe evidence',()=>{
  for(const modify of [e=>e.authenticated.role='founder',e=>e.ownerEmail='admin@work8.invalid',e=>e.authenticated.workspaceId='other',e=>e.forbidden.pop()]){
    const evidence=fixture();modify(evidence);assert.throws(()=>verifyWrongOwnerEvidence(evidence));
  }
});
test('rejects changed durable history despite otherwise correct403 replies',()=>{
  const evidence=fixture();evidence.afterDigest='b'.repeat(64);assert.throws(()=>verifyWrongOwnerEvidence(evidence));
});

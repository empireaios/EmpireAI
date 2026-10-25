'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{randomUUID,createHash}=require('node:crypto');
const {validateMembershipReceipt}=require('./runtime-membership-receipt.cjs');
test('recovery census receipt refuses foreign, incomplete, secret-bearing or authority-granting metadata',()=>{
 const source='a'.repeat(40),generation=randomUUID(),boot=randomUUID(),scope=['synthetic-store'];
 const roles=['primary','brain-worker','assurance-worker','assurance-inspector','containment-guard'];
 const members=roles.map((role,i)=>({id:randomUUID(),role,pid:100+i,startTicks:'1',boot,pidNamespace:'pid:[123]',uid:role==='containment-guard'?0:65534,gid:role==='containment-guard'?0:65534,source,generation,epoch:1,cutoverDigest:'b'.repeat(64),entrySha256:'c'.repeat(64),scope,scopeDigest:createHash('sha256').update(JSON.stringify(scope)).digest('hex'),storeRoot:'/synthetic/store',storeDevice:1,storeInode:2,state:'ADMITTED'}));
 const value={schema:'work8-controller-capture-v1',source,generation,journalRevision:6,captureId:randomUUID(),members,guardMarkerAbsent:true,scope:'ACTUAL_DECLARED_GRAPH_ONLY',completeLiveState:false,bootAllowed:false};
 const copied=validateMembershipReceipt(value,source);assert.deepEqual(copied,value);assert.notEqual(copied.members,value.members);
 for(const mutate of [v=>v.source='d'.repeat(40),v=>v.members.pop(),v=>v.members[1].pid=v.members[0].pid,v=>v.members[0].generation=randomUUID(),v=>v.members[0].password='forbidden',v=>v.members[1].epoch=2,v=>v.members[1].boot=randomUUID(),v=>v.members[1].pidNamespace='pid:[456]',v=>v.members[4].uid=65534,v=>v.guardMarkerAbsent=false,v=>v.bootAllowed=true,v=>v.completeLiveState=true]){
  const bad=structuredClone(value);mutate(bad);assert.throws(()=>validateMembershipReceipt(bad,source));
 }
});

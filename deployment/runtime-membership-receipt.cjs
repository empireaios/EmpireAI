'use strict';
const assert=require('node:assert/strict');
const {validateMemberRecord}=require('./runtime-membership-controller.cjs');
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
// Historical inspection evidence only. This parser never imports writer authority.
function validateMembershipReceipt(value,source){
 assert.ok(value&&typeof value==='object'&&!Array.isArray(value));
 assert.deepEqual(Object.keys(value).sort(),['schema','source','generation','journalRevision','captureId','members','guardMarkerAbsent','scope','completeLiveState','bootAllowed'].sort());
 assert.ok(['work8-controller-capture-v1','work8-controller-capture-v2'].includes(value.schema));const seven=value.schema==='work8-controller-capture-v2';assert.match(source,/^[a-f0-9]{40}$/);assert.equal(value.source,source);
 assert.match(value.generation,uuid);assert.match(value.captureId,uuid);assert.ok(Number.isSafeInteger(value.journalRevision)&&value.journalRevision>0);
 assert.equal(value.guardMarkerAbsent,true);assert.equal(value.scope,'ACTUAL_DECLARED_GRAPH_ONLY');assert.equal(value.completeLiveState,false);assert.equal(value.bootAllowed,false);
 assert.ok(Array.isArray(value.members));assert.equal(value.members.length,seven?7:5);
 const roles=['primary','brain-worker','assurance-worker','assurance-inspector','containment-guard',...(seven?['native-mission-lock-holder','work8-domain-lock-holder']:[])];
 assert.deepEqual(value.members.map(m=>m.role).sort(),roles.sort());
 const ids=new Set(),pids=new Set();
 for(const member of value.members){
  const {state,...record}=member;assert.ok(['ADMITTED','READY','HELD'].includes(state));validateMemberRecord(record);
  if(record.role.endsWith('-lock-holder'))assert.equal(state,'HELD');
  assert.equal(record.source,source);assert.equal(record.generation,value.generation);
  for(const key of ['boot','pidNamespace','epoch','cutoverDigest'])assert.equal(record[key],value.members[0][key]);
  if(record.role==='containment-guard'){assert.equal(record.uid,0);assert.equal(record.gid,0);}
  assert.ok(!ids.has(record.id)&&!pids.has(record.pid));ids.add(record.id);pids.add(record.pid);
 }
 const bytes=JSON.stringify(value);assert.ok(Buffer.byteLength(bytes)<=65536);
 return JSON.parse(bytes);
}
module.exports={validateMembershipReceipt};

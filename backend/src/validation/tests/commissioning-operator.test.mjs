import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {authorizeCommissioningRead as authorize} from '../../assurance/commissioning-operator.mjs';
const token='a'.repeat(43),now=1000000000;
const config={profile:'LOCKED_COMMISSIONING_V1',tokenSha256:createHash('sha256').update(token).digest('hex'),expiresAt:String(now+60000)};
const request={method:'GET',url:'/api/commissioning/read-only/accounting',token};
test('operator credential is narrowly scoped and cannot authenticate founder or commerce actions',()=>{
 assert.equal(authorize(request,config,now),true);
 assert.equal(authorize({...request,url:'/api/commissioning/read-only/assurance'},config,now),true);
 for(const url of ['/auth/me','/api/pillow/chat','/api/pillow/assurance-demo/inject','/api/pillow/commissioning-accounting','/api/commissioning/read-only/accounting?x=1','/api/commissioning/read-only/%61ccounting'])assert.equal(authorize({...request,url},config,now),false);
 for(const method of ['POST','PUT','DELETE','HEAD'])assert.equal(authorize({...request,method},config,now),false);
 for(const bad of ['',undefined,token+'a',[token]])assert.equal(authorize({...request,token:bad},config,now),false);
});
test('operator capability is disabled without exact configuration and expires without renewal',()=>{
 for(const update of [{profile:undefined},{profile:'PRODUCTION'},{tokenSha256:undefined},{tokenSha256:'z'.repeat(64)},{expiresAt:undefined},{expiresAt:String(now)},{expiresAt:String(now+7*86400000+1)}])assert.equal(authorize(request,{...config,...update},now),false);
 assert.equal(authorize(request,config,now+60000),false);
});

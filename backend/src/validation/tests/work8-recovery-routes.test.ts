import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Fastify from 'fastify';
import {registerWork8RecoveryRoutes} from '../../runtime/work8-recovery-routes.js';
async function setup(t:any,role='founder',reject=false){
 const app=Fastify(),root=fs.mkdtempSync(path.join(os.tmpdir(),'recovery-route-'));t.after(async()=>{await app.close();fs.rmSync(root,{recursive:true,force:true});});
 let calls=0;registerWork8RecoveryRoutes(app,{founderEmail:'owner@example.test',authenticate:async(req:any)=>{req.user={id:'owner',email:'owner@example.test',workspaceId:'ws_empire_1',role};},
 config:{WORK8_RECOVERY_EXAMINATION:'true',EMPIRE_ROLE:'brain-worker',NODE_ENV:'test',WORK8_RECOVERY_OUTPUT_DIRECTORY:root,RAILWAY_GIT_COMMIT_SHA:'a'.repeat(40),WORK8_FRONTEND_REVISION:'b'.repeat(40)},
 capture:async request=>{calls++;assert.equal(request.requireComplete,false);assert.equal(request.sourceCommit,'a'.repeat(40));assert.equal(path.dirname(request.destination),root);if(reject)throw Error('REDIS_UNAVAILABLE');return {directory:request.destination,digest:'c'.repeat(64),manifest:{completeLiveState:false,bootAllowed:false}};}});
 return {app,root,calls:()=>calls};
}
test('authenticated isolated route invokes configured recovery after response and records truthful scope',async t=>{
 const {app,calls}=await setup(t);const r=await app.inject({method:'POST',url:'/api/owner/commerce/twin/recovery-inventory',payload:{scope:'INSPECTION_ONLY'}});assert.equal(r.statusCode,202);
 await new Promise(r=>setTimeout(r,20));assert.equal(calls(),1);const result=await app.inject('/api/owner/commerce/twin/recovery-inventory/'+r.json().id);assert.equal(result.json().status,'SCOPED_INSPECTION_ONLY');assert.equal(result.json().bootAllowed,false);
});
test('foreign role and caller path/source substitution cannot start capture',async t=>{
 const {app,calls}=await setup(t,'admin');assert.equal((await app.inject({method:'POST',url:'/api/owner/commerce/twin/recovery-inventory',payload:{scope:'INSPECTION_ONLY'}})).statusCode,403);assert.equal(calls(),0);
 const owner=await setup(t);assert.equal((await owner.app.inject({method:'POST',url:'/api/owner/commerce/twin/recovery-inventory',payload:{scope:'INSPECTION_ONLY',destination:'/tmp/foreign'}})).statusCode,400);assert.equal(owner.calls(),0);
});
test('capture failure creates refusal, not a successful backup receipt',async t=>{
 const {app}=await setup(t,'founder',true);const r=await app.inject({method:'POST',url:'/api/owner/commerce/twin/recovery-inventory',payload:{scope:'INSPECTION_ONLY'}});await new Promise(r=>setTimeout(r,20));const receipt=(await app.inject('/api/owner/commerce/twin/recovery-inventory/'+r.json().id)).json();assert.equal(receipt.status,'REFUSED');assert.equal(receipt.digest,undefined);
});
test('route absent by default and refuses production activation',async t=>{
 const app=Fastify();t.after(()=>app.close());const options={authenticate:async()=>{},founderEmail:'x',capture:async()=>{throw Error('never');}};registerWork8RecoveryRoutes(app,{...options,config:{}});assert.equal((await app.inject('/api/owner/commerce/twin/recovery-inventory')).statusCode,404);
 assert.throws(()=>registerWork8RecoveryRoutes(Fastify(),{...options,config:{WORK8_RECOVERY_EXAMINATION:'true',NODE_ENV:'production'}}),/ISOLATION_REQUIRED/);
});

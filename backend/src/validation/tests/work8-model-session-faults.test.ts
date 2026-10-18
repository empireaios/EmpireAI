import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import {completeLockedRouted,LOCKED_PROVIDERS} from '../../brain/llm/locked-provider-orchestration.js';
import {inferenceLedgerPath} from '../../brain/llm/locked-inference.js';
import {readProviderHealth} from '../../assurance/provider-health.mjs';
// Existing control plane is implemented in JavaScript.
// @ts-ignore -- no declaration exists for the canonical runtime module
import {AssuranceControlPlane} from '../../assurance/control-plane.mjs';
import {SessionStore} from '../../auth/session-store.js';
import {createAuthMiddleware} from '../../auth/middleware.js';
import type {RedisClient} from '../../config/redis-client.js';
const w='synthetic:work8-model-session';
function completed(){return Response.json({id:'resp_isolated_work8',model:LOCKED_PROVIDERS.openai.model,status:'completed',output:[{type:'message',content:[{type:'output_text',text:'Isolated protocol response, not live inference.'}]}],usage:{input_tokens:20,output_tokens:30,total_tokens:50}});}

test('actual locked router failures feed passive Assurance and require a new successful receipt to recover',async t=>{
 assert.equal(process.env.WORK8_KERNEL_EGRESS,'DENIED','Run only under full kernel network denial');
 t.mock.timers.enable({apis:['Date'],now:new Date('2026-10-01T14:00:00Z')});
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'work8-model-faults-')),old={...process.env},originalFetch=globalThis.fetch;fs.mkdirSync(path.join(root,'commissioning'));
 Object.assign(process.env,{EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',EMPIRE_ENGINEERING_TEST_MODE:'true',RAILWAY_VOLUME_MOUNT_PATH:root,DATABASE_PATH:path.join(root,'commissioning','empireai-brain.db'),OPENAI_API_KEY:'isolated-not-a-provider-key'});delete process.env.ANTHROPIC_API_KEY;delete process.env.GOOGLE_AI_API_KEY;
 const control=new AssuranceControlPlane({root,revision:'work8-offline-model-faults',now:()=>Date.now()});let calls=0;
 const rows=()=>{const db=new DatabaseSync(inferenceLedgerPath(),{readOnly:true});try{return db.prepare('SELECT * FROM calls ORDER BY timestamp,id').all();}finally{db.close();}};
 const observe=()=>{const health=readProviderHealth(inferenceLedgerPath(),['openai'],Date.now());control.observe(w,{id:'model-response',capability:'model-response',classification:'INJECTED_PROVIDER_PROTOCOL',status:health.status,summary:'Passive actual accounting receipts from injected offline responses',evidence:health,synthetic:true});return health;};
 try{
  for(const fault of ['429','503','malformed-usage']){
   t.mock.timers.tick(61001);const before=rowsSafe();
   globalThis.fetch=async()=>{calls++;return fault==='malformed-usage'?Response.json({id:'bad-usage',status:'completed',model:LOCKED_PROVIDERS.openai.model,output:[{type:'message',content:[{type:'output_text',text:'Untrusted'}]}],usage:{input_tokens:20,output_tokens:-1,total_tokens:19}}):new Response(null,{status:Number(fault)});};
   const request={workspaceId:w,correlationId:'fault-'+fault,provider:'openai' as const,maxTokens:128,messages:[{role:'user' as const,content:'Offline protocol examination'}]};
   const callsBefore=calls;await assert.rejects(completeLockedRouted(request));assert.equal(calls-callsBefore,1);assert.equal(rows().length,before.length+1);assert.equal(rows().at(-1)?.status,'failed_uncertain');assert.equal(rows().at(-1)?.estimated_micro_usd,null);
   const failureRows=rows();assert.equal(observe().status,'DEGRADED');const incident=control.list(w,'incident').find((i:{status:string})=>i.status!=='RECOVERED');assert.ok(incident);assert.equal(incident.attempts,0);
   await assert.rejects(completeLockedRouted(request));assert.equal(calls,callsBefore+1,'replay or cooldown never issues another transport');assert.equal(observe().status,'DEGRADED');assert.notEqual(control.get(w,'incident',incident.id).status,'RECOVERED');
   t.mock.timers.tick(61001);await assert.rejects(completeLockedRouted(request));assert.equal(calls,callsBefore+1,'expired cooldown does not permit duplicate request transport');globalThis.fetch=async()=>{calls++;return completed();};await completeLockedRouted({...request,correlationId:'recovery-'+fault});
   const health=observe();assert.equal(health.status,'HEALTHY');assert.equal(health.inferenceCalls,0);assert.equal(control.get(w,'incident',incident.id).status,'RECOVERED');assert.deepEqual(rows().slice(0,failureRows.length),failureRows,'failed reservations retained without rewrite');assert.equal(rows().at(-1)?.invoice_actual_micro_usd,null);
  }
  assert.equal(calls,6);assert.equal(control.list(w,'incident').length,3);assert.equal(control.list(w,'recovery').length,0,'external provider healing is not claimed as an autonomous runbook repair');
 }finally{control.close();globalThis.fetch=originalFetch;for(const k of Object.keys(process.env))if(!(k in old))delete process.env[k];Object.assign(process.env,old);fs.rmSync(root,{recursive:true,force:true});t.mock.timers.reset();}
 function rowsSafe(){try{return rows();}catch{return [];}}
});

test('actual SessionStore Redis-adapter GET failure blocks Fastify handler and fresh read recovers',async()=>{
 assert.equal(process.env.WORK8_KERNEL_EGRESS,'DENIED');const root=fs.mkdtempSync(path.join(os.tmpdir(),'work8-session-faults-'));
 const values=new Map<string,string>();let failing=false,reads=0,executions=0;
 const adapter={eval:async()=>1,setex:async(k:string,_ttl:number,v:string)=>{values.set(k,v);return 'OK';},get:async(k:string)=>{reads++;if(failing)throw Error('INJECTED_REDIS_ADAPTER_UNAVAILABLE');return values.get(k)??null;},del:async(k:string)=>Number(values.delete(k))} as unknown as Pick<RedisClient,'setex'|'get'|'del'>;
 const store=new SessionStore(adapter),session=await store.create({id:'isolated-owner',email:'owner@example.invalid',name:'Isolated owner',role:'founder',workspaceId:w});
 const app=Fastify(),control=new AssuranceControlPlane({root,revision:'work8-session-adapter',now:Date.now});await app.register(cookie);app.get('/isolated-protected',{preHandler:createAuthMiddleware(store)},async()=>{executions++;return {workspace:w};});
 const probe=(status:string)=>control.observe(w,{id:'session-functional',capability:'session-auth',classification:'INJECTED_REDIS_ADAPTER',status,summary:'Actual Fastify authentication against injected session adapter',synthetic:true,evidence:{observedAt:Date.now(),reads,executions}});
 const read=()=>app.inject({method:'GET',url:'/isolated-protected',headers:{authorization:'Bearer '+session.token}});
 try{
  assert.equal((await read()).statusCode,200);assert.equal(executions,1);failing=true;
  const failed=await read();assert.equal(failed.statusCode,503);assert.equal(failed.json().code,'SHARED_SESSION_STORE_UNAVAILABLE');assert.equal(executions,1);probe('FAILED');const incident=control.list(w,'incident')[0];
  assert.equal((await read()).statusCode,503);assert.equal(executions,1);assert.notEqual(control.get(w,'incident',incident.id).status,'RECOVERED');failing=false;
  const readsBefore=reads;const recovered=await read();assert.equal(recovered.statusCode,200);assert.deepEqual(recovered.json(),{workspace:w});assert.equal(reads,readsBefore+1);assert.equal(executions,2);probe('HEALTHY');assert.equal(control.get(w,'incident',incident.id).status,'RECOVERED');assert.equal(control.list(w,'recovery').length,0);
 }finally{await app.close();control.close();fs.rmSync(root,{recursive:true,force:true});}
});

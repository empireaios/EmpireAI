import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import Fastify from 'fastify';
import { completeLockedInference, reserveInference, inferenceLedgerPath, LOCKED_MODEL } from '../../brain/llm/locked-inference.js';
import { installLockedCommissioning } from '../../runtime/locked-commissioning.js';

const request={workspaceId:'owner',correlationId:'ordinary-request',messages:[{role:'user' as const,content:'Explain why forecasts need uncertainty ranges.'}]};
const now=Date.parse('2026-10-01T14:00:00Z');
function read(filename:string){const db=new DatabaseSync(filename,{readOnly:true});try{return db.prepare('SELECT * FROM calls').all();}finally{db.close();}}
test('NOT_BORN inference is durable and never changes HTTP mutation authority',async()=>{
 const old={...process.env},originalFetch=globalThis.fetch;
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'inference-'));fs.mkdirSync(path.join(root,'commissioning'));
 Object.assign(process.env,{EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',EMPIRE_ENGINEERING_TEST_MODE:'true',RAILWAY_VOLUME_MOUNT_PATH:root,DATABASE_PATH:path.join(root,'commissioning','empireai-brain.db'),OPENAI_API_KEY:'offline-test-key'});
 let calls=0;
 globalThis.fetch=async(url,init)=>{
  calls++;assert.equal(url,'https://api.openai.com/v1/responses');
  const sent=JSON.parse(String(init?.body));assert.equal(sent.input[0].phase,'final_answer');assert.equal(sent.input[1].phase,'commentary');assert.equal(sent.input[2].phase,undefined);assert.equal(sent.model,LOCKED_MODEL);assert.equal(sent.store,false);assert.equal(sent.service_tier,'default');assert.equal(sent.tools,undefined);assert.equal(sent.previous_response_id,undefined);
  const saved=read(inferenceLedgerPath());assert.equal(saved.at(-1)?.status,'reserved_uncertain');
  return Response.json({id:'resp_fixture',model:LOCKED_MODEL,service_tier:'default',status:'completed',output:[{type:'message',content:[{type:'output_text',text:'Ranges communicate uncertainty.'}]}],usage:{input_tokens:30,output_tokens:25,total_tokens:55,input_tokens_details:{cached_tokens:0},output_tokens_details:{reasoning_tokens:10}}});
 };
 const app=Fastify();installLockedCommissioning(app);let mutations=0;
 const routes=['/pillow-commissioning/birth','/api/pillow/mission-runtime/execute','/brain/dispatch','/amazon/publish','/amazon/price','/amazon/inventory','/cj/orders','/payments','/fulfilment','/providers/write'];
 for(const url of routes)for(const method of ['POST','PUT','PATCH','DELETE'] as const)app.route({method,url,handler:async()=>{mutations++;return{ok:true};}});
 app.get('/health/ready',async()=>({ready:true}));
 try {
  const reply=await completeLockedInference({...request,messages:[{role:'assistant',content:'Prior final'},{role:'assistant',content:'Prior intermediate',phase:'commentary'},...request.messages]});assert.equal(reply.content,'Ranges communicate uncertainty.');
  for(const url of routes)for(const method of ['POST','PUT','PATCH','DELETE'] as const){const response=await app.inject({method,url,payload:{force:true,approved:true,born:true}});assert.equal(response.statusCode,423);assert.equal(response.json().birth,'NOT_BORN');assert.equal(response.json().commerce,'LOCKED');}
  assert.equal(mutations,0);const health=(await app.inject('/health/ready')).json();assert.equal(health.birth,'NOT_BORN');assert.equal(health.operational,false);assert.equal(process.env.EMPIRE_ENGINEERING_TEST_MODE,'true');
  const rows=read(inferenceLedgerPath());assert.equal(rows.length,1);assert.equal(rows[0]?.model,LOCKED_MODEL);assert.equal(rows[0]?.status,'usage_recorded');assert.equal(rows[0]?.invoice_actual_micro_usd,null);assert.ok(Number(rows[0]?.reserved_micro_usd)>Number(rows[0]?.estimated_micro_usd));assert.equal(JSON.parse(String(rows[0]?.usage_json)).reasoningTokens,10);assert.ok(!JSON.stringify(rows).includes(request.messages[0]!.content));assert.ok(!JSON.stringify(rows).includes('offline-test-key'));
  delete process.env.OPENAI_API_KEY;await assert.rejects(completeLockedInference(request),/credential/);assert.equal(calls,1);
  process.env.OPENAI_API_KEY='invalid-private-value';globalThis.fetch=async()=>{calls++;return new Response('secret diagnostic must not surface',{status:401});};
  await assert.rejects(completeLockedInference(request),/^Error: Bounded inference failed; reservation retained for reconciliation$/);assert.equal(read(inferenceLedgerPath())[1]?.status,'failed_uncertain');
  await assert.rejects(completeLockedInference({...request,tools:[{name:'pay',description:'pay',parameters:{}}]}),/not authorized/);
  await assert.rejects(completeLockedInference({...request,model:'unpriced'}),/not authorized/);
  assert.equal(calls,2);
  globalThis.fetch=async()=>Response.json({model:LOCKED_MODEL,status:'completed',output:[]});
  await assert.rejects(completeLockedInference(request),/reservation retained/);
  assert.equal(read(inferenceLedgerPath())[2]?.status,'failed_uncertain');
  assert.equal(read(inferenceLedgerPath())[2]?.estimated_micro_usd,null);
  globalThis.fetch=async()=>{throw new Error('private transport details');};
  await assert.rejects(completeLockedInference(request),/^Error: Bounded inference failed; reservation retained for reconciliation$/);
  assert.equal(read(inferenceLedgerPath())[3]?.status,'failed_uncertain');
 }finally{await app.close();globalThis.fetch=originalFetch;for(const key of Object.keys(process.env))if(!(key in old))delete process.env[key];Object.assign(process.env,old);fs.rmSync(root,{recursive:true,force:true});}
});
test('cumulative ceiling survives a separate process; uncertainty and missing ledger fail closed',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'inference-ledger-')),file=path.join(root,'ledger.sqlite');
 try{
  reserveInference(file,39_999_999,now);
  const moduleUrl=new URL('../../brain/llm/locked-inference.ts',import.meta.url).href;
  const child=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',`import {reserveInference} from ${JSON.stringify(moduleUrl)};try{reserveInference(${JSON.stringify(file)},2,${now});process.exit(3)}catch(e){if(!e.message.includes('budget exhausted'))throw e}`],{encoding:'utf8',cwd:new URL('../../../',import.meta.url)});
  assert.equal(child.status,0,child.stderr);assert.equal(read(file).length,1);
  reserveInference(file,1,now);assert.throws(()=>reserveInference(file,1,now),/budget exhausted/);
  assert.throws(()=>reserveInference(file,1,Date.parse('2026-10-09')),/pricing/);
  assert.equal(read(file).reduce((sum,row)=>sum+Number(row.reserved_micro_usd),0),40_000_000);
  fs.unlinkSync(file);assert.throws(()=>reserveInference(file,1,now),/missing/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('Responses commentary never becomes final answer or duplicated tool protocol',async()=>{
 const {finalResponseText}=await import('../../brain/llm/response-final-text.js');
 const message=(phase:string|undefined,text:string)=>({type:'message',role:'assistant',status:'completed',phase,content:[{type:'output_text',text}]});
 assert.equal(finalResponseText([message('commentary','Interim progress'),message('final_answer','Verified conclusion')]),'Verified conclusion');
 assert.equal(finalResponseText([message(undefined,'Legacy final')]),'Legacy final');
 assert.throws(()=>finalResponseText([message('commentary','Not complete')]),/absent/);
 assert.throws(()=>finalResponseText([message(undefined,'One'),message(undefined,'Two')]),/ambiguous/);
 assert.throws(()=>finalResponseText([message('unexpected','Unknown phase')]),/invalid/);
 assert.equal(finalResponseText([message('commentary','Preparing a calculation'),message('final_answer','{"readOnlyCalls":[]}')]),'{"readOnlyCalls":[]}');
});

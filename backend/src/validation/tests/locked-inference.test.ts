import {before,after} from 'node:test';
const realClock=Date.now;
before(()=>{Date.now=()=>Date.parse('2026-10-01T14:00:00Z');});
after(()=>{Date.now=realClock;});
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
test('investigation transport enforces collector query bounds and reserves schema input without adding provider tools',async()=>{
 const old={...process.env},originalFetch=globalThis.fetch;
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'investigation-contract-'));fs.mkdirSync(path.join(root,'commissioning'));
 Object.assign(process.env,{EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',EMPIRE_ENGINEERING_TEST_MODE:'true',RAILWAY_VOLUME_MOUNT_PATH:root,DATABASE_PATH:path.join(root,'commissioning','empireai-brain.db'),OPENAI_API_KEY:'offline-test-key'});
 try{for(const phase of ['plan','review','assessment'] as const){
  globalThis.fetch=async(_url,init)=>{const body=JSON.parse(String(init?.body));const format=body.text.format;
   assert.equal(format.type,'json_schema');assert.equal(format.strict,true);assert.equal(format.name,'four_eyes_'+phase);assert.equal(body.tools,undefined);
   const jobs=format.schema.properties.jobs;assert.equal(jobs.items.properties.subject.properties.query.anyOf[0].maxLength,120);
   assert.equal(jobs.maxItems,phase==='assessment'?0:4);assert.equal(jobs.minItems,phase==='plan'?1:0);assert.equal(jobs.items.properties.requestLimit.maximum,3);
   assert.equal(format.schema.additionalProperties,false);assert.equal(jobs.items.properties.subject.additionalProperties,false);
   const bound=Buffer.byteLength(JSON.stringify(body.input))+Buffer.byteLength(JSON.stringify(body.text))+4096+body.input.length*512;
   assert.equal(read(inferenceLedgerPath()).at(-1)?.reserved_micro_usd,Math.ceil(bound*2.75+10000*11));
   return Response.json({model:LOCKED_MODEL,status:'completed',usage:{input_tokens:10,output_tokens:10,total_tokens:20},output:[{type:'message',content:[{type:'output_text',text:'{"jobs":[],"answer":"fixture"}'}]}]});
  };
  await completeLockedInference({...request,maxTokens:2000,investigationPhase:phase});
 }}finally{globalThis.fetch=originalFetch;for(const key of Object.keys(process.env))if(!(key in old))delete process.env[key];Object.assign(process.env,old);fs.rmSync(root,{recursive:true,force:true});}
});
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
test('cumulative reservations cross former ceiling across processes; arithmetic and missing ledger fail closed',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'inference-ledger-')),file=path.join(root,'ledger.sqlite');
 try{
  reserveInference(file,39_999_999,now);
  const moduleUrl=new URL('../../brain/llm/locked-inference.ts',import.meta.url).href;
  const child=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',`import {reserveInference} from ${JSON.stringify(moduleUrl)};reserveInference(${JSON.stringify(file)},2,${now})`],{encoding:'utf8',cwd:new URL('../../../',import.meta.url)});
  assert.equal(child.status,0,child.stderr);assert.equal(read(file).length,2);
  reserveInference(file,1,now);assert.throws(()=>reserveInference(file,Number.MAX_SAFE_INTEGER,now),/accounting bound/);
  assert.throws(()=>reserveInference(file,1,Date.parse('2026-10-15')),/pricing/);
  assert.equal(read(file).reduce((sum,row)=>sum+Number(row.reserved_micro_usd),0),40_000_002);
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


test('incomplete receipt retains bounded reason and configured ceiling without replay or release',async()=>{
 const old={...process.env},originalFetch=globalThis.fetch;
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'incomplete-receipt-'));fs.mkdirSync(path.join(root,'commissioning'));
 Object.assign(process.env,{EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',EMPIRE_ENGINEERING_TEST_MODE:'true',RAILWAY_VOLUME_MOUNT_PATH:root,DATABASE_PATH:path.join(root,'commissioning','empireai-brain.db'),OPENAI_API_KEY:'offline-test-key'});
 let calls=0;
 try {
  for(const reason of ['max_output_tokens','content_filter','untrusted text must not be retained']){
   globalThis.fetch=async(_url,init)=>{calls++;assert.equal(JSON.parse(String(init?.body)).max_output_tokens,10000);return Response.json({id:'resp_incomplete',model:LOCKED_MODEL,status:'incomplete',incomplete_details:{reason},usage:{input_tokens:10,output_tokens:2000,total_tokens:2010,output_tokens_details:{reasoning_tokens:2000}},output:[]});};
   await assert.rejects(completeLockedInference({...request,maxTokens:2000}),/reservation retained/);
   const rows=read(inferenceLedgerPath());const row=rows.at(-1)!;const usage=JSON.parse(String(row.usage_json));
   assert.equal(row.status,'incomplete');assert.ok(Number(row.reserved_micro_usd)>0);assert.equal(usage.configuredOutputTokens,10000);assert.equal(usage.providerStatus,'incomplete');assert.equal(usage.reasoningTokens,2000);
   assert.equal(usage.incompleteReason,reason==='untrusted text must not be retained'?null:reason);
  }
  assert.equal(calls,3);
 }finally{globalThis.fetch=originalFetch;for(const key of Object.keys(process.env))if(!(key in old))delete process.env[key];Object.assign(process.env,old);fs.rmSync(root,{recursive:true,force:true});}
});

test('Pillow OpenAI headroom reserves 10000 tokens and keeps concise answers above former ceiling with bounded accounting',async()=>{
 const old={...process.env},originalFetch=globalThis.fetch;
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'headroom-'));fs.mkdirSync(path.join(root,'commissioning'));
 Object.assign(process.env,{EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',EMPIRE_ENGINEERING_TEST_MODE:'true',RAILWAY_VOLUME_MOUNT_PATH:root,DATABASE_PATH:path.join(root,'commissioning','empireai-brain.db'),OPENAI_API_KEY:'offline-test-key'});
 let calls=0;
 const message='Compare demand evidence and contribution margin before selecting an opportunity.';
 try {
  for(const outputTokens of [30,9000]){
   globalThis.fetch=async(_url,init)=>{
    calls++;const body=JSON.parse(String(init?.body));assert.equal(body.max_output_tokens,10000);assert.equal(body.reasoning.effort,'medium');assert.equal(body.model,LOCKED_MODEL);
    const bound=Buffer.byteLength(JSON.stringify(body.input),'utf8')+4096+body.input.length*512;
    assert.equal(read(inferenceLedgerPath()).at(-1)?.reserved_micro_usd,Math.ceil(bound*2.75+10000*11));
    return Response.json({model:LOCKED_MODEL,status:'completed',usage:{input_tokens:10,output_tokens:outputTokens,total_tokens:10+outputTokens,output_tokens_details:{reasoning_tokens:outputTokens-20}},output:[{type:'message',role:'assistant',phase:'final_answer',content:[{type:'output_text',text:message}]}]});
   };
   const answer=await completeLockedInference({...request,maxTokens:2000});assert.equal(answer.content,message);assert.ok(answer.content.split(/\s+/).length<25);
  }
  const file=inferenceLedgerPath(),held=read(file).reduce((s,r)=>s+Number(r.reserved_micro_usd),0);
  reserveInference(file,40_000_000-held-1);
  assert.equal((await completeLockedInference({...request,maxTokens:2000})).content,message);assert.equal(calls,3);
  assert.ok(read(file).reduce((s,r)=>s+Number(r.reserved_micro_usd),0)>40_000_000);
  await assert.rejects(completeLockedInference({...request,maxTokens:10001}),/output bound refused/);assert.equal(calls,3);
 }finally{globalThis.fetch=originalFetch;for(const key of Object.keys(process.env))if(!(key in old))delete process.env[key];Object.assign(process.env,old);fs.rmSync(root,{recursive:true,force:true});}
});

test('expired production pricing remains fail-closed before any reservation',()=>{
 for(const at of ['2026-10-15T00:00:00Z','2026-11-01T00:00:00Z'])assert.throws(()=>reserveInference('/nonexistent/never-created.sqlite',1,Date.parse(at)),/pricing\/window unavailable/);
 assert.throws(()=>reserveInference('/nonexistent/never-created.sqlite',1,NaN),/pricing\/window unavailable/);
 for(const provider of ['anthropic','gemini','unreviewed'])assert.throws(()=>reserveInference('/nonexistent/never-created.sqlite',1,Date.parse('2026-10-08T00:00:00Z'),{provider,model:'unreviewed',ceiling:100}),/pricing\/window unavailable/);
});

test('reviewed OpenAI renewal appends to existing reservations without resetting historical accounting',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pricing-renewal-')),file=path.join(root,'ledger.sqlite');
 try {
  reserveInference(file,500,Date.parse('2026-10-07T23:59:59Z'));
  const before=read(file);
  reserveInference(file,700,Date.parse('2026-10-08T02:00:00Z'));
  const after=read(file);assert.equal(after.length,2);assert.deepEqual(after[0],before[0]);assert.equal(after[1]?.reserved_micro_usd,700);
  assert.throws(()=>reserveInference(file,1,Date.parse('2026-10-15T00:00:00Z')),/pricing\/window unavailable/);assert.deepEqual(read(file),after);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});


test('reviewed alternative renewals remain exact-model scoped and preserve historical reservations',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'alternative-review-')),file=path.join(root,'ledger.sqlite');
 try{
  reserveInference(file,100,Date.parse('2026-10-07T23:59:59Z'));
  const before=read(file);
  const reviewedModels=[['anthropic','claude-sonnet-5-5'],['gemini','gemini-3.8-flash']] as const;
  for(const [provider,model] of reviewedModels)reserveInference(file,100,Date.parse('2026-10-08T02:00:00Z'),{provider,model,ceiling:5000000});
  assert.deepEqual(read(file)[0],before[0]);assert.equal(read(file).length,3);
  for(const [provider,model] of reviewedModels)assert.throws(()=>reserveInference(file,1,Date.parse('2026-10-15T00:00:00Z'),{provider,model,ceiling:5000000}),/pricing/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

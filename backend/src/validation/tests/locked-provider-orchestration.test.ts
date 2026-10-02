import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { spawnSync } from 'node:child_process';
import { completeLockedRouted, completeLockedAlternative, LOCKED_PROVIDERS, providerHealthReadback } from '../../brain/llm/locked-provider-orchestration.js';
import { inferenceLedgerPath, reserveInference } from '../../brain/llm/locked-inference.js';

const request=(id:string)=>({workspaceId:'owner',correlationId:id,messages:[{role:'system' as const,content:'Keep authority locked.'},{role:'user' as const,content:'Offline protocol fixture.'}],maxTokens:128});
function rows(){const db=new DatabaseSync(inferenceLedgerPath(),{readOnly:true});try{return db.prepare('SELECT c.*,p.provider,p.request_key FROM calls c LEFT JOIN call_providers p ON p.call_id=c.id').all();}finally{db.close();}}
function setup(){const old={...process.env},fetch=globalThis.fetch;const root=fs.mkdtempSync(path.join(os.tmpdir(),'provider-protocol-'));fs.mkdirSync(path.join(root,'commissioning'));Object.assign(process.env,{EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',EMPIRE_ENGINEERING_TEST_MODE:'true',RAILWAY_VOLUME_MOUNT_PATH:root,DATABASE_PATH:path.join(root,'commissioning','empireai-brain.db'),OPENAI_API_KEY:'offline-openai',ANTHROPIC_API_KEY:'offline-claude',GOOGLE_AI_API_KEY:'offline-gemini'});return()=>{globalThis.fetch=fetch;for(const key of Object.keys(process.env))if(!(key in old))delete process.env[key];Object.assign(process.env,old);fs.rmSync(root,{recursive:true,force:true});};}
function fixture(provider:string){if(provider==='openai')return Response.json({id:'resp_offline',model:LOCKED_PROVIDERS.openai.model,status:'completed',output:[{type:'message',content:[{type:'output_text',text:'OpenAI fixture'}]}],usage:{input_tokens:20,output_tokens:30,total_tokens:50}});if(provider==='anthropic')return Response.json({id:'msg_offline',model:LOCKED_PROVIDERS.anthropic.model,stop_reason:'end_turn',content:[{type:'thinking',thinking:'not exposed'},{type:'text',text:'Claude fixture'}],usage:{input_tokens:20,output_tokens:30,cache_read_input_tokens:5,cache_creation_input_tokens:2}});return Response.json({responseId:'gemini_offline',modelVersion:LOCKED_PROVIDERS.gemini.model,candidates:[{finishReason:'STOP',content:{parts:[{text:'Gemini fixture'}]}}],usageMetadata:{promptTokenCount:20,candidatesTokenCount:10,thoughtsTokenCount:30,totalTokenCount:60,serviceTier:'standard'}});}

test('three actual wire contracts preserve roles, priced usage, provenance and no tool authority',async()=>{
 const clean=setup();try{
 let count=0;globalThis.fetch=async(url,init)=>{count++;const body=JSON.parse(String(init?.body));assert.equal(body.tools,undefined);assert.equal(init?.redirect,'error');assert.ok(init?.signal);assert.equal(rows().at(-1)?.status,'reserved_uncertain');const u=String(url);assert.ok(!u.includes('offline-'));if(u.includes('anthropic')){assert.equal(body.temperature,undefined);assert.equal(body.service_tier,'standard_only');assert.equal(body.system,'Keep authority locked.');assert.equal(body.messages[0].role,'user');return fixture('anthropic');}if(u.includes('googleapis')){assert.equal(body.serviceTier,'standard');assert.equal(body.store,false);assert.equal(body.systemInstruction.parts[0].text,'Keep authority locked.');assert.equal(body.generationConfig.candidateCount,1);return fixture('gemini');}assert.equal(body.model,'gpt-6.1-sol');return fixture('openai');};
 for(const provider of ['openai','anthropic','gemini'] as const){const result=await completeLockedRouted({...request(provider),provider});assert.equal(result.provider,provider);assert.equal(result.model,LOCKED_PROVIDERS[provider].model);assert.equal(result.provenance?.attempts.length,1);assert.equal(result.usage?.totalTokens,provider==='anthropic'?57:provider==='gemini'?60:50);}
 assert.equal(count,3);assert.equal(rows().length,3);for(const row of rows()){assert.equal(row.status,'usage_recorded');assert.ok(Number(row.reserved_micro_usd)>=Number(row.estimated_micro_usd));assert.equal(row.invoice_actual_micro_usd,null);assert.match(String(row.request_key),/^[a-f0-9]{64}$/);}
 assert.equal(providerHealthReadback().length,3);assert.ok(!JSON.stringify(rows()).includes('Offline protocol fixture'));assert.ok(!JSON.stringify(rows()).includes('offline-claude'));
 await assert.rejects(completeLockedRouted({...request('openai'),provider:'openai'}));assert.equal(count,3);
 await assert.rejects(completeLockedRouted({...request('tools'),tools:[{name:'pay',description:'pay',parameters:{}}]}));assert.equal(count,3);
 }finally{clean();}
});
test('one bounded fallback on refusal; both reservations retained; replay cannot pay again',async()=>{
 const clean=setup();try{let count=0;globalThis.fetch=async(url)=>{count++;return String(url).includes('openai')?new Response(null,{status:503}):fixture('anthropic');};
 const result=await completeLockedRouted(request('fallback'));assert.equal(count,2);assert.equal(result.provider,'anthropic');assert.deepEqual(result.provenance?.attempts.map(a=>a.outcome),['temporary_refusal','success']);assert.equal(rows()[0]?.status,'failed_uncertain');assert.equal(rows()[1]?.status,'usage_recorded');
 const child=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',`import {completeLockedRouted} from ${JSON.stringify(new URL('../../brain/llm/locked-provider-orchestration.ts',import.meta.url).href)};globalThis.fetch=async()=>{process.exit(7)};try{await completeLockedRouted(${JSON.stringify(request('fallback'))});process.exit(8)}catch{}`],{encoding:'utf8',cwd:new URL('../../../',import.meta.url)});assert.equal(child.status,0,child.stderr);assert.equal(rows().length,2);
 }finally{clean();}
});
test('uncertain transport, invalid credentials and corrupt usage never trigger fallback',async()=>{
 for(const failure of ['timeout','auth','usage']){const clean=setup();try{let count=0;globalThis.fetch=async()=>{count++;if(failure==='timeout')throw Error('private details');if(failure==='auth')return new Response('secret',{status:401});return Response.json({usage:{input_tokens:0}});};await assert.rejects(completeLockedRouted(request(failure)),/reservation retained/);assert.equal(count,1);assert.equal(rows()[0]?.status,'failed_uncertain');assert.equal(providerHealthReadback()[0]?.state,'failed_closed');}finally{clean();}}
});
test('capability routing and credential isolation do not silently substitute explicit provider',async()=>{
 const clean=setup();try{globalThis.fetch=async(url)=>fixture(String(url).includes('googleapis')?'gemini':'anthropic');assert.equal((await completeLockedRouted({...request('summary'),capability:'summarization'})).provider,'gemini');assert.equal((await completeLockedRouted({...request('critique'),capability:'critique'})).provider,'anthropic');delete process.env.ANTHROPIC_API_KEY;await assert.rejects(completeLockedRouted({...request('missing'),provider:'anthropic'}),/credential/);await assert.rejects(completeLockedAlternative({...request('model'),model:'unknown'},'gemini'),/not authorized/);}finally{clean();}
});
test('existing cumulative charges and independent provider sublimits cannot reset',async()=>{
 const clean=setup();try{const file=inferenceLedgerPath();reserveInference(file,5_000_000,Date.now(),{provider:'anthropic',model:LOCKED_PROVIDERS.anthropic.model,ceiling:5_000_000});let count=0;globalThis.fetch=async()=>{count++;return fixture('anthropic');};await assert.rejects(completeLockedRouted({...request('cap'),provider:'anthropic'}),/budget exhausted/);assert.equal(count,0);reserveInference(file,14_999_999);assert.throws(()=>reserveInference(file,2),/budget exhausted/);assert.equal(rows().reduce((n,r)=>n+Number(r.reserved_micro_usd),0),19_999_999);}finally{clean();}
});
test('legacy v1 ledger rows remain byte-for-byte values and count against all providers',async()=>{
 const clean=setup();try{const file=inferenceLedgerPath();reserveInference(file,19_999_999);let db=new DatabaseSync(file);const before=db.prepare('SELECT * FROM calls').all();db.exec('DROP TABLE call_providers');db.close();let count=0;globalThis.fetch=async()=>{count++;return fixture('gemini');};await assert.rejects(completeLockedRouted({...request('old-ledger'),provider:'gemini'}),/budget exhausted/);assert.equal(count,0);db=new DatabaseSync(file,{readOnly:true});assert.deepEqual(db.prepare('SELECT * FROM calls').all(),before);db.close();}finally{clean();}
});
test('two temporary refusals stop without a third provider; bad usage cannot masquerade as a response',async()=>{
 const clean=setup();try{let count=0;globalThis.fetch=async()=>{count++;return new Response(null,{status:503});};await assert.rejects(completeLockedRouted(request('two-refusals')));assert.equal(count,2);assert.equal(rows().length,2);globalThis.fetch=async()=>Response.json({modelVersion:LOCKED_PROVIDERS.gemini.model,candidates:[{finishReason:'STOP',content:{parts:[{text:'untrusted'}]}}],usageMetadata:{promptTokenCount:1,candidatesTokenCount:1,thoughtsTokenCount:4,totalTokenCount:2}});await assert.rejects(completeLockedRouted({...request('bad-gemini-usage'),provider:'gemini'}));assert.equal(rows().at(-1)?.estimated_micro_usd,null);}finally{clean();}
});
test('real shared router consultation reserves two distinct identities and replay cannot pay again',async()=>{
 const clean=setup();try{
  const {LLMRouter}=await import('../../brain/llm/llm-router.js');
  const router=new LLMRouter();let calls=0;
  globalThis.fetch=async url=>{calls++;return fixture(String(url).includes('anthropic')?'anthropic':'gemini');};
  const results=await router.crossCheck(request('distinct-consultation'),['anthropic','gemini'],'Offline integration check');
  assert.equal(calls,2);assert.deepEqual(results.map(r=>r.provider),['anthropic','gemini']);
  assert.equal(new Set(rows().map(r=>r.request_key)).size,2);
  assert.ok(rows().every(r=>r.status==='usage_recorded'));
  await assert.rejects(router.crossCheck(request('distinct-consultation'),['anthropic','gemini'],'Offline integration replay'));
  assert.equal(calls,2);assert.equal(rows().length,2);
 }finally{clean();}
});
test('concurrent duplicate requests admit one paid transport and one durable reservation',async()=>{
 const clean=setup();try{
  let calls=0;globalThis.fetch=async()=>{calls++;await new Promise(resolve=>setTimeout(resolve,20));return fixture('openai');};
  const results=await Promise.allSettled([completeLockedRouted(request('concurrent-replay')),completeLockedRouted(request('concurrent-replay'))]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(results.filter(r=>r.status==='rejected').length,1);
  assert.equal(calls,1);assert.equal(rows().length,1);
 }finally{clean();}
});

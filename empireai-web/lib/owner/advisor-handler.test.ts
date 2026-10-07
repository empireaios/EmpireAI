import test from 'node:test';
import assert from 'node:assert/strict';
import {advisorProxy} from './advisor-handler';
test('Advisor BFF bounds routes, denies anonymous and cross-origin writes, preserves owner session and structured result',async()=>{
 const original=globalThis.fetch;let calls=0;
 globalThis.fetch=async(_url,init)=>{calls++;assert.equal((init?.headers as Record<string,string>).authorization,'Bearer owner-session');return Response.json({status:'COMPLETED',importIsApproval:false,reasoning:'worker proxy timed out is quoted data'});};
 try{
  assert.equal((await advisorProxy(new Request('https://empire-ai.co/api/owner/advisor/read'),['read'])).status,401);
  assert.equal((await advisorProxy(new Request('https://empire-ai.co/api/owner/advisor/import',{method:'POST',headers:{cookie:'empireai_session=owner-session',origin:'https://evil.example'},body:'{}'}),['import'])).status,403);
  assert.equal((await advisorProxy(new Request('https://empire-ai.co/api/owner/advisor/execute',{method:'POST'}),['execute'])).status,404);
  const valid=()=>new Request('https://empire-ai.co/api/owner/advisor/import',{method:'POST',headers:{cookie:'empireai_session=owner-session',origin:'https://empire-ai.co'},body:'{}'});
  const r=await advisorProxy(valid(),['import']);assert.equal(r.status,200);assert.equal((await r.json()).reasoning,'worker proxy timed out is quoted data');assert.equal(calls,1);
  const tooBig=new Request('https://empire-ai.co/api/owner/advisor/import',{method:'POST',headers:{cookie:'empireai_session=owner-session',origin:'https://empire-ai.co'},body:'x'.repeat(96001)});assert.equal((await advisorProxy(tooBig,['import'])).status,413);assert.equal(calls,1);
  globalThis.fetch=async()=>{throw Error('unavailable');};assert.equal((await advisorProxy(valid(),['import'])).status,503);
 }finally{globalThis.fetch=original;}
});

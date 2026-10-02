import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOmissionCollector } from '../../assurance/omission-collector.mjs';
import { reconcileSnapshot } from '../../assurance/independent-assurance.mjs';

const row={status:'COMPLETED',sessionId:'s',requestId:'r',finalResult:{message:'Verified answer'}};
const reply={role:'assistant',requestId:'r',content:'Verified answer'};
const collect=(rows,history,extra={})=>createOmissionCollector({readRequests:async()=>({ok:true,scope:'durable-complete',rows,...extra}),readHistory:async()=>({sessionId:'s',history}),clock:()=>100});
test('detects unreported missing and corrupted assistant delivery independently',async()=>{
  for(const [history,status,missing] of [[[reply],'PASS',0],[[],'FAIL',1],[[{...reply,content:'different'}],'FAIL',0]]){
    const result=reconcileSnapshot(await collect([row],history)(),100,1000);
    assert.equal(result.status,status);assert.equal(result.missing,missing);
  }
});
test('incomplete inventory, duplicates and malformed terminal records fail closed',async()=>{
  await assert.rejects(collect([row],[reply],{hasMore:true})());
  await assert.rejects(collect([row],[reply],{scope:'process_local_recent_cache'})());
  await assert.rejects(collect([row,row],[reply])());
  await assert.rejects(collect([row],[reply,reply])());
  await assert.rejects(collect([{...row,finalResult:null}],[reply])());
});

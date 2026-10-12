import test from 'node:test';
import assert from 'node:assert/strict';
import {settleAfterCompletion} from './ci-clock.mjs';

function harness(views) {
  let time=0, index=0; const calls=[],events=[];
  return {calls,events,options:{
    command:async action=>{calls.push(action.kind);return {tasks:views[Math.min(index++,views.length-1)]};},
    event:row=>events.push(row),now:()=>time,pause:async ms=>{time+=ms;}
  }};
}
const complete=Array.from({length:9},()=>({status:'COMPLETE'}));
test('ninth in-flight task completes before the settlement clock advances',async()=>{
  const h=harness([[...complete.slice(0,8),{status:'RUNNING'}],complete]);
  await settleAfterCompletion(h.options);
  assert.deepEqual(h.calls,['inspect','inspect','settle']);
  assert.equal(h.events[0].drainElapsedMs,1000);
});
test('blocked ninth task cannot advance settlement',async()=>{
  const h=harness([[...complete.slice(0,8),{status:'BLOCKED'}]]);
  await assert.rejects(settleAfterCompletion(h.options),/blocked before settlement/);
  assert.ok(!h.calls.includes('settle'));
});
test('eight completed tasks are not accepted as nine; wait remains bounded',async()=>{
  const h=harness([complete.slice(0,8)]);
  await assert.rejects(settleAfterCompletion(h.options),/did not drain/);
  assert.ok(!h.calls.includes('settle'));
  assert.equal(h.calls.length,61);
});

import assert from 'node:assert/strict';
import {test} from 'node:test';
import {runOneDurableReasoningAttempt} from '../../runtime/pillow-durable-reasoning-worker.js';
import {withDrainedWork8Background} from '../../runtime/work8-background-capture.js';
const flush=()=>new Promise<void>(resolve=>setImmediate(resolve));
test('durable reasoning admission participates in local capture drain before any Redis claim',async()=>{
 let finish!:(v:boolean)=>void;let readyCalls=0,entered=false;
 const running=runOneDurableReasoningAttempt({owner:'capture-fixture',ready:()=>{readyCalls++;return new Promise(resolve=>{finish=resolve;});},execute:async()=>{throw Error('must not infer');}});
 await flush();assert.equal(readyCalls,1);
 const capture=withDrainedWork8Background(async()=>{entered=true;assert.equal(await runOneDurableReasoningAttempt({owner:'refused',ready:async()=>{readyCalls++;return true;},execute:async()=>{throw Error('must not infer');}}),false);});
 await flush();assert.equal(entered,false);finish(false);assert.equal(await running,false);await capture;assert.equal(readyCalls,1);
 await assert.rejects(runOneDurableReasoningAttempt({owner:'failure',ready:async()=>{throw Error('readiness unavailable');},execute:async()=>{throw Error('must not infer');}}),/readiness unavailable/);
 assert.equal(await withDrainedWork8Background(()=>42),42);
});

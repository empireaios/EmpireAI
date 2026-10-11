import assert from 'node:assert/strict';
import {test} from 'node:test';
import {runCaptureAwareBackground,withDrainedWork8Background} from '../../runtime/work8-background-capture.js';
import {startTwinScheduler,type Work8TwinRuntime} from '../../runtime/commerce-runtime/governed/work8-twin-runtime.js';
const flush=()=>new Promise<void>(resolve=>setImmediate(resolve));

test('local background capture drains active work, holds the real twin timer, and resumes',async t=>{
 let finish!:()=>void;const pending=new Promise<void>(resolve=>{finish=resolve;});
 const active=runCaptureAwareBackground(()=>pending);
 let entered=false,runs=0;
 const stop=startTwinScheduler(()=>({cycle:()=>{runs++;}} as unknown as Work8TwinRuntime),10);
 t.after(()=>{finish();stop();});
 let releaseCapture!:()=>void;const held=new Promise<void>(resolve=>{releaseCapture=resolve;});
 t.after(()=>releaseCapture());
 const capture=withDrainedWork8Background(async()=>{entered=true;await held;return 'sealed';});
 await runCaptureAwareBackground(()=>{runs++;});
 await flush();assert.equal(entered,false);assert.equal(runs,0);
 finish();await active;await flush();assert.equal(entered,true);
 await new Promise(resolve=>setTimeout(resolve,35));assert.equal(runs,0);
 await assert.rejects(withDrainedWork8Background(()=>{}),/unavailable/);
 releaseCapture();assert.equal(await capture,'sealed');
 await new Promise(resolve=>setTimeout(resolve,35));assert.ok(runs>0);
 stop();
});

test('failed drain never captures; thrown jobs and capture errors release admission',async()=>{
 let finish!:()=>void;const active=runCaptureAwareBackground(()=>new Promise<void>(resolve=>{finish=resolve;}));
 let captured=false;
 try{await assert.rejects(withDrainedWork8Background(()=>{captured=true;},10),/timed out/);assert.equal(captured,false);}
 finally{finish();await active;}
 await assert.rejects(runCaptureAwareBackground(()=>{throw Error('job failed');}),/job failed/);
 await assert.rejects(withDrainedWork8Background(()=>{throw Error('capture failed');}),/capture failed/);
 assert.equal(await runCaptureAwareBackground(()=>42),42);
 assert.equal(await withDrainedWork8Background(()=>43),43);
});

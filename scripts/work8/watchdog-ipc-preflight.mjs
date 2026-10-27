// Changed boundary only. Full controller admission/startup is examined once by
// o33-application-coordinator, immediately before its original capture gate.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Worker} from 'node:worker_threads';
import {watchdogWorkerArguments} from '../../backend/dist/runtime/watchdog-worker-arguments.js';
import {CONTINUITY_BUFFER_BYTES,attachContinuityHeartbeat,writeContinuityHeartbeat} from '../../backend/dist/runtime/continuity-heartbeat.js';

assert.equal(process.versions.node,'22.23.2');
const preload=fileURLToPath(new URL('../../deployment/runtime-membership-bootstrap.mjs',import.meta.url));
const other='data:text/javascript,void%200';
const inherited=['--max-old-space-size=1536','--trace-warnings','--import',other,'--import',preload,'--enable-source-maps'];
assert.deepEqual(process.execArgv,['--max-old-space-size=1536']);
const actualControllerArguments=[...process.execArgv,'--import',preload];
const actualWorkerArguments=watchdogWorkerArguments(actualControllerArguments);
assert.deepEqual(actualWorkerArguments,[]);
const expected=['--trace-warnings','--import',other,'--enable-source-maps'];
assert.deepEqual(watchdogWorkerArguments(inherited),expected);
assert.deepEqual(inherited,['--max-old-space-size=1536','--trace-warnings','--import',other,'--import',preload,'--enable-source-maps']);
assert.deepEqual(watchdogWorkerArguments(expected),expected);
assert.deepEqual(watchdogWorkerArguments([]),[]);
assert.deepEqual(watchdogWorkerArguments(['--max-old-space-size=2048']),['--max-old-space-size=2048']);
assert.throws(()=>watchdogWorkerArguments(['--max-old-space-size=1536','--max-old-space-size=1536']),/DUPLICATE_WATCHDOG_MEMORY_ARGUMENT/);
assert.throws(()=>watchdogWorkerArguments(['--import',preload,'--import',preload]),/DUPLICATE_MEMBERSHIP_PRELOAD_ARGUMENT/);
assert.throws(()=>watchdogWorkerArguments(['--import='+preload]),/AMBIGUOUS_MEMBERSHIP_PRELOAD_ARGUMENT/);
const sharedBuffer=new SharedArrayBuffer(CONTINUITY_BUFFER_BYTES);
const view=attachContinuityHeartbeat(sharedBuffer);writeContinuityHeartbeat(view);
const worker=new Worker(new URL('./watchdog-ipc-preflight-worker.mjs',import.meta.url),{
  execArgv:actualWorkerArguments,
  resourceLimits:{maxOldGenerationSizeMb:1536},
  workerData:{sharedBuffer,stallExitMs:45000,pollMs:500,bootGraceMs:600000},
});
let effectiveLimits,boundaryReadback;
try{
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('WATCHDOG_READINESS_PREFLIGHT_DEADLINE')),5000);
    const finish=(error)=>{clearTimeout(timer);error?reject(error):resolve();};
    worker.once('error',finish);
    worker.once('exit',code=>finish(Error('WATCHDOG_EXIT_BEFORE_PREFLIGHT_COMPLETION_'+code)));
    worker.on('message',message=>{
      try{
        if(message?.type==='watchdog_boundary_readback'){
          assert.equal(boundaryReadback,undefined);
          assert.deepEqual(message.arguments,actualWorkerArguments);
          assert.equal(message.limits.maxOldGenerationSizeMb,1536);
          assert.ok(Number.isSafeInteger(message.heapSizeLimit)&&message.heapSizeLimit>0);
          boundaryReadback=message;return;
        }
        assert.deepEqual(message,{type:'continuity_watchdog_ready'});
        assert.ok(boundaryReadback);finish();
      }catch(error){finish(error);}
    });
  });
  effectiveLimits={...worker.resourceLimits};
  assert.equal(effectiveLimits.maxOldGenerationSizeMb,1536);
}finally{await worker.terminate();}
assert.deepEqual(process.execArgv,['--max-old-space-size=1536']);
const out=process.env.WORK8_PREFLIGHT_EVIDENCE;
assert.ok(out&&path.isAbsolute(out));
fs.writeFileSync(out,JSON.stringify({schema:'work8-watchdog-ipc-preflight-v1',source:process.env.GITHUB_SHA,node:process.version,
  inputArguments:actualControllerArguments,workerArguments:actualWorkerArguments,effectiveLimits,boundaryReadback,
  exactPreloadAndMemoryDuplicateOnly:true,otherArgumentsPreserved:true,inputUnchanged:true,ambiguousArgumentsRefused:true,
  compiledWatchdogReady:true,controllerAdmissionExamined:false,wholeRowAccepted:false},null,2)+'\n',{flag:'wx'});

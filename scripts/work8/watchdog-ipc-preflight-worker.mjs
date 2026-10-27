import {parentPort,resourceLimits} from 'node:worker_threads';
import {getHeapStatistics} from 'node:v8';
// Read back the real thread configuration, then load the unchanged compiled
// watchdog. This fixture never replaces the controller-managed application.
parentPort.postMessage({type:'watchdog_boundary_readback',arguments:process.execArgv,
  limits:resourceLimits,heapSizeLimit:getHeapStatistics().heap_size_limit});
await import('../../backend/dist/runtime/executive-continuity-watchdog-worker.js');

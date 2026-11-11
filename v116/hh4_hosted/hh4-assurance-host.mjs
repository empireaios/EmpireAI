// Explicit fixture prerequisite before the original capture clock is started.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
export function establishRealObserverPrerequisite({containerId,source,mounted,ready}){
 assert.match(containerId,/^[a-f0-9]{64}$/);assert.equal(source,'6c1e63ba20619ee480742fd87dc810ca93152e22');
 execFileSync('docker',['exec',containerId,'node','/control/hh4-assurance-prerequisite.mjs',source],{timeout:55000,maxBuffer:1048576,stdio:['ignore','pipe','pipe']});
 const file=path.join(mounted,'hh4-assurance-prerequisite.json'),st=fs.lstatSync(file);
 assert(st.isFile()&&!st.isSymbolicLink()&&st.nlink===1&&st.size<=1048576);
 const result=JSON.parse(fs.readFileSync(file,'utf8'));
 assert.equal(result.status,'PASS_REAL_OBSERVER_PREREQUISITE_ONLY');assert.equal(result.source,source);
 assert.equal(result.fixture.root,ready.inventory.root);assert.equal(result.fixture.worker.pid,ready.workerPid);assert.equal(result.fixture.worker.startTicks,ready.workerStartTicks);
 assert.equal(result.originalHoldChanged,false);assert.equal(result.healthyRuntimeClaim,false);assert.equal(result.ownerApproval,false);
 assert.equal(result.birth,'NOT_BORN');assert.equal(result.commerce,'LOCKED');assert.equal(result.paidInference,0);assert.equal(result.externalEffects,0);
 assert.equal(result.children.length,2);assert(result.children.every(c=>c.progressCount>0&&c.identity.startTicks&&c.exit));
 assert.equal(result.allPrerequisiteObserversStopped,true);assert.equal(result.generatedWorkerStillSameIdentity,true);assert.equal(result.assuranceSchemaPresent,true);
 assert(Number.isSafeInteger(result.actualWatchdog.observedAt)&&result.actualWatchdog.observedAt<=Date.now()&&Date.now()-result.actualWatchdog.observedAt<=90000);
 assert(result.elapsedMilliseconds<53000);
 return result;
}

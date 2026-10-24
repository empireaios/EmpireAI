import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {createHh4OuterCohort} from './hh4-outer-cohort.mjs';

// Deliberately stops after real runtime readiness and external containment.
// No capture request, inspector freshness, replacement or replay is fabricated.
export async function examineReadiness({imageId,source,evidenceRoot}){
  const cohort=createHh4OuterCohort({imageId,source,evidenceRoot});
  let failure,ready,started=false,containment;
  const clock=performance.now();
  try{
    started=true;await cohort.start();
    const file=path.join(evidenceRoot,'container-evidence/hh4-worker-ready.json');
    while(!fs.existsSync(file)){
      assert.ok(performance.now()-clock<180000,'HH4_STARTUP_DEADLINE');
      assert.equal(cohort.observe().inspection.State.Running,true,'HH4_EXIT_BEFORE_READY');
      await new Promise(r=>setTimeout(r,100));
    }
    const st=fs.lstatSync(file);assert.ok(st.isFile()&&!st.isSymbolicLink()&&st.size<=1048576,'HH4_READY_FILE_INVALID');
    ready=JSON.parse(fs.readFileSync(file,'utf8'));
    assert.ok(performance.now()-clock<180000,'HH4_STARTUP_DEADLINE');
    assert.equal(ready.source,source);assert.equal(ready.event,'hh4-worker-ready');
    assert.equal(ready.stage,'ACTUAL_INDEX_STARTUP_COMPLETE');assert.match(ready.runId,/^[a-f0-9-]{36}$/);
    assert.equal(ready.inventory.source,source);assert.equal(ready.inventory.classification,'LABELLED_SYNTHETIC_INITIALIZATION');
    assert.equal(ready.inventory.completeOperationalRecovery,false);
    const observed=cohort.observe();
    assert.ok(performance.now()-clock<180000,'HH4_STARTUP_DEADLINE');
    fs.writeFileSync(path.join(evidenceRoot,'external-readiness.json'),JSON.stringify({ready,observed,elapsedMs:performance.now()-clock}),{flag:'wx',mode:0o600});
  }catch(error){failure=error;}
  finally{
    if(started){try{containment=await cohort.contain(failure?'STARTUP_OR_READINESS_FAILED':'READINESS_SCOPE_COMPLETE');}
      catch(error){failure=new AggregateError([...(failure?[failure]:[]),error],'HH4_CONTAINMENT_UNVERIFIED');}}
  }
  const result={status:failure?'FAIL':'PASS_READINESS_AND_CONTAINMENT_ONLY',source,imageId,error:failure?String(failure):null,contained:Boolean(containment),heldCapture:false,operationalRestoration:false,replay:false,protectedCustody:false,originalRequirementsAccepted:[]};
  fs.writeFileSync(path.join(evidenceRoot,'readiness-result.json'),JSON.stringify(result,null,2),{flag:'wx',mode:0o600});
  if(failure)throw failure;return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===import.meta.filename){const [imageId,source,evidenceRoot]=process.argv.slice(2);examineReadiness({imageId,source,evidenceRoot}).catch(error=>{console.error(error);process.exitCode=1;});}

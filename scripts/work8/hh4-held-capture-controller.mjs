import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {performance} from 'node:perf_hooks';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const uuid=/^[a-f0-9-]{36}$/;
const live=p=>p&&p.state!=='Z'&&p.state!=='X';
function readReceipt(file){const st=fs.lstatSync(file);assert.ok(st.isFile()&&!st.isSymbolicLink()&&st.nlink===1&&st.size<=1048576,'HH4_RECEIPT_INVALID');return JSON.parse(fs.readFileSync(file,'utf8'));}
export function validateHeldReceipt(held,ready,source,requestedAt,now){
 assert.equal(held.source,source);assert.equal(held.runId,ready.runId);assert.match(held.scopeRunId,uuid);
 assert.equal(held.workerPid,ready.workerPid);assert.equal(held.workerStartTicks,ready.workerStartTicks);
 assert.match(held.directory,/^\/tmp\/work8-generated-capture-[^/]+\/capture\/capture$/);assert.match(held.digest,/^[a-f0-9]{64}$/);
 assert.equal(held.bootAllowed,false);assert.equal(held.completeLiveState,false);
 for(const key of ['expiresAt','receivedAt','copiedAt'])assert.ok(Number.isSafeInteger(held[key]),'HH4_INVALID_TIME');
 assert.ok(held.receivedAt>=requestedAt&&held.copiedAt>=held.receivedAt&&now>=held.copiedAt,'HH4_STALE_RECEIPT');
 assert.ok(held.remainingMs>0&&held.remainingMs<=5000&&held.expiresAt-held.receivedAt>0&&held.expiresAt-held.receivedAt<=held.remainingMs,'HH4_ORIGINAL_HOLD_BOUND');
 assert.ok(now<held.expiresAt,'HH4_HOLD_EXPIRED');
}
export function validateContainmentDeadline(receipt,held,observedMono,observedAt){
 assert.ok(Number.isSafeInteger(receipt.containedAt),'HH4_CONTAINMENT_TIMESTAMP_MISSING');
 assert.ok(Number.isFinite(receipt.containedMonotonicMs)&&receipt.containedMonotonicMs>=observedMono,'HH4_CONTAINMENT_CLOCK');
 assert.ok(receipt.containedAt>=observedAt&&receipt.containedAt<held.expiresAt,'HH4_CONTAINMENT_AFTER_HOLD');
 assert.ok(receipt.containedMonotonicMs-observedMono<held.expiresAt-observedAt,'HH4_MONOTONIC_HOLD_EXPIRED');
 assert.deepEqual(receipt.survivors,[]);assert.equal(receipt.after.State.Running,false);assert.equal(receipt.after.State.Pid,0);assert.equal(receipt.noRestart,true);
}
function verifyProcess(member,expectedNamespacePid,expectedStart,suffix){
 assert.ok(live(member),'HH4_REQUIRED_PROCESS_NOT_LIVE');assert.equal(member.startTicks,expectedStart);
 const status=fs.readFileSync(`/proc/${member.pid}/status`,'utf8');const row=status.split('\n').find(x=>x.startsWith('NSpid:'));
 assert.ok(row,'HH4_NAMESPACE_ID_UNAVAILABLE');assert.equal(Number(row.trim().split(/\s+/).at(-1)),expectedNamespacePid);
 const argv=fs.readFileSync(`/proc/${member.pid}/cmdline`,'utf8').split('\0').filter(Boolean);
 assert.equal(path.basename(argv[0]),'node');assert.equal(argv.length,2);assert.ok(argv[1].endsWith('/'+suffix)||argv[1]===suffix,'HH4_WRONG_PROCESS_ENTRY');
 return {pid:member.pid,startTicks:member.startTicks,namespacePid:expectedNamespacePid,argv};
}
export async function examineHeldCapture({imageId,source,evidenceRoot}){
 const {createHh4OuterCohort,processIdentity}=await import('./hh4-outer-cohort.mjs');
 const cohort=createHh4OuterCohort({imageId,source,evidenceRoot});const origin=performance.now();
 const mounted=path.join(evidenceRoot,'container-evidence');let started=false,contained=false,held,ready,containment,failure,observedMono,observedAt,requestedAt,processes;
 const write=(file,data)=>fs.writeFileSync(path.join(evidenceRoot,file),JSON.stringify(data,null,2),{flag:'wx',mode:0o600});
 try{
  started=true;await cohort.start();const readyFile=path.join(mounted,'hh4-worker-ready.json');
  while(!fs.existsSync(readyFile)){assert.ok(performance.now()-origin<180000,'HH4_STARTUP_DEADLINE');assert.equal(cohort.observe().inspection.State.Running,true);await pause(50);}
  ready=readReceipt(readyFile);assert.equal(ready.source,source);assert.equal(ready.event,'hh4-worker-ready');assert.equal(ready.stage,'ACTUAL_INDEX_STARTUP_COMPLETE');assert.match(ready.runId,uuid);
  assert.ok(Number.isSafeInteger(ready.workerPid)&&ready.workerPid>1);assert.match(ready.workerStartTicks,/^\d+$/);
  const before=cohort.observe();assert.ok(performance.now()-origin<180000,'HH4_STARTUP_DEADLINE');
  const leader=before.members.find(p=>p.pid===before.inspection.State.Pid);assert.ok(live(leader));
  const primary=verifyProcess(leader,1,leader.startTicks,'scripts/work8/hh4-generated-primary.mjs');
  const matches=before.members.filter(p=>p.startTicks===ready.workerStartTicks&&live(p)).filter(p=>{try{verifyProcess(p,ready.workerPid,ready.workerStartTicks,'scripts/work8/hh4-generated-worker.mjs');return true;}catch{return false;}});
  assert.equal(matches.length,1,'HH4_AMBIGUOUS_WORKER');const worker=matches[0];
  assert.ok(!fs.existsSync(path.join(mounted,'hh4-held.json'))&&!fs.existsSync(path.join(mounted,'held-capture')),'HH4_STALE_CAPTURE');
  requestedAt=Date.now();const requestMono=performance.now();
  execFileSync('docker',['kill','--signal','SIGUSR2',before.inspection.Id],{timeout:5000,stdio:['ignore','pipe','pipe']});
  const file=path.join(mounted,'hh4-held.json');while(!fs.existsSync(file)){assert.ok(performance.now()-requestMono<30000,'HH4_CAPTURE_RESPONSE_DEADLINE');const current=processIdentity(primary.pid);assert.ok(live(current)&&current.startTicks===primary.startTicks,'HH4_PRIMARY_DIED_BEFORE_HELD');await pause(10);}
  held=readReceipt(file);validateHeldReceipt(held,ready,source,requestedAt,Date.now());
  const observed=cohort.observe();assert.equal(observed.inspection.Id,before.inspection.Id);assert.equal(observed.inspection.State.Pid,primary.pid);
  processes={primary:verifyProcess(observed.members.find(p=>p.pid===primary.pid),1,primary.startTicks,'scripts/work8/hh4-generated-primary.mjs'),worker:verifyProcess(observed.members.find(p=>p.pid===worker.pid),ready.workerPid,ready.workerStartTicks,'scripts/work8/hh4-generated-worker.mjs')};
  observedMono=performance.now();observedAt=Date.now();validateHeldReceipt(held,ready,source,requestedAt,Date.now());
  containment=await cohort.contain('HELD_CAPTURE_VERIFIED_CONTAIN_WITHIN_ORIGINAL_HOLD');contained=true;validateContainmentDeadline(containment,held,observedMono,observedAt);
  const require=createRequire(import.meta.url);const {verifyRuntimeRecoverySet}=require('../../deployment/work8-recovery-set.cjs');
  const manifest=verifyRuntimeRecoverySet({directory:path.join(mounted,'held-capture'),digest:held.digest});
  assert.equal(manifest.sourceCommit,source);assert.equal(manifest.bootAllowed,false);assert.equal(manifest.completeLiveState,false);
  write('held-capture-external-verification.json',{source,imageId,ready,held,processes,observedMono,observedAt,containment,manifest,verificationAfterContainment:true,elapsedMs:performance.now()-origin});
 }catch(error){failure=error;}
 finally{if(started&&!contained){try{containment=await cohort.contain('HELD_CAPTURE_FAILED');contained=true;}catch(error){failure=new AggregateError([...(failure?[failure]:[]),error],'HH4_CONTAINMENT_UNVERIFIED');}}}
 const result={status:failure?'FAIL':'PASS_HELD_CAPTURE_AND_CONTAINMENT_ONLY',source,imageId,error:failure?String(failure):null,contained,heldCapture:!failure,operationalRestoration:false,replay:false,protectedCustody:false,originalRequirementsAccepted:[]};write('held-capture-result.json',result);if(failure)throw failure;return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===import.meta.filename){const [imageId,source,evidenceRoot]=process.argv.slice(2);examineHeldCapture({imageId,source,evidenceRoot}).catch(error=>{console.error(error);process.exitCode=1;});}

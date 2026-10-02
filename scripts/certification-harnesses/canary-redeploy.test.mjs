import assert from 'node:assert/strict';
import { test } from 'node:test';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { verifyRedeployPair } from './canary-redeploy.mjs';
const probe = createRequire(import.meta.url)('../../deployment/canary-runtime-probe.cjs');
const sha = v => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
// Synthetic unit fixtures ONLY. Never exported as hosted evidence.
function fixture() {
 const ids = ['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444','55555555-5555-4555-8555-555555555555'];
 const expected={sourceCommit:'a'.repeat(40),serviceId:ids[0],probeSha256:'b'.repeat(64),launcherSha256:'c'.repeat(64)};
 const mission={missionId:'test-mission',missionName:'test-generated',currentStatus:'Created',highRisk:true,pillowConfirmed:false,grandKingApproved:false,progress:0,workers:[]};
 const result={kind:'authority_facts',message:'Birth status: NOT_BORN. Real commerce authorized: no (unauthorized).',constitutionalGate:{allowed:true}};
 const terminal=(failure=false)=>({status:200,data:{durability:{REQUEST_STATE_STORE:'redis+memory'},request:{requestId:failure?'failed-test':'authority-test',ownerId:'primary-founder',workspaceId:'ws_empire_1',status:failure?'FAILED_FATAL':'COMPLETED',failureClass:failure?'BRAIN_FATAL':'BRAIN_SUCCESS',attemptCount:1,lastError:failure?'no_llm_provider':null,finalResult:failure?null:result}}});
 const entries=Object.fromEntries(['missions','transitions','checkpoints','retries','recoveries','timeline','reports','auditTrail'].map(k=>[k,[sha(k)]]));
 const native={revision:1,mission,missionSha256:sha(mission),entries,envelopeSha256:'d'.repeat(64),bytes:4096,integrity:'ok'};
 const marker={schema:'canary-restart-marker-v2',service:ids[0],commit:expected.sourceCommit,probeSha:expected.probeSha256,expiresAt:'2026-09-23T14:00:00.000Z',beforeDeploymentId:ids[1],beforeLaunchId:ids[3],beforePassed:true,missionId:mission.missionId,missionName:mission.missionName,missionDigest:sha(mission),requestId:'authority-test',failedRequestId:'failed-test',accountIds:{founder:'primary-founder',admin:'primary-admin'},databaseAccountIds:{founder:'worker-founder',admin:'worker-admin'},nativeBefore:native,authorityDigest:sha(result),failureDigest:'e'.repeat(64)};
 const receipts=['before','after'].map((phase,i)=>{
 const checks=probe.REQUIRED[phase].map(name=>({name,pass:true}));
 Object.assign(checks.find(c=>c.name==='scope_and_runtime'),{actualProbeSha256:expected.probeSha256,actualNodeVersion:'22.23.2'});
 Object.assign(checks.find(c=>c.name==='launcher_identity'),{launcherSha256:expected.launcherSha256,launchId:ids[3+i],childPid:123});
 Object.assign(checks.find(c=>c.name==='native_mission_history'),{envelopeSha256:native.envelopeSha256,revision:1,bytes:4096});
 if(i)Object.assign(checks.find(c=>c.name==='same_candidate_restarted'),{beforeDeploymentId:ids[1],afterDeploymentId:ids[2]});
 const r={schema:'empireai-bounded-canary-probe-v2',phase,service:ids[0],commit:expected.sourceCommit,probeSha:expected.probeSha256,deploymentId:ids[1+i],nodeVersion:'22.23.2',expiresAt:marker.expiresAt,startedAt:i?'2026-09-23T13:10:00.000Z':'2026-09-23T13:00:00.000Z',finishedAt:i?'2026-09-23T13:11:00.000Z':'2026-09-23T13:01:00.000Z',checks,...probe.summarize(phase,checks),birthCertificationGranted:false,commerceAuthorized:false,productionReadiness:'NOT_PROVEN',additionalRequiredProof:Object.fromEntries(['abruptKillRecovery','redisRestartRecovery','volumeRestore','v53BirthCertification','realProviderLifecycle','absentHandlerAndDependencyExecution'].map(k=>[k,'NOT_PROVEN']))};
 r.observations={schema:'canary-sanitized-observations-v1',deploymentId:r.deploymentId,serviceId:r.service,sourceCommit:r.commit,probeSha256:r.probeSha,accounts:{primary:{founder:{id:'primary-founder',role:'founder'},admin:{id:'primary-admin',role:'admin'}},worker:{founder:{id:'worker-founder',role:'founder'},admin:{id:'worker-admin',role:'admin'}}},birth:{status:200,data:{status:'NOT_BORN',authority:{birthStatus:'NOT_BORN',technicallyReady:false,commerceStatus:'LOCKED',realCommerceAuthorized:false,waveCredit:0,independentCertification:'UNVERIFIED'}}},readiness:{status:200,data:{ready:true,workerOnline:true,workerReady:true,sessionStore:'redis',pillow:{enabled:true,ready:true,lifecycle:'running'},checks:Object.fromEntries(['tier0Primary','redis','brainWorker','brainWorkerReady','pillow'].map(k=>[k,{ok:true,ping:true}]))}},mission,missionSha256:sha(mission),native,authority:terminal(),failure:terminal(true),authorityResultSha256:marker.authorityDigest,failureResultSha256:marker.failureDigest,requestOwnerIsolationStatus:404,crossWorkspaceStatus:403}; return r;
 });
 return {expected,bundle:{schema:'pillow-canary-redeploy-bundle-v1',before:receipts[0],after:receipts[1],marker,shutdown:{serviceId:ids[0],deploymentId:ids[1],records:[{timestamp:'2026-09-23T13:05:00.000Z',msg:'primary_shutdown_complete'},{timestamp:'2026-09-23T13:05:01.000Z',event:'bounded_canary_stopped',reason:'signal',childExitCode:0,childSignal:null,forcedTermination:false,forcedSignal:null}]}}};
}
test('synthetic unit pair gives only narrow support, never complete requirement credit',()=>{
 const {bundle,expected}=fixture(); const r=verifyRedeployPair(bundle,expected);
 assert.equal(r.supportingEvidenceVerified,true,JSON.stringify(r.errors));assert.equal(r.certificationCredit,0);assert.equal(r.fullRequirementAcceptance,false);
});
for(const [name,mutate] of [
 ['missing check',b=>b.after.checks.pop()],['failed before',b=>b.before.checks[0].pass=false],
 ['same boot',b=>b.after.checks.find(c=>c.name==='launcher_identity').launchId=b.marker.beforeLaunchId],
 ['different expiry',b=>b.after.expiresAt='2026-09-23T15:00:00.000Z'],
 ['foreign account',b=>b.after.observations.accounts.worker.founder.id='foreign'],
 ['lost history',b=>b.after.observations.native.entries.missions=[]],
 ['fake result',b=>b.after.observations.authority.data.request.status='FAILED_FATAL'],
 ['missing observations',b=>delete b.after.observations],
 ['forced stop',b=>b.shutdown.records[1].forcedTermination=true],
 ['unknown shutdown',b=>b.shutdown.records.pop()],
 ['false credit',b=>b.after.birthCertificationGranted=true],
])test('rejects '+name,()=>{const {bundle,expected}=fixture();const copy=JSON.parse(JSON.stringify(bundle));mutate(copy);assert.equal(verifyRedeployPair(copy,expected).supportingEvidenceVerified,false);});

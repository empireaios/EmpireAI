import test from 'node:test';
import assert from 'node:assert/strict';
import {digest,validatePendingState} from './pending-restoration.mjs';
const source='a'.repeat(40),scope={workspaceId:'ws_empire_1',ownerEmail:'hh4-owner@example.test'};
function fixture(){
 const binding={missionId:'synthetic-1',dispatchId:'dispatch-1',workerId:'pillow-authority-reader-v1',action:'authority.snapshot.v1',scope,buildSha:source,inputHash:digest({})};
 const job={...binding,jobId:'mae_'+digest([scope.workspaceId,scope.ownerEmail,binding.missionId,binding.workerId]),status:'queued',attempts:0,createdAt:'2026-10-20T00:00:00.000Z',leaseToken:null,leaseUntil:null,receipt:null,reconciled:false,lastError:null};
 return {execution:{meta:[{id:1,scope:JSON.stringify(scope)}],jobs:[{job_id:job.jobId,document:JSON.stringify(job)}],events:[{seq:1,job_id:job.jobId,event:'durably_admitted',at:job.createdAt}]},missionRows:[],history:{missions:[{missionId:job.missionId,highRisk:false,workers:[job.workerId],currentStatus:'Running'}],checkpoints:[{missionId:job.missionId,label:'authority.snapshot.v1:dispatch-intent',state:'Running',payload:{binding}}],timeline:[{entryId:job.dispatchId,label:'dispatch:'+job.missionId,state:'Running'}],transitions:[],retries:[],recoveries:[],reports:[],auditTrail:[]}};
}
test('fresh pending capability accepts only exact singleton captured readonly state',()=>{
 const oracle=fixture();assert.equal(validatePendingState(oracle,{source,oracle}).attempts,0);
 const mutations=[
  s=>s.execution.jobs.push(s.execution.jobs[0]),
  s=>s.execution.meta[0].scope=JSON.stringify({...scope,ownerEmail:'other@example.test'}),
  s=>s.history.checkpoints.push(s.history.checkpoints[0]),
  s=>s.history.checkpoints[0].payload.binding.action='commerce.publish',
  s=>s.history.timeline[0].entryId='forged',
  s=>s.history.missions[0].highRisk=true,
  s=>s.execution.events.push(s.execution.events[0]),
  ...['action','buildSha','inputHash','workerId','dispatchId','jobId','status','attempts','leaseToken','leaseUntil','receipt','reconciled'].map(key=>s=>{const j=JSON.parse(s.execution.jobs[0].document);j[key]=key==='attempts'?1:key==='reconciled'?true:'forged';s.execution.jobs[0].document=JSON.stringify(j);})
 ];
 for(const mutate of mutations){const changed=structuredClone(oracle);mutate(changed);assert.throws(()=>validatePendingState(changed,{source,oracle}));}
 const changed=structuredClone(oracle);changed.history.auditTrail.push('unexpected');assert.throws(()=>validatePendingState(changed,{source,oracle}));
});
test('completed continuation and fresh restart bind the same receipt and history',async()=>{
 const {createHash}=await import('node:crypto');const {validatePendingPlan}=await import('./pending-restoration.mjs');
 const oracle=fixture(),completed=structuredClone(oracle),j=JSON.parse(completed.execution.jobs[0].document);
 const request=Object.fromEntries(['missionId','dispatchId','workerId','action','scope','buildSha','inputHash'].map(k=>[k,j[k]]));
 const output={kind:'actual_readonly_authority_inspection',observedAt:j.createdAt,authority:{birthStatus:'NOT_BORN',technicallyReady:false,commerceStatus:'LOCKED',realCommerceAuthorized:false,waveCredit:0,independentCertification:'UNVERIFIED',certificationReceiptIngestion:'IMPLEMENTED_UNVERIFIED_ONLY',reason:'Synthetic retained authority read'}};
 j.receipt={...request,jobId:j.jobId,status:'completed',completedAt:j.createdAt,output,outputHash:digest(output),certificationCredit:false};j.receipt.receiptId='maer_'+createHash('sha256').update(j.jobId+':'+j.receipt.outputHash).digest('hex');j.status='completed';j.attempts=1;j.reconciled=true;completed.execution.jobs[0].document=JSON.stringify(j);
 for(const event of ['readonly_claimed','readonly_output_and_receipt_committed','mission_receipt_reconciled'])completed.execution.events.push({seq:completed.execution.events.length+1,job_id:j.jobId,event,at:j.createdAt});
 completed.history.missions[0].currentStatus='Completed';completed.history.missions[0].progress=100;completed.history.missions[0].updatedAt=j.createdAt;
 const t={transitionId:'tr-1',missionId:j.missionId,fromState:'Running',toState:'Completed',timestamp:j.createdAt,reason:'Actual readonly authority inspection receipt reconciled; no Birth or commerce credit',fabricated:false,metadataVersion:'test'};
 completed.history.transitions.push(t);completed.history.timeline.push({entryId:t.transitionId,timestamp:t.timestamp,label:'Running→Completed',state:'Completed',notes:[t.reason]});
 completed.history.checkpoints.push({checkpointId:'cp-1',timestamp:j.createdAt,missionId:j.missionId,state:'Completed',label:'authority.snapshot.v1:reconciled',payload:{receiptId:j.receipt.receiptId,outputHash:j.receipt.outputHash,jobId:j.jobId,executionBuildSha:source,operation:j.action,certificationCredit:false}});
 completed.history.auditTrail.push('transition:tr-1@'+j.createdAt,'mission_saved:'+j.missionId+'@'+j.createdAt,'timeline:tr-1@'+j.createdAt,'mission_saved:'+j.missionId+'@'+j.createdAt,'checkpoint:cp-1@'+j.createdAt);
 assert.equal(validatePendingState(completed,{source,oracle,completed:true}).attempts,1);
 const capability='12345678-1234-1234-1234-123456789abc',plan={source,capability,digest:'b'.repeat(64),authorization:'FRESH_GENERATED_SINGLE_READONLY_EXAMINATION',stage:'completed',oracle,completedState:completed};
 validatePendingPlan(plan,{capability,source,state:completed,expectedDigest:'b'.repeat(64)});
 for(const mutate of [p=>p.authorization='historical-approved',p=>p.capability='wrong',p=>p.source='c'.repeat(40),p=>p.stage='leased',p=>p.digest='c'.repeat(64),p=>p.grandKingApproved=true,p=>p.completedState.history.auditTrail.push('changed')]){const changed=structuredClone(plan);mutate(changed);assert.throws(()=>validatePendingPlan(changed,{capability,source,state:completed,expectedDigest:'b'.repeat(64)}));}
 for(const mutate of [s=>s.execution.events.push(s.execution.events[2]),s=>s.history.checkpoints.shift(),s=>s.history.missions.push({missionId:'extra',workers:[],grandKingApproved:false}),s=>s.history.reports.push({missionId:'extra'}),s=>s.history.checkpoints.push({label:'other:dispatch-intent'}),s=>{const job=JSON.parse(s.execution.jobs[0].document);job.attempts=2;s.execution.jobs[0].document=JSON.stringify(job);}]){const changed=structuredClone(completed);mutate(changed);assert.throws(()=>validatePendingState(changed,{source,oracle,completed:true}));}
});

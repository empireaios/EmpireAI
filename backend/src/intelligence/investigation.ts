import {latestQualificationReview} from './work8-qualification.js';
import {qualificationDossier} from './work8-dossier.js';
import type {Evidence} from './model.js';
import {modelDraftContract} from './work8-model-draft.js';
import {enrichmentBinding,verifyCandidateContextDelivery} from './work8-enrichment.js';
import {z} from 'zod';
import {capabilities,digest,key,jobSchema,investigationToolContract,type JobInput} from './model.js';
import {IntelligenceStore,type Row} from './store.js';
import {ReadAcquirer} from './acquisition.js';
import {runIntelligenceJob} from './runtime.js';

export const investigationGrantSchema=z.object({id:key,instruction:z.string().min(40).max(8000),predecessors:z.array(key).max(4).default([]),candidateId:key.optional()}).strict();
export function authorizeInvestigation(s:IntelligenceStore,w:string,owner:string,input:unknown,financialSnapshot:Row|null=null){
 const p=investigationGrantSchema.parse(input);
 const reviewed=p.candidateId?latestQualificationReview(s,w,p.candidateId):null;
 return s.use(db=>{db.exec('BEGIN IMMEDIATE');try{
  if(db.prepare("SELECT 1 FROM objects WHERE workspace=? AND kind='investigations' AND id=?").get(w,p.id))throw Error('INVESTIGATION_EXISTS');
  const candidateBinding=p.candidateId?enrichmentBinding(s,w,p.candidateId):null;
  if(db.prepare("SELECT 1 FROM objects WHERE workspace=? AND kind='investigations' AND json_extract(body,'$.instructionHash')=? AND (?=1 OR json_extract(body,'$.candidateBinding') IS NOT NULL) LIMIT 1").get(w,digest(p.instruction),candidateBinding?1:0))throw Error('CANDIDATE_INSTRUCTION_ALREADY_BOUND');
  if(p.candidateId){const current=db.prepare('SELECT record FROM work8_qualification_reviews WHERE workspace=? AND candidate=? ORDER BY rowid DESC LIMIT 1').get(w,p.candidateId);if(digest(current?JSON.parse(String(current.record)):null)!==digest(reviewed))throw Error('QUALIFICATION_REVIEW_CHANGED');}
  const candidateDossier=candidateBinding?qualificationDossier((ws,id)=>s.get(ws,'evidence',id) as Evidence|null,w,candidateBinding,s.now(),financialSnapshot,reviewed):null;
  const row={...p,...(candidateDossier?{candidateDossier}:{}),...(candidateBinding?{candidateBinding}:{}),owner,instructionHash:digest(p.instruction),status:'AUTHORIZED',createdAt:new Date(s.now()).toISOString(),maxModelCalls:3,maxRounds:2,maxJobs:8,maxRequests:24,requestId:null,rounds:[],commerceEffects:0};
  db.prepare('INSERT INTO objects VALUES(?,?,?,?,?)').run(w,'investigations',p.id,s.now(),JSON.stringify(row));db.exec('COMMIT');return row;
 }catch(error){if(db.isTransaction)db.exec('ROLLBACK');throw error;}});
}
/** Only an explicit authenticated owner grant matching the whole instruction can activate collection. */
export function claimInvestigation(s:IntelligenceStore,w:string,requestId:string,instruction:string):Row|null{
 const hash=digest(instruction);
 return s.use(db=>{db.exec('BEGIN IMMEDIATE');try{
  const rows=db.prepare("SELECT body FROM objects WHERE workspace=? AND kind='investigations'").all(w).map(r=>JSON.parse(String(r.body)) as Row);
  const grant=rows.find(r=>r.instructionHash===hash);
  if(!grant){db.exec('COMMIT');return null;}
  if(grant.status!=='AUTHORIZED')throw Error('INVESTIGATION_ALREADY_CONSUMED');
  grant.status='RUNNING';grant.requestId=requestId;grant.startedAt=new Date(s.now()).toISOString();
  db.prepare("UPDATE objects SET body=?,updated=? WHERE workspace=? AND kind='investigations' AND id=?").run(JSON.stringify(grant),s.now(),w,grant.id);
  db.exec('COMMIT');return grant;
 }catch(e){db.exec('ROLLBACK');throw e;}});
}
const batchSchema=z.object({jobs:z.array(z.unknown()).min(1).max(4)}).strict();
export class PillowInvestigation {
 private acquirer:ReadAcquirer;
 constructor(readonly store:IntelligenceStore,readonly workspace:string,readonly grant:Row,acquirer?:ReadAcquirer){this.acquirer=acquirer??new ReadAcquirer(store);}
 context(){
  // Deliberately select opportunity-linked evidence, not just the newest internal heartbeat.
  const pinned=this.grant.candidateBinding;
  if(pinned&&digest(enrichmentBinding(this.store,this.workspace,pinned.candidateId))!==digest(pinned))throw Error('INVESTIGATION_CANDIDATE_CHANGED');
  const opportunities=pinned?[]:this.store.recent(this.workspace,'opportunities',4);
  const ids=(pinned?pinned.evidence.map((e:Row)=>e.id):[...new Set(opportunities.flatMap(o=>o.evidenceRefs??[]))]) as string[];
  const evidence=ids.slice(0,12).map(id=>this.store.get(this.workspace,'evidence',id)).filter(Boolean);
  const delivered=this.bound(evidence);if(pinned&&delivered.length!==ids.length)throw Error('CANDIDATE_CONTEXT_DELIVERY_BOUND');
  const dossier=pinned?this.grant.candidateDossier:null;
  if(pinned){if(!dossier)throw Error('CANDIDATE_DOSSIER_NOT_PINNED');const {digest:hash,...body}=dossier;if(hash!==digest(body)||dossier.workspace!==this.workspace||digest(dossier.sourceBinding)!==digest(pinned))throw Error('CANDIDATE_DOSSIER_UNVERIFIED');}
  if(pinned){const row=this.store.get(this.workspace,'investigations',this.grant.id);if(!row||row.status!=='RUNNING'||typeof row.requestId!=='string'||row.requestId!==this.grant.requestId||digest(row.candidateBinding)!==digest(pinned))throw Error('CANDIDATE_CONTEXT_GRANT_UNVERIFIED');const body={requestId:row.requestId,owner:row.owner,bindingDigest:digest(pinned),evidenceIds:ids,snapshotDigest:pinned.snapshotDigest,dossierDigest:dossier!.digest,deliveredAt:new Date(this.store.now()).toISOString()};row.candidateContextDelivery={...body,digest:digest(body)};this.store.put(this.workspace,'investigations',row.id,row);}
  return {missionId:this.grant.id,candidateBinding:pinned??null,qualificationDossier:dossier,toolContract:investigationToolContract,modelDraftContract:pinned?modelDraftContract:null,opportunities,evidence:delivered,capabilities:this.store.arsenal(this.workspace).map(c=>({id:c.id,eye:c.eye,implemented:c.implemented,status:c.availability,purpose:c.purpose,limitations:c.limitations})),bounds:{rounds:2,jobsPerRound:4,requestsPerRound:12,totalRequests:24,modelCalls:3},publicSourceIds:['amazon-analytics','cj-logistics','keepa-history','trends-access'],commercialQualification:'UNESTABLISHED'};
 }
 private bound(items:unknown[]){const result:unknown[]=[];for(const item of items){if(JSON.stringify([...result,item]).length>42000)break;result.push(item);}return result;}
 observe(content:string,round:number,provenance:unknown){
  const row=this.store.get(this.workspace,'investigations',this.grant.id)!;
  if(row.status!=='RUNNING'||row.requestId!==this.grant.requestId||round<0||round>2)throw Error('INVESTIGATION_OBSERVATION_REFUSED');
  row.modelSteps??=[];if(row.modelSteps.length!==round)throw Error('INVESTIGATION_OBSERVATION_REPLAY');
  const outputId='output_'+digest([row.id,row.requestId,round]).slice(0,40);
  this.store.put(this.workspace,'model_outputs',outputId,{id:outputId,requestId:row.requestId,missionId:row.id,round,content,validationState:'CAPTURED_BEFORE_DOWNSTREAM_VALIDATION',sha256:digest(content),provenance,at:new Date(this.store.now()).toISOString()});
  row.modelSteps.push({outputId,round,content:content.slice(0,64000),complete:content.length<=64000,sha256:digest(content),provenance,at:new Date(this.store.now()).toISOString()});
  this.store.put(this.workspace,'investigations',row.id,row);
 }
 async execute(input:unknown,round:number){
  const batch=batchSchema.parse(input);
  if(round<1||round>2||!Number.isInteger(round))throw Error('INVESTIGATION_BOUND');
  const current=this.store.get(this.workspace,'investigations',this.grant.id)!;
  if(current.status!=='RUNNING'||current.requestId!==this.grant.requestId||current.rounds.length!==round-1)throw Error('INVESTIGATION_ROUND_CONSUMED');
  const rejectedJobs:Row[]=[];const jobs:JobInput[]=[];
  for(const [index,inputJob] of batch.jobs.entries()){
   const parsed=jobSchema.safeParse(inputJob);
   let code='';let issues:unknown=[];
   if(!parsed.success){code='JOB_SCHEMA';issues=parsed.error.issues.map(i=>({path:i.path,code:i.code,message:i.message}));}
   else if(parsed.data.capabilities.some(id=>!capabilities.some(c=>c.id===id&&c.implemented&&c.id!=='keepa.history')))code='CAPABILITY_NOT_AUTHORIZED';
   else if(parsed.data.evidenceRefs.some(id=>!this.store.get(this.workspace,'evidence',id)))code='EVIDENCE_REFERENCE';
   if(code)rejectedJobs.push({index,code,issues,inputDigest:digest(inputJob)});
   else jobs.push({...parsed.data!,id:`inv_${digest([this.grant.id,round,index]).slice(0,32)}`});
  }
  if(rejectedJobs.length){const id='rejection_'+digest([current.id,round,input]).slice(0,40);this.store.put(this.workspace,'investigation_rejections',id,{id,missionId:current.id,requestId:current.requestId,round,rejectedJobs,at:new Date(this.store.now()).toISOString()});}
  if(!jobs.length)throw Error('INVESTIGATION_NO_ELIGIBLE_JOBS:'+JSON.stringify(rejectedJobs));
  if(jobs.reduce((n,j)=>n+j.requestLimit,0)>12)throw Error('INVESTIGATION_BOUND');
  const receipt:Row={round,status:'STARTED',rejectedJobs,plans:jobs,jobIds:jobs.map(j=>j.id),startedAt:new Date(this.store.now()).toISOString()};
  // Persist intent before external requests. A crash never silently replays a consumed round.
  current.rounds.push(receipt);this.store.put(this.workspace,'investigations',current.id,current);
  return this.resume(round);
 }
 /** Resume only persisted downstream intent. No model call, new plan or grant reset. */
 async resume(round:number){
  const current=this.store.get(this.workspace,'investigations',this.grant.id)!;
  const receipt=current?.rounds?.find((r:Row)=>r.round===round);
  if(current?.status!=='RUNNING'||current.requestId!==this.grant.requestId||!receipt||!['STARTED','INCOMPLETE'].includes(receipt.status))throw Error('INVESTIGATION_RESUME_REFUSED');
  const results:Row[]=[];
  for(const j of receipt.plans){
   try{
    let stored=this.store.job(this.workspace,j.id);
    if(!stored)stored=this.store.enqueue(this.workspace,'PILLOW:'+this.grant.requestId,j);
    // A RUNNING or INTERRUPTED job may already have reached its provider: never replay it.
    if(stored.status==='QUEUED')await runIntelligenceJob(this.store,this.workspace,this.acquirer,j.id,false);
    results.push(this.store.job(this.workspace,j.id)!);
   }catch{results.push(this.store.job(this.workspace,j.id)??{id:j.id,status:'NOT_ENQUEUED',evidence:[],failures:[{code:'DOWNSTREAM_STAGE_FAILED'}]});}
  }
  receipt.status=results.every(j=>!['QUEUED','RUNNING','NOT_ENQUEUED','INTERRUPTED'].includes(j.status))?'RECORDED':'INCOMPLETE';
  receipt.completedAt=new Date(this.store.now()).toISOString();receipt.jobs=results;
  receipt.evidenceIds=[...new Set(results.flatMap(j=>j.evidence))];
  this.store.put(this.workspace,'investigations',current.id,current);
  const evidence=receipt.evidenceIds.map((id:string)=>this.store.get(this.workspace,'evidence',id));
  const delivered=this.bound(evidence) as Row[];receipt.deliveredEvidenceIds=delivered.map(e=>e.id);this.store.put(this.workspace,'investigations',current.id,current);
  const result={missionId:current.id,round,jobs:results,rejectedJobs:receipt.rejectedJobs??[],evidence:delivered,omittedEvidenceIds:receipt.evidenceIds.filter((id:string)=>!receipt.deliveredEvidenceIds.includes(id)),allEvidenceIds:receipt.evidenceIds,commercialQualification:'UNESTABLISHED',commerceEffects:0,grantsAuthority:false};
  this.store.put(this.workspace,'pillow_activity','pillow_'+digest(this.grant.requestId).slice(0,32),{id:'pillow_'+digest(this.grant.requestId).slice(0,32),requestId:this.grant.requestId,missionId:current.id,jobIds:current.rounds.flatMap((r:Row)=>r.jobIds),status:receipt.status==='RECORDED'?'EVIDENCE_RETURNED':'DOWNSTREAM_INCOMPLETE',judgmentClaimed:false});
  return result;
 }
 complete(answer:string,provenance:unknown){const row=this.store.get(this.workspace,'investigations',this.grant.id)!;
  if(!row.rounds.length||row.rounds.some((r:Row)=>r.status!=='RECORDED'))throw Error('INVESTIGATION_EVIDENCE_NOT_RETURNED');
  if(row.candidateBinding){if(row.status!=='RUNNING'||row.requestId!==this.grant.requestId||!answer.trim())throw Error('CANDIDATE_ASSESSMENT_UNVERIFIED');verifyCandidateContextDelivery(row,row.candidateBinding,this.store.now());}
  if(row.candidateBinding&&digest(enrichmentBinding(this.store,this.workspace,row.candidateBinding.candidateId))!==digest(row.candidateBinding))throw Error('INVESTIGATION_CANDIDATE_CHANGED');
  row.status='ASSESSED_PENDING_ACCEPTANCE';row.assessment={...(row.candidateBinding?{candidateBinding:row.candidateBinding,dossierDigest:row.candidateDossier.digest,owner:row.owner}:{}),answer,sha256:digest(answer),provenance,at:new Date(this.store.now()).toISOString(),requestId:row.requestId,evidenceIds:row.rounds.flatMap((r:Row)=>r.deliveredEvidenceIds??[])};
  this.store.put(this.workspace,'investigations',row.id,row);
 }
 fail(error:unknown){const row=this.store.get(this.workspace,'investigations',this.grant.id)!;
  // Failure is terminal evidence, never a reset or permission to replay the grant.
  row.status='FAILED';row.failedAt=new Date(this.store.now()).toISOString();
  row.failure={stage:row.rounds.length?'EVIDENCE_OR_ASSESSMENT':'COMMISSIONING',name:error instanceof Error?error.name:'UnknownError',code:'INVESTIGATION_FAILED',requestId:row.requestId,preservedOutputIds:(row.modelSteps??[]).map((step:Row)=>step.outputId).filter(Boolean),inferenceReplayAllowed:false};
  this.store.put(this.workspace,'investigations',row.id,row);
 }
}

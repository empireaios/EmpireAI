import {z} from 'zod';
import {capabilities,digest,key,jobSchema,type JobInput} from './model.js';
import {IntelligenceStore,type Row} from './store.js';
import {ReadAcquirer} from './acquisition.js';
import {runIntelligenceJob} from './runtime.js';

export const investigationGrantSchema=z.object({id:key,instruction:z.string().min(40).max(8000),predecessors:z.array(key).max(4).default([])}).strict();
export function authorizeInvestigation(s:IntelligenceStore,w:string,owner:string,input:unknown){
 const p=investigationGrantSchema.parse(input);
 if(s.get(w,'investigations',p.id))throw Error('INVESTIGATION_EXISTS');
 const row={...p,owner,instructionHash:digest(p.instruction),status:'AUTHORIZED',createdAt:new Date(s.now()).toISOString(),maxModelCalls:3,maxRounds:2,maxJobs:8,maxRequests:24,requestId:null,rounds:[],commerceEffects:0};
 s.put(w,'investigations',p.id,row);return row;
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
const batchSchema=z.object({jobs:z.array(jobSchema).min(1).max(4)}).strict();
export class PillowInvestigation {
 private acquirer:ReadAcquirer;
 constructor(readonly store:IntelligenceStore,readonly workspace:string,readonly grant:Row,acquirer?:ReadAcquirer){this.acquirer=acquirer??new ReadAcquirer(store);}
 context(){
  // Deliberately select opportunity-linked evidence, not just the newest internal heartbeat.
  const opportunities=this.store.recent(this.workspace,'opportunities',4);
  const ids=[...new Set(opportunities.flatMap(o=>o.evidenceRefs??[]))] as string[];
  const evidence=ids.slice(0,12).map(id=>this.store.get(this.workspace,'evidence',id)).filter(Boolean);
  return {missionId:this.grant.id,opportunities,evidence:this.bound(evidence),capabilities:this.store.arsenal(this.workspace).map(c=>({id:c.id,eye:c.eye,implemented:c.implemented,status:c.availability,purpose:c.purpose,limitations:c.limitations})),bounds:{rounds:2,jobsPerRound:4,requestsPerRound:12,totalRequests:24,modelCalls:3},publicSourceIds:['amazon-analytics','cj-logistics','keepa-history','trends-access'],commercialQualification:'UNESTABLISHED'};
 }
 private bound(items:unknown[]){const result:unknown[]=[];for(const item of items){if(JSON.stringify([...result,item]).length>42000)break;result.push(item);}return result;}
 async execute(input:unknown,round:number){
  const batch=batchSchema.parse(input);
  if(round<1||round>2||!Number.isInteger(round)||batch.jobs.reduce((n,j)=>n+j.requestLimit,0)>12)throw Error('INVESTIGATION_BOUND');
  const current=this.store.get(this.workspace,'investigations',this.grant.id)!;
  if(current.status!=='RUNNING'||current.requestId!==this.grant.requestId||current.rounds.length!==round-1)throw Error('INVESTIGATION_ROUND_CONSUMED');
  // Validate the entire plan before commissioning any read. No subscription capability is added.
  for(const j of batch.jobs){
   if(j.capabilities.some(id=>!capabilities.some(c=>c.id===id&&c.implemented&&c.id!=='keepa.history')))throw Error('CAPABILITY_NOT_AUTHORIZED');
   for(const id of j.evidenceRefs)if(!this.store.get(this.workspace,'evidence',id))throw Error('EVIDENCE_REFERENCE');
  }
  const jobs=batch.jobs.map((j:JobInput,i)=>({...j,id:`inv_${digest([this.grant.id,round,i]).slice(0,32)}`}));
  const receipt:Row={round,status:'STARTED',plans:jobs,jobIds:jobs.map(j=>j.id),startedAt:new Date(this.store.now()).toISOString()};
  // Persist intent before external requests. A crash never silently replays a consumed round.
  current.rounds.push(receipt);this.store.put(this.workspace,'investigations',current.id,current);
  for(const j of jobs)this.store.enqueue(this.workspace,'PILLOW:'+this.grant.requestId,j);
  const results=await Promise.all(jobs.map(async j=>{
   await runIntelligenceJob(this.store,this.workspace,this.acquirer,j.id,false);
   return this.store.job(this.workspace,j.id)!;
  }));
  receipt.status=results.every(j=>!['QUEUED','RUNNING'].includes(j.status))?'RECORDED':'INCOMPLETE';
  receipt.completedAt=new Date(this.store.now()).toISOString();receipt.jobs=results;
  receipt.evidenceIds=[...new Set(results.flatMap(j=>j.evidence))];
  this.store.put(this.workspace,'investigations',current.id,current);
  const evidence=receipt.evidenceIds.map((id:string)=>this.store.get(this.workspace,'evidence',id));
  const delivered=this.bound(evidence) as Row[];receipt.deliveredEvidenceIds=delivered.map(e=>e.id);this.store.put(this.workspace,'investigations',current.id,current);
  const result={missionId:current.id,round,jobs:results,evidence:delivered,omittedEvidenceIds:receipt.evidenceIds.filter((id:string)=>!receipt.deliveredEvidenceIds.includes(id)),allEvidenceIds:receipt.evidenceIds,commercialQualification:'UNESTABLISHED',commerceEffects:0,grantsAuthority:false};
  this.store.put(this.workspace,'pillow_activity','pillow_'+digest(this.grant.requestId).slice(0,32),{id:'pillow_'+digest(this.grant.requestId).slice(0,32),requestId:this.grant.requestId,missionId:current.id,jobIds:current.rounds.flatMap((r:Row)=>r.jobIds),status:'EVIDENCE_RETURNED',judgmentClaimed:false});
  return result;
 }
 complete(answer:string,provenance:unknown){const row=this.store.get(this.workspace,'investigations',this.grant.id)!;
  if(!row.rounds.length||row.rounds.some((r:Row)=>r.status!=='RECORDED'))throw Error('INVESTIGATION_EVIDENCE_NOT_RETURNED');
  row.status='ASSESSED_PENDING_ACCEPTANCE';row.assessment={answer,sha256:digest(answer),provenance,at:new Date(this.store.now()).toISOString(),requestId:row.requestId,evidenceIds:row.rounds.flatMap((r:Row)=>r.deliveredEvidenceIds??[])};
  this.store.put(this.workspace,'investigations',row.id,row);
 }
}

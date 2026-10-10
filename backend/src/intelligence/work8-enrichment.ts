import type {DatabaseSync} from 'node:sqlite';
import {digest,jobSchema,type Evidence} from './model.js';
import type {IntelligenceStore,Row} from './store.js';
import {qualify as completeness} from './engines.js';
import {RetainedDiscoveryWorker} from '../runtime/commerce-runtime/governed/work8-source-discovery.js';
import {verifiedSavedSource} from '../runtime/commerce-runtime/governed/work8-source-projection.js';
import {candidateSchema} from '../runtime/commerce-runtime/governed/contracts.js';
import {qualify as commercialQualification} from '../runtime/commerce-runtime/governed/engine.js';
import {validateSavedResearch} from '../runtime/commerce-runtime/governed/evidence-bridge.js';
const dayAt=(n:number)=>new Date(n+28800000).toISOString().slice(0,10);
const kind='work8_enrichment';
const get=(db:DatabaseSync,w:string,k:string,id:string):Row|null=>{const r=db.prepare('SELECT body FROM objects WHERE workspace=? AND kind=? AND id=?').get(w,k,id);return r?JSON.parse(String(r.body)):null;};
function ledger(db:DatabaseSync,w:string){
 const rows=db.prepare("SELECT body FROM objects WHERE workspace=? AND kind='work8_enrichment_receipt' ORDER BY CAST(json_extract(body,'$.sequence') AS INTEGER) LIMIT 10001").all(w);if(rows.length>10000)throw Error('ENRICHMENT_HISTORY_BOUND');
 let previous:string|null=null;const states=new Map<string,Row>();let sequence=0;
 for(const raw of rows){const r=JSON.parse(String(raw.body)),{digest:hash,...body}=r;if(hash!==digest(body)||r.previous!==previous||r.sequence!==++sequence)throw Error('ENRICHMENT_RECEIPT_CORRUPT');previous=hash;states.set(r.state.id,r.state);}
 const head=get(db,w,'work8_enrichment_head','head');if((rows.length&&!head)||head&&(head.digest!==previous||head.sequence!==sequence))throw Error('ENRICHMENT_HEAD_CORRUPT');
 const current=db.prepare('SELECT body FROM objects WHERE workspace=? AND kind=? LIMIT 10001').all(w,kind);if(current.length!==states.size||current.length>10000)throw Error('ENRICHMENT_STATE_CORRUPT');
 for(const raw of current){const s=JSON.parse(String(raw.body));if(digest(s)!==digest(states.get(s.id)))throw Error('ENRICHMENT_STATE_CORRUPT');for(const j of s.jobs){const job=db.prepare('SELECT body FROM jobs WHERE workspace=? AND id=?').get(w,j.id);if(!job){if(s.status==='PENDING')throw Error('ENRICHMENT_JOB_MISSING');continue;}const b=JSON.parse(String(job.body));const request=jobSchema.parse({id:b.id,objective:b.objective,capabilities:b.capabilities,subject:b.subject,requestLimit:b.requestLimit,evidenceRefs:b.evidenceRefs});if(digest(request)!==j.requestDigest||b.requester!=='WORK8_ENRICHMENT:'+s.id)throw Error('ENRICHMENT_JOB_BINDING');}}
 return {states,sequence,previous};
}
function save(db:DatabaseSync,w:string,s:Row,chain:ReturnType<typeof ledger>,now:number){
 const body={id:'enrichment:'+String(chain.sequence+1).padStart(8,'0'),sequence:chain.sequence+1,previous:chain.previous,state:s,at:now},receipt={...body,digest:digest(body)};
 for(const [k,id,value] of [[kind,s.id,s],['work8_enrichment_receipt',receipt.id,receipt],['work8_enrichment_head','head',{sequence:receipt.sequence,digest:receipt.digest}]] as const)db.prepare('INSERT INTO objects VALUES(?,?,?,?,?) ON CONFLICT(workspace,kind,id) DO UPDATE SET updated=excluded.updated,body=excluded.body').run(w,k,id,now,JSON.stringify(value));
}
function sources(store:IntelligenceStore,w:string,state:Row){return state.sources.map((ref:Row)=>{const {source,freshness}=verifiedSavedSource((workspace,id)=>store.get(workspace,'evidence',id) as Evidence|null,w,ref.id,store.now());if(digest(source)!==ref.envelopeDigest||freshness!=='FRESH')throw Error('ENRICHMENT_SOURCE_CHANGED_OR_STALE');return source;}) as Evidence[];}
export function readWork8Enrichment(store:IntelligenceStore,w:string){return store.use(db=>{const {states}=ledger(db,w),all=[...states.values()],day=dayAt(store.now());return {classification:'SOURCE_ENRICHMENT_NOT_COMMERCIAL_APPROVAL',day,parentHistoryBound:10000,activeCommerceLimitUnchanged:1000,capacityStatus:all.length>=10000?'CAPACITY_BLOCKED_HISTORY_REVIEW_REQUIRED':'WITHIN_HISTORY_BOUND',generationBoundReached:all.filter(s=>(s.generations?.length??1)>=3).length,dailyParentLimit:10,dailyJobLimit:20,parents:all.length,pending:all.filter(s=>s.status==='PENDING').length,deferred:all.filter(s=>s.status==='DEFERRED').length,generationsPerParentLimit:3,parentsAdmittedToday:all.flatMap(s=>s.generations??[{day:s.day}]).filter(g=>g.day===day).length,jobsAdmittedToday:all.flatMap(s=>s.jobs).filter(j=>j.day===day).length,qualified:0,paidInference:0,externalWrites:0,candidates:[...all].sort((a,b)=>String(b.updatedAt??b.createdAt).localeCompare(String(a.updatedAt??a.createdAt))).slice(0,20),coverage:'LATEST_20_ENRICHMENT_RECORDS; COUNTS_INCLUDE_ALL_BOUNDED_RECORDS'};});}
/** One atomic transition and at most one provider job per existing scheduler tick. */
export function advanceWork8Enrichment(store:IntelligenceStore,w:string):Row{
 new RetainedDiscoveryWorker(store).read(w);
 return store.use(db=>{db.exec('BEGIN IMMEDIATE');try{
 const chain=ledger(db,w),all=[...chain.states.values()],day=dayAt(store.now());
 const finish=(state:Row)=>{save(db,w,state,chain,store.now());db.exec('COMMIT');return state;};
 const quiet=(status:string)=>{db.exec('COMMIT');return {status};};
 const defer=(state:Row,reason:string)=>{const check=candidateSchema.safeParse({productId:state.productId});return finish({...state,status:'DEFERRED',qualification:{status:'CANONICAL_INPUT_DEFERRED',qualified:false,canonicalEngineInvoked:false,missing:check.success?[]:check.error.issues.map(i=>i.path.join('.')),reviewedEvidenceVerified:false,financialInputsVerified:false},reasons:[reason,...state.reasons],updatedAt:new Date(store.now()).toISOString()});};
 let state=all.find(s=>s.status==='PENDING');
 if(!state){
  // Fresh exact-parent evidence can open a new bounded generation; old receipts remain untouched.
  const eligible=all.filter(s=>s.status==='DEFERRED'&&(s.generations?.length??1)<3).sort((a,b)=>a.id.localeCompare(b.id));
  const after=get(db,w,'work8_enrichment_refresh_cursor','cursor')?.after??'';let page=eligible.filter(s=>s.id>after).slice(0,32);if(!page.length)page=eligible.slice(0,32);
  db.prepare('INSERT INTO objects VALUES(?,?,?,?,?) ON CONFLICT(workspace,kind,id) DO UPDATE SET updated=excluded.updated,body=excluded.body').run(w,'work8_enrichment_refresh_cursor','cursor',store.now(),JSON.stringify({after:page.at(-1)?.id??'',parentPageLimit:32}));
  for(const prior of page){
   const candidates=db.prepare("SELECT body FROM objects WHERE workspace=? AND kind='evidence' AND json_extract(body,'$.provider')='CJ' AND json_extract(body,'$.capabilityId')='cj.detail' AND json_extract(body,'$.subject.id')=? ORDER BY updated DESC LIMIT 20").all(w,prior.productId);
   const fresh=candidates.map(r=>JSON.parse(String(r.body))).find(e=>e.subject.marketplace===prior.subject.marketplace&&e.facts?.response?.pid===prior.productId&&Date.parse(e.observedAt)>Date.parse(prior.updatedAt??prior.createdAt)&&Date.parse(e.staleAfter)>store.now()&&!prior.sources.some((r:Row)=>r.id===e.id));
   if(!fresh)continue;
   const admissions=all.flatMap(s=>s.generations??[{day:s.day}]);if(admissions.filter(g=>g.day===day).length>=10)return quiet('DAILY_PARENT_BOUND');
   state={...prior,status:'PENDING',stage:'DETAIL',generation:(prior.generation??0)+1,generations:[...(prior.generations??[{day:prior.day}]),{day,sourceId:fresh.id}],subject:{id:prior.productId,marketplace:fresh.subject.marketplace,...(fresh.subject.destination?{destination:fresh.subject.destination}:{})},sources:[{id:fresh.id,envelopeDigest:digest(fresh)}],processedJobs:[],qualification:null,assessment:null,evidenceSnapshotDigest:null,reasons:['COMMERCIAL_EVIDENCE_AND_FINANCIAL_INPUTS_UNESTABLISHED']};break;
  }
 }
 if(!state){
  if(all.length>=10000)return quiet('CAPACITY_BLOCKED_PARENT_HISTORY_BOUND');if(all.flatMap(s=>s.generations??[{day:s.day}]).filter(g=>g.day===day).length>=10)return quiet('DAILY_PARENT_BOUND');
  const rows=db.prepare("SELECT identity.body FROM objects identity WHERE identity.workspace=? AND identity.kind='work8_discovery_identity' AND NOT EXISTS (SELECT 1 FROM objects progress WHERE progress.workspace=identity.workspace AND progress.kind='work8_enrichment' AND progress.id=identity.id) ORDER BY identity.id LIMIT 1").all(w);
  const identity=rows.map(r=>JSON.parse(String(r.body))).find(r=>!chain.states.has(r.id));if(!identity)return quiet('NO_NEW_PARENT');
  const source=store.get(w,'evidence',identity.sourceId) as Evidence|null;if(!source)return quiet('SOURCE_MISSING');if(source.digest!==identity.sourceDigest)throw Error('DISCOVERY_SOURCE_BINDING');const origin=db.prepare("SELECT json_extract(exam.value,'$.sourceEnvelopeDigest') envelope FROM objects receipt,json_each(receipt.body,'$.examined') exam WHERE receipt.workspace=? AND receipt.kind='work8_discovery_receipt' AND json_extract(exam.value,'$.sourceId')=? AND EXISTS (SELECT 1 FROM json_each(exam.value,'$.newParentIds') parent WHERE parent.value=?) LIMIT 1").get(w,source.id,identity.productId);if(!origin||origin.envelope!==digest(source))throw Error('DISCOVERY_SOURCE_ENVELOPE_CHANGED');
  state={id:identity.id,productId:identity.productId,day,generation:0,generations:[{day}],status:'PENDING',stage:'DETAIL',subject:{id:identity.productId,marketplace:source.subject.marketplace,...(source.subject.destination?{destination:source.subject.destination}:{})},sources:[{id:source.id,envelopeDigest:digest(source)}],jobs:[],reasons:['COMMERCIAL_EVIDENCE_AND_FINANCIAL_INPUTS_UNESTABLISHED'],qualification:null,assessment:null,paidInference:0,externalWrites:0,createdAt:new Date(store.now()).toISOString()};
 }
 let evidence:Evidence[];try{evidence=sources(store,w,state);}catch{return defer(state,'SOURCE_CHANGED_OR_EXPIRED');}
 const previous=state.jobs.filter((j:Row)=>(j.generation??0)===(state.generation??0)).at(-1);if(previous){
  const job=getJob(db,w,previous.id);if(!job)return defer(state,'JOB_MISSING');if(['QUEUED','RUNNING'].includes(job.status))return quiet('JOB_PENDING');if(job.status!=='COMPLETED')return defer(state,'JOB_'+job.status+':'+(job.failures??[]).map((f:Row)=>f.code).join(','));
  if(!state.processedJobs?.includes(job.id)){
   for(const id of job.evidence){const {source,freshness}=verifiedSavedSource((workspace,eid)=>store.get(workspace,'evidence',eid) as Evidence|null,w,id,store.now());if(freshness!=='FRESH'||source.provider!=='CJ'||digest(source.subject)!==digest(job.subject)||!job.capabilities.includes(source.capabilityId))return defer(state,'ENRICHMENT_RESPONSE_SCOPE');
    const request=source.facts.request as Row,response=source.facts.response as Row;
    if(source.capabilityId==='cj.detail'&&(request?.pid!==state.productId||response?.pid!==state.productId))return defer(state,'DETAIL_PRODUCT_IDENTITY');
    if(source.capabilityId==='cj.stock'&&request?.vid!==state.subject.variant)return defer(state,'STOCK_VARIANT_IDENTITY');
    if(source.capabilityId==='cj.freight'&&(request?.endCountryCode!==state.subject.destination||request?.products?.length!==1||request.products[0].vid!==state.subject.variant))return defer(state,'FREIGHT_OPERAND_IDENTITY');
    if(!state.sources.some((r:Row)=>r.id===id))state.sources.push({id,envelopeDigest:digest(source)});
   }
   state.processedJobs=[...(state.processedJobs??[]),job.id];evidence=sources(store,w,state);
   if(state.stage==='DETAIL'){
    const detail=evidence.find(e=>e.capabilityId==='cj.detail'),response=detail?.facts.response as Row|undefined,variants=response?.variants;
    if(!Array.isArray(variants)||variants.length!==1||typeof variants[0]?.vid!=='string'||variants[0].pid&&variants[0].pid!==state.productId)return defer(state,'VARIANT_SELECTION_REQUIRED');
    if(!state.subject.destination)return defer(state,'DESTINATION_REQUIRED');state.subject={...state.subject,variant:variants[0].vid};state.stage='LOGISTICS';
   }else {state.completeness=completeness(evidence,undefined,store.now());state.evidenceSnapshotDigest=digest(state.sources);return defer(state,'REVIEWED_DEMAND_COMPETITION_DIFFERENTIATION_QUALITY_COMPLIANCE_RETURNS_MARKETPLACE_AND_MONEY_REQUIRED');}
  }
 }
 if(all.flatMap(s=>s.jobs).filter(j=>j.day===day).length>=20)return state.jobs.length?quiet('DAILY_JOB_BOUND'):defer(state,'DAILY_JOB_BOUND');
 const capabilities=state.stage==='DETAIL'?['cj.detail']:['cj.stock','cj.freight'];
 const request=jobSchema.parse({id:'work8_enrich_'+digest([w,state.id,state.generation??0,state.stage]).slice(0,40),objective:'Bounded source enrichment; no assessment or commerce authority',capabilities,subject:state.subject,requestLimit:4,evidenceRefs:state.sources.map((r:Row)=>r.id)});
 const job=store.enqueueWithin(db,w,'WORK8_ENRICHMENT:'+state.id,request);state.jobs.push({id:job.id,day,generation:state.generation??0,requestDigest:digest(request)});return finish(state);
 }catch(error){if(db.isTransaction)db.exec('ROLLBACK');throw error;}});
}
function getJob(db:DatabaseSync,w:string,id:string):Row|null{const row=db.prepare('SELECT body FROM jobs WHERE workspace=? AND id=?').get(w,id);return row?JSON.parse(String(row.body)):null;}
/** Reuse canonical hard gates only when complete supplied input exists. Does not create a mission or approval. */
export function evaluateCompleteEnrichment(store:IntelligenceStore,w:string,id:string,input:unknown){
 const state=store.use(db=>ledger(db,w).states.get(id));if(!state)throw Error('ENRICHMENT_NOT_FOUND');sources(store,w,state);
 const parsed=candidateSchema.safeParse(input);if(!parsed.success)return {status:'DEFERRED',reason:'CANONICAL_INPUT_INCOMPLETE',missing:parsed.error.issues.map(i=>i.path.join('.')),qualified:false};
 const candidate=parsed.data;if(candidate.productId!==state.productId||candidate.offer.variantId!==state.subject.variant||candidate.offer.destination!==state.subject.destination)throw Error('CANDIDATE_BINDING');
 for(const ref of [candidate.offer.provenance,...candidate.evidence.map(e=>e.provenance)])if(!state.sources.some((r:Row)=>r.id===ref.reference))throw Error('CANDIDATE_EVIDENCE_NOT_PINNED');
 validateSavedResearch(candidate,store,w,store.now());candidate.cash.available=null;candidate.cash.liabilities=null;candidate.cash.fxVerified=false;candidate.evidence=candidate.evidence.map(e=>({...e,verified:false}));const result=commercialQualification(candidate,store.now());return {status:'EVALUATED_NOT_AUTHORIZED',...result};
}
export function enrichmentBinding(store:IntelligenceStore,w:string,id:string){const state=store.use(db=>ledger(db,w).states.get(id));if(!state||state.status!=='DEFERRED'||!state.evidenceSnapshotDigest)throw Error('ENRICHMENT_NOT_READY');sources(store,w,state);return {candidateId:id,productId:state.productId,subject:state.subject,evidence:state.sources,snapshotDigest:state.evidenceSnapshotDigest};}

/** A technical context-delivery receipt is not evidence of semantic model reading. */
export function verifyCandidateContextDelivery(row:Row,binding:Row,now:number){
 const proof=row.candidateContextDelivery;if(!proof)throw Error('CANDIDATE_CONTEXT_NOT_DELIVERED');const {digest:actual,...body}=proof;
 const at=Date.parse(proof.deliveredAt),created=Date.parse(row.createdAt);
 if(actual!==digest(body)||proof.requestId!==row.requestId||proof.bindingDigest!==digest(binding)||digest(proof.evidenceIds)!==digest(binding.evidence.map((e:Row)=>e.id))||proof.snapshotDigest!==binding.snapshotDigest||![at,created].every(Number.isFinite)||at<created||at>now)throw Error('CANDIDATE_CONTEXT_DELIVERY_UNVERIFIED');return proof;
}
/** Read-only proof linkage. Unbound historical answers never become candidate assessments. */
export function linkedCompletedAssessment(store:IntelligenceStore,w:string,candidateId:string,investigationId:string,readRequest:(id:string)=>Row|null){
 const binding=enrichmentBinding(store,w,candidateId),row=store.get(w,'investigations',investigationId);if(!row||row.status!=='COMPLETE'||!row.candidateBinding||digest(row.candidateBinding)!==digest(binding)||digest(row.assessment?.candidateBinding)!==digest(binding))return {status:'UNLINKED',reason:'NO_COMPLETED_CANDIDATE_BOUND_ASSESSMENT'};
 const assessment=row.assessment,request=readRequest(row.requestId),delivery=verifyCandidateContextDelivery(row,binding,store.now());
 const assessed=Date.parse(assessment.at),closed=Date.parse(row.closure?.at);if(![assessed,closed].every(Number.isFinite)||assessed<Date.parse(delivery.deliveredAt)||closed<assessed||closed>store.now())throw Error('ASSESSMENT_CHRONOLOGY_UNVERIFIED');
 if(!Array.isArray(row.rounds)||!row.rounds.length||row.rounds.some((r:Row)=>r.status!=='RECORDED')||digest(assessment.evidenceIds)!==digest(row.rounds.flatMap((r:Row)=>r.deliveredEvidenceIds??[])))throw Error('ASSESSMENT_EVIDENCE_UNVERIFIED');
 for(const id of assessment.evidenceIds){const source=store.get(w,'evidence',id);if(source?.authenticity==='INTERNAL_UNVERIFIED'&&source.eye==='EMPIRE'&&source.provider==='EmpireAI'&&source.capabilityId==='empire.state'){if(![source.observedAt,source.retrievedAt,source.staleAfter].every(t=>typeof t==='string'&&Number.isFinite(Date.parse(t)))||Date.parse(source.observedAt)>Date.parse(source.retrievedAt)||Date.parse(source.retrievedAt)>store.now()||source.digest!==digest(source.facts)||source.grantsAuthority!==false||Date.parse(source.staleAfter)<=store.now()||Date.parse(source.observedAt)>store.now())throw Error('ASSESSMENT_INTERNAL_EVIDENCE_UNVERIFIED');}else{const {freshness}=verifiedSavedSource((workspace,eid)=>store.get(workspace,'evidence',eid) as Evidence|null,w,id,store.now());if(freshness!=='FRESH')throw Error('ASSESSMENT_EVIDENCE_EXPIRED');}}

 if(!request||request.status!=='COMPLETED'||request.requestId!==row.requestId||request.workspaceId!==w||assessment.requestId!==row.requestId||typeof assessment.answer!=='string'||!assessment.answer.trim()||digest(assessment.answer)!==assessment.sha256||digest(request.responseText)!==assessment.sha256||row.closure?.advisorReadback?.requestId!==row.requestId||row.closure?.advisorReadback?.assessmentHash!==assessment.sha256||row.closure?.advisorReadback?.attestedBy!=='AUTHENTICATED_OWNER'||!row.owner||row.closure?.owner!==row.owner)throw Error('ASSESSMENT_COMPLETION_UNVERIFIED');
 return {status:'COMPLETED_ASSESSMENT_LINKED',candidateId,investigationId,requestId:row.requestId,assessmentHash:assessment.sha256,validatedGrantOwner:row.owner,candidateBinding:binding,commercialApproval:false,ownerRecommendation:null};
}

/** Bounded plain text is visible only to the exact recorded request/grant owner. */
type OwnerAssessmentView={status:string;excerpt?:string;classification?:string;characters?:number;truncated?:boolean;[key:string]:unknown};
export function verifiedOwnerAssessmentExcerpt(store:IntelligenceStore,w:string,candidateId:string,investigationId:string,ownerId:string,readRequest:(id:string)=>Row|null):OwnerAssessmentView{
 const row=store.get(w,'investigations',investigationId);
 if(!ownerId||row?.owner!==ownerId)return {status:'ASSESSMENT_OWNER_UNVERIFIED'};
 const request=readRequest(row.requestId);
 if(request?.ownerId!==ownerId)return {status:'ASSESSMENT_OWNER_UNVERIFIED'};
 const proof=linkedCompletedAssessment(store,w,candidateId,investigationId,()=>request);
 if(proof.status!=='COMPLETED_ASSESSMENT_LINKED')return proof;
 const answer=row.assessment?.answer;
 if(proof.validatedGrantOwner!==ownerId||typeof answer!=='string'||digest(answer)!==proof.assessmentHash||row.requestId!==proof.requestId||digest(row.candidateBinding)!==digest(proof.candidateBinding))throw Error('ASSESSMENT_SNAPSHOT_CHANGED');
 const {validatedGrantOwner:_validatedOwner,...publicProof}=proof;
 return {...publicProof,classification:'OWNER_VERIFIED_MODEL_ASSESSMENT_NOT_COMMERCIAL_APPROVAL',excerpt:answer.slice(0,2000),characters:answer.length,truncated:answer.length>2000};
}

export async function readWork8EnrichmentOwner(store:IntelligenceStore,w:string,readRequest:(id:string)=>Promise<Row|null>,ownerId?:string){
 const report=readWork8Enrichment(store,w);const investigations=store.recent(w,'investigations',100);let requestReads=0;
 const candidates=[];for(const state of report.candidates){let assessment:Row={status:'NO_VERIFIED_COMPLETED_ASSESSMENT'};
 const matches=investigations.filter(i=>i.status==='COMPLETE'&&i.candidateBinding?.candidateId===state.id&&(!ownerId||i.owner===ownerId));
 for(const row of matches){if(requestReads>=5){assessment={status:'ASSESSMENT_READ_BOUND'};break;}requestReads++;try{const request=await readRequest(row.requestId);assessment=ownerId?verifiedOwnerAssessmentExcerpt(store,w,state.id,row.id,ownerId,()=>request):linkedCompletedAssessment(store,w,state.id,row.id,()=>request);if(assessment.status==='COMPLETED_ASSESSMENT_LINKED')break;}catch{assessment={status:'ASSESSMENT_PROOF_UNAVAILABLE'};}}
 candidates.push({candidateId:state.id,productId:state.productId,status:state.status,qualification:state.qualification,stage:state.stage,generation:state.generation??0,reasons:state.reasons,evidenceCount:state.sources.length,completeness:state.completeness??null,assessment:assessment.status==='COMPLETED_ASSESSMENT_LINKED'?{status:assessment.status,investigationId:assessment.investigationId,requestId:assessment.requestId,assessmentHash:assessment.assessmentHash,...(assessment.classification==='OWNER_VERIFIED_MODEL_ASSESSMENT_NOT_COMMERCIAL_APPROVAL'?{classification:assessment.classification,excerpt:assessment.excerpt,characters:assessment.characters,truncated:assessment.truncated}:{})}:assessment});}
 return {...report,candidates,assessmentReadCoverage:'LATEST_100_INVESTIGATIONS_MAX_5_REQUEST_PROOFS; NOT_ALL_HISTORY',assessmentsLinkedInDisplayedSample:candidates.filter(c=>c.assessment.status==='COMPLETED_ASSESSMENT_LINKED').length};
}

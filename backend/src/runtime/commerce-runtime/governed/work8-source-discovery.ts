import type {DatabaseSync} from 'node:sqlite';
import {digest,key,type Evidence} from '../../../intelligence/model.js';
import type {IntelligenceStore} from '../../../intelligence/store.js';
import {projectWork8Sources} from './work8-source-projection.js';

type Status='QUEUED'|'RUNNING'|'TARGET_REACHED'|'SOURCE_EXHAUSTED';
export type DiscoveryCheckpoint={id:string;workspace:string;day:string;timezone:'Asia/Singapore';classification:'RETAINED_AUTHENTIC_EVIDENCE_SCAN';target:100;sourceIds:string[];sourceDigests:string[];sourceEnvelopeDigests:string[];snapshotTruncated:boolean;cursor:number;fence:number;newCandidates:number;duplicateObservations:number;quarantinedObservations:number;status:Status;shortfall:number;qualified:0;pillowAssessments:0;ownerRecommendations:0;externalRefresh:false;paidInference:0;externalEffects:0;lastReceipt:string|null;updatedAt:string};
type TickReceipt={id:string;day:string;fence:number;previous:string|null;digest:string;checkpoint:DiscoveryCheckpoint;examined:Array<{sourceId:string;sourceDigest:string|null;sourceEnvelopeDigest:string|null;identityDigests:Array<{id:string;digest:string}>;newParentIds:string[];duplicateParentIds:string[];quarantined:Array<{productId:string|null;reason:string}>}>};
const kinds={checkpoint:'work8_discovery_checkpoint',receipt:'work8_discovery_receipt',identity:'work8_discovery_identity'};
function verifyDiscoveryIdentityLedger(db:DatabaseSync,workspace:string){
 const records=db.prepare("SELECT body FROM objects WHERE workspace=? AND kind=? ORDER BY json_extract(body,'$.day'),CAST(json_extract(body,'$.fence') AS INTEGER) LIMIT 10001").all(workspace,kinds.receipt);
 if(records.length>10000)throw Error('DISCOVERY_HISTORY_VERIFICATION_BOUND');
 const heads=new Map<string,TickReceipt>(),identities=new Map<string,string>();
 for(const record of records){
  const r=JSON.parse(String(record.body)) as TickReceipt,{digest:actual,...body}=r,prior=heads.get(r.day);
  if(digest(body)!==actual||r.previous!==(prior?.digest??null)||r.fence!==(prior?.fence??0)+1||r.checkpoint.workspace!==workspace||r.checkpoint.day!==r.day||r.checkpoint.fence!==r.fence)throw Error('DISCOVERY_RECEIPT_CORRUPT');
  if(prior&&(['sourceIds','sourceDigests','sourceEnvelopeDigests'] as const).some(field=>digest(r.checkpoint[field].slice(0,prior.checkpoint[field].length))!==digest(prior.checkpoint[field])))throw Error('DISCOVERY_SNAPSHOT_PREFIX_CHANGED');
  for(const examined of r.examined){
   if(!Array.isArray(examined.identityDigests)||examined.identityDigests.length!==examined.newParentIds.length)throw Error('DISCOVERY_IDENTITY_LINEAGE_CORRUPT');
   for(const binding of examined.identityDigests){
    if(!examined.newParentIds.some(id=>'cj:'+id===binding.id)||identities.has(binding.id))throw Error('DISCOVERY_IDENTITY_LINEAGE_CORRUPT');
    identities.set(binding.id,binding.digest);
    const stored=db.prepare('SELECT body FROM objects WHERE workspace=? AND kind=? AND id=?').get(workspace,kinds.identity,binding.id);
    if(!stored||digest(JSON.parse(String(stored.body)))!==binding.digest)throw Error('DISCOVERY_IDENTITY_LINEAGE_CORRUPT');
   }
  }
  heads.set(r.day,r);
 }
 const identityCount=Number(db.prepare('SELECT count(*) n FROM objects WHERE workspace=? AND kind=?').get(workspace,kinds.identity)?.n??0);
 if(identityCount!==identities.size)throw Error('DISCOVERY_IDENTITY_LINEAGE_CORRUPT');
 const committedDays=Number(db.prepare("SELECT count(*) n FROM objects WHERE workspace=? AND kind=? AND json_extract(body,'$.fence')>0").get(workspace,kinds.checkpoint)?.n??0);
 if(committedDays!==heads.size)throw Error('DISCOVERY_CHECKPOINT_CORRUPT');
 for(const [day,receipt] of heads){const stored=db.prepare('SELECT body FROM objects WHERE workspace=? AND kind=? AND id=?').get(workspace,kinds.checkpoint,'discovery:'+day);const checkpoint=stored?JSON.parse(String(stored.body)):null;if(!checkpoint||checkpoint.lastReceipt!==receipt.digest||digest({...checkpoint,lastReceipt:receipt.checkpoint.lastReceipt})!==digest(receipt.checkpoint))throw Error('DISCOVERY_CHECKPOINT_CORRUPT');}
}
const dayAt=(now:number)=>new Date(now+8*3600000).toISOString().slice(0,10);
/** Uses existing IntelligenceStore transactional objects; it never acquires a provider or registers a schedule. */
export class RetainedDiscoveryWorker {
 constructor(readonly store:IntelligenceStore){}
 start(workspace:string):DiscoveryCheckpoint{
  key.parse(workspace);const now=this.store.now(),day=dayAt(now),id='discovery:'+day;
  return this.store.use(db=>{db.exec('BEGIN IMMEDIATE');try{
   verifyDiscoveryIdentityLedger(db,workspace);
   const old=db.prepare('SELECT body FROM objects WHERE workspace=? AND kind=? AND id=?').get(workspace,kinds.checkpoint,id);
   if(old){db.exec('COMMIT');return this.decodeCheckpoint(String(old.body),workspace,day);}
   const rows=db.prepare("SELECT id,body FROM objects WHERE workspace=? AND kind='evidence' AND json_extract(body,'$.provider')='CJ' AND json_extract(body,'$.capabilityId') IN ('cj.catalog','cj.detail') ORDER BY updated DESC,id LIMIT 1001").all(workspace);
   const selected=rows.slice(0,1000),state:DiscoveryCheckpoint={id,workspace,day,timezone:'Asia/Singapore',classification:'RETAINED_AUTHENTIC_EVIDENCE_SCAN',target:100,sourceIds:selected.map(r=>String(r.id)),sourceDigests:selected.map(r=>String(JSON.parse(String(r.body)).digest??'')),sourceEnvelopeDigests:selected.map(r=>digest(JSON.parse(String(r.body)))),snapshotTruncated:rows.length>1000,cursor:0,fence:0,newCandidates:0,duplicateObservations:0,quarantinedObservations:0,status:selected.length?'QUEUED':'SOURCE_EXHAUSTED',shortfall:100,qualified:0,pillowAssessments:0,ownerRecommendations:0,externalRefresh:false,paidInference:0,externalEffects:0,lastReceipt:null,updatedAt:new Date(now).toISOString()};
   db.prepare('INSERT INTO objects VALUES(?,?,?,?,?)').run(workspace,kinds.checkpoint,id,now,JSON.stringify(state));db.exec('COMMIT');return state;
  }catch(e){if(db.isTransaction)db.exec('ROLLBACK');throw e;}});
 }
 private decodeCheckpoint(body:string,workspace:string,day:string){const s=JSON.parse(body) as DiscoveryCheckpoint;if(s.workspace!==workspace||s.day!==day||s.target!==100||!Number.isInteger(s.fence)||!Number.isInteger(s.cursor)||s.cursor<0||s.cursor>s.sourceIds.length||s.sourceIds.length>1000||s.sourceIds.length!==s.sourceDigests.length||!Array.isArray(s.sourceEnvelopeDigests)||s.sourceIds.length!==s.sourceEnvelopeDigests.length)throw Error('DISCOVERY_CHECKPOINT_CORRUPT');return s;}
 read(workspace:string,day=dayAt(this.store.now())):DiscoveryCheckpoint|null{
  key.parse(workspace);if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw Error('DISCOVERY_DAY_INVALID');
  return this.store.use(db=>{
   db.exec('BEGIN');try{
   verifyDiscoveryIdentityLedger(db,workspace);
   const checkpoint=db.prepare('SELECT body FROM objects WHERE workspace=? AND kind=? AND id=?').get(workspace,kinds.checkpoint,'discovery:'+day);if(!checkpoint)return null;
   const state=this.decodeCheckpoint(String(checkpoint.body),workspace,day);
   const receipts=db.prepare("SELECT body FROM objects WHERE workspace=? AND kind=? AND json_extract(body,'$.day')=? ORDER BY CAST(json_extract(body,'$.fence') AS INTEGER)").all(workspace,kinds.receipt,day);
   let previous:string|null=null,fence=0;
   for(const row of receipts){const r=JSON.parse(String(row.body)) as TickReceipt;const {digest:actual,...body}=r;if(r.fence!==++fence||r.previous!==previous||digest(body)!==actual)throw Error('DISCOVERY_RECEIPT_CORRUPT');previous=actual;}
   if(fence!==state.fence||previous!==state.lastReceipt)throw Error('DISCOVERY_CHECKPOINT_CORRUPT');
   if(receipts.length){const last=JSON.parse(String(receipts.at(-1)!.body)) as TickReceipt;if(digest({...state,lastReceipt:last.checkpoint.lastReceipt})!==digest(last.checkpoint))throw Error('DISCOVERY_CHECKPOINT_CORRUPT');}
   return state;}finally{db.exec('COMMIT');}
  });
 }
 tick(workspace:string,day:string,expectedFence:number,batchSize=4):DiscoveryCheckpoint{
  key.parse(workspace);if(day!==dayAt(this.store.now()))throw Error('DISCOVERY_DAY_EXPIRED');
  if(!Number.isInteger(expectedFence)||expectedFence<0||!Number.isInteger(batchSize)||batchSize<1||batchSize>4)throw Error('DISCOVERY_TICK_BOUND');
  // Validate durable history before each mutation, including after a process restart.
  this.read(workspace,day);
  return this.store.use(db=>{db.exec('BEGIN IMMEDIATE');try{
   verifyDiscoveryIdentityLedger(db,workspace);
   const checkpoint=db.prepare('SELECT body FROM objects WHERE workspace=? AND kind=? AND id=?').get(workspace,kinds.checkpoint,'discovery:'+day);if(!checkpoint)throw Error('DISCOVERY_NOT_STARTED');
   const state=this.decodeCheckpoint(String(checkpoint.body),workspace,day);
   const receiptId='discovery:'+day+':'+String(expectedFence+1);
   const prior=db.prepare('SELECT body FROM objects WHERE workspace=? AND kind=? AND id=?').get(workspace,kinds.receipt,receiptId);
   if(prior){const old=JSON.parse(String(prior.body)) as TickReceipt;db.exec('COMMIT');return {...old.checkpoint,lastReceipt:old.digest};}
   if(state.fence!==expectedFence)throw Error('DISCOVERY_FENCE_CONFLICT');
   if(state.status==='TARGET_REACHED'){db.exec('COMMIT');return state;}
   // Extend only the new receipt's snapshot. Previously committed batches and
   // their evidence-envelope bindings remain byte-for-byte immutable.
   const known=new Set(state.sourceIds);
   const arrivals=db.prepare("SELECT id,body FROM objects WHERE workspace=? AND kind='evidence' AND json_extract(body,'$.provider')='CJ' AND json_extract(body,'$.capabilityId') IN ('cj.catalog','cj.detail') ORDER BY updated DESC,id LIMIT 1001").all(workspace).filter(r=>!known.has(String(r.id)));
   const room=1000-state.sourceIds.length,wasTruncated=state.snapshotTruncated;state.snapshotTruncated=state.snapshotTruncated||arrivals.length>room;
   for(const arrival of arrivals.slice(0,room)){const source=JSON.parse(String(arrival.body));state.sourceIds.push(String(arrival.id));state.sourceDigests.push(String(source.digest??''));state.sourceEnvelopeDigests.push(digest(source));}
   if(state.cursor===state.sourceIds.length&&state.status==='SOURCE_EXHAUSTED'&&state.snapshotTruncated===wasTruncated){db.exec('COMMIT');return state;}
   const now=this.store.now(),examined:TickReceipt['examined']=[];
   for(let step=0;step<batchSize&&state.cursor<state.sourceIds.length&&state.newCandidates<state.target;step++){
    const sourceId=state.sourceIds[state.cursor]!,expectedDigest=state.sourceDigests[state.cursor]!,expectedEnvelopeDigest=state.sourceEnvelopeDigests[state.cursor++]!;
    const raw=db.prepare("SELECT body FROM objects WHERE workspace=? AND kind='evidence' AND id=?").get(workspace,sourceId);
    const source=raw?JSON.parse(String(raw.body)) as Evidence:null;
    const result:TickReceipt['examined'][number]={sourceId,sourceDigest:source?.digest??null,sourceEnvelopeDigest:source?digest(source):null,identityDigests:[],newParentIds:[],duplicateParentIds:[],quarantined:[]};
    if(!source||source.digest!==expectedDigest||digest(source)!==expectedEnvelopeDigest){result.quarantined.push({productId:null,reason:'SNAPSHOT_SOURCE_MISSING_OR_CHANGED'});state.quarantinedObservations++;examined.push(result);continue;}
    const projection=projectWork8Sources((w,id)=>w===workspace&&id===sourceId?source:null,workspace,[sourceId],now);
    for(const failure of projection.rejected){result.quarantined.push({productId:null,reason:failure.reason});state.quarantinedObservations++;}
    for(const product of projection.products){
     if(product.freshness!=='FRESH'){result.quarantined.push({productId:product.productId,reason:'SOURCE_EXPIRED'});state.quarantinedObservations++;continue;}
     const identityId='cj:'+product.productId;
     const existing=db.prepare('SELECT body FROM objects WHERE workspace=? AND kind=? AND id=?').get(workspace,kinds.identity,identityId);
     if(existing){result.duplicateParentIds.push(product.productId);state.duplicateObservations++;continue;}
     if(state.newCandidates>=state.target)break;
     const candidate={id:identityId,productId:product.productId,provider:'CJ',firstObservedDay:day,sourceId,sourceDigest:source.digest,observedAt:source.observedAt,screening:'DEFERRED',reasons:product.reasons,pillowAssessment:null,ownerRecommendation:null,authority:'NONE',classification:'REAL_READ_ONLY'};
     db.prepare('INSERT INTO objects VALUES(?,?,?,?,?)').run(workspace,kinds.identity,identityId,now,JSON.stringify(candidate));result.newParentIds.push(product.productId);result.identityDigests.push({id:identityId,digest:digest(candidate)});state.newCandidates++;
    }
    examined.push(result);
   }
   state.fence++;state.shortfall=state.target-state.newCandidates;state.status=state.newCandidates>=state.target?'TARGET_REACHED':state.cursor>=state.sourceIds.length?'SOURCE_EXHAUSTED':'RUNNING';state.updatedAt=new Date(now).toISOString();
   const body={id:receiptId,day,fence:state.fence,previous:state.lastReceipt,checkpoint:{...state},examined};const receipt:TickReceipt={...body,digest:digest(body)};state.lastReceipt=receipt.digest;
   db.prepare('INSERT INTO objects VALUES(?,?,?,?,?)').run(workspace,kinds.receipt,receiptId,now,JSON.stringify(receipt));
   db.prepare('UPDATE objects SET body=?,updated=? WHERE workspace=? AND kind=? AND id=?').run(JSON.stringify(state),now,workspace,kinds.checkpoint,state.id);
   db.exec('COMMIT');return state;
  }catch(e){if(db.isTransaction)db.exec('ROLLBACK');throw e;}});
 }
}

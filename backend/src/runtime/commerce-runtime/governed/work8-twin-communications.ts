import {z} from 'zod';
import {digest} from './store.js';
import type {Work8TwinRuntime} from './work8-twin-runtime.js';
const key=z.string().min(1).max(100).regex(/^[A-Za-z0-9_.:-]+$/);
const reference=z.object({sessionId:key,missionId:z.string().regex(/^[A-Za-z0-9_.:-]{1,160}$/),receiptDigest:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
export const twinCommunicationRequest=z.object({id:key,reference,threadId:key,expectedVersion:z.number().int().nonnegative(),
 action:z.enum(['RECEIVE','PREPARE','ESCALATE','RESOLVE']),
 category:z.enum(['PRODUCT_INQUIRY','SHIPPING_QUESTION','COMPLAINT','RETURN_REFUND','HOSTILE_EXCHANGE','CHARGEBACK_DISPUTE','SELLER_PERFORMANCE','UNANSWERABLE']).optional(),
 message:z.string().trim().min(1).max(4000).optional(),deadlineAt:z.number().int().nonnegative().optional()}).strict();
type Event={version:number;id:string;owner:string;workspace:string;sessionId:string;missionId:string;threadId:string;requestDigest:string;previous:string;digest:string;at:number;action:string;category:string;risk:'NORMAL'|'ELEVATED'|'HIGH';status:string;deadlineAt:number|null;message:string|null;draft:string|null;receiptDigest:string;classification:'SIMULATED_COMMUNICATION';externalEffects:0;modelAssessment:'NOT_REQUESTED'};
/** Simulated communication intake and evidence-bound response preparation.
 * No send adapter, refund authority or model inference is present. */
export class Work8TwinCommunications{
 constructor(readonly runtime:Work8TwinRuntime){runtime.store.db.exec(`CREATE TABLE IF NOT EXISTS work8_twin_communications(workspace TEXT NOT NULL,session TEXT NOT NULL,thread TEXT NOT NULL,version INTEGER NOT NULL,id TEXT NOT NULL,record TEXT NOT NULL,PRIMARY KEY(workspace,session,thread,version),UNIQUE(workspace,id));
 CREATE TRIGGER IF NOT EXISTS immutable_twin_communication_update BEFORE UPDATE ON work8_twin_communications BEGIN SELECT RAISE(ABORT,'IMMUTABLE_COMMUNICATION');END;
 CREATE TRIGGER IF NOT EXISTS immutable_twin_communication_delete BEFORE DELETE ON work8_twin_communications BEGIN SELECT RAISE(ABORT,'IMMUTABLE_COMMUNICATION');END;`);}
 private history(p:{workspace:string;owner:string},session:string,thread:string){
 this.runtime.sessions.read(p,session);const rows=this.runtime.store.db.prepare('SELECT record FROM work8_twin_communications WHERE workspace=? AND session=? AND thread=? ORDER BY version LIMIT 1001').all(p.workspace,session,thread);if(rows.length>1000)throw Error('COMMUNICATION_HISTORY_BOUND');let previous='',version=0;
 return rows.map(row=>{const e=JSON.parse(String(row.record)) as Event,{digest:hash,...body}=e;if(e.owner!==p.owner||e.workspace!==p.workspace||e.sessionId!==session||e.threadId!==thread||e.version!==++version||e.previous!==previous||digest(body)!==hash||e.externalEffects!==0)throw Error('COMMUNICATION_HISTORY_UNVERIFIED');previous=hash;return e;});
 }
 read(p:{workspace:string;owner:string},session:string){
 this.runtime.sessions.read(p,session);const ids=this.runtime.store.db.prepare('SELECT DISTINCT thread FROM work8_twin_communications WHERE workspace=? AND session=? ORDER BY thread LIMIT 101').all(p.workspace,session);if(ids.length>100)throw Error('COMMUNICATION_THREAD_BOUND');
 return ids.map(x=>{const history=this.history(p,session,String(x.thread)),latest=history.at(-1)!;return {...latest,overdue:latest.status!=='RESOLVED'&&latest.deadlineAt!==null&&this.runtime.worker.engine.clock()>latest.deadlineAt,history};}).sort((a,b)=>Number(b.overdue)-Number(a.overdue)||({HIGH:0,ELEVATED:1,NORMAL:2}[a.risk]-{HIGH:0,ELEVATED:1,NORMAL:2}[b.risk])||(a.deadlineAt??Infinity)-(b.deadlineAt??Infinity));
 }
 command(p:{workspace:string;owner:string},raw:unknown){const r=twinCommunicationRequest.parse(raw);return this.runtime.store.transaction(()=>{
 const context=this.runtime.context(p,r.reference),history=this.history(p,r.reference.sessionId,r.threadId),last=history.at(-1),requestDigest=digest({p,r});
 const prior=this.runtime.store.db.prepare('SELECT record FROM work8_twin_communications WHERE workspace=? AND id=?').get(p.workspace,r.id);if(prior){const e=JSON.parse(String(prior.record)) as Event;if(e.requestDigest!==requestDigest||!history.some(h=>h.digest===e.digest))throw Error('COMMUNICATION_IDEMPOTENCY_CONFLICT');return e;}
 if((last?.version??0)!==r.expectedVersion||history.length>=1000)throw Error('COMMUNICATION_VERSION_CONFLICT');
 if(last&&last.missionId!==r.reference.missionId)throw Error('COMMUNICATION_PRODUCT_MISMATCH');
 if(r.action!=='RECEIVE'&&!last)throw Error('COMMUNICATION_NOT_FOUND');
 if(r.action==='RECEIVE'&&(!r.category||!r.message))throw Error('COMMUNICATION_INTAKE_REQUIRED');
 if(!last&&this.read(p,r.reference.sessionId).length>=100)throw Error('COMMUNICATION_THREAD_BOUND');
 if(r.action!=='RECEIVE'&&(r.category||r.message||r.deadlineAt!==undefined))throw Error('COMMUNICATION_ACTION_FIELDS');
 const category=r.category??last!.category,high=['CHARGEBACK_DISPUTE','SELLER_PERFORMANCE','UNANSWERABLE'].includes(category)||category==='HOSTILE_EXCHANGE'&&history.some(h=>h.category==='HOSTILE_EXCHANGE');
 const calculatedRisk=high?'HIGH' as const:['COMPLAINT','RETURN_REFUND','HOSTILE_EXCHANGE'].includes(category)?'ELEVATED' as const:'NORMAL' as const;
 const unresolved=last&&last.status!=='RESOLVED';
 const rank={NORMAL:0,ELEVATED:1,HIGH:2};
 const risk=unresolved&&rank[last.risk]>rank[calculatedRisk]?last.risk:calculatedRisk;
 const deadlineAt=unresolved&&last.deadlineAt!==null?Math.min(last.deadlineAt,r.deadlineAt??last.deadlineAt):r.deadlineAt??last?.deadlineAt??null;
 const overdue=deadlineAt!==null&&this.runtime.worker.engine.clock()>deadlineAt;
 const escalation=high||risk==='HIGH'||overdue||unresolved&&last.status==='OWNER_ESCALATION';
 const session=this.runtime.sessions.read(p,r.reference.sessionId),receipt=this.runtime.store.history(session.twinWorkspace,r.reference.missionId).at(-1)!;
 const state=receipt.state as {orders?:Record<string,{outcome?:string}>};
 const draft=r.action==='PREPARE'?`Prepared for owner review — simulated communication. Product: ${context.label}. ${category==='SHIPPING_QUESTION'?Object.values(state.orders??{}).map(o=>'Recorded order status: '+String(o.outcome??'unverified')).join('; '):'Question requires review against the attached product evidence.'} No delivery date, compensation, refund or policy exception has been authorised.`:null;
 const body={version:r.expectedVersion+1,id:r.id,owner:p.owner,workspace:p.workspace,sessionId:r.reference.sessionId,missionId:r.reference.missionId,threadId:r.threadId,requestDigest,previous:last?.digest??'',at:this.runtime.worker.engine.clock(),action:r.action,category,risk,
 status:r.action==='RESOLVE'?'RESOLVED':r.action==='ESCALATE'||escalation?'OWNER_ESCALATION':r.action==='PREPARE'?'DRAFT_FOR_OWNER_REVIEW':'ASSESSMENT_REQUIRED',deadlineAt,message:r.message??null,draft,receiptDigest:receipt.digest,classification:'SIMULATED_COMMUNICATION' as const,externalEffects:0 as const,modelAssessment:'NOT_REQUESTED' as const};
 const event={...body,digest:digest(body)};this.runtime.store.db.prepare('INSERT INTO work8_twin_communications VALUES(?,?,?,?,?,?)').run(p.workspace,r.reference.sessionId,r.threadId,event.version,r.id,JSON.stringify(event));return event;
 });}
}

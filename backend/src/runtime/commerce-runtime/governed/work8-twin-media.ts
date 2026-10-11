import {z} from 'zod';import {digest} from './store.js';import type {Work8TwinRuntime} from './work8-twin-runtime.js';import type {CommerceState} from './engine.js';
const key=z.string().min(1).max(160).regex(/^[A-Za-z0-9_.:-]+$/),hash=z.string().regex(/^[a-f0-9]{64}$/);
const ref=z.object({sessionId:key,missionId:key,receiptDigest:hash}).strict();
const asset=z.object({id:key,url:z.string().url().refine(s=>s.startsWith('https://')),kind:z.enum(['IMAGE','VIDEO']),sha256:hash,sourceIdentity:z.string().min(1).max(300),rightsEvidence:z.string().min(1).max(500),rightsStatus:z.enum(['UNVERIFIED','OWNER_REVIEWED']),provenance:z.string().min(1).max(1000)}).strict();
export const twinMediaRequest=z.discriminatedUnion('action',[
 z.object({action:z.literal('REQUEST_EDIT'),id:key,reference:ref,expectedVersion:z.number().int().nonnegative(),instructions:z.string().trim().min(1).max(3000),assetIds:z.array(key).min(1).max(20)}).strict(),
 z.object({action:z.literal('PROPOSE'),id:key,reference:ref,expectedVersion:z.number().int().nonnegative(),instructions:z.string().trim().min(1).max(3000),assets:z.array(asset).min(1).max(20),editingReceipt:z.string().min(1).max(1000)}).strict(),
 z.object({action:z.enum(['APPROVE_INTERNAL','REJECT','APPROVE_EXTERNAL']),id:key,reference:ref,expectedVersion:z.number().int().positive(),batchDigest:hash,assetIds:z.array(key).min(1).max(20).optional()}).strict(),
]);
type Asset=z.infer<typeof asset>;
type Event={id:string;owner:string;workspace:string;sessionId:string;missionId:string;version:number;previous:string;digest:string;requestDigest:string;at:number;action:string;receiptDigest:string;batchDigest:string|null;assets:Asset[];selectedIds:string[];instructions:string|null;editingReceipt:string|null;status:string;externalEffects:0};
/** Durable media workflow only. Canva execution needs separately configured,
 * authorised integration; this service never fabricates edited files or sends. */
export class Work8TwinMedia{
 constructor(readonly runtime:Work8TwinRuntime){runtime.store.db.exec(`CREATE TABLE IF NOT EXISTS work8_twin_media(workspace TEXT NOT NULL,session TEXT NOT NULL,mission TEXT NOT NULL,version INTEGER NOT NULL,id TEXT NOT NULL,record TEXT NOT NULL,PRIMARY KEY(workspace,session,mission,version),UNIQUE(workspace,id));
 CREATE TRIGGER IF NOT EXISTS immutable_twin_media_update BEFORE UPDATE ON work8_twin_media BEGIN SELECT RAISE(ABORT,'IMMUTABLE_MEDIA');END;
 CREATE TRIGGER IF NOT EXISTS immutable_twin_media_delete BEFORE DELETE ON work8_twin_media BEGIN SELECT RAISE(ABORT,'IMMUTABLE_MEDIA');END;`);}
 private history(p:{workspace:string;owner:string},sessionId:string,missionId:string){
 this.runtime.sessions.read(p,sessionId);let previous='',version=0;const rows=this.runtime.store.db.prepare('SELECT record FROM work8_twin_media WHERE workspace=? AND session=? AND mission=? ORDER BY version LIMIT 501').all(p.workspace,sessionId,missionId);if(rows.length>500)throw Error('MEDIA_HISTORY_BOUND');
 return rows.map(row=>{const e=JSON.parse(String(row.record)) as Event,{digest:hash,...body}=e;if(e.workspace!==p.workspace||e.owner!==p.owner||e.sessionId!==sessionId||e.missionId!==missionId||e.version!==++version||e.previous!==previous||digest(body)!==hash||e.externalEffects!==0)throw Error('MEDIA_HISTORY_UNVERIFIED');previous=hash;return e;});
 }
 read(p:{workspace:string;owner:string},reference:z.infer<typeof ref>){
 const context=this.runtime.context(p,reference),session=this.runtime.sessions.read(p,reference.sessionId),state=this.runtime.store.history(session.twinWorkspace,reference.missionId).at(-1)!.state as unknown as CommerceState;
 const original=(state.listing?.images??[]).map((a,i)=>({id:'original-'+i,url:a.url,kind:'IMAGE' as const,sha256:a.sha256,sourceIdentity:context.productId,rightsEvidence:a.rightsEvidence,rightsStatus:'UNVERIFIED' as const,provenance:a.license}));
 const history=this.history(p,reference.sessionId,reference.missionId),proposal=history.filter(e=>e.action==='PROPOSE').at(-1)??null;
 const approval=history.filter(e=>e.action==='APPROVE_INTERNAL').at(-1)??null;
 const current=approval?{batchDigest:approval.batchDigest,assets:approval.assets.filter(a=>approval.selectedIds.includes(a.id))}:null;
 const last=history.at(-1),external=history.filter(e=>e.action==='APPROVE_EXTERNAL').at(-1)??null;
 return {version:last?.version??0,original,proposal,current,history,status:last?.status??'ORIGINAL_ONLY',reminder:current&&(!external||external.batchDigest!==current.batchDigest||external.version<(approval?.version??0))?'Approved internally; separate publication approval is outstanding.':null,sourceBindingCurrent:proposal?.receiptDigest===reference.receiptDigest,externalStatus:external&&external.receiptDigest===reference.receiptDigest&&external.version>(proposal?.version??0)&&external.version>(approval?.version??0)?'SIMULATED_SUBMISSION_INTERCEPTED':'NOT_SUBMITTED',editingCapability:'CANVA_RUNTIME_NOT_CONFIGURED',classification:'SIMULATED_MEDIA_WORKFLOW',externalEffects:0};
 }
 command(p:{workspace:string;owner:string},raw:unknown){const r=twinMediaRequest.parse(raw);return this.runtime.store.transaction(()=>{
 const view=this.read(p,r.reference),history=view.history,last=history.at(-1),requestDigest=digest({p,r});const prior=this.runtime.store.db.prepare('SELECT record FROM work8_twin_media WHERE workspace=? AND id=?').get(p.workspace,r.id);
 if(prior){const e=JSON.parse(String(prior.record)) as Event;if(e.requestDigest!==requestDigest||!history.some(h=>h.digest===e.digest))throw Error('MEDIA_IDEMPOTENCY_CONFLICT');return e;}
 if(view.version!==r.expectedVersion||history.length>=500)throw Error('MEDIA_VERSION_CONFLICT');
 let assets:Asset[]=[],selectedIds:string[]=[],batchDigest:string|null=null,status='';
 if(r.action==='REQUEST_EDIT'){
 const available=[...view.original,...(view.current?.assets??[]),...(view.proposal?.assets??[])];if(r.assetIds.some(id=>!available.some(a=>a.id===id)))throw Error('MEDIA_ASSET_NOT_FOUND');selectedIds=r.assetIds;status='EDIT_REQUEST_BLOCKED_CANVA_RUNTIME';
 }else if(r.action==='PROPOSE'){
 if(new Set(r.assets.map(a=>a.id)).size!==r.assets.length)throw Error('MEDIA_DUPLICATE_ASSET');assets=r.assets;batchDigest=digest({assets,instructions:r.instructions,editingReceipt:r.editingReceipt,reference:r.reference});status='PROPOSED_OWNER_EVIDENCE_NOT_INDEPENDENTLY_VERIFIED';
 }else{
 const proposal=view.proposal;if(!proposal||proposal.receiptDigest!==r.reference.receiptDigest||proposal.batchDigest!==r.batchDigest||history.some(e=>e.action==='REJECT'&&e.batchDigest===r.batchDigest))throw Error('MEDIA_PROPOSAL_STALE');
 assets=proposal.assets;batchDigest=proposal.batchDigest;selectedIds=r.assetIds??assets.map(a=>a.id);if(new Set(selectedIds).size!==selectedIds.length||selectedIds.some(id=>!assets.some(a=>a.id===id)))throw Error('MEDIA_ASSET_NOT_FOUND');
 if(r.action==='APPROVE_INTERNAL'){
 if(assets.filter(a=>selectedIds.includes(a.id)).some(a=>a.rightsStatus!=='OWNER_REVIEWED'))throw Error('MEDIA_RIGHTS_REVIEW_REQUIRED');status='APPROVED_INTERNALLY';
 }else if(r.action==='APPROVE_EXTERNAL'){
 const approval=history.filter(e=>e.action==='APPROVE_INTERNAL').at(-1);if(!approval||approval.batchDigest!==r.batchDigest||approval.version<proposal.version||digest(selectedIds.slice().sort())!==digest(approval.selectedIds.slice().sort()))throw Error('MEDIA_INTERNAL_APPROVAL_REQUIRED');
 status='SIMULATED_SUBMISSION_INTERCEPTED';
 }else status='REJECTED';
 }
 const body={id:r.id,owner:p.owner,workspace:p.workspace,sessionId:r.reference.sessionId,missionId:r.reference.missionId,version:view.version+1,previous:last?.digest??'',requestDigest,at:this.runtime.worker.engine.clock(),action:r.action,receiptDigest:r.reference.receiptDigest,batchDigest,assets,selectedIds,instructions:'instructions'in r?r.instructions:null,editingReceipt:'editingReceipt'in r?r.editingReceipt:null,status,externalEffects:0 as const};
 const event={...body,digest:digest(body)};this.runtime.store.db.prepare('INSERT INTO work8_twin_media VALUES(?,?,?,?,?,?)').run(p.workspace,r.reference.sessionId,r.reference.missionId,event.version,r.id,JSON.stringify(event));return event;
 });}
}

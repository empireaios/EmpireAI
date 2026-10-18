import {listingSchema} from './contracts.js';
import {z} from 'zod';import {digest} from './store.js';import type {Work8TwinRuntime} from './work8-twin-runtime.js';import type {CommerceState} from './engine.js';
const key=z.string().min(1).max(160).regex(/^[A-Za-z0-9_.:-]+$/),hash=z.string().regex(/^[a-f0-9]{64}$/);
const ref=z.object({sessionId:key,missionId:key,receiptDigest:hash}).strict();
const asset=z.object({id:key,url:z.string().max(2000).url().refine(s=>{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password;}),kind:z.enum(['IMAGE','VIDEO']),sha256:hash,sourceIdentity:z.string().min(1).max(300),rightsEvidence:z.string().min(1).max(500),rightsStatus:z.enum(['UNVERIFIED','OWNER_REVIEWED']),provenance:z.string().min(1).max(1000)}).strict();
export const twinMediaRequest=z.discriminatedUnion('action',[
 z.object({action:z.literal('REQUEST_EDIT'),id:key,reference:ref,expectedVersion:z.number().int().nonnegative(),instructions:z.string().trim().min(1).max(3000),assetIds:z.array(key).min(1).max(20)}).strict(),
 z.object({action:z.literal('PROPOSE'),id:key,reference:ref,expectedVersion:z.number().int().nonnegative(),instructions:z.string().trim().min(1).max(3000),assets:z.array(asset).min(1).max(20),editingReceipt:z.string().min(1).max(1000)}).strict(),
 z.object({action:z.literal('TRANSFER_LISTING'),id:key,reference:ref,expectedVersion:z.number().int().positive(),batchDigest:hash,targetMissionId:key}).strict(),
 z.object({action:z.literal('APPLY_LISTING'),id:key,reference:ref,expectedVersion:z.number().int().positive(),batchDigest:hash,listing:listingSchema}).strict(),
 z.object({action:z.enum(['APPROVE_INTERNAL','REJECT','APPROVE_EXTERNAL']),id:key,reference:ref,expectedVersion:z.number().int().positive(),batchDigest:hash,assetIds:z.array(key).min(1).max(20).optional()}).strict(),
]);
type Asset=z.infer<typeof asset>;
type Event={id:string;owner:string;workspace:string;sessionId:string;missionId:string;version:number;previous:string;digest:string;requestDigest:string;at:number;action:string;receiptDigest:string;batchDigest:string|null;assets:Asset[];selectedIds:string[];instructions:string|null;editingReceipt:string|null;status:string;externalEffects:0;listingBinding?:{receiptDigest:string;candidateDigest:string;listingDigest:string;approvalDigest:string};transferBinding?:{sourceReceiptDigest:string;sourceApprovalDigest:string;targetWorkspace:string;targetMissionId:string;targetReceiptDigest:string;candidateDigest:string;listingDigest:string}};
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
 const lastEdit=history.filter(e=>e.action==='REQUEST_EDIT').at(-1);
 const approval=history.filter(e=>e.action==='APPROVE_INTERNAL'&&e.version>(proposal?.version??0)&&e.version>(lastEdit?.version??0)&&e.receiptDigest===reference.receiptDigest&&e.batchDigest===proposal?.batchDigest).at(-1)??null;
 const rejected=history.some(e=>e.action==='REJECT'&&e.batchDigest===approval?.batchDigest);
 const current=approval&&!rejected?{batchDigest:approval.batchDigest,assets:approval.assets.filter(a=>approval.selectedIds.includes(a.id))}:null;
 const last=history.at(-1),external=history.filter(e=>e.action==='APPROVE_EXTERNAL').at(-1)??null;
 return {version:last?.version??0,original,proposal,current,history,status:last?.status??'ORIGINAL_ONLY',reminder:current&&(!external||external.batchDigest!==current.batchDigest||external.version<(approval?.version??0))?'Approved internally; separate publication approval is outstanding.':null,sourceBindingCurrent:proposal?.receiptDigest===reference.receiptDigest,externalStatus:!!current&&!rejected&&external&&external.batchDigest===current.batchDigest&&digest(external.selectedIds.slice().sort())===digest(approval!.selectedIds.slice().sort())&&external.receiptDigest===reference.receiptDigest&&external.version>(proposal?.version??0)&&external.version>(approval?.version??0)?'SIMULATED_SUBMISSION_INTERCEPTED':'NOT_SUBMITTED',editingCapability:'CANVA_RUNTIME_NOT_CONFIGURED',classification:'SIMULATED_MEDIA_WORKFLOW',externalEffects:0};
 }
 command(p:{workspace:string;owner:string},raw:unknown){const r=twinMediaRequest.parse(raw);return this.runtime.store.transaction(()=>{
 const view=this.read(p,r.reference),history=view.history,last=history.at(-1),requestDigest=digest({p,r});const prior=this.runtime.store.db.prepare('SELECT record FROM work8_twin_media WHERE workspace=? AND id=?').get(p.workspace,r.id);
 if(prior){const e=JSON.parse(String(prior.record)) as Event;if(e.requestDigest!==requestDigest||!history.some(h=>h.digest===e.digest))throw Error('MEDIA_IDEMPOTENCY_CONFLICT');if(r.action==='APPROVE_INTERNAL'||r.action==='APPROVE_EXTERNAL'||r.action==='APPLY_LISTING'||r.action==='TRANSFER_LISTING')throw Error('MEDIA_APPROVAL_REPLAY_STALE');return e;}
 if(view.version!==r.expectedVersion||history.length>=500)throw Error('MEDIA_VERSION_CONFLICT');
 let assets:Asset[]=[],selectedIds:string[]=[],batchDigest:string|null=null,status='';let listingBinding:Event['listingBinding'];let transferBinding:Event['transferBinding'];
 if(r.action==='TRANSFER_LISTING'){
 if(last?.action!=='APPLY_LISTING'||!last.listingBinding||last.batchDigest!==r.batchDigest)throw Error('MEDIA_LISTING_TRANSFER_STALE');
 const session=this.runtime.sessions.read(p,r.reference.sessionId),source=this.runtime.store.history(session.twinWorkspace,r.reference.missionId).at(-1)!;
 const state=source.state as unknown as CommerceState,binding=last.listingBinding;
 const approval=history.find(e=>e.digest===binding.approvalDigest&&e.action==='APPROVE_INTERNAL');
 if(source.classification!=='SYNTHETIC'||state.candidate.offer.provenance.classification!=='SYNTHETIC'||state.candidate.evidence.some(e=>e.provenance.classification!=='SYNTHETIC')||!approval||digest(approval.assets.filter(a=>approval.selectedIds.includes(a.id)))!==digest(last.assets)||digest(approval.selectedIds.slice().sort())!==digest(last.selectedIds.slice().sort())||approval.batchDigest!==r.batchDigest||source.digest!==binding.receiptDigest||state.candidateDigest!==binding.candidateDigest||state.listingDigest!==binding.listingDigest||!state.listing)throw Error('MEDIA_LISTING_BINDING_INVALID');
 assets=last.assets;selectedIds=last.selectedIds;batchDigest=last.batchDigest;
 if(assets.some(a=>a.kind!=='IMAGE'||a.rightsStatus!=='OWNER_REVIEWED'||a.sourceIdentity!==state.candidate.productId)||state.listing.images.length!==assets.length||state.listing.images.some(i=>!assets.some(a=>a.url===i.url&&a.sha256===i.sha256&&a.rightsEvidence===i.rightsEvidence&&a.provenance===i.license)))throw Error('MEDIA_LISTING_ASSET_MISMATCH');
 if(p.workspace===session.twinWorkspace||this.runtime.store.history(p.workspace,r.targetMissionId).length)throw Error('MEDIA_LISTING_TARGET_EXISTS');
 const actor={workspace:p.workspace,id:'pillow-commerce-proposer',role:'PROPOSER' as const},prefix='media-transfer:'+digest({p,id:r.id});
 this.runtime.worker.engine.execute(actor,{id:prefix+':research',missionId:r.targetMissionId,expectedVersion:0,command:{type:'research',candidate:state.candidate}});
 const target=this.runtime.worker.engine.execute(actor,{id:prefix+':listing',missionId:r.targetMissionId,expectedVersion:1,command:{type:'listing',listing:state.listing}});
 if(target.state.candidateDigest!==binding.candidateDigest||target.state.listingDigest!==binding.listingDigest||target.state.approval||target.state.review||target.state.publicationIntent)throw Error('MEDIA_LISTING_TRANSFER_DRIFT');
 transferBinding={sourceReceiptDigest:source.digest,sourceApprovalDigest:approval.digest,targetWorkspace:p.workspace,targetMissionId:r.targetMissionId,targetReceiptDigest:target.digest,candidateDigest:binding.candidateDigest,listingDigest:binding.listingDigest};status='LISTING_TRANSFERRED_REVIEW_REQUIRED';
 }else if(r.action==='APPLY_LISTING'){
 const approval=history.filter(e=>e.action==='APPROVE_INTERNAL').at(-1),current=view.current;
 if(!current||!approval||current.batchDigest!==r.batchDigest||!view.sourceBindingCurrent)throw Error('MEDIA_LISTING_APPROVAL_REQUIRED');
 assets=current.assets;selectedIds=assets.map(a=>a.id);batchDigest=current.batchDigest;
 const context=this.runtime.context(p,r.reference);
 if(assets.some(a=>a.kind!=='IMAGE'||a.rightsStatus!=='OWNER_REVIEWED'||a.sourceIdentity!==context.productId))throw Error('MEDIA_LISTING_SOURCE_OR_RIGHTS');
 if(r.listing.images.length!==assets.length||new Set(r.listing.images.map(i=>i.sha256+':'+i.url)).size!==assets.length||r.listing.images.some(i=>!assets.some(a=>a.url===i.url&&a.sha256===i.sha256&&a.rightsEvidence===i.rightsEvidence&&a.provenance===i.license)))throw Error('MEDIA_LISTING_ASSET_MISMATCH');
 const session=this.runtime.sessions.read(p,r.reference.sessionId),prior=this.runtime.store.history(session.twinWorkspace,r.reference.missionId).at(-1)!;
 const state=prior.state as unknown as CommerceState;
 // Actual canonical listing command retains original schema/provenance/admission checks,
 // and invalidates previous candidate review/owner approval. No external approval is granted.
 const receipt=this.runtime.worker.engine.execute({workspace:session.twinWorkspace,id:state.proposer,role:'PROPOSER'},{id:'media-listing:'+digest({workspace:p.workspace,id:r.id}),missionId:r.reference.missionId,expectedVersion:prior.version,command:{type:'listing',listing:r.listing}});
 listingBinding={receiptDigest:receipt.digest,candidateDigest:String(receipt.state.candidateDigest),listingDigest:String(receipt.state.listingDigest),approvalDigest:approval.digest};status='LISTING_PREPARED_REVIEW_REQUIRED';
 }else if(r.action==='REQUEST_EDIT'){
 const available=[...view.original,...(view.current?.assets??[]),...(view.proposal?.assets??[])];if(r.assetIds.some(id=>!available.some(a=>a.id===id)))throw Error('MEDIA_ASSET_NOT_FOUND');selectedIds=r.assetIds;status='EDIT_REQUEST_BLOCKED_CANVA_RUNTIME';
 }else if(r.action==='PROPOSE'){
 if(new Set(r.assets.map(a=>a.id)).size!==r.assets.length)throw Error('MEDIA_DUPLICATE_ASSET');assets=r.assets;batchDigest=digest({assets,instructions:r.instructions,editingReceipt:r.editingReceipt,reference:r.reference});status='PROPOSED_OWNER_EVIDENCE_NOT_INDEPENDENTLY_VERIFIED';
 }else{
 const proposal=view.proposal;if(!proposal||(r.action!=='REJECT'&&history.some(e=>e.action==='REQUEST_EDIT'&&e.version>proposal.version))||proposal.receiptDigest!==r.reference.receiptDigest||proposal.batchDigest!==r.batchDigest||history.some(e=>e.action==='REJECT'&&e.batchDigest===r.batchDigest))throw Error('MEDIA_PROPOSAL_STALE');
 assets=proposal.assets;batchDigest=proposal.batchDigest;selectedIds=r.assetIds??assets.map(a=>a.id);if(new Set(selectedIds).size!==selectedIds.length||selectedIds.some(id=>!assets.some(a=>a.id===id)))throw Error('MEDIA_ASSET_NOT_FOUND');
 if(r.action==='APPROVE_INTERNAL'){
 if(assets.filter(a=>selectedIds.includes(a.id)).some(a=>a.rightsStatus!=='OWNER_REVIEWED'))throw Error('MEDIA_RIGHTS_REVIEW_REQUIRED');status='APPROVED_INTERNALLY';
 }else if(r.action==='APPROVE_EXTERNAL'){
 const approval=history.filter(e=>e.action==='APPROVE_INTERNAL').at(-1);if(!view.current||!approval||approval.receiptDigest!==r.reference.receiptDigest||approval.batchDigest!==r.batchDigest||approval.version<proposal.version||digest(selectedIds.slice().sort())!==digest(approval.selectedIds.slice().sort()))throw Error('MEDIA_INTERNAL_APPROVAL_REQUIRED');
 if(history.some(e=>e.action==='APPROVE_EXTERNAL'&&e.version>approval.version))throw Error('MEDIA_APPROVAL_REPLAY_STALE');
 status='SIMULATED_SUBMISSION_INTERCEPTED';
 }else status='REJECTED';
 }
 const body={id:r.id,owner:p.owner,workspace:p.workspace,sessionId:r.reference.sessionId,missionId:r.reference.missionId,version:view.version+1,previous:last?.digest??'',requestDigest,at:this.runtime.worker.engine.clock(),action:r.action,receiptDigest:r.reference.receiptDigest,batchDigest,assets,selectedIds,instructions:'instructions'in r?r.instructions:null,editingReceipt:'editingReceipt'in r?r.editingReceipt:null,status,externalEffects:0 as const,...(listingBinding?{listingBinding}:{}),...(transferBinding?{transferBinding}:{})};
 const event={...body,digest:digest(body)};this.runtime.store.db.prepare('INSERT INTO work8_twin_media VALUES(?,?,?,?,?,?)').run(p.workspace,r.reference.sessionId,r.reference.missionId,event.version,r.id,JSON.stringify(event));return event;
 });}
}

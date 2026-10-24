import {createHash} from 'node:crypto';
import {z} from 'zod';
import {digest} from './store.js';
import type {Work8TwinMedia} from './work8-twin-media.js';
import type {VisualProviderAdapter} from '../../../orchestration/visual-generation-layer/providers/canva-visual-provider.js';

const key=z.string().min(1).max(160).regex(/^[A-Za-z0-9_.:-]+$/);
const hash=z.string().regex(/^[a-f0-9]{64}$/);
/** Exports an identified, externally edited design. This is NOT an instruction-to-edit API. */
export const canvaMediaExportRequest=z.object({
 action:z.literal('PREPARE_CANVA_EXPORT_PROPOSAL'),id:key,
 reference:z.object({sessionId:key,missionId:key,receiptDigest:hash}).strict(),
 expectedVersion:z.number().int().positive(),editRequestDigest:hash,
 designId:key,format:z.enum(['png','jpg','mp4']),expectedExportSha256:hash,
 rightsEvidence:z.string().trim().min(1).max(500),
}).strict();
type Principal={workspace:string;owner:string};
export type CanvaMediaExportBinding={principal:Principal;request:z.infer<typeof canvaMediaExportRequest>;companyId:string;sourceAssetsDigest:string;instructions:string};
/** Server-owned ports only. Never construct these from browser authority flags.
 * authorize must check current, separately granted export/download authority AND
 * rights for the exact binding on every call. readArtifact must enforce its byte
 * limit while reading and its own authorized HTTPS/redirect/host policy. */
export type CanvaMediaExportPorts={
 companyId:string;
 authorize(binding:CanvaMediaExportBinding):Promise<{bindingDigest:string;expiresAt:number}>;
 readArtifact(url:string,maxBytes:number):Promise<Uint8Array>;
 exporter?:Pick<VisualProviderAdapter,'exportDesign'>;
};

export class Work8CanvaMedia {
 constructor(readonly media:Work8TwinMedia,private readonly ports?:CanvaMediaExportPorts){
  media.runtime.store.db.exec(`CREATE TABLE IF NOT EXISTS work8_canva_export_attempts(workspace TEXT NOT NULL,session TEXT NOT NULL,mission TEXT NOT NULL,edit_digest TEXT NOT NULL,record TEXT NOT NULL,PRIMARY KEY(workspace,session,mission,edit_digest));
  CREATE TRIGGER IF NOT EXISTS immutable_canva_attempt_update BEFORE UPDATE ON work8_canva_export_attempts BEGIN SELECT RAISE(ABORT,'IMMUTABLE_CANVA_ATTEMPT');END;
  CREATE TRIGGER IF NOT EXISTS immutable_canva_attempt_delete BEFORE DELETE ON work8_canva_export_attempts BEGIN SELECT RAISE(ABORT,'IMMUTABLE_CANVA_ATTEMPT');END;`);
 }
 async prepare(p:Principal,raw:unknown){
  const r=canvaMediaExportRequest.parse(raw),ports=this.ports;
  if(!ports)throw Error('CANVA_RUNTIME_AUTHORITY_NOT_CONFIGURED');
  key.parse(ports.companyId);
  const snapshot=()=>{
   const view=this.media.read(p,r.reference),edit=view.history.at(-1);
   if(view.version!==r.expectedVersion||edit?.action!=='REQUEST_EDIT'||edit.digest!==r.editRequestDigest||edit.receiptDigest!==r.reference.receiptDigest)throw Error('CANVA_EDIT_REQUEST_STALE');
   const available=[...view.original,...(view.current?.assets??[]),...(view.proposal?.assets??[])];
   const assets=edit.selectedIds.map(id=>{
    const matches=available.filter(a=>a.id===id);
    if(!matches.length||new Set(matches.map(a=>digest(a))).size!==1)throw Error('CANVA_SOURCE_ASSET_AMBIGUOUS');
    return matches[0]!;
   });
   if(new Set(edit.selectedIds).size!==edit.selectedIds.length)throw Error('CANVA_SOURCE_ASSET_AMBIGUOUS');
   return {principal:p,request:r,companyId:ports.companyId,sourceAssetsDigest:digest(assets),instructions:edit.instructions!};
  };
  const binding=snapshot(),bindingDigest=digest(binding);
  const check=async()=>{
   const grant=await ports.authorize(structuredClone(binding));
   if(grant?.bindingDigest!==bindingDigest||!Number.isFinite(grant.expiresAt)||grant.expiresAt<=this.media.runtime.worker.engine.clock())throw Error('CANVA_RUNTIME_AUTHORITY_DENIED');
   if(digest(snapshot())!==bindingDigest)throw Error('CANVA_EDIT_REQUEST_STALE');
  };
  await check();
  // Commit intent before the first possible external operation. An unknown outcome
  // is never silently retried, including after process restart or under a new ID.
  const intent={binding,bindingDigest,at:this.media.runtime.worker.engine.clock(),status:'ATTEMPT_RESERVED_NO_AUTOMATIC_RETRY'};
  this.media.runtime.store.transaction(()=>{
   if(digest(snapshot())!==bindingDigest)throw Error('CANVA_EDIT_REQUEST_STALE');
   const db=this.media.runtime.store.db;
   if(db.prepare('SELECT 1 FROM work8_twin_media WHERE workspace=? AND id=?').get(p.workspace,r.id))throw Error('CANVA_PROPOSAL_ID_CONFLICT');
   if(db.prepare('SELECT 1 FROM work8_canva_export_attempts WHERE workspace=? AND session=? AND mission=? AND edit_digest=?').get(p.workspace,r.reference.sessionId,r.reference.missionId,r.editRequestDigest))throw Error('CANVA_EXPORT_ALREADY_ATTEMPTED_RECONCILIATION_REQUIRED');
   db.prepare('INSERT INTO work8_canva_export_attempts VALUES(?,?,?,?,?)').run(p.workspace,r.reference.sessionId,r.reference.missionId,r.editRequestDigest,JSON.stringify(intent));
  });
  const exporter=ports.exporter??(await import('../../../orchestration/visual-generation-layer/providers/canva-visual-provider.js')).getVisualProvider('canva');
  await check();
  const result=await exporter.exportDesign({workspaceId:p.workspace,companyId:ports.companyId,useCase:'media',providerId:'canva',designId:r.designId,format:r.format});
  if(result.provider!=='canva'||result.status!=='success'||result.designId!==r.designId||result.exportFormat!==r.format||result.useCase!=='media'||result.usageMetadata.mock!==false||result.usageMetadata.operation!=='export_design'||result.errors.length||!result.exportLocation)throw Error('CANVA_EXPORT_UNVERIFIED');
  const url=new URL(result.exportLocation);
  if(url.protocol!=='https:'||url.username||url.password||result.exportLocation.length>2000)throw Error('CANVA_EXPORT_UNVERIFIED');
  await check();
  const bytes=await ports.readArtifact(result.exportLocation,20*1024*1024);
  if(!bytes.length||bytes.length>20*1024*1024||createHash('sha256').update(bytes).digest('hex')!==r.expectedExportSha256)throw Error('CANVA_EXPORT_HASH_MISMATCH');
  await check();
  // Proposal only. No inherited rights review, internal approval or publication.
  return this.media.command(p,{action:'PROPOSE',id:r.id,reference:r.reference,expectedVersion:r.expectedVersion,instructions:binding.instructions,
   editingReceipt:JSON.stringify({kind:'CANVA_EXTERNALLY_EDITED_DESIGN_EXPORT',bindingDigest,intentDigest:digest(intent),resultDigest:digest(result),editRequestDigest:r.editRequestDigest}),
   assets:[{id:r.id,url:result.exportLocation,kind:r.format==='mp4'?'VIDEO':'IMAGE',sha256:r.expectedExportSha256,sourceIdentity:'canva:'+r.designId,rightsEvidence:r.rightsEvidence,rightsStatus:'UNVERIFIED',provenance:'Canva design export; edit instructions not executed or independently verified. Binding '+bindingDigest}],
  });
 }
}

import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import type {DatabaseSync} from 'node:sqlite';
import {assertOwnerWritesReleased} from '../../owner-write-restriction.js';
import {readConnectorSourceCandidates} from './work8-connector-source.js';

// Real, private media preparation is separate from synthetic CommerceState missions.
// Only two independently retained assets can enter this adapter; there is no URL fetch,
// editor invocation, listing mutation, qualification or publication capability.
type Row=Record<string,unknown>;
type Principal={workspace:string;owner:string};
type Reference={candidateId:string;candidateDigest:string};
type Asset={id:string;kind:'IMAGE';mime:string;bytes:number;sha256:string;sourceIdentity:string;rights:'PRIVATE_FACTUAL_PREPARATION_ONLY';provenance:string};
type Event={schema:string;id:string;workspace:string;owner:string;candidateId:string;candidateDigest:string;version:number;previous:string;digest:string;requestDigest:string;atUTC:string;action:string;assetIds:string[];assets:Asset[];batchDigest:string|null;instructions:string|null;editingReceipt:string|null;editRequestDigest:string|null;status:string;bindingDigest:string;ownerApproval:boolean;externalEffects:0;paidInference:0};
type Request={id:string;reference:Reference;expectedVersion:number;action:'REQUEST_EDIT'|'PROPOSE_RETAINED'|'APPROVE_INTERNAL'|'REJECT';instructions?:string;assetIds?:string[];batchDigest?:string};
const TABLE='work8_connector_media',RIGHTS='PRIVATE_FACTUAL_PREPARATION_ONLY' as const;
const MAX_EVENTS=128,MAX_RESPONSE_BYTES=3*1024*1024;
const PID='2610240019051639200',VID='2610240019061630200',SKU='CJYD335906902BY';
const ORIGINAL='4fe19c2fbe0907474d053181a5568489d842421e0dbd2b627e487cca61511048',REVISED='69f1f95ab622041332d5e5e1ee43a59a2c34bd017151a6bb45e260f69e035788';
const REVIEW='bd45ebfea787feef24dcd429044672c7aab4a76bd0176c0217070dc3432777d0';
const SOURCE=`CJ product ${PID} / variant ${VID} / SKU ${SKU}`;
const sha=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
const digest=(value:unknown)=>sha(JSON.stringify(value));
function fail(code:string):never{throw Error('CONNECTOR_MEDIA_'+code);}
const row=(v:unknown):Row=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Row:fail('OBJECT');
const exact=(r:Row,keys:string[])=>{if(Object.keys(r).sort().join(',')!==keys.sort().join(','))fail('KEYS');};
const key=(v:unknown)=>typeof v==='string'&&/^[A-Za-z0-9_.:-]{1,160}$/.test(v)?v:fail('KEY');
const hash=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v)?v:fail('HASH');
function principal(p:Principal){if(p.workspace!=='ws_empire_1')fail('WORKSPACE');key(p.owner);return p;}
function request(raw:unknown):Request{
 const r=row(raw),reference=row(r.reference);exact(reference,['candidateId','candidateDigest']);
 const action=r.action;if(!['REQUEST_EDIT','PROPOSE_RETAINED','APPROVE_INTERNAL','REJECT'].includes(String(action)))fail('ACTION');
 const keys=['id','reference','expectedVersion','action'];
 if(action==='REQUEST_EDIT')keys.push('instructions','assetIds');
 if(action==='APPROVE_INTERNAL'||action==='REJECT'){keys.push('batchDigest');if('assetIds'in r)keys.push('assetIds');hash(r.batchDigest);}
 exact(r,keys);key(r.id);key(reference.candidateId);hash(reference.candidateDigest);
 if(!Number.isSafeInteger(r.expectedVersion)||Number(r.expectedVersion)<0)fail('VERSION');
 if(action==='REQUEST_EDIT'&&(typeof r.instructions!=='string'||r.instructions!==r.instructions.trim()||!r.instructions.length||r.instructions.length>3000))fail('INSTRUCTIONS');
 if('assetIds'in r){if(!Array.isArray(r.assetIds)||r.assetIds.length<1||r.assetIds.length>2||new Set(r.assetIds).size!==r.assetIds.length)fail('ASSETS');r.assetIds.forEach(key);}
 return {id:key(r.id),reference:{candidateId:key(reference.candidateId),candidateDigest:hash(reference.candidateDigest)},expectedVersion:Number(r.expectedVersion),action:action as Request['action'],...('instructions'in r?{instructions:r.instructions as string}:{}),...('assetIds'in r?{assetIds:r.assetIds as string[]}:{}),...('batchDigest'in r?{batchDigest:r.batchDigest as string}:{})};
}
function candidate(db:DatabaseSync,p:Principal){
 principal(p);const view=readConnectorSourceCandidates(db,p.workspace);if(view.candidates.length!==1)fail('SOURCE_UNAVAILABLE');
 const c=row(view.candidates[0]),s=row(c.source);
 if(s.supplierProductId!==PID||s.supplierVariantId!==VID||s.supplierSKU!==SKU||c.ownerApproval!==false||c.qualifiedDossierAdmission!==false||s.missionId!==null)fail('SOURCE_SCOPE');
 return {candidateId:key(c.id),candidateDigest:hash(c.digest)};
}
function mounted(file:string,max:number){
 if(!path.isAbsolute(file)||fs.realpathSync(file)!==file)fail('INPUT_PATH');
 const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
 try{const st=fs.fstatSync(fd);if(!st.isFile()||st.nlink!==1||st.size>max||(st.mode&0o222)!==0||(st.uid!==0&&st.uid!==process.getuid?.()))fail('INPUT_PERMISSIONS');return fs.readFileSync(fd);}finally{fs.closeSync(fd);}
}
function bundle(p:Principal,c:Reference,write:boolean){
 const root=process.env.EMPIRE_CONNECTOR_MEDIA_ROOT;if(!root)fail('BUNDLE_NOT_CONFIGURED');
 if(!path.isAbsolute(root)||fs.realpathSync(root)!==root||(fs.statSync(root).mode&0o022)!==0)fail('INPUT_ROOT');
 const policyBytes=mounted(path.join(root,'private-media-binding.json'),8192),policy=row(JSON.parse(policyBytes.toString('utf8')));
 exact(policy,['schema','workspace','owner','candidateId','candidateDigest','rights','publicPublicationAllowed','retainedReviewSHA256','originalSHA256','revisedSHA256','authoritySHA256','expiresAtUTC','applicationCommit','publicationCommit','moduleSHA256']);
 if(policy.schema!=='WORK8_CONNECTOR_PRIVATE_MEDIA_BINDING_V1'||policy.workspace!==p.workspace||policy.owner!==p.owner||policy.candidateId!==c.candidateId||policy.candidateDigest!==c.candidateDigest||policy.rights!==RIGHTS||policy.publicPublicationAllowed!==false||policy.retainedReviewSHA256!==REVIEW||policy.originalSHA256!==ORIGINAL||policy.revisedSHA256!==REVISED)fail('BINDING');
 if(policy.applicationCommit!==process.env.RAILWAY_GIT_COMMIT_SHA||policy.publicationCommit!==process.env.EMPIRE_CONNECTOR_ADAPTER_COMMIT||policy.moduleSHA256!==sha(fs.readFileSync(fileURLToPath(import.meta.url))))fail('SOFTWARE');
 hash(policy.authoritySHA256);const expires=typeof policy.expiresAtUTC==='string'?Date.parse(policy.expiresAtUTC):NaN;if(!Number.isSafeInteger(expires))fail('AUTHORITY');
 if(write){
  assertOwnerWritesReleased();const outer=row(JSON.parse(mounted(process.env.EMPIRE_OWNER_WRITE_POLICY!,4096).toString('utf8')));
  if(policy.authoritySHA256!==outer.approvalSha256||expires<=Date.now()||expires-Date.now()>1200000||expires>Date.parse(String(outer.expiresAt)))fail('AUTHORITY');
 }
 const original=mounted(path.join(root,'retained-original.jpg'),149719),revised=mounted(path.join(root,'retained-revised.png'),599818);
 if(original.length!==149719||sha(original)!==ORIGINAL||revised.length!==599818||sha(revised)!==REVISED)fail('ASSET_BYTES');
 const originalAsset:Asset={id:'retained-original-'+ORIGINAL.slice(0,16),kind:'IMAGE',mime:'image/jpeg',bytes:original.length,sha256:ORIGINAL,sourceIdentity:SOURCE,rights:RIGHTS,provenance:'Retained genuine supplier photograph, 800 × 800. Original pixels and bytes preserved. Accepted O7 private factual preparation only.'};
 const revisedAsset:Asset={id:'retained-revised-'+REVISED.slice(0,16),kind:'IMAGE',mime:'image/png',bytes:revised.length,sha256:REVISED,sourceIdentity:SOURCE,rights:RIGHTS,provenance:'Accepted retained ImageMagick convert6.9.12-98 alternative export, 880 × 1060. Complete original at (40,40), no resizing, crop, retouch or regeneration; neutral margins and separate factual caption. Not a new Canva export.'};
 // Bind persistent history to rights/source/byte identity, not a temporary lease expiry.
 const bindingDigest=digest({workspace:p.workspace,owner:p.owner,...c,rights:RIGHTS,publicPublicationAllowed:false,originalSHA256:ORIGINAL,revisedSHA256:REVISED,retainedReviewSHA256:REVIEW});
 return {bindingDigest,originalAsset,revisedAsset,bytes:new Map([[ORIGINAL,original],[REVISED,revised]])};
}
function history(db:DatabaseSync,p:Principal,c:Reference,bindingDigest:string){
 if(!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(TABLE))return [];
 const saved=db.prepare(`SELECT record FROM ${TABLE} WHERE workspace=? AND candidate=? ORDER BY version LIMIT ${MAX_EVENTS+1}`).all(p.workspace,c.candidateId);if(saved.length>MAX_EVENTS)fail('HISTORY_BOUND');
 let previous='',version=0;return saved.map(s=>{
  const e=JSON.parse(String(s.record)) as Event,{digest:actual,...body}=e;
  if(e.schema!=='WORK8_CONNECTOR_MEDIA_EVENT_V1'||e.workspace!==p.workspace||e.owner!==p.owner||e.candidateId!==c.candidateId||e.candidateDigest!==c.candidateDigest||e.bindingDigest!==bindingDigest||e.version!==++version||e.previous!==previous||actual!==digest(body)||e.externalEffects!==0||e.paidInference!==0||e.ownerApproval!==(e.action==='APPROVE_INTERNAL'))fail('HISTORY');
  previous=actual;return e;
 });
}
function project(events:Event[]){
 const proposal=events.filter(e=>e.action==='PROPOSE_RETAINED').at(-1)??null,lastRequest=events.filter(e=>e.action==='REQUEST_EDIT').at(-1);
 const approval=events.filter(e=>e.action==='APPROVE_INTERNAL'&&e.batchDigest===proposal?.batchDigest&&e.version>(proposal?.version??0)&&e.version>(lastRequest?.version??0)).at(-1);
 const rejected=events.some(e=>e.action==='REJECT'&&e.batchDigest===proposal?.batchDigest&&e.version>(proposal?.version??0));
 return {proposal,current:approval&&!rejected?{batchDigest:approval.batchDigest,assets:approval.assets.filter(a=>approval.assetIds.includes(a.id))}:{assets:[] as Asset[]},status:events.at(-1)?.status??'ORIGINAL_ONLY',version:events.at(-1)?.version??0};
}
/** Called only from existing authenticated owner routes. No writes occur on read. */
export function readConnectorMedia(db:DatabaseSync,p:Principal){
 principal(p);const sources=readConnectorSourceCandidates(db,p.workspace);if(!sources.candidates.length)return {availability:'NOT_PREPARED',rights:RIGHTS};
 const c=candidate(db,p),configuredRoot=process.env.EMPIRE_CONNECTOR_MEDIA_ROOT;
 // The host binds the policy only after the first actual authenticated source read.
 // An absent policy exposes no private media and cannot authorize a command.
 if(!configuredRoot||!fs.existsSync(path.join(configuredRoot,'private-media-binding.json')))return {availability:'NOT_PREPARED',...c,version:0,original:[],proposal:null,current:{assets:[]},history:[],rights:RIGHTS,ownerApproval:false};
 const b=bundle(p,c,false),events=history(db,p,c,b.bindingDigest),view=project(events);
 const checked=(a:Asset)=>{const bytes=b.bytes.get(a.sha256);if(!bytes||a.bytes!==bytes.length||a.rights!==RIGHTS||digest(a)!==digest(a.sha256===ORIGINAL?b.originalAsset:b.revisedAsset))fail('HISTORY_ASSET');return a;};
 const visible=(a:Asset)=>({...checked(a),base64:b.bytes.get(a.sha256)!.toString('base64')});
 const event=(e:Event)=>({...e,assets:e.assets.map(visible)});
 const response={availability:'VERIFIED_SOURCE_BOUND_PRIVATE_MEDIA',...c,...view,original:[visible(b.originalAsset)],proposal:view.proposal?event(view.proposal):null,current:{...view.current,assets:view.current.assets.map(checked)},history:events.map(e=>({...e,assets:e.assets.map(checked)})),rights:RIGHTS,ownerApproval:view.current.assets.length>0,publicPublicationAllowed:false,externalEffects:0,paidInference:0};
 if(Buffer.byteLength(JSON.stringify(response))>MAX_RESPONSE_BYTES)fail('RESPONSE_BOUND');return response;
}
/** Bounded source-bound commands. A real approval is recorded only for an explicit
 * authenticated APPROVE_INTERNAL command; preparing/importing never implies review. */
export function commandConnectorMedia(db:DatabaseSync,p:Principal,raw:unknown){
 principal(p);const r=request(raw),c=candidate(db,p);if(c.candidateId!==r.reference.candidateId||c.candidateDigest!==r.reference.candidateDigest)fail('STALE_SOURCE');
 const b=bundle(p,c,true);db.exec('BEGIN IMMEDIATE');try{
  const events=history(db,p,c,b.bindingDigest),view=project(events),requestDigest=digest({principal:p,request:r,bindingDigest:b.bindingDigest});
  const prior=events.find(e=>e.id===r.id);if(prior){if(prior.requestDigest!==requestDigest)fail('IDEMPOTENCY_CONFLICT');if(r.action==='APPROVE_INTERNAL'||r.action==='REJECT')fail('DECISION_REPLAY');db.exec('COMMIT');return prior;}
  if(view.version!==r.expectedVersion||events.length>=MAX_EVENTS)fail('VERSION_CONFLICT');
  let assets:Asset[]=[],assetIds:string[]=[],batchDigest:string|null=null,instructions:string|null=null,editingReceipt:string|null=null,editRequestDigest:string|null=null,status='';
  if(r.action==='REQUEST_EDIT'){
   const available=[b.originalAsset,...view.current.assets];if(r.assetIds!.some(id=>!available.some(a=>a.id===id)))fail('ASSET_SELECTION');
   assetIds=r.assetIds!;assets=available.filter(a=>assetIds.includes(a.id));instructions=r.instructions!;batchDigest=digest({reference:c,assets});status='EDIT_REQUEST_SAVED';
  }else if(r.action==='PROPOSE_RETAINED'){
   const edit=events.at(-1);if(edit?.action!=='REQUEST_EDIT'||edit.assetIds.length!==1||edit.assetIds[0]!==b.originalAsset.id)fail('RETAINED_EDIT_REQUEST_REQUIRED');
   assets=[b.revisedAsset];assetIds=assets.map(a=>a.id);instructions=edit.instructions;editRequestDigest=edit.digest;
   editingReceipt=`Accepted retained review ${REVIEW}; export script f9d2075a015b3bfa5d505fdb940ef6e640566828073a22e65c8af4612f588b7c. Imported unchanged; no new editor execution or claim that new instructions were executed.`;
   batchDigest=digest({reference:c,editRequestDigest,assets,instructions,editingReceipt,bindingDigest:b.bindingDigest});status='PROPOSED_RETAINED_ASSET_AWAITING_OWNER_REVIEW';
  }else{
   const proposal=view.proposal;if(!proposal||proposal.batchDigest!==r.batchDigest||events.some(e=>e.version>proposal.version&&(e.action==='REQUEST_EDIT'||e.action==='REJECT')))fail('PROPOSAL_STALE');
   assets=proposal.assets;assetIds=r.assetIds??assets.map(a=>a.id);if(assetIds.some(id=>!assets.some(a=>a.id===id)))fail('ASSET_SELECTION');
   if(r.action==='APPROVE_INTERNAL'&&events.some(e=>e.version>proposal.version&&e.action==='APPROVE_INTERNAL'))fail('DECISION_REPLAY');
   batchDigest=proposal.batchDigest;editRequestDigest=proposal.editRequestDigest;status=r.action==='APPROVE_INTERNAL'?'APPROVED_INTERNALLY_PRIVATE_ONLY':'REJECTED';
  }
  const body={schema:'WORK8_CONNECTOR_MEDIA_EVENT_V1',id:r.id,workspace:p.workspace,owner:p.owner,...c,version:view.version+1,previous:events.at(-1)?.digest??'',requestDigest,atUTC:new Date().toISOString(),action:r.action,assetIds,assets,batchDigest,instructions,editingReceipt,editRequestDigest,status,bindingDigest:b.bindingDigest,ownerApproval:r.action==='APPROVE_INTERNAL',externalEffects:0 as const,paidInference:0 as const};
  const e={...body,digest:digest(body)};
  db.exec(`CREATE TABLE IF NOT EXISTS ${TABLE}(workspace TEXT NOT NULL,candidate TEXT NOT NULL,version INTEGER NOT NULL,id TEXT NOT NULL,record TEXT NOT NULL,PRIMARY KEY(workspace,candidate,version),UNIQUE(workspace,id));CREATE TRIGGER IF NOT EXISTS immutable_connector_media_update BEFORE UPDATE ON ${TABLE} BEGIN SELECT RAISE(ABORT,'IMMUTABLE_CONNECTOR_MEDIA');END;CREATE TRIGGER IF NOT EXISTS immutable_connector_media_delete BEFORE DELETE ON ${TABLE} BEGIN SELECT RAISE(ABORT,'IMMUTABLE_CONNECTOR_MEDIA');END;`);
  db.prepare(`INSERT INTO ${TABLE} VALUES(?,?,?,?,?)`).run(p.workspace,c.candidateId,e.version,e.id,JSON.stringify(e));
  // A successful write must remain retrievable within the same bounded private response.
  readConnectorMedia(db,p);db.exec('COMMIT');return e;
 }catch(error){db.exec('ROLLBACK');throw error;}
}

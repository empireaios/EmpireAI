import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import type {DatabaseSync} from 'node:sqlite';
import {assertOwnerWritesReleased} from '../../owner-write-restriction.js';
import {readConnectorSourceCandidates} from './work8-connector-source.js';

type Row=Record<string,unknown>;
function fail(code:string):never {throw Error(code);}
const object=(v:unknown):Row=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Row:fail('WALKTHROUGH_OBJECT');
const sha=(b:string|Buffer)=>createHash('sha256').update(b).digest('hex');
const digest=(v:unknown)=>sha(JSON.stringify(v));
const equals=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const PID='2610240019051639200',VID='2610240019061630200',SKU='CJYD335906902BY';
const PINS={inventory:'58edc9d3628ec353661cbf3f080037e78bd4aaff3d4def18ee79b0ce9bb2fd15',inventoryReview:'1a68312ffc73e6fff3067651ad8dccde76c7872db638bdb2d236ad384d3a1958',currency:'c8ea5c46b108ab2b30f88ae13cea5230db2027750e86d3393fc3a3f10768ada4',media:'4fe19c2fbe0907474d053181a5568489d842421e0dbd2b627e487cca61511048',mediaCustody:'0f3a51064967c38691de338feaad6e9fea512e01fa5f2ccb81db9c706df7a9cd',mediaReview:'8e12d1b6a850b9f934081cc81c8f303f450a03cf131ae272c71c4316591b92c6',mediaBinding:'6a7279e7f169615646e3d1f7e5824f4d67d852fe355ac45e42aaf54199a23286'} as const;
type Inputs=Record<keyof typeof PINS,string> & {policy:string};
const POLICY={id:'WORK8_CONNECTOR_SOURCE_COMPLETENESS_V1',scope:'PINNED_SOURCE_RECEIPTS_ONLY',outcomeWhenIncomplete:'DEFER',mayQualifyDossier:false,mayApproveOwnerDecision:false,mayInvokePillow:false};
const TABLE='work8_connector_walkthrough';
const EVIDENCE_SHA='c6a044514dc00c8f7c81839db325195c7e3d7702e13ca0303c9d2b4d55de53e0';
function mounted(p:string,max:number){
 if(!path.isAbsolute(p)||fs.realpathSync(p)!==p)fail('WALKTHROUGH_INPUT_PATH');
 const fd=fs.openSync(p,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
 try{const st=fs.fstatSync(fd);if(!st.isFile()||st.nlink!==1||st.size>max||(st.mode&0o222)!==0||(st.uid!==0&&st.uid!==process.getuid?.()))fail('WALKTHROUGH_INPUT_PERMISSIONS');return fs.readFileSync(fd);}finally{fs.closeSync(fd);}
}
function pinned(files:Inputs,key:keyof typeof PINS){const b=mounted(files[key],key==='media'?160000:64000);if(sha(b)!==PINS[key])fail('WALKTHROUGH_INPUT_PIN');return b;}
function nativeCandidate(db:DatabaseSync,w:string,now:number){const view=readConnectorSourceCandidates(db,w,now);if(view.candidates.length!==1)fail('WALKTHROUGH_NATIVE_CANDIDATE');const projected=object(view.candidates[0]);const {sourceAgeMs,freshness,providerExpiry,assessmentFreshnessAdmission,...record}=projected;const source=object(record.source);if(source.supplierProductId!==PID||source.supplierVariantId!==VID||source.supplierSKU!==SKU)fail('WALKTHROUGH_PRODUCT_SCOPE');return record;}
function evidence(files:Inputs,now:number){
 const input=object(JSON.parse(pinned(files,'inventory').toString('utf8'))),result=object(input.result);
 if(result.isError===true||!Array.isArray(result.content)||result.content.length!==1)fail('WALKTHROUGH_INVENTORY');
 const content=object(result.content[0]);if(content.type!=='text'||typeof content.text!=='string')fail('WALKTHROUGH_INVENTORY');
 const rows=JSON.parse(content.text);if(!Array.isArray(rows)||rows.length!==1)fail('WALKTHROUGH_INVENTORY');const stock=object(rows[0]);
 if(stock.vid!==VID||stock.totalInventoryNum!==9427||stock.factoryInventoryNum!==9427||stock.cjInventoryNum!==0||stock.countryCode!=='CN'||stock.areaEn!=='China Warehouse')fail('WALKTHROUGH_INVENTORY_IDENTITY');
 const at=typeof input.atUTC==='string'?Date.parse(input.atUTC):NaN;if(!Number.isSafeInteger(at)||at>now)fail('WALKTHROUGH_INVENTORY_TIME');
 const review=object(JSON.parse(pinned(files,'inventoryReview').toString('utf8')));if(object(object(review.receipts).inventoryRead).sha256!==PINS.inventory||object(review.exactSelectedIdentity).vid!==VID)fail('WALKTHROUGH_INVENTORY_REVIEW');
 const currency=object(JSON.parse(pinned(files,'currency').toString('utf8')));const selected=object(currency.selectedSupplierIdentity);if(selected.pid!==PID||selected.vid!==VID||selected.sku!==SKU||currency.providerField!=='variantSellPrice'||currency.currency!=='USD')fail('WALKTHROUGH_CURRENCY');
 const media=pinned(files,'media'),custody=object(JSON.parse(pinned(files,'mediaCustody').toString('utf8'))),mediaReview=object(JSON.parse(pinned(files,'mediaReview').toString('utf8')));
 if(media.length!==149719||media[0]!==255||media[1]!==216||media.at(-2)!==255||media.at(-1)!==217||!equals(custody.product,{pid:PID,vid:VID,sku:SKU})||mediaReview.decision!=='PRESERVED_ORIGINAL_IMAGE_BYTE_CUSTODY')fail('WALKTHROUGH_MEDIA');
 pinned(files,'mediaBinding');
 return {receiptSHA256:{...PINS},coverage:{inputKinds:['CJ_DETAIL_OBSERVATION','CJ_INVENTORY_OBSERVATION','DOCUMENTED_CJ_FIELD_UNITS','ACCEPTED_O7_PRIVATE_PHOTO_RIGHTS'],fulfilmentResponsibility:[],deliveryTerms:[],returnsTerms:[],marketplaceEligibility:[],matchedCompetition:[],completeEconomics:[],assessmentFreshnessReview:[],scope:'THESE_SUPPLIED_RECEIPTS_ONLY_NOT_GLOBAL_HISTORY'},inventory:{variantId:VID,connectorReceiptAtUTC:input.atUTC,totalInventoryNum:9427,factoryInventoryNum:9427,cjInventoryNum:0,countryCode:'CN',warehouse:'China Warehouse',freshness:'RETAINED_OBSERVATION_ONLY',providerExpiry:null,dispatchCommitment:false,fulfilmentResponsibilityVerified:false},currency:{value:'USD',providerField:'variantSellPrice',basis:'RETAINED_OFFICIAL_FIELD_DEFINITION',basisReceiptSHA256:PINS.currency,currencyFieldInDetailReceipt:null,fx:null},originalMedia:{id:'retained-original-'+PINS.media.slice(0,16),sha256:PINS.media,bytes:media.length,mime:'image/jpeg',sourceProductId:PID,sourceVariantId:VID,sourceSKU:SKU,sourceObservedAtUTC:'2026-10-30T14:25:11.080Z',classification:'RETAINED_SUPPLIER_PHOTOGRAPH',rights:'PRIVATE_FACTUAL_PREPARATION_ONLY',publicPublicationAllowed:false,ownerRevisedMediaApproval:false,base64:media.toString('base64')}};
}
function screening(candidate:Row,e:Row,atUTC:string,moduleSHA256:string){
 const source=object(candidate.source),inventory=object(e.inventory),coverage=object(e.coverage);
 const supplied=(field:string)=>Array.isArray(coverage[field])&&(coverage[field] as unknown[]).length>0?'UNVERIFIED':'MISSING';
 const checks=[
  {id:'SELECTED_IDENTITY',status:source.supplierProductId===PID&&source.supplierVariantId===VID&&source.supplierSKU===SKU?'PRESENT':'MISSING'},
  {id:'OBSERVED_PRICE_AND_DOCUMENTED_CURRENCY',status:typeof source.observedPrice==='number'&&Number.isFinite(source.observedPrice)&&object(e.currency).value==='USD'?'PRESENT':'MISSING'},
  {id:'RETAINED_STOCK_OBSERVATION',status:inventory.variantId===VID?'PRESENT':'MISSING'},
  {id:'RESPONSIBLE_SUPPLIER_IDENTITY',status:typeof source.supplierName==='string'&&typeof source.supplierId==='string'?'PRESENT':'MISSING'},
  {id:'FULFILMENT_RESPONSIBILITY_AND_PROCESSING',status:supplied('fulfilmentResponsibility')},
  {id:'VERIFIED_DELIVERY_TERMS',status:supplied('deliveryTerms')},
  {id:'VERIFIED_RETURNS_TERMS',status:supplied('returnsTerms')},
  {id:'MATCHED_MARKETPLACE_ELIGIBILITY',status:supplied('marketplaceEligibility')},
  {id:'MATCHED_COMPETITION',status:supplied('matchedCompetition')},
  {id:'COMPLETE_ECONOMICS',status:supplied('completeEconomics')},
  {id:'ASSESSMENT_TIME_FRESHNESS',status:supplied('assessmentFreshnessReview')},
 ];
 const reasons=checks.filter(c=>c.status!=='PRESENT').map(c=>c.id);
 if(!reasons.length)fail('WALKTHROUGH_POLICY_CANNOT_QUALIFY');
 return {schema:'SOURCE_COMPLETENESS_SCREENING_V1',executionKind:'ACTUAL_DETERMINISTIC_SOURCE_COMPLETENESS_CHECK',status:'DEFER',candidateId:candidate.id,candidateDigest:candidate.digest,inputDigest:digest({candidateDigest:candidate.digest,evidenceDigest:digest(e)}),checks,reasons,atUTC,policy:POLICY,policySHA256:digest(POLICY),executedModuleSHA256:moduleSHA256,attributedTo:'DELEGATED_TECHNICAL_OPERATOR',qualifiedDossierAdmission:false,ownerDecision:false,pillowExecution:false,paidInference:0,externalEffects:0};
}
function verify(row:Row,candidate:Row){
 const {digest:actual,...body}=row,e=object(row.evidence),m=object(e.originalMedia);
 if(actual!==digest(body)||row.schema!=='WORK8_CONNECTOR_WALKTHROUGH_V1'||row.workspace!==candidate.workspace||row.candidateId!==candidate.id||row.candidateDigest!==candidate.digest||row.ownerActionObserved!==false||row.ownerApproval!==false||row.externalEffects!==0)fail('WALKTHROUGH_CHAIN');
 if(!equals(e.receiptSHA256,PINS)||m.sha256!==PINS.media||m.bytes!==149719||m.mime!=='image/jpeg'||typeof m.base64!=='string'||sha(Buffer.from(m.base64,'base64'))!==PINS.media||m.rights!=='PRIVATE_FACTUAL_PREPARATION_ONLY'||m.publicPublicationAllowed!==false)fail('WALKTHROUGH_EVIDENCE');
 if(object(e.inventory).totalInventoryNum!==9427||object(e.inventory).factoryInventoryNum!==9427||object(e.inventory).cjInventoryNum!==0||object(e.inventory).variantId!==VID||object(e.currency).value!=='USD')fail('WALKTHROUGH_EVIDENCE');
 if(digest(e)!==EVIDENCE_SHA)fail('WALKTHROUGH_EVIDENCE_PROJECTION');
 const software=object(row.softwareIdentity);if(software.applicationCommit!==process.env.RAILWAY_GIT_COMMIT_SHA||software.publicationCommit!==process.env.EMPIRE_CONNECTOR_ADAPTER_COMMIT||software.moduleSHA256!==sha(fs.readFileSync(fileURLToPath(import.meta.url))))fail('WALKTHROUGH_EXECUTED_SOFTWARE');
 if(!equals(row.screening,screening(candidate,e,String(row.atUTC),String(object(row.softwareIdentity).moduleSHA256))))fail('WALKTHROUGH_SCREENING');
 if(row.requestDigest!==digest({operationId:row.operationId,candidateId:row.candidateId,candidateDigest:row.candidateDigest,authoritySHA256:row.authoritySHA256,softwareIdentity:row.softwareIdentity,evidenceDigest:digest(e)}))fail('WALKTHROUGH_REQUEST');
 return row;
}
/** Operator-only same-source supplement; no HTTP write route and no owner business decision. */
export function admitPinnedConnectorWalkthrough(db:DatabaseSync,files:Inputs,now=Date.now()){
 assertOwnerWritesReleased();if(!Number.isSafeInteger(now))fail('WALKTHROUGH_TIME');
 const p=object(JSON.parse(mounted(files.policy,4096).toString('utf8'))),outer=object(JSON.parse(mounted(process.env.EMPIRE_OWNER_WRITE_POLICY!,4096).toString('utf8')));
 if(Object.keys(p).sort().join(',')!==['schema','operationId','workspace','candidateId','candidateDigest','authoritySHA256','expiresAtUTC','expectedCurrentCount','applicationCommit','publicationCommit','moduleSHA256'].sort().join(',')||p.schema!=='WORK8_CONNECTOR_WALKTHROUGH_ADMISSION_V1'||p.workspace!=='ws_empire_1'||p.expectedCurrentCount!==0)fail('WALKTHROUGH_POLICY');
 const expiry=typeof p.expiresAtUTC==='string'?Date.parse(p.expiresAtUTC):NaN;
 if(!Number.isSafeInteger(expiry)||expiry<=now||expiry-now>1200000||expiry>Date.parse(String(outer.expiresAt))||p.authoritySHA256!==outer.approvalSha256||!(/^[a-f0-9]{64}$/).test(String(p.authoritySHA256)))fail('WALKTHROUGH_AUTHORITY');
 if(typeof p.operationId!=='string'||!(/^[A-Za-z0-9_.:-]{1,160}$/).test(p.operationId)||p.applicationCommit!==process.env.RAILWAY_GIT_COMMIT_SHA||!(/^[a-f0-9]{40}$/).test(String(p.applicationCommit))||p.publicationCommit!==process.env.EMPIRE_CONNECTOR_ADAPTER_COMMIT||!(/^[a-f0-9]{40}$/).test(String(p.publicationCommit))||p.moduleSHA256!==sha(fs.readFileSync(fileURLToPath(import.meta.url))))fail('WALKTHROUGH_SOFTWARE');
 const candidate=nativeCandidate(db,String(p.workspace),now);if(candidate.id!==p.candidateId||candidate.digest!==p.candidateDigest)fail('WALKTHROUGH_STALE_CANDIDATE');
 const e=evidence(files,now),softwareIdentity={applicationCommit:p.applicationCommit,publicationCommit:p.publicationCommit,moduleSHA256:p.moduleSHA256};
 const requestDigest=digest({operationId:p.operationId,candidateId:candidate.id,candidateDigest:candidate.digest,authoritySHA256:p.authoritySHA256,softwareIdentity,evidenceDigest:digest(e)});
 db.exec('BEGIN IMMEDIATE');try{
  db.exec(`CREATE TABLE IF NOT EXISTS ${TABLE}(workspace TEXT PRIMARY KEY,candidate TEXT NOT NULL,operation TEXT NOT NULL UNIQUE,record TEXT NOT NULL);CREATE TRIGGER IF NOT EXISTS immutable_connector_walkthrough_update BEFORE UPDATE ON ${TABLE} BEGIN SELECT RAISE(ABORT,'IMMUTABLE_CONNECTOR_WALKTHROUGH');END;CREATE TRIGGER IF NOT EXISTS immutable_connector_walkthrough_delete BEFORE DELETE ON ${TABLE} BEGIN SELECT RAISE(ABORT,'IMMUTABLE_CONNECTOR_WALKTHROUGH');END;`);
  const prior=db.prepare(`SELECT record FROM ${TABLE} WHERE workspace=?`).get(p.workspace as string);if(prior){const v=verify(object(JSON.parse(String(prior.record))),candidate);if(v.requestDigest!==requestDigest)fail('WALKTHROUGH_IDEMPOTENCY_CONFLICT');db.exec('COMMIT');return {status:'ALREADY_ADMITTED',record:v};}
  const atUTC=new Date(now).toISOString(),body={schema:'WORK8_CONNECTOR_WALKTHROUGH_V1',workspace:p.workspace,candidateId:candidate.id,candidateDigest:candidate.digest,operationId:p.operationId,authoritySHA256:p.authoritySHA256,softwareIdentity,requestDigest,atUTC,evidence:e,screening:screening(candidate,e,atUTC,String(p.moduleSHA256)),ownerActionObserved:false,ownerApproval:false,externalEffects:0};const value={...body,digest:digest(body)};verify(value,candidate);
  db.prepare(`INSERT INTO ${TABLE} VALUES(?,?,?,?)`).run(String(p.workspace),String(candidate.id),String(p.operationId),JSON.stringify(value));db.exec('COMMIT');return {status:'ADMITTED_RETAINED_FACTS_AND_EXECUTED_DEFER',record:value};
 }catch(error){db.exec('ROLLBACK');throw error;}
}
/** Existing authenticated portfolio response is the only media-serving surface. */
export function readConnectorWalkthrough(db:DatabaseSync,workspace:string,now=Date.now()){
 if(workspace!=='ws_empire_1')fail('WALKTHROUGH_READ_SCOPE');
 if(!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(TABLE))return {availability:'NOT_ADMITTED',record:null};
 const row=db.prepare(`SELECT record FROM ${TABLE} WHERE workspace=?`).get(workspace);if(!row)return {availability:'NOT_ADMITTED',record:null};
 const candidate=nativeCandidate(db,workspace,now),v=verify(object(JSON.parse(String(row.record))),candidate);return {availability:'VERIFIED_RETAINED_FACTS_AND_EXECUTED_SCREENING',record:v};
}

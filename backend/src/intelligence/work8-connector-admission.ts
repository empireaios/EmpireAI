import {createHash} from 'node:crypto';
import {digest,key,subjectSchema,type Evidence} from './model.js';
import type {IntelligenceStore,Row} from './store.js';

/** Operator-only intake of a retained authenticated connector result. No HTTP
 * handler, provider request, scheduler job, health claim or owner approval.
 * The distinct namespaces are essential: direct-acquisition caches must never
 * mistake this transport for their own API execution. */
export const CONNECTOR_EVIDENCE_KIND='connector_evidence';
export const CONNECTOR_IMPORT_KIND='connector_import';
const TOOL='mcp__codex_apps__cjdropshipping_readback_get_product_detail';
const PREFIX='🔍 Product detail loaded.\n\n';
/** Closed admission for the retained MCP observations reviewed in V135.
 * These pins are trusted source configuration, never caller input. A digest or
 * tool name supplied by a caller cannot authenticate a new receipt. Additional
 * observations require a separately reviewed admission; this is not a provider
 * signature or an open production connector ingestion endpoint. */
const detailAdmission={
 capabilityId:'cj.detail',endpoint:'/product/query',tool:TOOL,
 rawReceiptSHA256:'d212ad58c32f37bc9a7614cedf0c1e45b40a705376810b6a21b1d5473971cf29',
 factsDigest:'a91e04b797f6a95809513455a6fe62b5ae795d069f0791aef6a6313036f9f673',
 workspace:'ws_v135_local_connector_intake',
 subject:{id:'2610240019051639200',variant:'2610240019061630200',marketplace:'US',destination:'US'},
 sku:'CJYD335906902BY',sourceOperation:'V135-CONNECTOR-NATIVE-IMPORT-CJ-DETAIL-01',
 readStartedAtUTC:'2026-11-14T09:00:27.449Z',readFinishedAtUTC:'2026-11-14T09:00:30.737Z',
 policy:{id:'V135_LOCAL_CJ_OBSERVATION_1H_V1',ttlMs:3600000}
}as const;
const inventoryAdmission={...detailAdmission,
 capabilityId:'cj.stock',endpoint:'/product/stock/queryByVid',tool:'mcp__codex_apps__cjdropshipping_readback_query_cj_inventory',
 rawReceiptSHA256:'01eb50c993cdfb770f39f6e351137b65c207a703ac453db3a61605e37b3322fd',
 factsDigest:'cc45707c761d7d73326bda8e6579b1b1a223c937d8d512a5ce75eeb04f8f7f8a',
 sourceOperation:'V135-CONNECTOR-NATIVE-CJ-INVENTORY-01',readStartedAtUTC:'2026-11-14T09:29:51.697Z',readFinishedAtUTC:'2026-11-14T09:29:55.678Z'
}as const;
const freightAdmission={...detailAdmission,
 capabilityId:'cj.freight',endpoint:'/logistic/freightCalculate',tool:'mcp__codex_apps__cjdropshipping_readback_calculate_freight',
 rawReceiptSHA256:'9494a01f4ba90768c2ece26271980ab5e47740752ae1e4d634ccd7f1a230f07c',
 factsDigest:'ddf17d34aefac4614fdec3bc5332c601a176ca2d67cc61f58632da933ef3003a',
 sourceOperation:'V135-CONNECTOR-NATIVE-CJ-FREIGHT-01',readStartedAtUTC:'2026-11-14T09:31:22.820Z',readFinishedAtUTC:'2026-11-14T09:31:26.819Z'
}as const;
// Exact V139 observations retained at the recorded times for independently
// reviewed admission. Existing admissions and expiry bounds remain unchanged.
const v139DetailAdmission={...detailAdmission,
 rawReceiptSHA256:'b5f4cf8eccf58a9a246586e3586cf607259f3b626efe649cdbbcf2651e721af2',
 factsDigest:'a91e04b797f6a95809513455a6fe62b5ae795d069f0791aef6a6313036f9f673',
 sourceOperation:'V139-CONNECTOR-CJ-DETAIL-01',readStartedAtUTC:'2026-11-14T12:48:13.002Z',readFinishedAtUTC:'2026-11-14T12:48:16.420Z'
}as const;
const v139InventoryAdmission={...inventoryAdmission,
 rawReceiptSHA256:'45b5de4e20a9e6e2833d5da85537753046999eb46b111d3ff26360c2104d5aa6',
 factsDigest:'cc45707c761d7d73326bda8e6579b1b1a223c937d8d512a5ce75eeb04f8f7f8a',
 sourceOperation:'V139-CONNECTOR-CJ-INVENTORY-01',readStartedAtUTC:'2026-11-14T12:50:22.357Z',readFinishedAtUTC:'2026-11-14T12:50:25.258Z'
}as const;
const v139FreightAdmission={...freightAdmission,
 rawReceiptSHA256:'0cc2c2319ea2c1f887d06b970ee65af8b2addbdc3dfaf2b613fa2de251e5e757',
 factsDigest:'38b92ecd91aeec6aebadb76fff592eac26dc1db6c4f40369997e8877f8125d9c',
 sourceOperation:'V139-CONNECTOR-CJ-FREIGHT-01',readStartedAtUTC:'2026-11-14T12:50:22.357Z',readFinishedAtUTC:'2026-11-14T12:50:25.872Z'
}as const;
const admissions=[detailAdmission,inventoryAdmission,freightAdmission,v139DetailAdmission,v139InventoryAdmission,v139FreightAdmission]as const;
function admissionFor(rawSHA:string){const a=admissions.find(a=>a.rawReceiptSHA256===rawSHA);need(a,'CONNECTOR_UNREVIEWED_ADMISSION');return a;}
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
function need(ok:unknown,code:string):asserts ok {if(!ok)throw Error(code);}
const record=(v:unknown):Row=>{need(v!==null&&typeof v==='object'&&!Array.isArray(v),'CONNECTOR_OBJECT');return v as Row;};
const instant=(v:unknown)=>{const n=typeof v==='string'?Date.parse(v):NaN;need(Number.isSafeInteger(n),'CONNECTOR_TIME');return n;};
const exact=(v:Row,keys:string[])=>need(Object.keys(v).sort().join(',')===keys.sort().join(','),'CONNECTOR_KEYS');
const hash=(v:unknown)=>need(typeof v==='string'&&/^[a-f0-9]{64}$/.test(v),'CONNECTOR_HASH');
export type ConnectorImportPolicy={id:string;ttlMs:number};
export type ConnectorEvidence=Evidence&{connector:Row};
export type ConnectorImportReader=(workspace:string,id:string)=>Row|null;
export type ConnectorSourceReader=((workspace:string,id:string)=>Evidence|null)&{connectorImport:ConnectorImportReader};

function policyCheck(policy:ConnectorImportPolicy){key.parse(policy.id);need(Number.isSafeInteger(policy.ttlMs)&&policy.ttlMs>0&&policy.ttlMs<=6*3600000,'CONNECTOR_LOCAL_TTL_BOUND');}
function trustedAdmission(workspace:string,rawSHA:string,subject:unknown,policy:ConnectorImportPolicy){
 const admitted=admissionFor(rawSHA);
 need(rawSHA===admitted.rawReceiptSHA256&&workspace===admitted.workspace&&digest(subject)===digest(admitted.subject)&&policy.id===admitted.policy.id&&policy.ttlMs===admitted.policy.ttlMs,'CONNECTOR_UNREVIEWED_ADMISSION');return admitted;
}

export function verifyConnectorEvidence(source:Evidence,workspace:string,readImport:ConnectorImportReader|undefined,now:number){
 const e=source as ConnectorEvidence,c=record(e.connector);key.parse(workspace);const admitted=admissionFor(c.rawReceiptSHA256);
 need(e.authenticity==='AUTHENTICATED_CONNECTOR'&&typeof readImport==='function','CONNECTOR_IMPORT_READER_REQUIRED');
 exact(c,['schema','workspace','importOperationId','rawReceiptSHA256','tool','sourceOperation','readStartedAtUTC','readFinishedAtUTC','importedAtUTC','freshnessPolicy','providerObservedAt','providerExpiresAt','nativeCJAPIExecuted']);
 need(c.schema==='WORK8_CONNECTOR_TRANSPORT_V1'&&c.workspace===workspace&&c.tool===admitted.tool&&c.nativeCJAPIExecuted===false&&c.providerObservedAt===null&&c.providerExpiresAt===null,'CONNECTOR_TRANSPORT_SCOPE');
 hash(c.rawReceiptSHA256);key.parse(c.sourceOperation);key.parse(c.importOperationId);
 const p=record(c.freshnessPolicy);exact(p,['id','ttlMs','basis']);policyCheck(p as ConnectorImportPolicy);
 trustedAdmission(workspace,c.rawReceiptSHA256,e.subject,p as ConnectorImportPolicy);
 need(c.sourceOperation===admitted.sourceOperation&&c.readStartedAtUTC===admitted.readStartedAtUTC&&c.readFinishedAtUTC===admitted.readFinishedAtUTC&&e.digest===admitted.factsDigest,'CONNECTOR_ADMITTED_OBSERVATION_BINDING');
 need(p.basis==='LOCAL_POLICY_FROM_CONNECTOR_READ_FINISH','CONNECTOR_POLICY_BASIS');
 const start=instant(c.readStartedAtUTC),finish=instant(c.readFinishedAtUTC),imported=instant(c.importedAtUTC);
 need(Number.isSafeInteger(now)&&start<=finish&&finish-start<=60000&&finish<=imported&&imported<=now&&imported<finish+p.ttlMs,'CONNECTOR_CHRONOLOGY');
 need(e.observedAt===c.readFinishedAtUTC&&e.retrievedAt===c.readFinishedAtUTC&&instant(e.staleAfter)===finish+p.ttlMs,'CONNECTOR_EXPIRY_BINDING');
 need(e.provider==='CJ'&&e.capabilityId===admitted.capabilityId&&e.endpoint===admitted.endpoint&&e.eye==='SUPPLIER'&&e.jobId===c.importOperationId&&e.grantsAuthority===false&&e.digest===digest(e.facts),'CONNECTOR_EVIDENCE_SCOPE');
 const r=record(readImport(workspace,c.importOperationId));const {digest:claimed,...body}=r;
 need(claimed===digest(body)&&r.schema==='WORK8_CONNECTOR_IMPORT_RECEIPT_V1'&&r.status==='COMPLETED_LOCAL_IMPORT'&&r.id===c.importOperationId&&r.workspace===workspace&&r.evidenceId===e.id&&r.evidenceEnvelopeDigest===digest(e)&&r.rawReceiptSHA256===c.rawReceiptSHA256&&r.importedAtUTC===c.importedAtUTC,'CONNECTOR_IMPORT_BINDING');
 need(r.directProviderRequests===0&&r.nativeAcquisitionJobsCreated===0&&r.ownerDecisionPerformed===false&&r.grantsAuthority===false,'CONNECTOR_IMPORT_AUTHORITY');
 return c;
}

/** Freshness is an explicit local admissibility limit anchored to the original
 * connector read finish. It is not a provider observation time or price promise.
 * The caller's expectedReceiptSHA256 is only a byte-integrity check; the private
 * reviewed admission pins above provide the separate custody trust boundary.
 * The local operation and evidence commit
 * together; idempotence never renews either import time or source expiry. */
function importConnectorObservation(store:IntelligenceStore,workspace:string,raw:Buffer,expectedReceiptSHA256:string,subject:unknown,expectedSKU:string,policy:ConnectorImportPolicy,capabilityId:string){
 key.parse(workspace);hash(expectedReceiptSHA256);policyCheck(policy);
 need(raw.length>0&&raw.length<=64000&&sha(raw)===expectedReceiptSHA256,'CONNECTOR_RECEIPT_BYTES');
 const request=subjectSchema.parse(subject);need(!!request.variant,'CONNECTOR_SELECTED_VARIANT_REQUIRED');
 const admitted=trustedAdmission(workspace,expectedReceiptSHA256,request,policy);
 need(expectedSKU===admitted.sku&&capabilityId===admitted.capabilityId,'CONNECTOR_UNREVIEWED_SKU_OR_CAPABILITY');
 const r=record(JSON.parse(raw.toString('utf8')));need(r.tool===admitted.tool&&r.operation===admitted.sourceOperation,'CONNECTOR_TOOL_SCOPE');key.parse(r.operation);
 const input=record(r.input),start=instant(r.startedAtUTC),finish=instant(r.finishedAtUTC),now=store.now();
 need(Number.isSafeInteger(now)&&start<=finish&&finish-start<=60000&&finish<=now&&now<finish+policy.ttlMs,'CONNECTOR_STALE_OR_FUTURE');
 need(r.startedAtUTC===admitted.readStartedAtUTC&&r.finishedAtUTC===admitted.readFinishedAtUTC,'CONNECTOR_ADMITTED_OBSERVATION_BINDING');
 const result=record(r.result);need(result.isError!==true&&Array.isArray(result.content)&&result.content.length===1,'CONNECTOR_RESULT');
 const content=record(result.content[0]);need(content.type==='text'&&typeof content.text==='string','CONNECTOR_RESULT_TEXT');
 let response:Row|Row[];
 if(capabilityId==='cj.detail'){
  exact(input,['pid']);need(input.pid===request.id,'CONNECTOR_INPUT_PID');
  need(content.text.startsWith(PREFIX),'CONNECTOR_RESULT_PREFIX');response=record(JSON.parse(content.text.slice(PREFIX.length)));
  need(response.pid===request.id&&Array.isArray(response.variants)&&response.variants.length>0&&response.variants.length<=100,'CONNECTOR_PARENT');
  const variants=response.variants.map(record),selected=variants.filter(v=>v.vid===request.variant);need(selected.length===1&&selected[0].pid===request.id,'CONNECTOR_VARIANT');
  const variant=selected[0];need(variant.variantSku===expectedSKU,'CONNECTOR_SKU');
  need(typeof variant.variantSellPrice==='number'&&Number.isFinite(variant.variantSellPrice)&&variant.variantSellPrice>=0&&variant.variantSellPrice<=1e9,'CONNECTOR_PRICE');
  need([response.currency,variant.currency].every(c=>c===undefined||c===null||c==='USD'),'CONNECTOR_CURRENCY_CONTRADICTION');
 }else{
  const parsed:unknown=JSON.parse(content.text);need(Array.isArray(parsed)&&parsed.length>0&&parsed.length<=100,'CONNECTOR_ROW_BOUND');response=parsed.map(record);
  if(capabilityId==='cj.stock'){
   exact(input,['vid']);need(input.vid===request.variant,'CONNECTOR_INPUT_VID');
   need(response.every(row=>row.vid===request.variant&&typeof row.countryCode==='string'&&/^[A-Z]{2}$/.test(row.countryCode)&&['storageNum','totalInventoryNum','cjInventoryNum','factoryInventoryNum'].every(k=>Number.isSafeInteger(row[k])&&row[k]>=0&&row[k]<=1e9)&&row.totalInventoryNum===row.cjInventoryNum+row.factoryInventoryNum),'CONNECTOR_STOCK_COUNTS');
   need(response.filter(row=>row.countryCode==='CN').length===1,'CONNECTOR_STOCK_AMBIGUOUS');
  }else{
   need(capabilityId==='cj.freight','CONNECTOR_CAPABILITY');exact(input,['startCountryCode','endCountryCode','products']);
   need(input.startCountryCode==='CN'&&input.endCountryCode===request.destination&&Array.isArray(input.products)&&input.products.length===1,'CONNECTOR_FREIGHT_ROUTE');
   const product=record(input.products[0]);exact(product,['vid','quantity']);need(product.vid===request.variant&&product.quantity===1,'CONNECTOR_FREIGHT_QUANTITY');
   need(response.every(row=>typeof row.logisticName==='string'&&row.logisticName.length>0&&typeof row.logisticPrice==='number'&&Number.isFinite(row.logisticPrice)&&row.logisticPrice>=0&&row.logisticPrice<=1e9),'CONNECTOR_FREIGHT_QUOTES');
   need(response.every(row=>row.currency===undefined||row.currency===null||row.currency==='USD'),'CONNECTOR_CURRENCY_CONTRADICTION');
  }
 }
 const identity=digest([workspace,expectedReceiptSHA256,request,policy]),importId='connector_import_'+identity.slice(0,40),evidenceId='connector_ev_'+identity.slice(0,40);
 return store.use(db=>{db.exec('BEGIN IMMEDIATE');try{
  const get=(kind:string,id:string):Row|null=>{const row=db.prepare('SELECT body FROM objects WHERE workspace=? AND kind=? AND id=?').get(workspace,kind,id);return row?JSON.parse(String(row.body)):null;};
  const old=get(CONNECTOR_IMPORT_KIND,importId),oldEvidence=get(CONNECTOR_EVIDENCE_KIND,evidenceId);
  if(old||oldEvidence){need(old&&oldEvidence,'CONNECTOR_PARTIAL_IMPORT');verifyConnectorEvidence(oldEvidence as ConnectorEvidence,workspace,(_w,id)=>get(CONNECTOR_IMPORT_KIND,id),now);db.exec('COMMIT');return {evidence:oldEvidence as ConnectorEvidence,receipt:old,idempotent:true};}
  const connector={schema:'WORK8_CONNECTOR_TRANSPORT_V1',workspace,importOperationId:importId,rawReceiptSHA256:expectedReceiptSHA256,tool:admitted.tool,sourceOperation:r.operation,readStartedAtUTC:r.startedAtUTC,readFinishedAtUTC:r.finishedAtUTC,importedAtUTC:new Date(now).toISOString(),freshnessPolicy:{...policy,basis:'LOCAL_POLICY_FROM_CONNECTOR_READ_FINISH'},providerObservedAt:null,providerExpiresAt:null,nativeCJAPIExecuted:false};
  const facts={request:input,response};
  need(digest(facts)===admitted.factsDigest,'CONNECTOR_ADMITTED_FACTS_BINDING');
  const evidence:ConnectorEvidence={id:evidenceId,capabilityId:admitted.capabilityId,eye:'SUPPLIER',provider:'CJ',endpoint:admitted.endpoint,subject:request,observedAt:r.finishedAtUTC,retrievedAt:r.finishedAtUTC,staleAfter:new Date(finish+policy.ttlMs).toISOString(),authenticity:'AUTHENTICATED_CONNECTOR',digest:digest(facts),facts,jobId:importId,quality:['AUTHENTICATED_CONNECTOR_RECEIPT','LOCAL_FRESHNESS_POLICY_NOT_PROVIDER_GUARANTEE','NO_NATIVE_API_EXECUTION','NO_EXECUTION_AUTHORITY'],lineage:[admitted.tool,r.operation,expectedReceiptSHA256,importId],grantsAuthority:false,connector};
  const body={schema:'WORK8_CONNECTOR_IMPORT_RECEIPT_V1',id:importId,workspace,status:'COMPLETED_LOCAL_IMPORT',evidenceId,evidenceEnvelopeDigest:digest(evidence),rawReceiptSHA256:expectedReceiptSHA256,importedAtUTC:connector.importedAtUTC,directProviderRequests:0,nativeAcquisitionJobsCreated:0,ownerDecisionPerformed:false,grantsAuthority:false};
  const receipt={...body,digest:digest(body)};
  for(const [kind,id,value]of[[CONNECTOR_EVIDENCE_KIND,evidenceId,evidence],[CONNECTOR_IMPORT_KIND,importId,receipt]]as const){const encoded=JSON.stringify(value);need(Buffer.byteLength(encoded)<=48000,'CONNECTOR_NATIVE_OBJECT_BOUND');db.prepare('INSERT INTO objects VALUES(?,?,?,?,?)').run(workspace,kind,id,now,encoded);}
  verifyConnectorEvidence(evidence,workspace,(_w,id)=>get(CONNECTOR_IMPORT_KIND,id),now);db.exec('COMMIT');return {evidence,receipt,idempotent:false};
 }catch(error){if(db.isTransaction)db.exec('ROLLBACK');throw error;}});
}

/** These functions admit only their separately reviewed immutable observation. */
export function importConnectorCJDetail(store:IntelligenceStore,workspace:string,raw:Buffer,expectedReceiptSHA256:string,subject:unknown,expectedSKU:string,policy:ConnectorImportPolicy){return importConnectorObservation(store,workspace,raw,expectedReceiptSHA256,subject,expectedSKU,policy,'cj.detail');}
export function importConnectorCJInventory(store:IntelligenceStore,workspace:string,raw:Buffer,expectedReceiptSHA256:string,subject:unknown,expectedSKU:string,policy:ConnectorImportPolicy){return importConnectorObservation(store,workspace,raw,expectedReceiptSHA256,subject,expectedSKU,policy,'cj.stock');}
export function importConnectorCJFreight(store:IntelligenceStore,workspace:string,raw:Buffer,expectedReceiptSHA256:string,subject:unknown,expectedSKU:string,policy:ConnectorImportPolicy){return importConnectorObservation(store,workspace,raw,expectedReceiptSHA256,subject,expectedSKU,policy,'cj.freight');}

export function connectorSavedSourceReader(store:IntelligenceStore):ConnectorSourceReader{
 const reader=((workspace:string,id:string)=>store.get(workspace,CONNECTOR_EVIDENCE_KIND,id)as ConnectorEvidence|null)as ConnectorSourceReader;
 reader.connectorImport=(workspace,id)=>store.get(workspace,CONNECTOR_IMPORT_KIND,id);return reader;
}

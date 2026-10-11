import {z} from 'zod';
import {listingSchema} from '../runtime/commerce-runtime/governed/contracts.js';
export const reviewedListingSchema=z.object({listing:listingSchema,detailSourceId:z.string(),stockSourceId:z.string(),freightSourceId:z.string(),rightsSourceIds:z.array(z.string()).min(1).max(9),deliveryDays:z.number().int().min(1).max(180),deliveryRationale:z.string().trim().min(10).max(1000),attestation:z.literal('I_REVIEWED_EXACT_LISTING_AND_IMAGE_PERMISSIONS')}).strict();
import {digest,key,type Evidence} from './model.js';
import type {Row} from './store.js';
import {verifiedSavedSource,type SavedSourceReader} from '../runtime/commerce-runtime/governed/work8-source-projection.js';
const kind=z.enum(['DEMAND','COMPETITION','DIFFERENTIATION','QUALITY','COMPLIANCE','RETURNS','MARKETPLACE']);
export const qualificationReviewSchema=z.object({id:key,candidateId:key,sourceSnapshotDigest:z.string().regex(/^[a-f0-9]{64}$/),financialDigest:z.string().regex(/^[a-f0-9]{64}$/),restricted:z.boolean(),budgetSgd:z.number().finite().nonnegative().max(1e9),processingDays:z.number().int().min(0).max(180),processingSourceId:key,findings:z.array(z.object({kind,value:z.number().finite().min(0).max(100),sourceId:key,rationale:z.string().trim().min(10).max(1000)}).strict()).length(7),listingPreparation:reviewedListingSchema.optional(),attestation:z.literal('I_REVIEWED_THE_CITED_EVIDENCE_NOT_JUST_MODEL_OUTPUT')}).strict();
/** Text screening has no image display or publication. Media rights and model/owner
 * execution authority are separate downstream gates, never waived by QUALIFIED. */
export const qualificationPolicy={version:'WORK8_TEXT_QUALIFICATION_V1',intendedUse:'INTERNAL_TEXT_SCREENING',mandatory:['EXACT_IDENTITY','FRESH_PRICE_CURRENCY_STOCK','PROCESSING','DESTINATION_FREIGHT','REVIEWED_SEVEN_FINDINGS','COMPLETE_REVIEWED_ECONOMICS','SOURCE_COST_FX_BINDING','COMPLETE_CASH_LIABILITIES_COMMITMENTS','EXPOSURE_BUDGET'],optional:['PRODUCT_IMAGES','MODEL_PROPOSAL'],imageDisplayAllowed:false,grantsExecutionAuthority:false} as const;
export function evaluateReviewedQualification(dossier:Row,review:Row|null,snapshot:Row|null,reader:SavedSourceReader,now:number){
 const missing=new Set<string>(),rejected=new Set<string>(),supplier=dossier.supplier,finance=dossier.financialInputs;
 const baseMissing=(dossier.eligibility?.missing??[]) as string[];
 for(const m of baseMissing)if(!['IMAGE_PERMISSION_REQUIRED','REVIEWED_FINANCIAL_INPUTS_REQUIRED','REVIEWED_ELIGIBILITY_REQUIRED','PILLOW_COMPLETED_ASSESSMENT_REQUIRED','EXPLICIT_SIMULATION_AUTHORIZATION_REQUIRED'].includes(m))missing.add(m);
 if(supplier.stock===0){missing.delete('OUT_OF_STOCK');rejected.add('OUT_OF_STOCK');}
 const evidencePins:Array<{id:string;envelopeDigest:string}>=[];
 const read=(id:string):Evidence=>{const {source,freshness}=verifiedSavedSource(reader,dossier.workspace,id,now);if(freshness!=='FRESH')throw Error('REVIEW_SOURCE_EXPIRED');if(source.subject.id!==dossier.sourceBinding.productId||source.subject.marketplace!==dossier.sourceBinding.subject.marketplace)throw Error('REVIEW_SOURCE_IDENTITY');evidencePins.push({id,envelopeDigest:digest(source)});return source;};
 let input:z.infer<typeof qualificationReviewSchema>|null=null;
 if(!review)missing.add('AUTHENTICATED_EVIDENCE_REVIEW_REQUIRED');
 else{try{input=qualificationReviewSchema.parse(review.command);if(review.workspace!==dossier.workspace||review.candidateId!==dossier.candidateId||!review.actor||review.attestedBy!=='AUTHENTICATED_OWNER'||input.sourceSnapshotDigest!==dossier.sourceBinding.snapshotDigest||input.financialDigest!==finance.financialDigest||new Set(input.findings.map(f=>f.kind)).size!==7)throw Error('REVIEW_BINDING');
  if(input.restricted)rejected.add('RESTRICTED_PRODUCT');
  read(input.processingSourceId);
  if(input.listingPreparation){for(const sourceId of [...new Set([input.listingPreparation.detailSourceId,input.listingPreparation.stockSourceId,input.listingPreparation.freightSourceId,...input.listingPreparation.rightsSourceIds,...input.listingPreparation.listing.sourceEvidence])])read(sourceId);}
  for(const f of input.findings){const source=read(f.sourceId);const eyes=f.kind==='DEMAND'||f.kind==='COMPETITION'||f.kind==='MARKETPLACE'?['MARKET']:f.kind==='COMPLIANCE'?['INTERNET','SUPPLIER']:['SUPPLIER','MARKET'];if(!eyes.includes(source.eye))throw Error('REVIEW_EVIDENCE_DOMAIN');if(f.kind==='COMPLIANCE'&&f.value!==100)rejected.add('COMPLIANCE_DENIED');}
 if(review.evidencePins&&digest(review.evidencePins)!==digest(evidencePins))throw Error('REVIEW_SOURCE_CHANGED');
 }catch{input=null;missing.add('REVIEW_STALE_INVALID_OR_UNSUPPORTED');}}
 const economics=finance.economics?.input;
 if(finance.status!=='OWNER_REVIEWED_FORECAST_NOT_ACTUAL'||!economics?.complete||!economics.evidenceRefs?.length)missing.add('COMPLETE_REVIEWED_FORECAST_REQUIRED');
 // Snapshot comes exclusively from the canonical server journal; its digest and
 // entry metadata were already checked by reviewedDossierFinance.
 if(!snapshot||snapshot.entryDigest!==finance.financialDigest)missing.add('CANONICAL_FINANCIAL_SNAPSHOT_REQUIRED');
 const conversions:Row[]=[];
 const convert=(amount:unknown,currency:unknown,capability:string)=>{
  if(typeof amount!=='number'||!Number.isFinite(amount)||typeof currency!=='string')return null;
  const source=dossier.sourceEvidence.find((s:Row)=>s.capability===capability);
  if(!source)return null;
  if(currency==='SGD'){conversions.push({sourceId:source.id,originalAmount:amount,originalCurrency:currency,sgd:amount,rate:1,basis:'SAME_CURRENCY'});return amount;}
  const quotes=(snapshot?.costs??[]).filter((c:Row)=>c.data?.authenticity==='REAL'&&c.data.stage==='ESTIMATED'&&c.data.category==='COGS'&&c.data.quantity===1&&c.data.currency===currency&&c.data.amountMicro===Math.round(amount*1e6)&&c.data.taxMicro===0&&c.data.creditMicro===0&&c.data.attribution?.productId===dossier.sourceBinding.productId&&c.data.attribution?.country===supplier.destination&&c.data.sourceIds?.includes(source.id)&&c.data.evidence?.some((e:Row)=>e.kind==='QUOTE')&&!c.stale&&!c.fxStale&&c.data.fx&&Date.parse(c.data.fx.observedAt)<=now&&now-Date.parse(c.data.fx.observedAt)<86400000);
  if(quotes.length!==1)return null;
  const q=quotes[0],rate=q.data.fx.sgdPerUnit,result=Math.round(amount*rate*100)/100;
  if(!Number.isSafeInteger(Math.round(result*100)))return null;
  conversions.push({sourceId:source.id,originalAmount:amount,originalCurrency:currency,sgd:result,rate,rounding:'NEAREST_SGD_CENT',journalEntryId:q.id,journalEntryDigest:q.digest,fxReference:q.data.fx.reference,classification:'REVIEWED_FX_DERIVATION_NOT_SUPPLIER_SGD_QUOTE'});return result;
 };
 const price=convert(supplier.price,supplier.currency,'cj.detail'),freight=convert(supplier.freight.amount,supplier.freight.currency,'cj.freight');
 if(price===null||freight===null)missing.add('SOURCE_COST_FX_BINDING_REQUIRED');
 if(economics&&price!==null&&freight!==null&&(economics.productCost!==price||economics.freight!==freight))missing.add('FORECAST_SOURCE_COST_MISMATCH');
 if(economics){const refs=new Set([...dossier.sourceEvidence.map((e:Row)=>e.id),...evidencePins.map(e=>e.id),...(snapshot?.entries??[]).map((e:Row)=>e.id)]);if(economics.evidenceRefs.some((id:string)=>!refs.has(id)))missing.add('FORECAST_EVIDENCE_UNRESOLVED');}
 let cash:Row|null=null;
 if(snapshot?.completeCashPosition===true&&[snapshot.knownCashSgdMicro,snapshot.position?.payableSgdMicro,snapshot.position?.commitmentsSgdMicro].every(n=>Number.isSafeInteger(n)&&n>=0))cash={available:snapshot.knownCashSgdMicro/1e6,liabilities:snapshot.position.payableSgdMicro/1e6,committed:snapshot.position.commitmentsSgdMicro/1e6,budget:input?.budgetSgd??null,financialDigest:snapshot.entryDigest,classification:'CANONICAL_REVIEWED_CASH_POSITION_NOT_SPENDING_AUTHORITY'};
 else missing.add('COMPLETE_CURRENT_CASH_POSITION_REQUIRED');
 const exposure=economics?economics.productCost+economics.freight+economics.fulfilment+economics.duties+economics.refundLoss:null;
 if(cash&&input&&exposure!==null&&(cash.available-cash.liabilities-cash.committed<exposure||input.budgetSgd<exposure))rejected.add('INSUFFICIENT_CASH_OR_BUDGET');
 if(economics&&Number.isFinite(finance.economics.net)&&finance.economics.net<=0)rejected.add('NON_POSITIVE_REVIEWED_MARGIN');
 const financialMissing=[...missing].some(m=>/FORECAST|FINANCIAL|COST|CASH|CURRENCY|PRICE|FREIGHT/.test(m));
 const status=rejected.size?'REJECTED':missing.size?'DEFERRED':'QUALIFIED';
 return {policy:qualificationPolicy,eligibility:{status,qualified:status==='QUALIFIED',missing:[...missing].sort(),rejected:[...rejected].sort()},review:input?{id:review!.id,actor:review!.actor,digest:review!.digest,findings:input.findings,processingDays:input.processingDays,...(input.listingPreparation?{listingPreparation:input.listingPreparation}:{}),classification:'OWNER_REVIEWED_INTERPRETATION_NOT_MODEL_OR_SUPPLIER_FACT'}:null,reviewEvidencePins:evidencePins,financialQualification:{status:financialMissing?'INCOMPLETE':'REVIEWED_SCENARIO_NOT_ACTUAL',netEstimate:financialMissing?null:finance.economics?.net??null,exposure:financialMissing?null:exposure,cash,conversions},downstreamGates:{imageDisplay:'PERMISSION_REQUIRED',listing:'PERMISSION_AND_LISTING_REVIEW_REQUIRED',assessment:'COMPLETED_DOSSIER_BOUND_ASSESSMENT_REQUIRED',simulation:'EXPLICIT_OWNER_AUTHORITY_REQUIRED'},grantsAuthority:false};
}

function reviewHistory(store:import('./store.js').IntelligenceStore,workspace:string){return store.use(db=>{
 db.exec(`CREATE TABLE IF NOT EXISTS work8_qualification_reviews(workspace TEXT NOT NULL,id TEXT NOT NULL,candidate TEXT NOT NULL,record TEXT NOT NULL,PRIMARY KEY(workspace,id)) STRICT;
 CREATE TRIGGER IF NOT EXISTS work8_qualification_review_update BEFORE UPDATE ON work8_qualification_reviews BEGIN SELECT RAISE(ABORT,'IMMUTABLE_QUALIFICATION_REVIEW');END;
 CREATE TRIGGER IF NOT EXISTS work8_qualification_review_delete BEFORE DELETE ON work8_qualification_reviews BEGIN SELECT RAISE(ABORT,'IMMUTABLE_QUALIFICATION_REVIEW');END;`);
 const rows=db.prepare('SELECT record FROM work8_qualification_reviews WHERE workspace=? ORDER BY rowid LIMIT 1001').all(workspace).map(r=>JSON.parse(String(r.record)) as Row);if(rows.length>1000)throw Error('QUALIFICATION_REVIEW_HISTORY_BOUND');
 for(const r of rows){const {digest:actual,...body}=r;if(actual!==digest(body)||r.workspace!==workspace||r.attestedBy!=='AUTHENTICATED_OWNER'||r.grantsAuthority!==false)throw Error('QUALIFICATION_REVIEW_CORRUPT');}return rows;
 });}
export function latestQualificationReview(store:import('./store.js').IntelligenceStore,workspace:string,candidateId:string){return reviewHistory(store,workspace).filter(r=>r.candidateId===candidateId).at(-1)??null;}
export function recordQualificationReview(store:import('./store.js').IntelligenceStore,workspace:string,owner:string,raw:unknown,resolve:()=>{dossier:Row;snapshot:Row|null}){
 key.parse(workspace);key.parse(owner);const command=qualificationReviewSchema.parse(raw);const old=reviewHistory(store,workspace).find(r=>r.id===command.id);if(old){if(old.actor!==owner||digest(old.command)!==digest(command))throw Error('QUALIFICATION_REVIEW_ID_CONFLICT');return old;}
 return store.use(db=>{db.exec('BEGIN IMMEDIATE');try{
 const {dossier,snapshot}=resolve();if(dossier.workspace!==workspace||dossier.candidateId!==command.candidateId||dossier.sourceBinding.snapshotDigest!==command.sourceSnapshotDigest||dossier.financialInputs.financialDigest!==command.financialDigest)throw Error('QUALIFICATION_REVIEW_STALE');
 const body={id:command.id,workspace,candidateId:command.candidateId,actor:owner,attestedBy:'AUTHENTICATED_OWNER',at:new Date(store.now()).toISOString(),command,grantsAuthority:false};
 const result=evaluateReviewedQualification(dossier,body,snapshot,(w,id)=>store.get(w,'evidence',id) as Evidence|null,store.now());if(result.eligibility.missing.includes('REVIEW_STALE_INVALID_OR_UNSUPPORTED'))throw Error('QUALIFICATION_REVIEW_SOURCE_INVALID');
 const complete={...body,evidencePins:result.reviewEvidencePins},receipt={...complete,digest:digest(complete)};
 if(Number(db.prepare('SELECT count(*) n FROM work8_qualification_reviews WHERE workspace=?').get(workspace)?.n)>=1000)throw Error('QUALIFICATION_REVIEW_HISTORY_BOUND');
 db.prepare('INSERT INTO work8_qualification_reviews VALUES(?,?,?,?)').run(workspace,command.id,command.candidateId,JSON.stringify(receipt));db.exec('COMMIT');return receipt;
 }catch(e){if(db.isTransaction)db.exec('ROLLBACK');throw e;}});
}

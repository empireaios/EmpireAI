import {createHash} from 'node:crypto';
import {digest,type Evidence} from './model.js';
import type {IntelligenceStore,Row} from './store.js';
import {verifyConnectorEvidence} from './work8-connector-admission.js';

/** Closed, operator-only retention of two independently reviewed MCP receipts.
 * This is a supplemental historical constraints record, not a new live-provider
 * cache entry, qualification decision, Pillow assessment or owner approval.
 * No network, credentials, scheduler, commerce or production route is added.
 */
export const FULFILMENT_KIND='work8_fulfilment_supplement';
export const FULFILMENT_IMPORT_KIND='work8_fulfilment_import';
const WORKSPACE='ws_v135_local_connector_intake';
const CANDIDATE='cj:2610240019051639200';
const DETAIL_ID='connector_ev_4fd22e093376e28ecd775ede06ca7caa22fe5a96';
const DETAIL_SHA='b5f4cf8eccf58a9a246586e3586cf607259f3b626efe649cdbbcf2651e721af2';
const FREIGHT_SHA='fe773c64ce130f9ba9a3164f3f1c29f505024c5942b3caeaad91ed906823cf94';
const SHOPS_SHA='1717c15bea5514c847e6800b53615341e347f643b122e001069aa78faaa77240';
const ID='cj_constraints_'+FREIGHT_SHA.slice(0,40);
const IMPORT_ID='cj_constraints_import_'+FREIGHT_SHA.slice(0,32);
const API_DOC='https://developers.cjdropshipping.com/en/api/api2/api/logistic.html';
const PRODUCT_DOC='https://developers.cjdropshipping.com/en/api/api2/api/product.html';
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
function need(ok:unknown,code:string):asserts ok {if(!ok)throw Error(code);}
const parse=(b:Buffer,pin:string,limit:number)=>{need(Buffer.isBuffer(b)&&b.length<=limit&&hash(b)===pin,'FULFILMENT_UNREVIEWED_RECEIPT');return JSON.parse(b.toString('utf8')) as Row;};
const parsedResult=(r:Row)=>{need(r.result?.isError!==true&&Array.isArray(r.result?.content)&&r.result.content.length===1&&r.result.content[0]?.type==='text','FULFILMENT_RECEIPT_RESULT');return JSON.parse(r.result.content[0].text);};
const nullable=(v:unknown)=>v===undefined?null:v;

function projection(store:IntelligenceStore,workspace:string,freightBytes:Buffer,shopBytes:Buffer){
 need(workspace===WORKSPACE,'FULFILMENT_WORKSPACE');
 // The larger receipt bound applies only to this exact hash-pinned operator
 // transport. Existing connector and native-object bounds are unchanged.
 const freight=parse(freightBytes,FREIGHT_SHA,90000),shops=parse(shopBytes,SHOPS_SHA,2000),rows=parsedResult(freight),shopRows=parsedResult(shops);
 need(freight.operation==='V140-CJ-AMAZON-FREIGHT-APPLICABILITY-01'&&freight.physicalSourceReceiptSHA256===DETAIL_SHA&&freight.automaticRetries===0,'FULFILMENT_RECEIPT_BINDING');
 need(freight.startedAtUTC==='2026-11-14T13:41:19.295Z'&&freight.finishedAtUTC==='2026-11-14T13:41:22.371Z','FULFILMENT_RECEIPT_TIME');
 const now=store.now();need(Number.isSafeInteger(now)&&now>=Date.parse(freight.finishedAtUTC),'FULFILMENT_CLOCK');
 need(Array.isArray(rows)&&rows.length===29&&Array.isArray(shopRows)&&shopRows.length===1,'FULFILMENT_RECEIPT_SHAPE');
 const candidate=store.get(workspace,'work8_connector_discovery_identity',CANDIDATE),source=store.get(workspace,'connector_evidence',DETAIL_ID);
 need(candidate?.id===CANDIDATE&&candidate.sourceId===DETAIL_ID&&candidate.productId==='2610240019051639200'&&candidate.screening==='DEFERRED'&&candidate.authority==='NONE'&&candidate.pillowAssessment===null&&candidate.ownerRecommendation===null,'FULFILMENT_CANDIDATE_BINDING');
 need(source&&source.connector?.rawReceiptSHA256===DETAIL_SHA&&source.digest===candidate.sourceDigest,'FULFILMENT_DETAIL_BINDING');
 // Verify the retained source chain at its actual acquisition/use interval.
 // This authenticates historical association; it does not refresh its TTL.
 verifyConnectorEvidence(source as Evidence,workspace,(w,id)=>store.get(w,'connector_import',id),Date.parse(freight.finishedAtUTC));
 const detail=source.facts.response,variant=detail.variants.filter((v:Row)=>v.vid==='2610240019061630200');
 need(variant.length===1&&variant[0].variantSku==='CJYD335906902BY'&&variant[0].variantSellPrice===4.35&&detail.productType==='ORDINARY_PRODUCT','FULFILMENT_EXACT_VARIANT');
 need(Date.parse(source.observedAt)<=Date.parse(freight.startedAtUTC)&&Date.parse(freight.finishedAtUTC)<Date.parse(source.staleAfter),'FULFILMENT_INPUT_NOT_VALID_AT_QUOTE');
 const options=rows.map((r:Row)=>({
  rowDigest:digest(r),optionId:r.optionId,optionName:r.option?.enName,
  arrivalTime:nullable(r.arrivalTime),optionArrivalTime:nullable(r.option?.arrivalTime),
  timingFieldsAgree:r.arrivalTime===r.option?.arrivalTime,
  // Preserve reported amounts separately; never coerce a null tax to zero.
  reportedUSD:{discountFee:nullable(r.discountFee),wrapPostage:nullable(r.wrapPostage),postage:nullable(r.postage),remoteFee:nullable(r.remoteFee),taxesFee:nullable(r.taxesFee),clearanceOperationFee:nullable(r.clearanceOperationFee),euTariff:nullable(r.tariff),totalPostageFee:nullable(r.totalPostageFee)},
  sourceCountry:r.srcArea?.shortCode,destinationCountry:r.destArea?.shortCode,
  error:nullable(r.error),errorEn:nullable(r.errorEn),message:nullable(r.message),tip:nullable(r.tip),
  ruleTipTypes:r.ruleTipTypes??[],ruleTips:r.ruleTips??[],allRuleTips:r.allRuleTips??[],stopWords:r.stopWords??[],
  selected:false,deliveryPromise:false,taxInclusiveGuarantee:false
 }));
 const result={
  schema:'WORK8_REVIEWED_CJ_FULFILMENT_SUPPLEMENT_V1',id:ID,workspace,candidateId:CANDIDATE,
  classification:'HISTORICAL_AUTHENTICATED_CONNECTOR_CONSTRAINTS',
  subject:{productId:'2610240019051639200',variantId:'2610240019061630200',sku:'CJYD335906902BY',origin:'CN',destination:'US'},
  sourceAssociation:{detailEvidenceId:DETAIL_ID,detailEvidenceDigest:digest(source),detailRawReceiptSHA256:DETAIL_SHA,candidateDigest:digest(candidate),productType:detail.productType,documentedProductTypeCode:0,productTypeBasis:{url:PRODUCT_DOC,section:'Product Type',mapping:'ORDINARY_PRODUCT=0; inventory/shipping managed by CJ'}},
  freightReceipt:{rawReceiptSHA256:FREIGHT_SHA,tool:'mcp__codex_apps__cjdropshipping_readback_calculate_freight_tip',endpoint:'/api2.0/v1/logistic/freightCalculateTip',operation:freight.operation,readStartedAtUTC:freight.startedAtUTC,readFinishedAtUTC:freight.finishedAtUTC,nativeProviderAPIExecuted:false},
  request:freight.input,
  interpretation:{requestedPlatform:'amazon',filterApplication:'UNVERIFIED',platformParameterValidatedByOpenPlatform:false,explicitShippingMode:null,documentedDefaultShippingMode:2,explicitTrialCalculationType:null,documentedDefaultTrialCalculationType:0,defaultBasis:{url:API_DOC,section:'1.2 Freight Calculation Tip'},numericCurrency:'USD',currencyBasis:{url:API_DOC,section:'1.2 return field contract'},tariffFieldScope:'EU_TARIFF_NOT_US_TAX',totalPostageFormula:'wrapPostage (or discountFee if null) + taxesFee + clearanceOperationFee + tariff',nullFieldIsZero:false,countryQuoteIsFinalDeliveryCommitment:false,selectedShippingOption:null},
  inputValidity:{detailObservedAtUTC:source.observedAt,detailLocalAdmissionExpiryUTC:source.staleAfter,detailAdmissibleAtQuote:true,providerPriceExpiry:null,providerQuoteExpiry:null,retainedForHistoricalReviewOnly:true,currentCommitmentAuthority:false,renewedByFreightRead:false},
  accountBindingObservation:{rawReceiptSHA256:SHOPS_SHA,tool:'mcp__codex_apps__cjdropshipping_readback_list_shops',transportRecordedAtUTC:shops.observedAtUTC,readStartedAtUTC:null,readFinishedAtUTC:null,scope:'AUTHENTICATED_CJ_SHOPS_PAGE_1_SIZE_100',records:shopRows.map((s:Row)=>({type:s.type,status:s.status,marketplace:nullable(s.marketplace),countryCode:nullable(s.countryCode),currencyCode:nullable(s.currencyCode),fulfillmentStatus:nullable(s.fulfillmentStatus)})),amazonSellerAccountBindingProven:false,absenceOfAmazonAccountNotProven:true},
  options,
  disposition:{status:'DEFERRED',qualified:false,marketplaceEligibility:'UNVERIFIED',processingCommitment:null,dispatchCommitment:null,selectedSupplierReturnsAgreement:null,sellerOfRecordHandling:null,marketPrice:null,completeLandedCost:null,pillowAssessment:null,ownerRecommendation:null,ownerDecision:null,missing:['SELECTED_PROCESSING_AND_DISPATCH_OBLIGATIONS','SELECTED_APPLICABLE_FULFILMENT_AND_RETURNS_TERMS','AUTHENTICATED_MARKETPLACE_ACCOUNT_AND_SELLER_IDENTITY_EVIDENCE','CURRENT_SOURCE_BOUND_SELECTED_FREIGHT_AND_LANDED_COST','GENUINE_MARKET_EVIDENCE_AND_APPLICABLE_MARKET_RESTRICTIONS'],preservedAcceptedPrivateImageRightsPredicate:'O13-09',privateImageRightsReopened:false,genericPublicPolicyIsSelectedSupplierAgreement:false,allOptionalInquiryAnswersRequired:false,fixedAddressOrHSCodeUnconditionalGate:false},
  privacy:{opaqueProviderUidOmitted:true,shopNameAndIdOmitted:true,rawReceiptsRetainedSeparately:true},
  grantsAuthority:false,providerWrites:0,commerceEffects:0,paidInference:0
 };
 need(Buffer.byteLength(JSON.stringify(result))<=48000,'FULFILMENT_OBJECT_BOUND');
 return result;
}

export function importReviewedCJFulfilmentSupplement(store:IntelligenceStore,workspace:string,freightBytes:Buffer,shopBytes:Buffer){
 const facts=projection(store,workspace,freightBytes,shopBytes),at=store.now(),record={...facts,digest:digest(facts)};
 const makeReceipt=()=>{const body={schema:'WORK8_CJ_FULFILMENT_IMPORT_V1',id:IMPORT_ID,workspace,recordId:ID,recordDigest:record.digest,rawReceiptSHA256s:[FREIGHT_SHA,SHOPS_SHA],importedAtUTC:new Date(at).toISOString(),source:'REVIEWED_OPERATOR_MCP_RECEIPT_ADMISSION',nativeProviderAPIExecuted:false,grantsAuthority:false};return {...body,digest:digest(body)};};
 return store.use(db=>{db.exec('BEGIN IMMEDIATE');try{
  const decode=(kind:string,id:string)=>{const row=db.prepare('SELECT body FROM objects WHERE workspace=? AND kind=? AND id=?').get(workspace,kind,id);return row?JSON.parse(String(row.body)):null;};
  const old=decode(FULFILMENT_KIND,ID),oldImport=decode(FULFILMENT_IMPORT_KIND,IMPORT_ID);
  if(old||oldImport){need(old&&oldImport&&digest(old)===digest(record),'FULFILMENT_IMMUTABLE_CONFLICT');const{digest:importDigest,...importBody}=oldImport;need(importDigest===digest(importBody)&&oldImport.recordDigest===record.digest&&oldImport.recordId===ID&&oldImport.workspace===workspace&&digest(oldImport.rawReceiptSHA256s)===digest([FREIGHT_SHA,SHOPS_SHA]),'FULFILMENT_IMPORT_CORRUPT');db.exec('COMMIT');return {record:old,receipt:oldImport,idempotent:true};}
  const receipt=makeReceipt(),insert=db.prepare('INSERT INTO objects VALUES(?,?,?,?,?)');
  insert.run(workspace,FULFILMENT_KIND,ID,at,JSON.stringify(record));insert.run(workspace,FULFILMENT_IMPORT_KIND,IMPORT_ID,at,JSON.stringify(receipt));
  db.exec('COMMIT');return {record,receipt,idempotent:false};
 }catch(error){if(db.isTransaction)db.exec('ROLLBACK');throw error;}});
}

/** Reconstruct from the exact original receipt bytes, then authenticate both
 * immutable native records. A self-supplied digest alone is never sufficient. */
export function readReviewedCJFulfilmentSupplement(store:IntelligenceStore,workspace:string,freightBytes:Buffer,shopBytes:Buffer){
 const expected=projection(store,workspace,freightBytes,shopBytes),record=store.get(workspace,FULFILMENT_KIND,ID),receipt=store.get(workspace,FULFILMENT_IMPORT_KIND,IMPORT_ID);
 need(record&&receipt&&digest(record)===digest({...expected,digest:digest(expected)}),'FULFILMENT_READBACK_MISMATCH');
 const{digest:receiptDigest,...body}=receipt;
 need(receiptDigest===digest(body)&&receipt.schema==='WORK8_CJ_FULFILMENT_IMPORT_V1'&&receipt.id===IMPORT_ID&&receipt.workspace===workspace&&receipt.recordId===ID&&receipt.recordDigest===record.digest&&digest(receipt.rawReceiptSHA256s)===digest([FREIGHT_SHA,SHOPS_SHA])&&receipt.source==='REVIEWED_OPERATOR_MCP_RECEIPT_ADMISSION'&&receipt.nativeProviderAPIExecuted===false&&receipt.grantsAuthority===false,'FULFILMENT_IMPORT_CORRUPT');
 need(Number.isFinite(Date.parse(receipt.importedAtUTC))&&Date.parse(receipt.importedAtUTC)>=Date.parse(expected.freightReceipt.readFinishedAtUTC)&&Date.parse(receipt.importedAtUTC)<=store.now(),'FULFILMENT_IMPORT_TIME');
 return {record,receipt,readbackAtUTC:new Date(store.now()).toISOString(),currentInputValidity:store.now()<Date.parse(expected.inputValidity.detailLocalAdmissionExpiryUTC)?'WITHIN_ORIGINAL_LOCAL_INPUT_BOUND':'EXPIRED_INPUT_RETAINED_AS_HISTORICAL',currentCommitmentAuthority:false};
}

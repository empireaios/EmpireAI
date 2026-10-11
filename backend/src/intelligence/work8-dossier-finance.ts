import {commandSchema,economics,type Entry} from '../finance/financial-centre.js';
import {digest} from './model.js';
import type {Row} from './store.js';
/** Only call with a server-owned canonical journal read. This function never appends financial rows.
 * An approved forecast remains reviewed assumptions, never invoice/payment/supplier evidence. */
export function reviewedDossierFinance(workspace:string,productId:string,destination:string|undefined,snapshot:Row|null,now:number){
 const missing=(reason:string)=>({status:'MISSING_REVIEWED_CANONICAL_INPUTS',reason,economics:null,cash:null,fx:null,financialDigest:null,grantsAuthority:false});
 if(!snapshot)return missing('CANONICAL_FINANCIAL_READ_UNAVAILABLE');
 if(!Array.isArray(snapshot.entries)||snapshot.entries.length>10000||JSON.stringify(snapshot.entries).length>4*1024*1024||snapshot.entryDigest!==digest(snapshot.entries))throw Error('DOSSIER_FINANCIAL_DIGEST');
 const entries=snapshot.entries as Entry[];
 const ids=new Set<string>();
 for(const e of entries){const parsed=commandSchema.parse(e);if(e.workspace!==workspace||!e.actor||ids.has(e.id)||e.digest!==digest(parsed)||!Number.isFinite(Date.parse(e.at))||Date.parse(e.at)>now)throw Error('DOSSIER_FINANCIAL_ENTRY');ids.add(e.id);}
 const reversed=(id:string)=>entries.some(e=>e.type==='reversal'&&e.data.target===id);
 const forecasts=entries.filter(e=>e.type==='forecast'&&e.data.economics.productId===productId&&e.data.economics.supplierId==='CJ'&&e.data.economics.country===destination&&!reversed(e.id));
 const target=forecasts.at(-1);
 if(!target||target.type!=='forecast')return {...missing('EXACT_PRODUCT_FORECAST_REQUIRED'),financialDigest:snapshot.entryDigest};
 const review=entries.find(e=>e.type==='review'&&e.data.target===target.id&&e.data.decision==='APPROVE'&&e.data.evidenceConfirmed===true&&!reversed(e.id));
 if(!review||Date.parse(review.at)<Date.parse(target.at))return {...missing('FORECAST_REVIEW_REQUIRED'),financialDigest:snapshot.entryDigest};
 const observed=Date.parse(target.data.observedAt);
 if(!Number.isFinite(observed)||observed>now||now-observed>=86400000)return {...missing('FORECAST_STALE'),financialDigest:snapshot.entryDigest};
 const calculated=economics(target.data.economics);
 return {status:'OWNER_REVIEWED_FORECAST_NOT_ACTUAL',reason:'SUPPLIER_COST_FX_AND_CASH_BINDING_STILL_REQUIRED',economics:{...calculated,entryId:target.id,entryDigest:target.digest,reviewId:review.id,reviewActor:review.actor,reviewDigest:review.digest,classification:'REVIEWED_ASSUMPTIONS_NOT_SUPPLIER_OR_PAYMENT_EVIDENCE'},cash:null,fx:null,financialDigest:snapshot.entryDigest,grantsAuthority:false};
}

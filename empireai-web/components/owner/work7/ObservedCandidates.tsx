import {TechnicalEvidence} from './TechnicalEvidence';
import s from './journeys.module.css';

type Row = Record<string, unknown>;
const row = (value: unknown): Row => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Row : {};
const text = (value: unknown, fallback = 'Unknown') => typeof value === 'string' && value.trim() ? value : fallback;
const list = (value: unknown): Row[] => Array.isArray(value) ? value.map(row) : [];
const reasons: Record<string, string> = {
 MEDIA_USAGE_RIGHTS_UNVERIFIED: 'Image usage permission needs verification',
 INDEPENDENT_ELIGIBILITY_AND_ECONOMICS_REQUIRED: 'Eligibility and complete costs need verification',
 PILLOW_ASSESSMENT_NOT_LINKED: 'No completed Pillow assessment linked',
 SOURCE_EXPIRED: 'Source observation needs refreshing',
 PRICE_UNKNOWN: 'A single supplier price is not established',
 CURRENCY_UNKNOWN: 'Supplier price currency is not recorded',
 VARIANT_NOT_SELECTED: 'A product variant has not been selected',
};

/** Retained provider observations are separate from qualified missions and never imply approval. */
export function ObservedCandidates({value,discovery}: {value: unknown;discovery?:unknown}) {
 const data=row(value), products=list(data.products), counts=row(data.counts), scan=row(discovery), checkpoint=row(scan.checkpoint);
 if(!value)return null;
 return <section aria-label="Observed supplier products" className={s.details}>
  <h2 className={s.rowTitle}>Observed supplier products</h2>
  <p className={s.note}>Genuine saved source observations · {products.length} products in this sample. These are separate from the portfolio records and filters below.</p>
  <p><span className={s.badge}>Real observed identities</span><span className={s.badge}>Downstream commerce: simulation only</span></p>
  {discovery?<div className={s.details} aria-label="Retained source scan progress">{scan.availability==='RETAINED_SCAN_ONLY'&&scan.checkpoint?<><strong>Saved-evidence scan · {text(checkpoint.day)} SGT</strong><p>{typeof checkpoint.newCandidates==='number'?checkpoint.newCandidates:'Unknown'} newly catalogued parent products / {typeof checkpoint.target==='number'?checkpoint.target:'unknown'} daily target · shortfall {typeof checkpoint.shortfall==='number'?checkpoint.shortfall:'unknown'}.</p><p className={s.note}>This scans retained observations, not new supplier requests. {checkpoint.status==='SOURCE_EXHAUSTED'?'The saved snapshot is exhausted.':checkpoint.status==='TARGET_REACHED'?'The daily scan target has been reached.':'The bounded scan is pending or in progress.'} Qualification and Pillow assessment remain separate.</p></>:<p role="status">{scan.availability==='NOT_STARTED'?'Today’s saved-evidence scan has not started.':'Saved-evidence scan progress is unavailable; no progress is inferred.'}</p>}</div>:null}
  {data.availability!== 'RETAINED_SOURCE_READ' && data.availability!==undefined ? <p role="status">Saved supplier observations are unavailable. Existing portfolio records remain below.</p> : !products.length ? <p>No authentic supplier products are available in this saved sample.</p> : <table className={s.table} aria-label="Source screening; qualification and owner approval pending">
   <thead><tr><th scope="col">Product</th><th scope="col">Supplier / observed price</th><th scope="col">Screening / next action</th></tr></thead>
   <tbody>{products.map((product,index)=><tr key={text(product.candidateId,String(index))}>
    <td><h3 className={s.rowTitle}>{text(product.title,'Source product title unavailable')}</h3><p>{text(product.category,'Category unavailable')}</p><p className={s.note}>Images withheld: usage permission unverified.</p><span className={s.badge}>{product.freshness==='FRESH'?'Within recorded source validity':'Historical observation'}</span></td>
    <td data-label="Supplier / observed price"><p>{text(product.supplierName,'Supplier name not recorded')} · {text(product.supplier,'Source unknown')}</p><p>{typeof product.observedPrice==='number'&&Number.isFinite(product.observedPrice)?product.observedPrice.toLocaleString('en-SG',{maximumFractionDigits:6}):'Price unknown'} {text(product.currency,'· currency unknown')}</p>{list(product.observedVariants).length>0?<details className={s.details}><summary>{list(product.observedVariants).length} observed variant prices · USD</summary><ul>{list(product.observedVariants).map(variant=><li key={text(variant.variantId)}>{text(variant.title,'Source variant')} · {typeof variant.observedPrice==='number'?variant.observedPrice.toLocaleString('en-SG',{maximumFractionDigits:6}):'Unknown'} USD</li>)}</ul><p className={s.note}>Currency comes from CJ’s documented product-detail variant price contract. No variant is selected or approved.</p></details>:null}<p className={s.note}>Observed {text(product.observedAt)} · stock, shipping and competitor prices not established.</p></td>
    <td data-label="Screening / next action"><strong>Deferred for evidence</strong><p className={s.note}>Next: verify source rights, variant, currency and complete economics before assessment.</p><details className={s.details}><summary>Why this product is deferred</summary><ul>{(Array.isArray(product.reasons)?product.reasons:[]).map((reason,index)=><li key={String(index)}>{typeof reason==='string'?(reasons[reason]??'Additional source verification required'):'Additional source verification required'}</li>)}</ul><p>No completed Pillow assessment or owner recommendation is established by this observation.</p></details><TechnicalEvidence label="Inspect original source details" value={product}/></td>
   </tr>)}</tbody>
  </table>}
  <details className={s.details}><summary>Sample coverage and verification counts</summary><p>Source identity matches: {typeof counts.sourceIdentityMatches==='number'?counts.sourceIdentityMatches:'Unknown'} / {products.length}. Image usage rights verified: {typeof counts.validImagesWithRights==='number'?counts.validImagesWithRights:'Unknown'} / {typeof counts.observedImages==='number'?counts.observedImages:'unknown'} observed URLs. Prices with currency: {typeof counts.pricesWithCurrency==='number'?counts.pricesWithCurrency:'Unknown'} / {products.length} products. Separately, {typeof counts.variantPricesWithDocumentedCurrency==='number'?counts.variantPricesWithDocumentedCurrency:0} observed variants have documented currency.</p><p className={s.note}>Latest 100 saved evidence records only. No new supplier request or paid assessment is triggered by this view. Freshness is evaluated when the page loads; refresh to recheck. Recorded prices are observations, not guaranteed quotes.</p></details>
 </section>;
}

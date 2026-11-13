'use client';

import {ConnectorMedia} from '../work8/ConnectorMedia';
import {Fragment} from 'react';

// Read-only presentation of separately admitted connector observations.
// This does not turn observations into a qualified dossier or a business decision.
type Row = Record<string, unknown>;
const row = (value: unknown): Row => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Row : {};
const text = (value: unknown, fallback = 'Unavailable'): string => typeof value === 'string' && value.length > 0 ? value : fallback;
const receiptURL = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'www.cjdropshipping.com' && !url.username && !url.password && !url.hash ? url.href : null; } catch { return null; }
};
const age = (value: unknown): string => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
  ? `${Math.floor(value / 3600000)} hours since connector read` : 'Age unavailable';
const factStyle = {display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem'};

export function ConnectorSourceCandidates({value,walkthrough,connectorMedia}: {value: unknown;walkthrough?:unknown;connectorMedia?:unknown}) {
  const result = row(value);
  if (result.availability === 'NOT_ADMITTED') return null;
  if (result.availability !== 'RETAINED_AUTHENTICATED_CONNECTOR_SOURCE' || !Array.isArray(result.candidates) || result.candidates.length > 1 || result.grantsAuthority !== false) {
    return <p role="alert">Retained supplier observations are unavailable. No product qualification can be inferred.</p>;
  }
  return <section aria-label="Retained supplier source observations" style={{marginBlock: '1.5rem'}}>
    <h2>Retained supplier observations</h2>
    <p>These are authenticated source observations saved for review. They have not been admitted as qualified product dossiers.</p>
    {result.candidates.map((entry: unknown) => {
      const candidate = row(entry), source = row(candidate.source), qualification = row(source.qualification);
      if (candidate.schema !== 'WORK8_CONNECTOR_SOURCE_CANDIDATE_V1' || candidate.workspace !== 'ws_empire_1' || candidate.ownerApproval !== false || candidate.qualifiedDossierAdmission !== false || source.sourceTransport !== 'AUTHENTICATED_CONNECTOR_RECEIPT' || source.nativeCJAPIExecuted !== false || source.grantsAuthority !== false || qualification.qualified !== false) {
        return <p role="alert" key="unverified">The saved source observation could not be verified for this view.</p>;
      }
      const url = receiptURL(source.sourceURL);
      const price = typeof source.observedPrice === 'number' && Number.isFinite(source.observedPrice) ? String(source.observedPrice) : 'Unavailable';
      const supplement=row(row(walkthrough).record),bound=row(walkthrough).availability==='VERIFIED_RETAINED_FACTS_AND_EXECUTED_SCREENING'&&supplement.schema==='WORK8_CONNECTOR_WALKTHROUGH_V1'&&supplement.candidateId===candidate.id&&supplement.candidateDigest===candidate.digest&&supplement.ownerApproval===false&&supplement.ownerActionObserved===false;
      const extra=bound?row(supplement.evidence):{},inventory=row(extra.inventory),currency=row(extra.currency),media=row(extra.originalMedia),screen=bound?row(supplement.screening):{};
      const screened=screen.schema==='SOURCE_COMPLETENESS_SCREENING_V1'&&screen.status==='DEFER'&&screen.candidateDigest===candidate.digest&&screen.pillowExecution===false&&screen.ownerDecision===false;
      const photo=bound&&media.sha256==='4fe19c2fbe0907474d053181a5568489d842421e0dbd2b627e487cca61511048'&&media.mime==='image/jpeg'&&media.sourceProductId===source.supplierProductId&&media.sourceVariantId===source.supplierVariantId&&media.rights==='PRIVATE_FACTUAL_PREPARATION_ONLY'&&typeof media.base64==='string'&&media.base64.length<220000;
      const reasons:Record<string,string>={RESPONSIBLE_SUPPLIER_IDENTITY:'Responsible supplier identity is unverified.',FULFILMENT_RESPONSIBILITY_AND_PROCESSING:'Fulfilment responsibility and payment-to-carrier processing are unverified.',VERIFIED_DELIVERY_TERMS:'No verified delivery promise is supplied; historical freight estimates are not a dispatch or arrival commitment.',VERIFIED_RETURNS_TERMS:'Applicable returns terms are unverified.',MATCHED_MARKETPLACE_ELIGIBILITY:'Product/account marketplace eligibility is unverified.',MATCHED_COMPETITION:'No matched competitor evidence is supplied.',COMPLETE_ECONOMICS:'Complete costs, fees, returns and selling economics are unavailable.',ASSESSMENT_TIME_FRESHNESS:'An assessment-time freshness review has not been completed.'};
      return <Fragment key={text(candidate.id)}><article data-testid="connector-source-candidate" data-candidate-id={text(candidate.id)} data-record-digest={text(candidate.digest)} style={{border: '1px solid currentColor', borderRadius: '0.5rem', padding: '1rem'}}>
        <h3>{text(source.title)}</h3>
        <p>{text(source.variantTitle)} · {text(source.variantKey)}</p>
        {photo?<figure><img data-testid="retained-original-photo" data-media-sha256={text(media.sha256)} src={'data:image/jpeg;base64,'+media.base64} width={800} height={800} alt="Retained supplier photograph: black one-layer rotating bathroom storage rack" style={{width:'100%',maxWidth:480,height:'auto'}}/><figcaption>Retained original supplier photograph · source observed {text(media.sourceObservedAtUTC)}. Exact original bytes; private factual preparation only. No public listing permission or revised-media approval is granted.</figcaption></figure>:null}
        <dl style={factStyle}>
          <div><dt>Category</dt><dd>{text(source.category)}</dd></div>
          <div><dt>Supplier product reference</dt><dd>{text(source.supplierProductId)} / {text(source.supplierVariantId)}<br/>SKU {text(source.supplierSKU)}</dd></div>
          <div><dt>Supplier identity</dt><dd>{text(source.supplierName, 'Unavailable in this source receipt')}</dd></div>
          <div><dt>Observed supplier price</dt><dd>{price} · {currency.value==='USD'?'USD — documented CJ field units':text(source.explicitCurrency, 'Currency not stated in the receipt')}{currency.value==='USD'?<p>The response has no currency field. USD comes from the retained official definition of variantSellPrice; no FX conversion or future price guarantee is implied.</p>:null}</dd></div>
          <div><dt>Connector read completed</dt><dd>{text(source.readFinishedAtUTC)}<br/>{age(candidate.sourceAgeMs)}</dd></div>
          <div><dt>Freshness</dt><dd>Retained observation only. Provider observation time and expiry are unavailable; no assessment-time freshness has been admitted.</dd></div>
          <div><dt>Stock, lead time and shipping</dt><dd>{bound?<><p>Retained CJ inventory observation: {String(inventory.factoryInventoryNum)} factory units; {String(inventory.cjInventoryNum)} CJ warehouse units; {String(inventory.totalInventoryNum)} total. {text(inventory.warehouse)} ({text(inventory.countryCode)}).</p><p>Connector receipt: {text(inventory.connectorReceiptAtUTC)}. This is a retained observation, with no provider expiry or dispatch commitment. Fulfilment responsibility, processing time and verified delivery promise remain unavailable.</p></>:'Unavailable in this selected receipt'}</dd></div>
          <div><dt>Competitor and market evidence</dt><dd>Unavailable in this selected receipt. No sales or demand estimate is supplied.</dd></div>
          <div><dt>Economics</dt><dd>Unavailable. Conflicting suggested selling prices are excluded from all calculations.</dd></div>
          <div><dt>Images</dt><dd>{photo?'One accepted original photograph is shown for private factual review. Additional source image rights remain unverified; no additional gallery images are loaded.':'Additional source image rights have not been verified; images are not loaded by this view.'}</dd></div>
        </dl>
        <p>{url ? <a href={url} target="_blank" rel="noopener noreferrer">Open the recorded CJ product reference</a> : 'Source URL unavailable'}</p>
        <h4>Source admission boundary</h4>
        <p>Saved for review only. The deferred source-admission status is not an executed business screening result, a Pillow recommendation or an owner decision.</p>
        {screened?<section aria-label="Recorded source completeness screening" data-testid="source-completeness-screening" data-screening-digest={text(supplement.digest)}><h4>Source completeness screening — Deferred</h4><p>A separate software check was executed and saved at {text(screen.atUTC)} against this exact candidate record. It reviewed the supplied receipts and deferred further qualification for the reasons below. This is not a Pillow assessment, a qualified dossier or an owner decision.</p><ul>{Array.isArray(screen.reasons)?screen.reasons.map((reason:unknown)=><li key={text(reason)}>{reasons[text(reason)]??text(reason)}</li>):null}</ul><p>Confidence: limited to the identified retained observations. The check does not establish commercial viability, current stock availability, seller eligibility or a delivery commitment.</p></section>:null}
        <p>Supplier responsibility, marketplace eligibility and complete economics remain unverified. No linked Pillow assessment, owner decision or mission has been created by this admission. Owner decision stage: no linked decision; qualification review is deferred.</p>
        <p>Next permitted step: obtain the missing source evidence and a separate, source-bound qualification review. Commerce remains locked and Pillow remains not born.</p>
        <section aria-label="Linked outcomes"><h4>Linked outcomes</h4><p>Listing, order, finance and Assurance outcomes are unavailable for this source observation. Historical operational records are not queried by this isolated view; no zero balance, completed settlement or healthy Assurance state is inferred.</p><p>This is a genuine retained supplier observation. No simulated sale, order, revenue or profit is represented by this card. No owner approval is required or solicited for this read-only deferred walkthrough.</p></section>
        <details><summary>Saved source and record evidence</summary><pre style={{whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'}}>{JSON.stringify(candidate, null, 2)}</pre></details>
        {bound?<details><summary>Recorded screening and retained evidence</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{JSON.stringify({...supplement,evidence:{...extra,originalMedia:{...media,base64:'[exact authenticated original JPEG shown above]'}}},null,2)}</pre></details>:null}
      </article><ConnectorMedia key={text(candidate.id)+text(candidate.digest)} value={connectorMedia} candidateId={text(candidate.id)} candidateDigest={text(candidate.digest)}/></Fragment>;
    })}
  </section>;
}

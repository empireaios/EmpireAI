'use client';

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

export function ConnectorSourceCandidates({value}: {value: unknown}) {
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
      return <article key={text(candidate.id)} data-testid="connector-source-candidate" data-candidate-id={text(candidate.id)} data-record-digest={text(candidate.digest)} style={{border: '1px solid currentColor', borderRadius: '0.5rem', padding: '1rem'}}>
        <h3>{text(source.title)}</h3>
        <p>{text(source.variantTitle)} · {text(source.variantKey)}</p>
        <dl style={factStyle}>
          <div><dt>Category</dt><dd>{text(source.category)}</dd></div>
          <div><dt>Supplier product reference</dt><dd>{text(source.supplierProductId)} / {text(source.supplierVariantId)}<br/>SKU {text(source.supplierSKU)}</dd></div>
          <div><dt>Supplier identity</dt><dd>{text(source.supplierName, 'Unavailable in this source receipt')}</dd></div>
          <div><dt>Observed supplier price</dt><dd>{price} · {text(source.explicitCurrency, 'Currency not stated in the receipt')}</dd></div>
          <div><dt>Connector read completed</dt><dd>{text(source.readFinishedAtUTC)}<br/>{age(candidate.sourceAgeMs)}</dd></div>
          <div><dt>Freshness</dt><dd>Retained observation only. Provider observation time and expiry are unavailable; no assessment-time freshness has been admitted.</dd></div>
          <div><dt>Stock, lead time and shipping</dt><dd>Unavailable in this selected receipt</dd></div>
          <div><dt>Competitor and market evidence</dt><dd>Unavailable in this selected receipt. No sales or demand estimate is supplied.</dd></div>
          <div><dt>Economics</dt><dd>Unavailable. Conflicting suggested selling prices are excluded from all calculations.</dd></div>
          <div><dt>Images</dt><dd>Additional source image rights have not been verified; images are not loaded by this view.</dd></div>
        </dl>
        <p>{url ? <a href={url} target="_blank" rel="noopener noreferrer">Open the recorded CJ product reference</a> : 'Source URL unavailable'}</p>
        <h4>Source admission boundary</h4>
        <p>Saved for review only. The deferred source-admission status is not an executed business screening result, a Pillow recommendation or an owner decision.</p>
        <p>Supplier responsibility, marketplace eligibility and complete economics remain unverified. No linked Pillow assessment, owner decision or mission has been created by this admission.</p>
        <p>Next permitted step: obtain the missing source evidence and a separate, source-bound qualification review. Commerce remains locked and Pillow remains not born.</p>
        <details><summary>Saved source and record evidence</summary><pre style={{whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'}}>{JSON.stringify(candidate, null, 2)}</pre></details>
      </article>;
    })}
  </section>;
}

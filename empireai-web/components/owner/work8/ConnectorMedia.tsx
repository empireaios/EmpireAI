'use client';

import {useRef, useState} from 'react';
import Image from 'next/image';
import {MessageCircle} from 'lucide-react';

type Row = Record<string, unknown>;
type MediaAction = 'REQUEST_EDIT' | 'PROPOSE_RETAINED' | 'ACKNOWLEDGE_REVIEW' | 'APPROVE_INTERNAL' | 'REJECT';
const row = (value: unknown): Row => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Row : {};
const rows = (value: unknown): Row[] => Array.isArray(value) ? value.map(row) : [];
const text = (value: unknown): string => typeof value === 'string' ? value : '';
const digest = (value: unknown): boolean => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const rights = 'PRIVATE_FACTUAL_PREPARATION_ONLY';
const sourceIdentity = 'CJ product 2610240019051639200 / variant 2610240019061630200 / SKU CJYD335906902BY';
const retained = {
  '4fe19c2fbe0907474d053181a5568489d842421e0dbd2b627e487cca61511048': {mime: 'image/jpeg', bytes: 149719, width: 800, height: 800, label: 'Original supplier photograph'},
  '69f1f95ab622041332d5e5e1ee43a59a2c34bd017151a6bb45e260f69e035788': {mime: 'image/png', bytes: 599818, width: 880, height: 1060, label: 'Retained ImageMagick composition'},
} as const;

function verifiedAsset(asset: Row) {
  const sha = text(asset.sha256);
  if (!Object.hasOwn(retained, sha)) return null;
  const expected = retained[sha as keyof typeof retained], encoded = text(asset.base64);
  if (asset.kind !== 'IMAGE' || !text(asset.id) || asset.rights !== rights || asset.sourceIdentity !== sourceIdentity || asset.mime !== expected.mime || asset.bytes !== expected.bytes || !text(asset.provenance)) return null;
  // Only the two server-pinned retained images may enter a private data URL.
  if (encoded.length !== Math.ceil(expected.bytes / 3) * 4 || encoded.length > 800000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return null;
  const padding = encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0;
  if (encoded.length / 4 * 3 - padding !== expected.bytes) return null;
  return {...expected, src: `data:${expected.mime};base64,${encoded}`};
}

function AssetFigure({asset, prefix}: {asset: Row; prefix: string}) {
  const [inspecting, setInspecting] = useState(false);
  const verified = verifiedAsset(asset);
  return <figure style={{margin: 0, maxWidth: 300}}>
      {verified ? <Image unoptimized src={verified.src} alt={verified.label + ': black one-layer rotating bathroom storage rack'} width={verified.width} height={verified.height} data-testid={prefix + '-image'} data-media-sha256={text(asset.sha256)} style={{width: '100%', height: 'auto', objectFit: 'contain'}}/> : <p role="alert">This private image could not be verified and is withheld.</p>}
      <figcaption>{verified?.label ?? 'Unverified image'}<br/>{text(asset.provenance)}</figcaption>
      <details onToggle={event => setInspecting(event.currentTarget.open)}><summary>Inspect this image and its evidence</summary>
        {inspecting && verified && <Image unoptimized src={verified.src} alt={'Individual inspection: ' + verified.label} width={verified.width} height={verified.height} style={{width: '100%', height: 'auto'}}/>}
        <p>{text(asset.sourceIdentity)}</p><p>Asset {text(asset.id)} · {text(asset.mime)} · {String(asset.bytes ?? '')} bytes</p>
        <p style={{overflowWrap: 'anywhere'}}>SHA-256: {text(asset.sha256)}</p>
        <p>Private factual preparation only. Public listing and advertising rights are not granted.</p>
      </details>
    </figure>;
}

function Assets({assets, prefix}: {assets: Row[]; prefix: string}) {
  return <div style={{display: 'flex', flexWrap: 'wrap', gap: 12}}>{assets.map(asset => <AssetFigure key={text(asset.id)} asset={asset} prefix={prefix}/>)}</div>;
}

function ArchivedVersion({event, resolveAsset}: {event: Row; resolveAsset: (asset: Row) => Row}) {
  const [open, setOpen] = useState(false);
  return <details onToggle={event => setOpen(event.currentTarget.open)}><summary>Version {Number(event.version)} · {event.action === 'REJECT' ? 'Rejected proposal' : 'Earlier proposal'}</summary>
    {open && <div><Assets assets={rows(event.assets).map(resolveAsset)} prefix="connector-archived"/><p>{text(event.instructions)}</p><p style={{overflowWrap: 'anywhere'}}>Batch digest: {text(event.batchDigest)}</p></div>}
  </details>;
}

export function ConnectorMedia({value, candidateId, candidateDigest}: {value: unknown; candidateId: string; candidateDigest: string}) {
  const [saved, setSaved] = useState<Row | null>(null), [editing, setEditing] = useState(false), [instructions, setInstructions] = useState('');
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [busy, setBusy] = useState(false), [needsRefresh, setNeedsRefresh] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const lock = useRef(false);
  const valid = (media: Row) => ['VERIFIED_SOURCE_BOUND_PRIVATE_MEDIA', 'NOT_PREPARED'].includes(text(media.availability)) && media.candidateId === candidateId && media.candidateDigest === candidateDigest && digest(candidateDigest) && media.rights === rights && typeof media.ownerApproval === 'boolean' && typeof media.version === 'number' && Number.isSafeInteger(media.version) && media.version >= 0 && Array.isArray(media.original) && Array.isArray(media.history) && Array.isArray(row(media.current).assets);
  const incoming = row(value), media = saved && valid(saved) && (!valid(incoming) || Number(saved.version) >= Number(incoming.version)) ? saved : incoming;
  if (!valid(media)) return null;
  const ownerReviewMode = media.ownerReviewMode === 'RESTORED_A08_V2';
  const reviewComplete = ownerReviewMode && Number(media.version) > 2;
  const original = rows(media.original), proposal = row(media.proposal), proposed = rows(proposal.assets), current = row(media.current), history = rows(media.history);
  const request = [...history].reverse().find(event => event.action === 'REQUEST_EDIT');
  const ready = media.availability === 'VERIFIED_SOURCE_BOUND_PRIVATE_MEDIA' && original.length > 0 && original.every(asset => verifiedAsset(asset));
  const proposalReady = proposed.length > 0 && digest(proposal.batchDigest) && proposed.every(asset => verifiedAsset(asset));
  const rejected = history.some(event => event.action === 'REJECT' && event.batchDigest === proposal.batchDigest && Number(event.version) > Number(proposal.version));
  const selected = media.ownerApproval === true && current.batchDigest === proposal.batchDigest;
  const awaitingRevision = Boolean(request && Number(request.version) > Number(proposal.version ?? -1));
  const reviewable = proposalReady && !rejected && !selected && !awaitingRevision;
  const acknowledgement = [...history].reverse().find(event => event.action === 'ACKNOWLEDGE_REVIEW' && event.batchDigest === proposal.batchDigest && Number(event.version) > Number(proposal.version) && Number(event.version) > Number(request?.version ?? -1));
  const finalReviewResponse = ownerReviewMode && history.some(event => Number(event.version) === 3 && ['ACKNOWLEDGE_REVIEW', 'APPROVE_INTERNAL', 'REJECT'].includes(text(event.action)) && event.candidateId === candidateId && event.candidateDigest === candidateDigest && event.batchDigest === proposal.batchDigest);
  const archived = history.filter(event => ((event.action === 'PROPOSE_RETAINED' || event.action === 'PROPOSE') && event.batchDigest !== proposal.batchDigest && event.batchDigest !== current.batchDigest) || event.action === 'REJECT');
  const catalog = [...original, ...proposed, ...rows(current.assets)].filter(asset => verifiedAsset(asset));
  const archivedAsset = (metadata: Row): Row => catalog.find(asset => ['id', 'kind', 'mime', 'bytes', 'sha256', 'sourceIdentity', 'rights', 'provenance'].every(key => asset[key] === metadata[key])) ?? {...metadata, base64: ''};
  const disabled = busy || needsRefresh || reviewComplete;

  async function readSaved(minimumVersion = 0) {
    const response = await fetch('/api/owner/commerce/portfolio', {credentials: 'include', cache: 'no-store'});
    if (!response.ok) throw Error('Saved media could not be refreshed. Refresh before taking another action.');
    const refreshed = row(row(await response.json()).connectorMedia);
    if (!valid(refreshed) || Number(refreshed.version) < minimumVersion) throw Error('The saved media version could not be confirmed. Refresh before taking another action.');
    setSaved(refreshed); setNeedsRefresh(false); return refreshed;
  }

  async function refresh() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await readSaved(Number(media.version)); setNotice('Saved media refreshed. Review the current version before acting.'); }
    catch (e) { setNeedsRefresh(true); setError(e instanceof Error ? e.message : 'Saved media is unavailable.'); }
    finally { lock.current = false; setBusy(false); }
  }

  async function command(action: MediaAction, assetId?: string) {
    if (lock.current || needsRefresh || !ready || reviewComplete) return;
    if (ownerReviewMode && (Number(media.version) !== 2 || !['ACKNOWLEDGE_REVIEW', 'APPROVE_INTERNAL', 'REJECT'].includes(action))) return;
    if (action === 'REQUEST_EDIT' && !instructions.trim()) return;
    if (action === 'PROPOSE_RETAINED' && (!request || Number(request.version) <= Number(proposal.version ?? -1))) return;
    if ((action === 'APPROVE_INTERNAL' || action === 'REJECT') && !reviewable) return;
    if (action === 'ACKNOWLEDGE_REVIEW' && (!reviewable || acknowledgement)) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const payload = {id: crypto.randomUUID(), reference: {candidateId, candidateDigest}, expectedVersion: media.version, action,
        ...(action === 'REQUEST_EDIT' ? {instructions: instructions.trim(), assetIds: original.map(asset => asset.id)} : action === 'PROPOSE_RETAINED' ? {} : {batchDigest: proposal.batchDigest, ...(assetId ? {assetIds: [assetId]} : {})})};
      // Any interrupted response must be reconciled by a read before another command.
      setNeedsRefresh(true);
      let reviewNonce: string | null = null;
      if (ownerReviewMode) {
        const sessionResponse = await fetch('/api/owner/commerce/review-session', {credentials: 'same-origin', cache: 'no-store'});
        if (!sessionResponse.ok) throw Error('This review session is unavailable. Refresh saved media before retrying.');
        const session = row(await sessionResponse.json());
        if (typeof session.nonce !== 'string' || !/^[A-Za-z0-9_-]{32,128}$/.test(session.nonce) || !Number.isSafeInteger(session.expiresAtMs) || Number(session.expiresAtMs) <= Date.now() || session.expectedVersion !== 2 || session.expectedVersion !== media.version || session.candidateId !== candidateId || session.candidateDigest !== candidateDigest || session.batchDigest !== proposal.batchDigest) throw Error('The review session does not match this exact media version. Refresh before acting.');
        reviewNonce = session.nonce;
      }
      const response = await fetch(ownerReviewMode ? '/api/owner/commerce/review' : '/api/owner/commerce', {method: 'POST', credentials: ownerReviewMode ? 'same-origin' : 'include', headers: {'content-type': 'application/json', ...(reviewNonce ? {'x-empire-review-nonce': reviewNonce} : {})}, body: JSON.stringify({action: 'connector_media', media: payload})});
      if (!response.ok) throw Error('The media action was not confirmed. Refresh saved media before retrying.');
      const refreshed = await readSaved(Number(media.version) + 1);
      if (!rows(refreshed.history).some(event => event.id === payload.id && event.action === action)) throw Error('The exact media action was not found in saved history. Refresh before taking another action.');
      setEditing(false); setNotice(action === 'REQUEST_EDIT' ? 'Editing request saved for this product and exact original image.' : action === 'PROPOSE_RETAINED' ? 'The retained composition is ready for review against the saved request.' : action === 'ACKNOWLEDGE_REVIEW' ? 'Review acknowledged for this exact revised batch. No media was approved or selected.' : action === 'APPROVE_INTERNAL' ? 'Internal media selection recorded. Commerce remains locked.' : 'Rejection recorded. Review the saved selection below.');
    } catch (e) { setNeedsRefresh(true); setError(e instanceof Error ? e.message : 'Media is unavailable. Refresh saved media before retrying.'); }
    finally { lock.current = false; setBusy(false); }
  }

  return <section aria-label="Source product media versions" data-testid="connector-media" data-candidate-id={candidateId} data-candidate-digest={candidateDigest} data-media-version={Number(media.version)} style={{marginTop: 24}}>
    <h3>Product images {!ownerReviewMode && <button type="button" aria-label="Request editing for this product’s media" aria-expanded={editing} data-testid="connector-media-edit-toggle" disabled={!ready || busy} onClick={() => setEditing(value => !value)}><MessageCircle size={18}/></button>}</h3>
    <p>{sourceIdentity} · media version {Number(media.version)}</p>
    <p>{text(media.status).toLowerCase().replaceAll('_', ' ') || 'No editing request saved'} · Private factual preparation only.</p>
    {!ready && <p>Private media has not been prepared for this exact source record. No editing request or approval is inferred.</p>}
    {!ownerReviewMode && editing && <div><label>Editing instructions for this product’s original image<textarea maxLength={3000} value={instructions} onChange={event => setInstructions(event.target.value)}/></label>
      <p>A saved request records instructions. The retained alternative uses ImageMagick: the complete original photograph at (40,40), without resizing, cropping or retouching, plus neutral margins and a separate factual caption.</p>
      <button type="button" disabled={disabled || !instructions.trim()} onClick={() => void command('REQUEST_EDIT')}>Save editing request</button>
    </div>}
    {request && <details><summary>Saved editing request · version {Number(request.version)}</summary><p>{text(request.instructions)}</p><p style={{overflowWrap: 'anywhere'}}>Request digest: {text(request.digest)}</p><p>Original asset IDs: {Array.isArray(request.assetIds) ? request.assetIds.map(text).join(', ') : 'Unavailable'}</p></details>}
    {!ownerReviewMode && ready && request && Number(request.version) > Number(proposal.version ?? -1) && <div><p>Review the retained composition against these instructions. This loads the completed ImageMagick artifact; no Canva execution or new image generation is claimed.</p><button type="button" disabled={disabled} onClick={() => void command('PROPOSE_RETAINED')}>Load retained revised composition</button></div>}
    <div data-testid="connector-media-gallery" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))', gap: 16}}>
      <div><h4>Original supplier image</h4><Assets assets={original} prefix="connector-original"/>{!original.length && <p>No source-bound private media is available in this record.</p>}</div>
      <div data-testid="connector-media-proposal"><h4>Proposed revised image</h4><Assets assets={proposed} prefix="connector-revised"/>{!proposed.length ? <p>No revised version has been proposed in this record.</p> : <><p>Proposal version {Number(proposal.version)} · {rejected ? 'Rejected' : selected ? 'Selected internally' : awaitingRevision ? 'Awaiting response to the latest editing request' : acknowledgement ? 'Reviewed without approval or selection' : 'Awaiting owner review'}</p><p>{text(proposal.instructions)}</p><details><summary>Composition and version evidence</summary><p>{text(proposal.editingReceipt)}</p><p style={{overflowWrap: 'anywhere'}}>Batch digest: {text(proposal.batchDigest)}<br/>Event digest: {text(proposal.digest)}</p></details></>}</div>
    </div>
    {reviewable && !reviewComplete && <div><p>Compare the exact original and revised images, instructions and rights. You may acknowledge your review without approving or selecting a version. Internal approval does not grant publication authority.</p>{!acknowledgement && <button type="button" disabled={disabled} onClick={() => void command('ACKNOWLEDGE_REVIEW')}>Acknowledge review without approval</button>}{proposed.map(asset => <button key={text(asset.id)} type="button" disabled={disabled} onClick={() => void command('APPROVE_INTERNAL', text(asset.id))}>Select and approve this image internally</button>)}<button type="button" disabled={disabled} onClick={() => void command('APPROVE_INTERNAL')}>Approve revised batch internally</button><button type="button" disabled={disabled} onClick={() => void command('REJECT')}>Reject proposed batch</button></div>}
    {reviewComplete && <p data-testid="connector-media-review-complete">{finalReviewResponse ? 'A review response is recorded for this exact batch. This review session accepts no further changes. The saved result and exact version remain available below.' : 'This review session accepts no further changes. Refresh saved media to confirm the recorded response.'}</p>}
    {acknowledgement && <details data-testid="connector-media-review"><summary>Review acknowledgement · version {Number(acknowledgement.version)}</summary><p>This acknowledgement records review only. It grants no approval or selection.</p><p style={{overflowWrap: 'anywhere'}}>Reviewed batch: {text(acknowledgement.batchDigest)}<br/>Review event: {text(acknowledgement.digest)}</p></details>}
    <div><h4>Selected internal version</h4>{media.ownerApproval === true && rows(current.assets).length > 0 ? <><Assets assets={rows(current.assets).map(archivedAsset)} prefix="connector-selected"/><p style={{overflowWrap: 'anywhere'}}>Selected batch: {text(current.batchDigest)}</p></> : <p>No internally approved media version is selected.</p>}</div>
    <details data-testid="connector-media-archive" style={{marginBlock: 12}} onToggle={event => setArchiveOpen(event.currentTarget.open)}><summary>Archive{archived.length ? ` · ${archived.length} saved events` : ''}</summary>{archived.length ? archiveOpen && archived.map(event => <ArchivedVersion key={text(event.digest) || String(event.version)} event={event} resolveAsset={archivedAsset}/>) : <p>No prior, replaced or rejected versions are recorded.</p>}</details>
    {ready && <p>One original photograph is available; its retained revision appears after proposal. Additional supplier images and videos have no verified private display record here.</p>}
    <button type="button" disabled={busy} onClick={() => void refresh()}>Refresh saved media</button>
    {notice && <p role="status">{notice}</p>}{error && <p role="alert">{error}</p>}
  </section>;
}

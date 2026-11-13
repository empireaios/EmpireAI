import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { assertOwnerWritesReleased } from '../../owner-write-restriction.js';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const digest = (v) => hash(JSON.stringify(v));
function fail(code) { throw Error(code); }
const record = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) ? v : fail('CONNECTOR_OBJECT_REQUIRED');
const exact = (r, keys) => { if (Object.keys(r).sort().join(',') !== keys.sort().join(','))
    fail('CONNECTOR_KEYS'); };
const text = (v, max) => typeof v === 'string' && v.length > 0 && v.length <= max ? v : fail('CONNECTOR_TEXT_BOUND');
const sha = (v) => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v) ? v : fail('CONNECTOR_DIGEST_REQUIRED');
const instant = (v) => { const n = typeof v === 'string' ? Date.parse(v) : NaN; if (!Number.isSafeInteger(n))
    fail('CONNECTOR_TIME'); return n; };
const https = (v) => { const s = text(v, 1500); let u; try {
    u = new URL(s);
}
catch {
    return fail('CONNECTOR_URL');
} if (u.protocol !== 'https:' || u.username || u.password || u.hash)
    fail('CONNECTOR_URL'); return s; };
const TABLE = 'work8_connector_source_candidates';
const TOOL = 'mcp__codex_apps__cjdropshipping_readback_get_product_detail';
const PID = '2610240019051639200', VID = '2610240019061630200', SKU = 'CJYD335906902BY';
const RAW_SHA = '49a84a8c0d78aa4fefe5fad51f28d80d2e51c9f86e74c6ec1fe37f632e69be78';
const REVIEW_SHA = '7b88b56f5eb8d2e2edb32220614271abb9bd95bb228e41dac1b02f541c84fe63';
const SOURCE_PROJECTION_SHA = 'be882d70f16202ea2c8623a5ca9aa80713cca04b4df53daf1f2a4da8e11a19be';
function readMounted(filename, max) {
    if (!path.isAbsolute(filename) || fs.realpathSync(filename) !== filename)
        fail('CONNECTOR_INPUT_PATH');
    const fd = fs.openSync(filename, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    try {
        const s = fs.fstatSync(fd);
        if (!s.isFile() || s.nlink !== 1 || s.size > max || (s.mode & 0o222) !== 0 || (s.uid !== 0 && s.uid !== process.getuid?.()))
            fail('CONNECTOR_INPUT_PERMISSIONS');
        return fs.readFileSync(fd);
    }
    finally {
        fs.closeSync(fd);
    }
}
function decodeRaw(raw, review, now) {
    if (raw.length > 64000 || review.length > 64000 || hash(raw) !== RAW_SHA || hash(review) !== REVIEW_SHA)
        fail('CONNECTOR_PIN_MISMATCH');
    const r = record(JSON.parse(raw.toString('utf8'))), reviewed = record(JSON.parse(review.toString('utf8')));
    if (r.operation !== 'V127-OWNER-CJ-DETAIL-READ-01' || r.tool !== TOOL || record(r.input).pid !== PID)
        fail('CONNECTOR_OPERATION_SCOPE');
    const start = instant(r.startedAtUTC), finish = instant(r.finishedAtUTC);
    if (start > finish || finish > now)
        fail('CONNECTOR_TIME');
    const result = record(r.result);
    if (result.isError === true || !Array.isArray(result.content) || result.content.length !== 1)
        fail('CONNECTOR_RESULT');
    const content = record(result.content[0]);
    if (content.type !== 'text' || typeof content.text !== 'string')
        fail('CONNECTOR_RESULT');
    const prefix = '🔍 Product detail loaded.\n\n';
    if (!content.text.startsWith(prefix))
        fail('CONNECTOR_PREFIX');
    const product = record(JSON.parse(content.text.slice(prefix.length)));
    if (product.pid !== PID || !Array.isArray(product.variants) || product.variants.length !== 6)
        fail('CONNECTOR_PARENT_SCOPE');
    const matches = product.variants.map(record).filter(v => v.vid === VID);
    if (matches.length !== 1)
        fail('CONNECTOR_VARIANT_SCOPE');
    const variant = matches[0];
    if (variant.pid !== PID || variant.variantSku !== SKU)
        fail('CONNECTOR_VARIANT_SCOPE');
    if (reviewed.verdict !== 'PASS_SOURCE_RECEIPT_CUSTODY_AND_EXACT_IDENTITY_ONLY' || record(record(reviewed.inputs).rawProviderReceipt).sha256 !== RAW_SHA)
        fail('CONNECTOR_REVIEW_SCOPE');
    if (!Array.isArray(reviewed.newWholeRowsAccepted) || reviewed.newWholeRowsAccepted.length || !Array.isArray(reviewed.newOriginalPredicatesAccepted) || reviewed.newOriginalPredicatesAccepted.length)
        fail('CONNECTOR_REVIEW_SCOPE');
    if (!Array.isArray(product.productImageSet) || product.productImageSet.length > 20)
        fail('CONNECTOR_MEDIA_BOUND');
    const amount = variant.variantSellPrice;
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0)
        fail('CONNECTOR_PRICE');
    return { sourceOperation: r.operation, connector: TOOL, receiptSHA256: RAW_SHA, independentReviewSHA256: REVIEW_SHA,
        readStartedAtUTC: r.startedAtUTC, readFinishedAtUTC: r.finishedAtUTC, providerObservedAt: null, providerExpiresAt: null,
        sourceTransport: 'AUTHENTICATED_CONNECTOR_RECEIPT', nativeCJAPIExecuted: false,
        supplierProductId: PID, supplierVariantId: VID, supplierSKU: SKU,
        title: text(product.productNameEn, 1500), variantTitle: text(variant.variantNameEn, 1500), variantKey: text(variant.variantKey, 160), category: text(product.categoryName, 1500),
        sourceURL: https(product.productUrl), observedPrice: amount, explicitCurrency: variant.currency ?? product.currency ?? null,
        supplierName: product.supplierName ?? null, supplierId: product.supplierId ?? null,
        observedImageURLs: product.productImageSet.map(https), selectedImageURL: https(variant.variantImage),
        sourceDeclaredBarcode: variant.barcode ?? null, sourceDeclaredEntryCode: product.entryCode ?? null,
        qualification: { status: 'DEFERRED', qualified: false, assessmentFreshness: 'NOT_ADMITTED', reasons: ['SUPPLIER_RESPONSIBILITY_UNVERIFIED', 'MARKETPLACE_ELIGIBILITY_UNVERIFIED', 'COMPLETE_ECONOMICS_UNVERIFIED', 'NO_SOURCE_BOUND_PILLOW_ASSESSMENT', 'RETAINED_OBSERVATION_REQUIRES_ASSESSMENT_TIME_REVIEW'], stock: null, leadTime: null, shipping: null, competitorPrices: [], economics: null },
        quarantinedFields: [{ field: 'variantSugSellPrice', priorReceiptSHA256: '1d131fced10d7a14963d7d62f3ce6ab34e99ac1273c8b241c325814b63375fcf', priorValue: 4.35, currentValue: 32.28, cause: 'UNDETERMINED_ACROSS_DIFFERENT_READ_OPERATIONS_AND_TIMES', excludedFromEconomics: true }],
        mediaRights: 'ADDITIONAL_URLS_UNVERIFIED_EXISTING_O7_RIGHTS_NOT_EXPANDED',
        ownerDecision: null, pillowAssessment: null, missionId: null, simulatedCommerce: null, finance: null, assurance: null,
        grantsAuthority: false, liveCommerce: 'LOCKED', birth: 'NOT_BORN' };
}
/** File pins are deliberately specific to the independently reviewed V127 receipt.
 * Changing selected input is a reviewed source change, never a browser-supplied hash.
 * The mounted policy authorizes this operator transaction only; its expiry is NOT source freshness.
 */
export function admitPinnedConnectorSource(db, files, now = Date.now()) {
    assertOwnerWritesReleased();
    if (!Number.isSafeInteger(now))
        fail('CONNECTOR_TIME');
    const policy = record(JSON.parse(readMounted(files.policy, 4096).toString('utf8')));
    exact(policy, ['schema', 'operationId', 'workspace', 'authoritySHA256', 'expiresAtUTC', 'expectedCurrentCount', 'applicationCommit', 'adapterPublicationCommit', 'adapterModuleSHA256']);
    if (policy.schema !== 'WORK8_CONNECTOR_SOURCE_ADMISSION_V1' || policy.workspace !== 'ws_empire_1' || policy.expectedCurrentCount !== 0)
        fail('CONNECTOR_POLICY');
    const operationId = text(policy.operationId, 160);
    if (!/^[A-Za-z0-9_.:-]+$/.test(operationId))
        fail('CONNECTOR_OPERATION_ID');
    const authoritySHA256 = sha(policy.authoritySHA256), expires = instant(policy.expiresAtUTC);
    if (expires <= now || expires - now > 1200000)
        fail('CONNECTOR_POLICY_EXPIRED');
    // The original guard checks whether release is allowed; this binds the narrower operation
    // to that exact mounted audit reference and lifetime, without treating it as a signature.
    const outer = record(JSON.parse(readMounted(process.env.EMPIRE_OWNER_WRITE_POLICY, 4096).toString('utf8')));
    if (authoritySHA256 !== outer.approvalSha256 || expires > instant(outer.expiresAt))
        fail('CONNECTOR_AUTHORITY_BINDING');
    if (typeof policy.applicationCommit !== 'string' || !/^[a-f0-9]{40}$/.test(policy.applicationCommit) || policy.applicationCommit !== process.env.RAILWAY_GIT_COMMIT_SHA)
        fail('CONNECTOR_APPLICATION_COMMIT');
    if (typeof policy.adapterPublicationCommit !== 'string' || !/^[a-f0-9]{40}$/.test(policy.adapterPublicationCommit) || policy.adapterPublicationCommit !== process.env.EMPIRE_CONNECTOR_ADAPTER_COMMIT)
        fail('CONNECTOR_ADAPTER_COMMIT');
    const adapterModuleSHA256 = sha(policy.adapterModuleSHA256);
    if (adapterModuleSHA256 !== hash(fs.readFileSync(fileURLToPath(import.meta.url))))
        fail('CONNECTOR_ADAPTER_BYTES');
    const source = decodeRaw(readMounted(files.rawReceipt, 64000), readMounted(files.independentReview, 64000), now);
    if (digest(source) !== SOURCE_PROJECTION_SHA)
        fail('CONNECTOR_SOURCE_PROJECTION_CHANGED');
    const workspace = String(policy.workspace), id = 'connector-cj:' + digest({ workspace, receipt: source.receiptSHA256, pid: PID, vid: VID }).slice(0, 40);
    const softwareIdentity = { applicationCommit: policy.applicationCommit, adapterPublicationCommit: policy.adapterPublicationCommit, adapterModuleSHA256 };
    const requestDigest = digest({ operationId, workspace, authoritySHA256, softwareIdentity, source });
    db.exec('BEGIN IMMEDIATE');
    try {
        db.exec(`CREATE TABLE IF NOT EXISTS ${TABLE}(workspace TEXT NOT NULL,id TEXT NOT NULL,source_sha TEXT NOT NULL,operation TEXT NOT NULL,record TEXT NOT NULL,PRIMARY KEY(workspace,id),UNIQUE(workspace,source_sha),UNIQUE(workspace,operation));
   CREATE TRIGGER IF NOT EXISTS immutable_connector_source_update BEFORE UPDATE ON ${TABLE} BEGIN SELECT RAISE(ABORT,'IMMUTABLE_CONNECTOR_SOURCE');END;
   CREATE TRIGGER IF NOT EXISTS immutable_connector_source_delete BEFORE DELETE ON ${TABLE} BEGIN SELECT RAISE(ABORT,'IMMUTABLE_CONNECTOR_SOURCE');END;`);
        const prior = db.prepare(`SELECT record FROM ${TABLE} WHERE workspace=? AND (source_sha=? OR operation=?)`).all(workspace, source.receiptSHA256, operationId);
        if (prior.length) {
            if (prior.length !== 1)
                fail('CONNECTOR_IDEMPOTENCY_CONFLICT');
            const value = record(JSON.parse(String(prior[0].record)));
            verifyStored(value, workspace);
            if (value.requestDigest !== requestDigest)
                fail('CONNECTOR_IDEMPOTENCY_CONFLICT');
            db.exec('COMMIT');
            return { status: 'ALREADY_ADMITTED', record: value, externalEffects: 0 };
        }
        const count = Number(db.prepare(`SELECT count(*) n FROM ${TABLE} WHERE workspace=?`).get(workspace)?.n);
        if (count !== policy.expectedCurrentCount)
            fail('CONNECTOR_VERSION_CONFLICT');
        const body = { schema: 'WORK8_CONNECTOR_SOURCE_CANDIDATE_V1', id, workspace, version: 1, source, operationId, authoritySHA256, softwareIdentity, requestDigest, admittedAtUTC: new Date(now).toISOString(), inputActor: 'DELEGATED_TECHNICAL_OPERATOR', ownerActionObserved: false, ownerApproval: false, qualifiedDossierAdmission: false, externalEffects: 0 };
        const value = { ...body, digest: digest(body) };
        db.prepare(`INSERT INTO ${TABLE} VALUES(?,?,?,?,?)`).run(workspace, id, source.receiptSHA256, operationId, JSON.stringify(value));
        db.exec('COMMIT');
        return { status: 'ADMITTED_SOURCE_OBSERVATION_ONLY', record: value, externalEffects: 0 };
    }
    catch (e) {
        db.exec('ROLLBACK');
        throw e;
    }
}
function verifyStored(raw, workspace) {
    const { digest: actual, ...body } = raw;
    const source = record(raw.source);
    if (raw.schema !== 'WORK8_CONNECTOR_SOURCE_CANDIDATE_V1' || raw.workspace !== workspace || raw.version !== 1 || digest(body) !== actual || source.receiptSHA256 !== RAW_SHA || source.independentReviewSHA256 !== REVIEW_SHA || source.sourceTransport !== 'AUTHENTICATED_CONNECTOR_RECEIPT' || source.nativeCJAPIExecuted !== false || source.grantsAuthority !== false || raw.ownerActionObserved !== false || raw.ownerApproval !== false || raw.qualifiedDossierAdmission !== false || raw.externalEffects !== 0)
        fail('CONNECTOR_STORED_CHAIN_UNVERIFIED');
    if (digest(source) !== SOURCE_PROJECTION_SHA)
        fail('CONNECTOR_STORED_CHAIN_UNVERIFIED');
    if (raw.id !== 'connector-cj:' + digest({ workspace, receipt: RAW_SHA, pid: PID, vid: VID }).slice(0, 40) || raw.requestDigest !== digest({ operationId: raw.operationId, workspace, authoritySHA256: raw.authoritySHA256, softwareIdentity: raw.softwareIdentity, source }))
        fail('CONNECTOR_STORED_CHAIN_UNVERIFIED');
    return raw;
}
/** Read-only, workspace-scoped projection; absence is distinct from unavailable/corrupt evidence.
 * No schema creation, source refresh, model call, inference, decision or media fetch occurs here.
 */
export function readConnectorSourceCandidates(db, workspace, now = Date.now()) {
    if (workspace !== 'ws_empire_1' || !Number.isSafeInteger(now))
        fail('CONNECTOR_READ_SCOPE');
    if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(TABLE))
        return { availability: 'NOT_ADMITTED', candidates: [], coverage: 'PINNED_SINGLE_SOURCE', grantsAuthority: false };
    const saved = db.prepare(`SELECT record FROM ${TABLE} WHERE workspace=? ORDER BY id LIMIT 2`).all(workspace);
    if (saved.length > 1)
        fail('CONNECTOR_READ_BOUND');
    const candidates = saved.map(r => verifyStored(record(JSON.parse(String(r.record))), workspace)).map(r => { const source = record(r.source); const read = instant(source.readFinishedAtUTC); if (read > now)
        fail('CONNECTOR_TIME'); return { ...r, sourceAgeMs: now - read, freshness: 'RETAINED_OBSERVATION_ONLY', providerExpiry: null, assessmentFreshnessAdmission: false }; });
    return { availability: 'RETAINED_AUTHENTICATED_CONNECTOR_SOURCE', candidates, coverage: 'PINNED_SINGLE_SOURCE', grantsAuthority: false };
}
//# sourceMappingURL=work8-connector-source.js.map
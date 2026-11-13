// A10-only prospective probe. Delegated preparation never constitutes owner review.
// No image bytes, private URLs or credentials are stored in this source file.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {readBrowserNativeResponse} from './browser-native-request.mjs';

const ORIGIN = 'http://127.0.0.1:43117', OUTPUT = '/evidence';
const PORTFOLIO = '/api/owner/commerce/portfolio?classification=REAL_READ_ONLY&page=1&pageSize=10';
const APPLICATION_COMMIT = '6c1e63ba20619ee480742fd87dc810ca93152e22';
const OWNER_SHA = 'a437be3d7f2e7927959c2be2040016464de75d69529d9abd197e47a8caa21267';
const ORIGINAL_SHA = '4fe19c2fbe0907474d053181a5568489d842421e0dbd2b627e487cca61511048';
const REVISED_SHA = '69f1f95ab622041332d5e5e1ee43a59a2c34bd017151a6bb45e260f69e035788';
const REVIEW_SHA = 'bd45ebfea787feef24dcd429044672c7aab4a76bd0176c0217070dc3432777d0';
const SCRIPT_SHA = 'f9d2075a015b3bfa5d505fdb940ef6e640566828073a22e65c8af4612f588b7c';
const RIGHTS = 'PRIVATE_FACTUAL_PREPARATION_ONLY';
const PID = '2610240019051639200', VID = '2610240019061630200', SKU = 'CJYD335906902BY';
const SOURCE = `CJ product ${PID} / variant ${VID} / SKU ${SKU}`;
const EXECUTABLE = '/ms-playwright/chromium-1234/chrome-linux64/chrome';
const EXECUTABLE_BYTES = 290614600, EXECUTABLE_SHA = '0b20b130e7edd9dd51873be867761295fe0cfad490c2b9a64f95bd3cfc08fa71';
const MAX_READ = 4194304;
export const EDIT_INSTRUCTIONS = 'Compare the retained ImageMagick composition with this exact original: complete original photograph at (40,40), no resizing, crop, retouch or regeneration; neutral margins and a separate factual caption. Private factual preparation only. Do not publish.';
const sha = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha(JSON.stringify(value));
const row = value => { assert.ok(value && typeof value === 'object' && !Array.isArray(value), 'OBJECT_REQUIRED'); return value; };
const exact = (value, keys) => assert.deepEqual(Object.keys(value).sort(), [...keys].sort(), 'EXACT_FIELDS');
const metadata = ({base64, ...asset}) => asset;

export function canonicalCandidate(projection, publicationCommit) {
  const {sourceAgeMs, freshness, providerExpiry, assessmentFreshnessAdmission, ...candidate} = row(projection);
  assert.ok(Number.isSafeInteger(sourceAgeMs) && sourceAgeMs >= 0);
  assert.equal(freshness, 'RETAINED_OBSERVATION_ONLY'); assert.equal(providerExpiry, null); assert.equal(assessmentFreshnessAdmission, false);
  const {digest: recorded, ...body} = candidate; assert.equal(digest(body), recorded, 'CANDIDATE_CANONICAL_DIGEST');
  assert.equal(candidate.schema, 'WORK8_CONNECTOR_SOURCE_CANDIDATE_V1'); assert.equal(candidate.workspace, 'ws_empire_1');
  assert.equal(candidate.ownerApproval, false); assert.equal(candidate.ownerActionObserved, false); assert.equal(candidate.qualifiedDossierAdmission, false);
  assert.equal(candidate.source.supplierProductId, PID); assert.equal(candidate.source.supplierVariantId, VID); assert.equal(candidate.source.supplierSKU, SKU);
  assert.equal(candidate.source.missionId, null); assert.equal(candidate.source.sourceTransport, 'AUTHENTICATED_CONNECTOR_RECEIPT');
  assert.equal(candidate.softwareIdentity.applicationCommit, APPLICATION_COMMIT);
  assert.equal(candidate.softwareIdentity.adapterPublicationCommit, publicationCommit);
  return candidate;
}

export function verifiedAsset(asset, encoded = true) {
  row(asset); const expected = asset.sha256 === ORIGINAL_SHA ? {mime: 'image/jpeg', bytes: 149719, width: 800, height: 800} : asset.sha256 === REVISED_SHA ? {mime: 'image/png', bytes: 599818, width: 880, height: 1060} : null;
  assert.ok(expected, 'UNRETAINED_ASSET'); assert.equal(asset.kind, 'IMAGE'); assert.equal(asset.mime, expected.mime); assert.equal(asset.bytes, expected.bytes);
  assert.equal(asset.rights, RIGHTS); assert.equal(asset.sourceIdentity, SOURCE); assert.ok(typeof asset.id === 'string' && asset.id.length > 0);
  assert.ok(typeof asset.provenance === 'string' && asset.provenance.length > 0);
  if (encoded) {
    assert.equal(typeof asset.base64, 'string'); assert.equal(asset.base64.length, Math.ceil(expected.bytes / 3) * 4);
    const bytes = Buffer.from(asset.base64, 'base64'); assert.equal(bytes.toString('base64'), asset.base64, 'CANONICAL_ASSET_ENCODING');
    assert.equal(bytes.length, expected.bytes); assert.equal(sha(bytes), asset.sha256, 'ACTUAL_SERVED_ASSET_HASH');
  } else assert.equal(Object.hasOwn(asset, 'base64'), false, 'HISTORY_BYTES_MUST_BE_DEDUPLICATED');
  if (asset.sha256 === REVISED_SHA) assert.match(asset.provenance, /ImageMagick convert6\.9\.12-98/);
  return expected;
}

export function admitMediaCommand(payload, expected) {
  exact(row(payload), ['action', 'media']); assert.equal(payload.action, 'connector_media');
  const media = row(payload.media); assert.ok(expected, 'UNEXPECTED_MEDIA_MUTATION');
  assert.equal(media.action, expected.action); assert.ok(['REQUEST_EDIT', 'PROPOSE_RETAINED'].includes(media.action), 'OWNER_DECISION_OR_PUBLICATION_REFUSED');
  exact(media, ['id', 'reference', 'expectedVersion', 'action', ...(media.action === 'REQUEST_EDIT' ? ['instructions', 'assetIds'] : [])]);
  assert.match(media.id, /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i);
  assert.deepEqual(media.reference, expected.reference); assert.equal(media.expectedVersion, expected.expectedVersion);
  if (media.action === 'REQUEST_EDIT') { assert.equal(media.instructions, EDIT_INSTRUCTIONS); assert.deepEqual(media.assetIds, [expected.originalId]); }
  return {id: media.id, reference: {candidateId: media.reference.candidateId, candidateDigest: media.reference.candidateDigest}, expectedVersion: media.expectedVersion, action: media.action,
    ...(media.action === 'REQUEST_EDIT' ? {instructions: media.instructions, assetIds: media.assetIds} : {})};
}

export function verifyMedia(media, candidate, principal, version, commands) {
  assert.equal(media.availability, 'VERIFIED_SOURCE_BOUND_PRIVATE_MEDIA'); assert.equal(media.version, version);
  assert.equal(media.candidateId, candidate.id); assert.equal(media.candidateDigest, candidate.digest);
  assert.equal(media.rights, RIGHTS); assert.equal(media.ownerApproval, false); assert.equal(media.publicPublicationAllowed, false);
  assert.equal(media.externalEffects, 0); assert.equal(media.paidInference, 0); assert.deepEqual(media.current, {assets: []});
  assert.equal(media.original.length, 1); verifiedAsset(media.original[0]); assert.equal(media.original[0].sha256, ORIGINAL_SHA);
  assert.equal(media.history.length, version); assert.ok(version >= 0 && version <= 2, 'UNRECONCILED_MEDIA_HISTORY');
  const reference = {candidateId: candidate.id, candidateDigest: candidate.digest};
  const bindingDigest = digest({workspace: principal.workspaceId, owner: principal.id, ...reference, rights: RIGHTS, publicPublicationAllowed: false, originalSHA256: ORIGINAL_SHA, revisedSHA256: REVISED_SHA, retainedReviewSHA256: REVIEW_SHA});
  let previous = '';
  for (let index = 0; index < media.history.length; index++) {
    const event = media.history[index], {digest: recorded, ...body} = event;
    assert.equal(event.schema, 'WORK8_CONNECTOR_MEDIA_EVENT_V1'); assert.equal(digest(body), recorded, 'NATIVE_EVENT_DIGEST');
    assert.equal(event.version, index + 1); assert.equal(event.previous, previous); previous = recorded;
    assert.equal(event.workspace, principal.workspaceId); assert.equal(event.owner, principal.id);
    assert.equal(event.candidateId, candidate.id); assert.equal(event.candidateDigest, candidate.digest); assert.equal(event.bindingDigest, bindingDigest);
    assert.equal(event.ownerApproval, false); assert.equal(event.externalEffects, 0); assert.equal(event.paidInference, 0);
    assert.equal(event.action, index === 0 ? 'REQUEST_EDIT' : 'PROPOSE_RETAINED');
    assert.equal(event.id, commands[index]?.id, 'ACTUAL_UI_COMMAND_ID');
    assert.equal(event.requestDigest, digest({principal: {workspace: principal.workspaceId, owner: principal.id}, request: commands[index], bindingDigest}), 'ACTUAL_UI_REQUEST_DIGEST');
    assert.equal(event.assets.length, 1); verifiedAsset(event.assets[0], false); assert.equal(event.instructions, EDIT_INSTRUCTIONS);
    assert.deepEqual(event.assetIds, event.assets.map(asset => asset.id));
    if (index === 0) {
      assert.deepEqual(event.assets, [metadata(media.original[0])]); assert.equal(event.editRequestDigest, null); assert.equal(event.editingReceipt, null);
      assert.equal(event.batchDigest, digest({reference, assets: event.assets})); assert.equal(event.status, 'EDIT_REQUEST_SAVED');
    } else {
      assert.equal(event.assets[0].sha256, REVISED_SHA); assert.equal(event.editRequestDigest, media.history[0].digest);
      assert.ok(event.editingReceipt.includes(REVIEW_SHA) && event.editingReceipt.includes(SCRIPT_SHA)); assert.match(event.editingReceipt, /no new editor execution/);
      assert.equal(event.batchDigest, digest({reference, editRequestDigest: event.editRequestDigest, assets: event.assets, instructions: event.instructions, editingReceipt: event.editingReceipt, bindingDigest}));
      assert.equal(event.status, 'PROPOSED_RETAINED_ASSET_AWAITING_OWNER_REVIEW');
    }
  }
  if (version < 2) assert.equal(media.proposal, null);
  else { verifiedAsset(media.proposal.assets[0]); assert.deepEqual({...media.proposal, assets: media.proposal.assets.map(metadata)}, media.history[1]); }
  return {version, mediaDigest: digest(media), originalSHA256: ORIGINAL_SHA, revisedSHA256: version === 2 ? REVISED_SHA : null, eventDigests: media.history.map(event => event.digest), batchDigest: media.proposal?.batchDigest ?? null, currentAssets: 0, ownerApproval: false};
}

async function main() {
  const started = Date.now(), deadline = started + 120000;
  let cfg, privateValues = [], browser, activeContext, phase = 'private-configuration-admission', deadlineExpired = false;
  let expectedCommand = null, acceptedCandidate = null, acceptedPrincipal = null, proposedMedia = null;
  const commands = [], result = {schema: 'v128-connector-media-browser-observation-v1', status: 'FAIL', startedAtMs: started, inputActor: 'DELEGATED_TECHNICAL_OPERATOR', ownerActionObserved: false, ownerDecisionGranted: false, wholeRowAccepted: false, productionAccess: false, publicationActions: 0, ownerDecisionActions: 0, liveCommerce: 'LOCKED', pillow: 'NOT_BORN', applicationCommit: APPLICATION_COMMIT,
    artifactDisposition: 'PRIVATE_RUNTIME_OUTPUT_REQUIRES_REVIEWED_ENCRYPTION_BEFORE_PUBLICATION', views: [], nativeReads: [], independentReadMaximumBytesPerResponse: MAX_READ, independentReadTotalBytes: 0,
    network: {mode: 'SHARED_EXACT_NATIVE_NONE_NAMESPACE', externalRequestsBlocked: 0, webSocketsBlocked: 0, unexpectedMutationsBlocked: 0}, browserStarted: false, browserClosed: false};
  const bounded = () => assert.ok(!deadlineExpired && Date.now() < deadline, 'BROWSER_OPERATION_DEADLINE');
  function assertPrivateSafe(value) {
    const encoded = typeof value === 'string' ? value : JSON.stringify(value);
    assert.ok(!privateValues.some(secret => encoded.includes(secret)), 'PRIVATE_VALUE_REFUSED');
    assert.ok(!/[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(encoded), 'PRIVATE_EMAIL_REFUSED');
    function scan(item) { if (Array.isArray(item)) { item.forEach(scan); return; } if (item && typeof item === 'object') for (const [key, child] of Object.entries(item)) { assert.ok(!['password', 'founderpassword', 'adminpassword', 'token', 'cookie', 'authorization', 'set-cookie', 'sessionsecret'].includes(key.toLowerCase()), 'PRIVATE_KEY_REFUSED'); scan(child); } }
    if (typeof value !== 'string') scan(value);
  }
  function saveJSON(name, value) {
    assert.match(name, /^connector-media-[a-z-]+\.json$/); assertPrivateSafe(value);
    const encoded = JSON.stringify(value, null, 2) + '\n'; assert.ok(Buffer.byteLength(encoded) <= MAX_READ);
    const target=path.join(OUTPUT,name);
    if(name==='connector-media-binding-request.json'){
      const temporary=target+'.tmp',fd=fs.openSync(temporary,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);
      try{fs.writeFileSync(fd,encoded);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
      assert.ok(!fs.existsSync(target));fs.renameSync(temporary,target);
    }else fs.writeFileSync(target,encoded,{flag:'wx',mode:0o600});
    return {path:name,bytes:Buffer.byteLength(encoded),sha256:sha(encoded)};
  }
  async function nativeRead(page, route, method = 'GET') {
    bounded(); assert.ok(result.nativeReads.length < 28, 'INDEPENDENT_READ_COUNT_BOUND');
    const response = await readBrowserNativeResponse(page, route, method); assert.ok(response.raw.length <= MAX_READ);
    const receipt = {route, method, status: response.status, responseBytes: response.raw.length, responseSHA256: sha(response.raw), transport: 'AUTHENTICATED_BROWSER_FETCH'};
    result.nativeReads.push(receipt); result.independentReadTotalBytes += response.raw.length; return {...response, receipt};
  }
  async function readJSON(page, route, captureName) {
    const response = await nativeRead(page, route); assert.equal(response.status, 200, 'AUTHENTICATED_NATIVE_READ_STATUS');
    const value = JSON.parse(response.raw.toString('utf8'));
    if (captureName) { assertPrivateSafe(value); assertPrivateSafe(response.raw.toString('utf8')); assert.match(captureName, /^connector-media-portfolio-(?:before|request|desktop|mobile)\.json$/); fs.writeFileSync(path.join(OUTPUT, captureName), response.raw, {flag: 'wx', mode: 0o600}); }
    return {value, raw: response.raw, receipt: {...response.receipt, ...(captureName ? {path: captureName, completeResponseBody: true, privateValueScanPassed: true} : {})}};
  }
  function candidateFrom(portfolio) {
    assert.equal(portfolio.connectorSourceCandidates.availability, 'RETAINED_AUTHENTICATED_CONNECTOR_SOURCE'); assert.equal(portfolio.connectorSourceCandidates.candidates.length, 1);
    const candidate = canonicalCandidate(portfolio.connectorSourceCandidates.candidates[0], cfg.adapterPublicationCommit);
    if (acceptedCandidate) assert.deepEqual(candidate, acceptedCandidate, 'SOURCE_RECORD_CHANGED'); return candidate;
  }
  async function principal(page) {
    const response = await readJSON(page, '/api/auth/me'), user = response.value.user;
    assert.equal(user.email, cfg.founderEmail); assert.equal(user.id, 'usr_' + OWNER_SHA.slice(0, 16)); assert.equal(user.role, 'founder'); assert.equal(user.workspaceId, 'ws_empire_1');
    return {value: {id: user.id, role: user.role, workspaceId: user.workspaceId, emailSHA256: OWNER_SHA}, receipt: response.receipt};
  }
  async function waitVersion(page, version) {
    await page.waitForFunction(value => document.querySelector('[data-testid="connector-media"]')?.getAttribute('data-media-version') === String(value), version, {timeout: 10000});
  }
  async function inspectImage(locator, asset) {
    assert.equal(await locator.count(), 1); await locator.scrollIntoViewIfNeeded();
    const expected = verifiedAsset(asset), uri = await locator.getAttribute('src'); assert.equal(uri, `data:${asset.mime};base64,${asset.base64}`, 'ACTUAL_RENDERED_IMAGE_BYTES'); assert.equal(await locator.getAttribute('data-media-sha256'), asset.sha256);
    const decoded = await locator.evaluate(async image => { await image.decode(); return {complete: image.complete, width: image.naturalWidth, height: image.naturalHeight}; });
    assert.deepEqual(decoded, {complete: true, width: expected.width, height: expected.height}); return {id: asset.id, sha256: asset.sha256, bytes: asset.bytes, mime: asset.mime, decoded, displayedDataURISHA256: sha(uri)};
  }
  async function screenshot(page, section, name, width) {
    assert.match(name, /^connector-media-(?:request-desktop|desktop|mobile)\.png$/); await section.scrollIntoViewIfNeeded();
    const box = await section.boundingBox(); assert.ok(box && box.x >= -1 && box.x + box.width <= width + 1 && box.height > 100 && box.height <= 14000, 'MEDIA_SCREENSHOT_BOUND');
    const horizontal = await section.evaluate(element => ({scrollWidth: element.scrollWidth, clientWidth: element.clientWidth})); assert.ok(horizontal.scrollWidth <= horizontal.clientWidth + 1, 'MEDIA_HORIZONTAL_OVERFLOW');
    const target = path.join(OUTPUT, name); assert.equal(fs.existsSync(target), false);
    await section.screenshot({path: target, animations: 'disabled', caret: 'hide', timeout: 10000, mask: [page.getByText(cfg.founderEmail, {exact: false}), page.locator('input[type="email"],input[type="password"]')]});
    const bytes = fs.readFileSync(target); assert.ok(bytes.length > 100 && bytes.length <= 8388608); assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a'); assert.equal(bytes.subarray(12, 16).toString(), 'IHDR');
    const pixels = {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)}; assert.ok(pixels.width <= width + 1 && pixels.height <= 14000);
    return {path: name, bytes: bytes.length, sha256: sha(bytes), scope: 'ACTUAL_SOURCE_BOUND_PRIVATE_MEDIA_SECTION', privateIdentityMaskApplied: true, sectionBounds: box, pixels};
  }
  async function logout(page, view) {
    const exited = await nativeRead(page, '/api/auth/logout', 'POST'); assert.equal(exited.status, 200); view.logoutStatus = exited.status;
    const me = await nativeRead(page, '/api/auth/me'); assert.equal(me.status, 401, 'BROWSER_IDENTITY_NOT_CLEARED'); view.postLogoutAuthStatus = me.status; view.browserIdentityCleared = true;
  }
  const timer = setTimeout(() => { deadlineExpired = true; void browser?.close().catch(() => {}); }, deadline - Date.now()); timer.unref();
  try {
    cfg = JSON.parse(fs.readFileSync('/private/native-bootstrap.json', 'utf8')); privateValues = [cfg.founderEmail, cfg.founderPassword, cfg.adminPassword].filter(value => typeof value === 'string' && value.length);
    assert.equal(sha(cfg.founderEmail), OWNER_SHA); assert.match(cfg.founderPassword, /^[A-Za-z0-9_-]{43,128}$/); assert.match(cfg.adapterPublicationCommit, /^[a-f0-9]{40}$/);
    assert.ok(cfg.expiresAtMs > started + 130000, 'INSUFFICIENT_PRIVATE_AUTHORITY_LIFETIME'); assert.equal(cfg.origin, ORIGIN);
    result.adapterPublicationCommit = cfg.adapterPublicationCommit; result.probeSHA256 = sha(fs.readFileSync(fileURLToPath(import.meta.url))); result.buildManifestSHA256 = sha(fs.readFileSync('/control/connector-build-manifest.json'));
    const require = createRequire('/browser-deps/package.json'), {chromium} = require('playwright'); assert.equal(require('playwright/package.json').version, '1.62.1');
    phase = 'pinned-browser-and-isolation'; assert.ok(fs.statSync(EXECUTABLE).isFile()); assert.equal(fs.statSync(EXECUTABLE).size, EXECUTABLE_BYTES);
    const executableHash = createHash('sha256'); for await (const chunk of fs.createReadStream(EXECUTABLE)) executableHash.update(chunk); assert.equal(executableHash.digest('hex'), EXECUTABLE_SHA);
    assert.deepEqual(fs.readFileSync('/proc/net/dev', 'utf8').trim().split('\n').slice(2).map(line => line.split(':')[0].trim()), ['lo']); assert.equal(fs.readFileSync('/proc/net/route', 'utf8').trim().split('\n').length, 1);
    const processStatus = fs.readFileSync('/proc/self/status', 'utf8'); assert.match(processStatus, /CapEff:\s+0000000000000000/); assert.match(processStatus, /NoNewPrivs:\s+1/);
    browser = await chromium.launch({headless: true, executablePath: EXECUTABLE, chromiumSandbox: false, timeout: 15000, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-background-networking', '--disable-component-update', '--disable-default-apps', '--no-first-run'], env: {PATH: '/usr/local/bin:/usr/bin:/bin', HOME: '/tmp', LANG: 'C.UTF-8', TZ: 'UTC', PLAYWRIGHT_BROWSERS_PATH: '/ms-playwright'}});
    result.browserStarted = true; assert.equal(browser.version(), '151.0.7922.34'); result.browser = {version: browser.version(), playwrightVersion: '1.62.1', executableSHA256: EXECUTABLE_SHA, executableBytes: EXECUTABLE_BYTES};
    for (const shape of [{name: 'desktop', width: 1440, height: 1000, mobile: false}, {name: 'mobile', width: 390, height: 844, mobile: true}]) {
      bounded(); const view = {name: shape.name, viewport: {width: shape.width, height: shape.height}, deviceMode: shape.mobile ? 'MOBILE_VIEWPORT_EMULATION' : 'DESKTOP_VIEWPORT', status: 'FAIL', ownerActionObserved: false, browserIdentityCleared: false, contextClosed: false}; result.views.push(view);
      const context = await browser.newContext({viewport: view.viewport, deviceScaleFactor: 1, isMobile: shape.mobile, hasTouch: shape.mobile, locale: 'en-SG', timezoneId: 'UTC', serviceWorkers: 'block', acceptDownloads: false}); activeContext = context; context.setDefaultTimeout(8000); context.setDefaultNavigationTimeout(25000);
      await context.route('**/*', async route => {
        const request = route.request(); let url;
        try { url = new URL(request.url()); } catch { result.network.externalRequestsBlocked++; await route.abort('blockedbyclient'); return; }
        if (url.origin !== ORIGIN || url.username || url.password) { result.network.externalRequestsBlocked++; await route.abort('blockedbyclient'); return; }
        if (!['GET', 'HEAD'].includes(request.method())) {
          try {
            assert.equal(request.method(), 'POST'); assert.equal(url.search, '');
            if (url.pathname === '/api/owner/commerce') {
              assert.ok(commands.length < 2); assert.ok(Buffer.byteLength(request.postData() ?? '') < 4096);
              commands.push(admitMediaCommand(request.postDataJSON(), expectedCommand)); expectedCommand = null;
            } else assert.ok(['/api/auth/login', '/api/auth/logout'].includes(url.pathname), 'NON_MEDIA_MUTATION_REFUSED');
          } catch { result.network.unexpectedMutationsBlocked++; await route.abort('blockedbyclient'); return; }
        }
        await route.continue();
      });
      await context.routeWebSocket('**/*', socket => { result.network.webSocketsBlocked++; socket.close(); });
      const page = await context.newPage(); page.on('popup', popup => { void popup.close(); });
      let authenticated = false, viewError;
      try {
        phase = shape.name + '-actual-native-login'; await page.goto(ORIGIN + '/login?next=%2Fcockpit%2Fproducts', {waitUntil: 'domcontentloaded'});
        await page.locator('input[type="email"]').fill(cfg.founderEmail); await page.locator('input[type="password"]').fill(cfg.founderPassword);
        await Promise.all([page.waitForURL(url => url.origin === ORIGIN && url.pathname === '/cockpit/products'), page.locator('button[type="submit"]').click()]); authenticated = true;
        const actualPrincipal = await principal(page); view.nativePrincipal = actualPrincipal.value;
        if (acceptedPrincipal) assert.deepEqual(actualPrincipal.value, acceptedPrincipal); else acceptedPrincipal = actualPrincipal.value;
        if (!shape.mobile) {
          phase = 'desktop-actual-principal-and-source-binding';
          const initial = await readJSON(page, PORTFOLIO), candidate = candidateFrom(initial.value); acceptedCandidate = candidate;
          assert.equal(initial.value.connectorMedia.availability, 'NOT_PREPARED', 'PREEXISTING_MEDIA_REQUIRES_RECONCILIATION'); assert.equal(initial.value.connectorMedia.ownerApproval, false);
          const handshake = {schema: 'v128-media-native-binding-request-v1', principal: actualPrincipal.value, candidate, principalRead: actualPrincipal.receipt, candidateRead: initial.receipt, ownerActionObserved: false, ownerApproval: false};
          result.bindingRequest = saveJSON('connector-media-binding-request.json', handshake);
          const readyDeadline = Math.min(deadline - 45000, Date.now() + 20000); let ready;
          for (let attempt = 0; attempt < 10 && Date.now() < readyDeadline; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 2000)); bounded(); const response = await readJSON(page, PORTFOLIO); candidateFrom(response.value);
            if (response.value.connectorMedia.availability === 'VERIFIED_SOURCE_BOUND_PRIVATE_MEDIA') { ready = response; break; }
            assert.equal(response.value.connectorMedia.availability, 'NOT_PREPARED');
          }
          assert.ok(ready, 'ACTUAL_PRINCIPAL_MEDIA_BINDING_NOT_READY'); view.before = verifyMedia(ready.value.connectorMedia, candidate, acceptedPrincipal, 0, commands);
          assertPrivateSafe(ready.value); assertPrivateSafe(ready.raw.toString('utf8')); fs.writeFileSync(path.join(OUTPUT, 'connector-media-portfolio-before.json'), ready.raw, {flag: 'wx', mode: 0o600});
          view.beforeResponse = {...ready.receipt, path: 'connector-media-portfolio-before.json', completeResponseBody: true, privateValueScanPassed: true};
          await page.reload({waitUntil: 'domcontentloaded'}); await waitVersion(page, 0);
          const section = page.getByTestId('connector-media'); await section.getByTestId('connector-original-image').waitFor({state: 'visible'});
          await inspectImage(section.getByTestId('connector-original-image'), ready.value.connectorMedia.original[0]);
          phase = 'desktop-actual-edit-request'; expectedCommand = {action: 'REQUEST_EDIT', reference: {candidateId: candidate.id, candidateDigest: candidate.digest}, expectedVersion: 0, originalId: ready.value.connectorMedia.original[0].id};
          await section.getByTestId('connector-media-edit-toggle').click(); await section.getByLabel('Editing instructions for this product’s original image').fill(EDIT_INSTRUCTIONS);
          const requestResponse = page.waitForResponse(response => response.url() === ORIGIN + '/api/owner/commerce' && response.request().method() === 'POST');
          await section.getByRole('button', {name: 'Save editing request', exact: true}).click(); assert.equal((await requestResponse).status(), 200); await waitVersion(page, 1); assert.equal(commands.length, 1);
          const requestRead = await readJSON(page, PORTFOLIO, 'connector-media-portfolio-request.json'); candidateFrom(requestRead.value); view.request = verifyMedia(requestRead.value.connectorMedia, candidate, acceptedPrincipal, 1, commands); view.requestResponse = requestRead.receipt;
          const requestDetails = section.locator('details').filter({hasText: 'Saved editing request · version 1'}); assert.equal(await requestDetails.count(), 1); await requestDetails.locator('summary').click(); assert.ok((await requestDetails.innerText()).includes(EDIT_INSTRUCTIONS));
          view.requestScreenshot = await screenshot(page, section, 'connector-media-request-desktop.png', shape.width); await requestDetails.locator('summary').click();
          phase = 'desktop-actual-retained-proposal'; expectedCommand = {action: 'PROPOSE_RETAINED', reference: {candidateId: candidate.id, candidateDigest: candidate.digest}, expectedVersion: 1};
          const proposalResponse = page.waitForResponse(response => response.url() === ORIGIN + '/api/owner/commerce' && response.request().method() === 'POST');
          await section.getByRole('button', {name: 'Load retained revised composition', exact: true}).click(); assert.equal((await proposalResponse).status(), 200); await waitVersion(page, 2); assert.equal(commands.length, 2);
          const proposalRead = await readJSON(page, PORTFOLIO, 'connector-media-portfolio-desktop.json'); candidateFrom(proposalRead.value); proposedMedia = proposalRead.value.connectorMedia; view.proposal = verifyMedia(proposedMedia, candidate, acceptedPrincipal, 2, commands); view.portfolioResponse = proposalRead.receipt;
        } else { phase = 'mobile-persisted-media-reload'; await page.reload({waitUntil: 'domcontentloaded'}); await waitVersion(page, 2); const saved = await readJSON(page, PORTFOLIO, 'connector-media-portfolio-mobile.json'); candidateFrom(saved.value); assert.deepEqual(saved.value.connectorMedia, proposedMedia, 'PERSISTED_MEDIA_CHANGED'); view.proposal = verifyMedia(saved.value.connectorMedia, acceptedCandidate, acceptedPrincipal, 2, commands); view.portfolioResponse = saved.receipt; }
        phase = shape.name + '-actual-private-gallery'; await waitVersion(page, 2); const section = page.getByTestId('connector-media');
        assert.equal(await section.getAttribute('data-candidate-id'), acceptedCandidate.id); assert.equal(await section.getAttribute('data-candidate-digest'), acceptedCandidate.digest);
        const text = await section.innerText(); assertPrivateSafe(text); assert.ok(text.includes(SOURCE) && text.includes('media version 2') && text.includes('ImageMagick') && text.includes('No internally approved media version is selected.'));
        assert.equal(await section.getByTestId('connector-selected-image').count(), 0); assert.equal(await section.getByRole('button', {name: 'Approve revised batch internally', exact: true}).count(), 1);
        assert.equal(await section.getByRole('button', {name: /publish|submit|transfer|apply listing/i}).count(), 0);
        view.images = [await inspectImage(section.getByTestId('connector-original-image'), proposedMedia.original[0]), await inspectImage(section.getByTestId('connector-revised-image'), proposedMedia.proposal.assets[0])];
        const originalCard = page.getByTestId('connector-source-candidate'); assert.equal(await originalCard.locator('input,button,select,textarea').count(), 0); assert.equal(await originalCard.locator('img').count(), 1);
        assert.equal(await originalCard.getByTestId('retained-original-photo').getAttribute('src'), 'data:image/jpeg;base64,' + proposedMedia.original[0].base64); view.readOnlyOriginalCardPreserved = true;
        const beforeInspectionCount = commands.length;
        for (const id of ['connector-original-image', 'connector-revised-image']) {
          const figure = section.getByTestId(id).locator('..'), detail = figure.locator('details'); assert.equal(await detail.getAttribute('open'), null); assert.equal(await figure.locator('img').count(), 1);
          await detail.locator('summary').click(); const individual = figure.locator('img').nth(1); await individual.waitFor({state: 'visible'}); assert.equal(await individual.getAttribute('src'), await section.getByTestId(id).getAttribute('src')); await individual.evaluate(async image => { await image.decode(); });
          await detail.locator('summary').click(); await individual.waitFor({state: 'detached'});
        }
        const archive = section.getByTestId('connector-media-archive'); assert.equal(await archive.getAttribute('open'), null); await archive.locator(':scope > summary').click(); assert.ok((await archive.innerText()).includes('No prior, replaced or rejected versions are recorded.')); await archive.locator(':scope > summary').click(); assert.equal(await archive.getAttribute('open'), null);
        assert.equal(commands.length, beforeInspectionCount); assert.equal(result.network.unexpectedMutationsBlocked, 0); view.archive = {initiallyCollapsed: true, truthfulEmptyHistory: true, openedAndCollapsed: true, mutationRequests: 0}; view.individualInspection = {originalAndRevisedOpened: true, collapsedImagesUnmounted: true, mutationRequests: 0};
        view.screenshot = await screenshot(page, section, 'connector-media-' + shape.name + '.png', shape.width);
        await page.reload({waitUntil: 'domcontentloaded'}); await waitVersion(page, 2); const reloaded = page.getByTestId('connector-media'); assert.ok((await reloaded.innerText()).includes('No internally approved media version is selected.')); assert.equal(await reloaded.getByTestId('connector-media-archive').getAttribute('open'), null);
        await inspectImage(reloaded.getByTestId('connector-original-image'), proposedMedia.original[0]); await inspectImage(reloaded.getByTestId('connector-revised-image'), proposedMedia.proposal.assets[0]);
        view.reload = {version: 2, sourceCandidateDigest: acceptedCandidate.digest, originalAndRevisedUnchanged: true, selectedAssets: 0, archiveCollapsed: true};
        view.canonicalCandidate = acceptedCandidate; view.mediaRecord = {...proposedMedia, original: proposedMedia.original.map(metadata), proposal: {...proposedMedia.proposal, assets: proposedMedia.proposal.assets.map(metadata)}};
        view.status = 'PASS_SOURCE_BOUND_PRIVATE_MEDIA_PREPARATION_AND_RENDERING';
      } catch (error) { viewError = error; view.failurePhase = phase; throw error; }
      finally {
        const precedingPhase = phase; let cleanupError;
        if (authenticated) { phase = shape.name + '-logout'; try { await logout(page, view); } catch (error) { view.cleanupFailure = {name: error.name, messageSHA256: sha(String(error.message))}; cleanupError = error; } }
        try { await context.close(); view.contextClosed = true; activeContext = null; } catch (error) { view.contextCleanupFailure = {name: error.name, messageSHA256: sha(String(error.message))}; cleanupError ??= error; }
        if (viewError) phase = view.failurePhase; else if (cleanupError) { view.status = 'FAIL_CLEANUP'; throw cleanupError; } else phase = precedingPhase;
      }
    }
    assert.equal(commands.length, 2); assert.deepEqual(commands.map(command => command.action), ['REQUEST_EDIT', 'PROPOSE_RETAINED']); assert.equal(result.network.unexpectedMutationsBlocked, 0);
    result.actualPreparedCommands = commands; result.finalMedia = verifyMedia(proposedMedia, acceptedCandidate, acceptedPrincipal, 2, commands);
    result.sameCandidateAcrossViews = true; result.sameMediaVersionAcrossViews = true; result.noOwnerApproval = true;
    result.status = 'PASS_AUTHENTICATED_SOURCE_BOUND_RETAINED_MEDIA_PRESENTATION';
  } catch (error) { result.status = 'FAIL'; result.firstFailure = {phase, name: error.name, messageSHA256: sha(String(error.message)), sourceLocations: String(error.stack ?? '').split('\n').filter(line => /^\s+at /.test(line) && line.includes('/control/')).slice(0, 3)}; process.exitCode = 1; }
  finally {
    clearTimeout(timer); if (activeContext) try { await activeContext.close(); } catch (error) { result.contextCleanupFailure = {name: error.name, messageSHA256: sha(String(error.message))}; process.exitCode = 1; }
    if (browser) try { await browser.close(); result.browserClosed = true; } catch (error) { result.browserCleanupFailure = {name: error.name, messageSHA256: sha(String(error.message))}; process.exitCode = 1; }
    result.finishedAtMs = Date.now(); result.deadlineExpired = deadlineExpired; if ((result.browserStarted && !result.browserClosed) || result.contextCleanupFailure || result.browserCleanupFailure) result.status = 'FAIL_CLEANUP';
    result.nativeReadCount = result.nativeReads.length; result.actualPreparedCommandCount = commands.length; saveJSON('connector-media-browser-result.json', result);
    console.log(JSON.stringify({status: result.status, views: result.views.map(view => ({name: view.name, status: view.status})), browserClosed: result.browserClosed, ownerActionObserved: false, wholeRowAccepted: false}));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();

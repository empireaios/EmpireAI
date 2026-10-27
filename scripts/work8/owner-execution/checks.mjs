import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {assertReadiness, assertRecord, assertExecutive, digest, requireCheck} from './check-contract.mjs';
import {examineWrongOwner} from './wrong-owner-check.mjs';
import {operationFor, summarizeResponse, summarizeFailure} from './safe-diagnostics.mjs';

const phase = process.argv[2];
requireCheck(['initial', 'after-restart'].includes(phase), 'INVALID_PHASE');
const frontend = process.env.FRONTEND_URL || 'http://localhost:43117';
const backend = process.env.BACKEND_URL || 'http://owner-backend:43118';
requireCheck(frontend === 'http://localhost:43117' && backend === 'http://owner-backend:43118', 'ISOLATED_ORIGINS_REQUIRED');
const output = process.env.OUTPUT_DIR || '/evidence';
const target = 'work8-hosted-synthetic-owner-package';
const note = 'SYNTHETIC isolated immutable-package examination. DEFER only; no real product or execution authority.';
const title = 'SYNTHETIC OWNER PACKAGE EXAMINATION — NO REAL PRODUCT';
const expectedSource = '98970018d579e5a7c720d25293cdddbe294856c0';
requireCheck(process.env.EXPECTED_SOURCE_COMMIT === expectedSource, 'UNAPPROVED_SOURCE');
requireCheck(process.env.OWNER_EMAIL?.endsWith('.invalid') && Boolean(process.env.OWNER_PASSWORD), 'SYNTHETIC_CREDENTIALS_REQUIRED');
fs.mkdirSync(output, {recursive:true});
let stage = 'readiness';
let browser;
const receipt = {classification:'SYNTHETIC_EXACT_PACKAGE_TECHNICAL_EXAMINATION', phase, sourceCommit:expectedSource, genuineConnectedOwnerAcceptance:false, newlyAcceptedRows:[], status:'FAIL', checks:{}};
const save = (name, data) => fs.writeFileSync(path.join(output, name), JSON.stringify(data, null, 2) + '\n', {mode:0o600});
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const apiPages = new WeakMap();
const responseDiagnostics = [];
const recordResponse = (operation, status, body, jsonParsed=true) => {
  responseDiagnostics.push(summarizeResponse(operation, status, body, jsonParsed));
  if (responseDiagnostics.length > 24) responseDiagnostics.shift();
};
async function health(url) {
  const response = await fetch(url, {signal:AbortSignal.timeout(7000), redirect:'error'});
  return {status:response.status, body:await response.json()};
}
async function waitReady() {
  const deadline = Date.now() + 180000;
  do {
    try {
      const [live, ready] = await Promise.all([health(backend + '/health/live'), health(backend + '/health/ready')]);
      assertReadiness(live, ready, expectedSource);
      return {live, ready};
    } catch { await delay(1500); }
  } while (Date.now() < deadline);
  throw new Error('READINESS_DEADLINE');
}
async function jsonRequest(context, route, body, expectedStatus=200) {
  let page = apiPages.get(context);
  if (!page) {
    page = await context.newPage();
    await page.goto(frontend + '/login', {waitUntil:'domcontentloaded', timeout:30000});
    requireCheck(new URL(page.url()).origin === frontend, 'BROWSER_ORIGIN_MISMATCH');
    apiPages.set(context, page);
  }
  // Chromium owns the Secure cookie on localhost; never copy it into a separate
  // HTTP client or weaken the accepted application's cookie attributes.
  const response = await page.evaluate(async ({route, body}) => {
    const r = await fetch(route, {method:body === undefined ? 'GET' : 'POST', credentials:'include', redirect:'error', cache:'no-store', headers:body === undefined ? undefined : {'content-type':'application/json'}, body:body === undefined ? undefined : JSON.stringify(body), signal:AbortSignal.timeout(20000)});
    let parsed;
    try { parsed = await r.json(); } catch { return {status:r.status, jsonParsed:false}; }
    return {status:r.status, body:parsed, jsonParsed:true};
  }, {route, body});
  recordResponse(operationFor(route, body), response.status, response.body, response.jsonParsed);
  requireCheck(response.status === expectedStatus, 'HTTP_STATUS_MISMATCH');
  requireCheck(response.jsonParsed, 'JSON_RESPONSE_REQUIRED');
  return response.body;
}
async function readRecord(context) {
  const result = await jsonRequest(context, '/api/owner/advisor/read?domain=memory&id=' + target);
  requireCheck(result.status !== 'UNAVAILABLE', 'MEMORY_UNAVAILABLE');
  return result.data;
}
async function openCard(page) {
  const card = page.locator(`[data-testid="recommendation-detail"][id="${target}"]`);
  await card.waitFor({state:'attached', timeout:30000});
  const parent = card.locator('..');
  if (await parent.evaluate(el => el.tagName === 'DETAILS' && !el.open)) await parent.locator(':scope > summary').click();
  await card.waitFor({state:'visible', timeout:10000});
  return card;
}
async function verifyScreens(context, command) {
  const results = [];
  for (const [name, viewport] of [['desktop',{width:1440,height:1000}], ['mobile',{width:390,height:844}]]) {
    const page = await context.newPage();
    await page.setViewportSize(viewport);
    await page.goto(frontend + '/cockpit/approvals', {waitUntil:'domcontentloaded', timeout:30000});
    let card = await openCard(page);
    await card.getByText('Record identity and history', {exact:true}).click();
    requireCheck(/version 1\b/.test(await card.innerText()), 'UI_VERSION_MISMATCH');
    await card.getByLabel('Decision reason', {exact:true}).fill('Synthetic readback only; do not submit a second decision.');
    requireCheck(await card.getByRole('button', {name:'Defer decision', exact:true}).isDisabled(), 'UI_DEFER_NOT_DISABLED');
    await page.reload({waitUntil:'domcontentloaded'});
    card = await openCard(page);
    await card.getByText('Record identity and history', {exact:true}).click();
    requireCheck(/version 1\b/.test(await card.innerText()), 'UI_RELOAD_VERSION_MISMATCH');
    await card.getByLabel('Decision reason', {exact:true}).fill('Synthetic readback only; do not submit a second decision.');
    requireCheck(await card.getByRole('button', {name:'Defer decision', exact:true}).isDisabled(), 'UI_RELOAD_DEFER_NOT_DISABLED');
    const evidenceLabel = 'Sources, confidence, alternatives and measured outcome';
    await card.getByRole('button', {name:evidenceLabel, exact:true}).click();
    const dialog = card.getByRole('dialog', {name:evidenceLabel, exact:true});
    const visibleDecision = JSON.parse(await dialog.locator('pre').innerText());
    requireCheck(visibleDecision.ownerDecision?.id === command.id && visibleDecision.ownerDecision?.decision === 'DEFER' && visibleDecision.ownerDecision?.note === command.note && visibleDecision.executionStatus === 'NOT_EXECUTED' && visibleDecision.outcome === null, 'UI_DECISION_HISTORY_MISMATCH');
    await dialog.getByRole('button', {name:'Close technical evidence', exact:true}).click();
    requireCheck(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'UI_HORIZONTAL_OVERFLOW');
    const record = assertRecord(await readRecord(context), target, command);
    assertExecutive(await jsonRequest(context, '/api/owner/advisor/executive'), target, command);
    await page.screenshot({path:path.join(output, `${phase}-${name}.png`), fullPage:true});
    results.push({viewport:name, width:viewport.width, version:record.version, historyDigest:digest(record), displayedDecisionId:visibleDecision.ownerDecision.id, displayedDecision:'DEFER', disabledDefer:true, reload:true, horizontalOverflow:false});
    await page.close();
  }
  requireCheck(results[0].historyDigest === results[1].historyDigest, 'DESKTOP_MOBILE_HISTORY_MISMATCH');
  return results;
}
try {
  const readiness = await waitReady();
  receipt.checks.readiness = {status:'PASS', sessionStore:readiness.ready.body.sessionStore, sourceCommit:readiness.live.body.deploy.gitCommitSha, pillowRuntime:'running', tier0Isolation:true};
  stage = 'browser-start';
  const {chromium} = createRequire(process.env.PLAYWRIGHT_PACKAGE_JSON || '/tools/package.json')('playwright');
  browser = await chromium.launch({headless:true, args:['--disable-dev-shm-usage']});
  const context = await browser.newContext({viewport:{width:1440,height:1000}, serviceWorkers:'block'});
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.origin === frontend ? route.continue() : route.abort('blockedbyclient');
  });
  stage = 'authentication';
  await jsonRequest(context, '/api/owner/advisor/executive', undefined, 401);
  const login = await jsonRequest(context, '/api/auth/login', {email:process.env.OWNER_EMAIL, password:process.env.OWNER_PASSWORD});
  requireCheck(login.user?.email === process.env.OWNER_EMAIL, 'LOGIN_IDENTITY');
  const cookies = await context.cookies(frontend);
  requireCheck(cookies.some(c => c.name === 'empireai_session' && c.httpOnly && c.secure), 'SECURE_HTTPONLY_SESSION_REQUIRED');
  const me = await jsonRequest(context, '/api/auth/me');
  requireCheck(me.user?.email === process.env.OWNER_EMAIL && me.user?.id === login.user.id, 'SESSION_IDENTITY');
  const state = await jsonRequest(context, '/api/owner/advisor/read?domain=state');
  requireCheck(state.data?.backendSha === expectedSource && state.data?.profile === 'LOCKED_COMMISSIONING_V1' && state.data?.birth === 'NOT_BORN' && state.data?.commerce === 'LOCKED', 'LOCKED_RUNTIME_IDENTITY');
  receipt.checks.authenticatedFrontendBackend = {status:'PASS', anonymousStatus:401, httpOnlyCookie:true, secureCookie:true, freshLogin:true};
  let command;
  if (phase === 'initial') {
    stage = 'synthetic-fixture-write';
    const seeded = await jsonRequest(context, '/api/owner/advisor/memory', {action:'synthetic_experience', experience:{id:target, scope:{domain:'executive', entities:[]}, belief:'An isolated package must preserve a deferred owner decision.', decision:title, rationale:'Synthetic fixture verifies native UI decision persistence only. No genuine product, CEO assessment, finance result or Assurance certification.', evidence:[], expectation:{description:'One durable DEFER and no execution', metrics:[], assumptions:['Synthetic non-production examination']}, confidence:1}});
    stage = 'synthetic-fixture-receipt';
    requireCheck(seeded.result?.id === target && seeded.result.created === true && seeded.grantsAuthority === false, 'NEW_FIXTURE_REQUIRED');
    stage = 'synthetic-fixture-read';
    const before = await readRecord(context);
    stage = 'synthetic-fixture-version';
    requireCheck(before?.version === 0 && before.events?.length === 0, 'FRESH_ZERO_VERSION_REQUIRED');
    stage = 'native-defer';
    const page = await context.newPage();
    await page.goto(frontend + '/cockpit/approvals', {waitUntil:'domcontentloaded', timeout:30000});
    const card = await openCard(page);
    await card.getByLabel('Decision reason', {exact:true}).fill(note);
    const posted = page.waitForRequest(req => req.method() === 'POST' && req.url() === frontend + '/api/owner/advisor/memory');
    const responded = page.waitForResponse(res => res.request().method() === 'POST' && res.url() === frontend + '/api/owner/advisor/memory');
    await card.getByRole('button', {name:'Defer decision', exact:true}).click();
    command = (await posted).postDataJSON();
    requireCheck(command.action === 'owner_decision' && command.target === target && command.expectedVersion === 0 && command.decision === 'DEFER' && command.note === note && /^work7-decision-/.test(command.id), 'NATIVE_COMMAND_MISMATCH');
    const response = await responded;
    let nativeResult;
    let nativeJsonParsed = true;
    try { nativeResult = await response.json(); } catch { nativeJsonParsed = false; }
    recordResponse('NATIVE_DEFER_WRITE', response.status(), nativeResult, nativeJsonParsed);
    requireCheck(response.status() === 200, 'NATIVE_DEFER_HTTP');
    requireCheck(nativeJsonParsed, 'JSON_RESPONSE_REQUIRED');
    requireCheck(nativeResult.result?.id === command.id && nativeResult.result.created === true && nativeResult.grantsAuthority === false, 'NATIVE_DURABLE_RECEIPT');
    const first = assertRecord(await readRecord(context), target, command);
    assertExecutive(await jsonRequest(context, '/api/owner/advisor/executive'), target, command);
    stage = 'replay-rejection';
    const replay = await jsonRequest(context, '/api/owner/advisor/memory', command);
    requireCheck(replay.result?.id === command.id && replay.result.created === false && replay.grantsAuthority === false, 'REPLAY_CREATED_MUTATION');
    await jsonRequest(context, '/api/owner/advisor/memory', {...command, note:note+' conflicting content'}, 400);
    await jsonRequest(context, '/api/owner/advisor/memory', {...command, id:command.id+'-stale'}, 400);
    const final = assertRecord(await readRecord(context), target, command);
    requireCheck(digest(first) === digest(final), 'REPLAY_MUTATED_HISTORY');
    stage = 'authenticated-wrong-owner';
    receipt.checks.wrongOwner = await examineWrongOwner({browser, frontend, target, ownerEmail:process.env.OWNER_EMAIL, adminEmail:process.env.WRONG_OWNER_EMAIL, adminPassword:process.env.WRONG_OWNER_PASSWORD, request:jsonRequest, readOwnerRecord:() => readRecord(context)});
    save('initial-defer.json', {classification:receipt.classification, target, command, record:final, historyDigest:digest(final)});
    receipt.checks.nativeDefer = {status:'PASS', versionBefore:0, versionAfter:1, events:1, nativeUiClick:true};
    receipt.checks.replay = {status:'PASS', identicalReplay:'200_CREATED_FALSE_NO_MUTATION', conflictingReplay:400, staleVersion:400, unchangedHistory:true};
    await page.close();
  } else {
    stage = 'restart-history';
    const initial = JSON.parse(fs.readFileSync(path.join(output, 'initial-defer.json'), 'utf8'));
    requireCheck(initial.target === target && initial.classification === receipt.classification, 'INITIAL_RECEIPT_REQUIRED');
    command = initial.command;
    const restored = assertRecord(await readRecord(context), target, command);
    requireCheck(digest(restored) === initial.historyDigest && digest(initial.record) === initial.historyDigest, 'RESTART_HISTORY_MISMATCH');
    assertExecutive(await jsonRequest(context, '/api/owner/advisor/executive'), target, command);
    receipt.checks.restartPersistence = {status:'PASS', version:1, events:1, unchangedFullRecordDigest:initial.historyDigest, sameImageRestartOnly:true, rollbackEstablished:false};
  }
  stage = 'desktop-mobile';
  receipt.checks.desktopMobile = await verifyScreens(context, command);
  receipt.status = 'PASS';
} catch (error) {
  receipt.failureStage = stage;
  receipt.failure = summarizeFailure(error);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close().catch(() => {});
  receipt.responseDiagnostics = responseDiagnostics;
  save(`${phase}-checks.json`, receipt);
  console.log(JSON.stringify({phase, status:receipt.status, failureStage:receipt.failureStage || null}));
}

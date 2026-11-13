// Source-bound delegated browser observation. No owner decision or native acceptance is asserted.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {readBrowserNativeResponse} from './browser-native-request.mjs';

const ORIGIN='http://127.0.0.1:43117';
const OUTPUT='/evidence';
const EXECUTABLE='/ms-playwright/chromium-1234/chrome-linux64/chrome';
const EXECUTABLE_BYTES=290614600;
const EXECUTABLE_SHA='0b20b130e7edd9dd51873be867761295fe0cfad490c2b9a64f95bd3cfc08fa71';
const OWNER_SHA='a437be3d7f2e7927959c2be2040016464de75d69529d9abd197e47a8caa21267';
const RAW_SHA='49a84a8c0d78aa4fefe5fad51f28d80d2e51c9f86e74c6ec1fe37f632e69be78';
const REVIEW_SHA='7b88b56f5eb8d2e2edb32220614271abb9bd95bb228e41dac1b02f541c84fe63';
const SOURCE_SHA='be882d70f16202ea2c8623a5ca9aa80713cca04b4df53daf1f2a4da8e11a19be';
const APPLICATION_COMMIT='6c1e63ba20619ee480742fd87dc810ca93152e22';
const WALKTHROUGH_EVIDENCE_SHA='c6a044514dc00c8f7c81839db325195c7e3d7702e13ca0303c9d2b4d55de53e0';
const MEDIA_SHA='4fe19c2fbe0907474d053181a5568489d842421e0dbd2b627e487cca61511048';
const MEDIA_BYTES=149719;
const SCREENING_POLICY={id:'WORK8_CONNECTOR_SOURCE_COMPLETENESS_V1',scope:'PINNED_SOURCE_RECEIPTS_ONLY',outcomeWhenIncomplete:'DEFER',mayQualifyDossier:false,mayApproveOwnerDecision:false,mayInvokePillow:false};
const SCREENING_REASON_TEXT={
  RESPONSIBLE_SUPPLIER_IDENTITY:'Responsible supplier identity is unverified.',
  FULFILMENT_RESPONSIBILITY_AND_PROCESSING:'Fulfilment responsibility and payment-to-carrier processing are unverified.',
  VERIFIED_DELIVERY_TERMS:'No verified delivery promise is supplied; historical freight estimates are not a dispatch or arrival commitment.',
  VERIFIED_RETURNS_TERMS:'Applicable returns terms are unverified.',
  MATCHED_MARKETPLACE_ELIGIBILITY:'Product/account marketplace eligibility is unverified.',
  MATCHED_COMPETITION:'No matched competitor evidence is supplied.',
  COMPLETE_ECONOMICS:'Complete costs, fees, returns and selling economics are unavailable.',
  ASSESSMENT_TIME_FRESHNESS:'An assessment-time freshness review has not been completed.',
};
const PID='2610240019051639200',VID='2610240019061630200';
const sha=value=>createHash('sha256').update(value).digest('hex');
const normalize=value=>String(value).replace(/\s+/g,' ').trim();
const digest=value=>sha(JSON.stringify(value));
let cfg=null,privateValues=[],chromium=null;
const started=Date.now();
const deadline=started+120000;
let browser=null,activeContext=null,phase='source-and-browser-admission',deadlineExpired=false;
const result={schema:'v128-connector-owner-browser-observation-v1',status:'FAIL',startedAtMs:started,
  inputActor:'DELEGATED_TECHNICAL_OPERATOR',ownerActionObserved:false,ownerDecisionGranted:false,
  wholeRowAccepted:false,productionAccess:false,historyImported:false,liveCommerce:'LOCKED',pillow:'NOT_BORN',
  applicationCommit:APPLICATION_COMMIT,
  artifactDisposition:'PRIVATE_RUNTIME_OUTPUT_REQUIRES_REVIEWED_ENCRYPTION_BEFORE_PUBLICATION',
  views:[],nativeReads:[],network:{mode:'SHARED_EXACT_NATIVE_NONE_NAMESPACE',externalRequestsBlocked:0,webSocketsBlocked:0},
  browserStarted:false,browserClosed:false};
const require=createRequire('/browser-deps/package.json');


function bounded(){assert.ok(!deadlineExpired&&Date.now()<deadline,'BROWSER_OPERATION_DEADLINE');}
function assertPublic(value){
  const text=typeof value==='string'?value:JSON.stringify(value);
  assert.ok(!privateValues.some(secret=>text.includes(secret)),'PRIVATE_VALUE_REFUSED');
  assert.ok(!(text.includes('@')&&/[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(text)),'PRIVATE_EMAIL_REFUSED');
  function scan(v){
    if(Array.isArray(v)){for(const item of v)scan(item);return;}
    if(v&&typeof v==='object')for(const[key,item]of Object.entries(v)){
      assert.ok(!['password','founderpassword','adminpassword','token','cookie','authorization','set-cookie','sessionsecret'].includes(key.toLowerCase()),'PRIVATE_KEY_REFUSED');
      scan(item);
    }
  }
  if(typeof value!=='string')scan(value);
}
function canonical(projection){
  assert.ok(projection&&typeof projection==='object'&&!Array.isArray(projection));
  const {sourceAgeMs,freshness,providerExpiry,assessmentFreshnessAdmission,...record}=projection;
  assert.ok(Number.isSafeInteger(sourceAgeMs)&&sourceAgeMs>=0);
  assert.equal(freshness,'RETAINED_OBSERVATION_ONLY');assert.equal(providerExpiry,null);assert.equal(assessmentFreshnessAdmission,false);
  const {digest:saved,...body}=record;
  assert.equal(digest(body),saved,'CANONICAL_RECORD_DIGEST');
  assert.equal(record.schema,'WORK8_CONNECTOR_SOURCE_CANDIDATE_V1');assert.equal(record.workspace,'ws_empire_1');assert.equal(record.version,1);
  assert.equal(record.inputActor,'DELEGATED_TECHNICAL_OPERATOR');assert.equal(record.ownerActionObserved,false);assert.equal(record.ownerApproval,false);
  assert.equal(record.qualifiedDossierAdmission,false);assert.equal(record.externalEffects,0);
  assert.equal(record.softwareIdentity.applicationCommit,APPLICATION_COMMIT);
  assert.equal(record.softwareIdentity.adapterPublicationCommit,cfg.adapterPublicationCommit);
  assert.match(record.softwareIdentity.adapterModuleSHA256,/^[a-f0-9]{64}$/);
  assert.equal(record.source.receiptSHA256,RAW_SHA);assert.equal(record.source.independentReviewSHA256,REVIEW_SHA);
  assert.equal(digest(record.source),SOURCE_SHA,'AUTHENTIC_SOURCE_PROJECTION');
  assert.equal(record.source.supplierProductId,PID);assert.equal(record.source.supplierVariantId,VID);
  assert.equal(record.source.grantsAuthority,false);assert.equal(record.source.nativeCJAPIExecuted,false);
  assert.equal(record.source.sourceTransport,'AUTHENTICATED_CONNECTOR_RECEIPT');
  assert.equal(record.source.qualification.qualified,false);assert.equal(record.source.qualification.assessmentFreshness,'NOT_ADMITTED');
  assert.equal(record.id,'connector-cj:'+digest({workspace:record.workspace,receipt:RAW_SHA,pid:PID,vid:VID}).slice(0,40));
  assert.equal(record.requestDigest,digest({operationId:record.operationId,workspace:record.workspace,authoritySHA256:record.authoritySHA256,softwareIdentity:record.softwareIdentity,source:record.source}));
  assertPublic(record);return record;
}
function canonicalWalkthrough(projection,candidate){
  assert.equal(projection.availability,'VERIFIED_RETAINED_FACTS_AND_EXECUTED_SCREENING');
  const record=projection.record;assert.ok(record&&typeof record==='object'&&!Array.isArray(record));
  const {digest:saved,...body}=record;assert.equal(digest(body),saved,'WALKTHROUGH_RECORD_DIGEST');
  assert.equal(record.schema,'WORK8_CONNECTOR_WALKTHROUGH_V1');assert.equal(record.workspace,candidate.workspace);
  assert.equal(record.candidateId,candidate.id);assert.equal(record.candidateDigest,candidate.digest);
  assert.equal(record.ownerActionObserved,false);assert.equal(record.ownerApproval,false);assert.equal(record.externalEffects,0);
  assert.equal(record.softwareIdentity.applicationCommit,APPLICATION_COMMIT);
  assert.equal(record.softwareIdentity.publicationCommit,cfg.adapterPublicationCommit);
  assert.match(record.softwareIdentity.moduleSHA256,/^[a-f0-9]{64}$/);
  const evidence=record.evidence,media=evidence.originalMedia,screen=record.screening;
  assert.equal(digest(evidence),WALKTHROUGH_EVIDENCE_SHA,'EXACT_RETAINED_WALKTHROUGH_EVIDENCE');
  assert.equal(media.sha256,MEDIA_SHA);assert.equal(media.bytes,MEDIA_BYTES);assert.equal(media.mime,'image/jpeg');
  assert.equal(media.sourceProductId,PID);assert.equal(media.sourceVariantId,VID);assert.equal(media.sourceSKU,candidate.source.supplierSKU);
  assert.equal(media.rights,'PRIVATE_FACTUAL_PREPARATION_ONLY');assert.equal(media.publicPublicationAllowed,false);assert.equal(media.ownerRevisedMediaApproval,false);
  assert.ok(typeof media.base64==='string'&&media.base64.length<220000);
  const image=Buffer.from(media.base64,'base64');assert.equal(image.toString('base64'),media.base64,'CANONICAL_MEDIA_ENCODING');
  assert.equal(image.length,MEDIA_BYTES);assert.equal(sha(image),MEDIA_SHA);
  assert.equal(image.subarray(0,2).toString('hex'),'ffd8');assert.equal(image.subarray(-2).toString('hex'),'ffd9');
  assert.equal(evidence.inventory.variantId,VID);assert.equal(evidence.inventory.factoryInventoryNum,9427);
  assert.equal(evidence.inventory.cjInventoryNum,0);assert.equal(evidence.inventory.totalInventoryNum,9427);
  assert.equal(evidence.inventory.freshness,'RETAINED_OBSERVATION_ONLY');assert.equal(evidence.inventory.providerExpiry,null);
  assert.equal(evidence.inventory.dispatchCommitment,false);assert.equal(evidence.inventory.fulfilmentResponsibilityVerified,false);
  assert.equal(evidence.currency.value,'USD');assert.equal(evidence.currency.providerField,'variantSellPrice');
  assert.equal(evidence.currency.basis,'RETAINED_OFFICIAL_FIELD_DEFINITION');assert.equal(evidence.currency.currencyFieldInDetailReceipt,null);assert.equal(evidence.currency.fx,null);
  assert.equal(screen.schema,'SOURCE_COMPLETENESS_SCREENING_V1');assert.equal(screen.executionKind,'ACTUAL_DETERMINISTIC_SOURCE_COMPLETENESS_CHECK');
  assert.equal(screen.status,'DEFER');assert.equal(screen.candidateId,candidate.id);assert.equal(screen.candidateDigest,candidate.digest);
  assert.equal(screen.inputDigest,digest({candidateDigest:candidate.digest,evidenceDigest:digest(evidence)}));
  assert.equal(screen.atUTC,record.atUTC);assert.equal(screen.executedModuleSHA256,record.softwareIdentity.moduleSHA256);
  assert.equal(screen.attributedTo,'DELEGATED_TECHNICAL_OPERATOR');assert.equal(screen.qualifiedDossierAdmission,false);
  assert.equal(screen.ownerDecision,false);assert.equal(screen.pillowExecution,false);assert.equal(screen.paidInference,0);assert.equal(screen.externalEffects,0);
  assert.deepEqual(screen.policy,SCREENING_POLICY);assert.equal(screen.policySHA256,digest(SCREENING_POLICY));
  const coverage=evidence.coverage,source=candidate.source;
  const supplied=field=>Array.isArray(coverage[field])&&coverage[field].length>0?'UNVERIFIED':'MISSING';
  const expectedChecks=[
    {id:'SELECTED_IDENTITY',status:source.supplierProductId===PID&&source.supplierVariantId===VID&&source.supplierSKU===media.sourceSKU?'PRESENT':'MISSING'},
    {id:'OBSERVED_PRICE_AND_DOCUMENTED_CURRENCY',status:typeof source.observedPrice==='number'&&Number.isFinite(source.observedPrice)&&evidence.currency.value==='USD'?'PRESENT':'MISSING'},
    {id:'RETAINED_STOCK_OBSERVATION',status:evidence.inventory.variantId===VID?'PRESENT':'MISSING'},
    {id:'RESPONSIBLE_SUPPLIER_IDENTITY',status:typeof source.supplierName==='string'&&typeof source.supplierId==='string'?'PRESENT':'MISSING'},
    {id:'FULFILMENT_RESPONSIBILITY_AND_PROCESSING',status:supplied('fulfilmentResponsibility')},
    {id:'VERIFIED_DELIVERY_TERMS',status:supplied('deliveryTerms')},
    {id:'VERIFIED_RETURNS_TERMS',status:supplied('returnsTerms')},
    {id:'MATCHED_MARKETPLACE_ELIGIBILITY',status:supplied('marketplaceEligibility')},
    {id:'MATCHED_COMPETITION',status:supplied('matchedCompetition')},
    {id:'COMPLETE_ECONOMICS',status:supplied('completeEconomics')},
    {id:'ASSESSMENT_TIME_FRESHNESS',status:supplied('assessmentFreshnessReview')},
  ];
  assert.deepEqual(screen.checks,expectedChecks,'ACTUAL_SOURCE_CHECK_RESULTS');
  assert.deepEqual(screen.reasons,expectedChecks.filter(check=>check.status!=='PRESENT').map(check=>check.id));
  assert.ok(screen.reasons.length>0);assert.equal(record.requestDigest,digest({operationId:record.operationId,candidateId:record.candidateId,candidateDigest:record.candidateDigest,authoritySHA256:record.authoritySHA256,softwareIdentity:record.softwareIdentity,evidenceDigest:digest(evidence)}));
  assertPublic(record);return record;
}
async function hashFile(filename){
  const hash=createHash('sha256');for await(const chunk of fs.createReadStream(filename))hash.update(chunk);return hash.digest('hex');
}
async function browserNativeRead(page,route,method='GET'){
  bounded();
  const response=await readBrowserNativeResponse(page,route,method);
  assert.ok(result.nativeReads.length<16,'NATIVE_READ_RECEIPT_BOUND');
  result.nativeReads.push({route,method,status:response.status,responseBytes:response.raw.length,
    responseSHA256:sha(response.raw),transport:'AUTHENTICATED_BROWSER_FETCH'});
  return response;
}
async function readJSON(page,route,captureFilename=null){
  bounded();assert.ok(route.startsWith('/api/')&&!route.includes('://'));
  const response=await browserNativeRead(page,route);
  assert.equal(response.status,200,'AUTHENTICATED_NATIVE_READ_STATUS');
  const raw=response.raw;assert.ok(raw.length<=4194304,'NATIVE_READ_BOUND');
  const text=raw.toString('utf8');assert.ok(Buffer.from(text,'utf8').equals(raw),'NATIVE_RESPONSE_UTF8');
  const value=JSON.parse(text);
  if(captureFilename!==null){
    assert.ok(['connector-portfolio-desktop.json','connector-portfolio-mobile.json'].includes(captureFilename));
    assertPublic(value);assertPublic(text);
    fs.writeFileSync(path.join(OUTPUT,captureFilename),raw,{flag:'wx',mode:0o600});
    return {value,receipt:{path:captureFilename,bytes:raw.length,sha256:sha(raw),completeResponseBody:true,privateValueScanPassed:true}};
  }
  return value;
}
async function verifyPrincipal(page){
  const me=await readJSON(page,'/api/auth/me');
  assert.equal(me.user.email,cfg.founderEmail);assert.equal(me.user.id,'usr_'+OWNER_SHA.slice(0,16));
  assert.equal(me.user.role,'founder');assert.equal(me.user.workspaceId,'ws_empire_1');
  return {id:me.user.id,role:me.user.role,workspaceId:me.user.workspaceId,emailSHA256:OWNER_SHA};
}
async function logout(page,view){
  const response=await browserNativeRead(page,'/api/auth/logout','POST');
  view.logoutStatus=response.status;assert.equal(response.status,200,'BROWSER_LOGOUT_STATUS');
  const me=await browserNativeRead(page,'/api/auth/me');
  view.postLogoutAuthStatus=me.status;assert.equal(me.status,401,'BROWSER_IDENTITY_NOT_CLEARED');
  view.browserIdentityCleared=true;
}
const timer=setTimeout(()=>{deadlineExpired=true;void browser?.close().catch(()=>{});},Math.max(1,deadline-Date.now()));
timer.unref();
try{
  phase='private-configuration-admission';
  cfg=JSON.parse(fs.readFileSync('/private/native-bootstrap.json','utf8'));
  privateValues=[cfg.founderEmail,cfg.founderPassword,cfg.adminPassword].filter(v=>typeof v==='string'&&v.length>0);
  assert.equal(sha(cfg.founderEmail),OWNER_SHA,'PRIVATE_OWNER_BINDING');
  assert.ok(/^[A-Za-z0-9_-]{43,128}$/.test(cfg.founderPassword),'PRIVATE_PASSWORD_SHAPE');
  assert.match(cfg.adapterPublicationCommit,/^[a-f0-9]{40}$/);
  assert.ok(cfg.expiresAtMs>started+130000,'INSUFFICIENT_PRIVATE_AUTHORITY_LIFETIME');
  assert.equal(cfg.origin,ORIGIN);
  Object.assign(result,{adapterPublicationCommit:cfg.adapterPublicationCommit,
    probeSHA256:sha(fs.readFileSync(fileURLToPath(import.meta.url))),
    buildManifestSHA256:sha(fs.readFileSync('/control/connector-build-manifest.json'))});
  ({chromium}=require('playwright'));assert.equal(require('playwright/package.json').version,'1.62.1');
  phase='source-and-browser-admission';
  assert.ok(fs.statSync(EXECUTABLE).isFile());assert.equal(fs.statSync(EXECUTABLE).size,EXECUTABLE_BYTES);
  assert.equal(await hashFile(EXECUTABLE),EXECUTABLE_SHA,'PINNED_BROWSER_BYTES');
  const interfaces=fs.readFileSync('/proc/net/dev','utf8').trim().split('\n').slice(2).map(x=>x.split(':')[0].trim());
  assert.deepEqual(interfaces,['lo']);assert.equal(fs.readFileSync('/proc/net/route','utf8').trim().split('\n').length,1);
  const processStatus=fs.readFileSync('/proc/self/status','utf8');
  assert.match(processStatus,/CapEff:\s+0000000000000000/);assert.match(processStatus,/NoNewPrivs:\s+1/);
  phase='pinned-browser-start';
  browser=await chromium.launch({headless:true,executablePath:EXECUTABLE,chromiumSandbox:false,timeout:15000,
    args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-background-networking','--disable-component-update','--disable-default-apps','--no-first-run'],
    env:{PATH:'/usr/local/bin:/usr/bin:/bin',HOME:'/tmp',LANG:'C.UTF-8',TZ:'UTC',PLAYWRIGHT_BROWSERS_PATH:'/ms-playwright'}});
  result.browserStarted=true;assert.equal(browser.version(),'151.0.7922.34');
  result.browser={version:browser.version(),playwrightVersion:'1.62.1',executableSHA256:EXECUTABLE_SHA,executableBytes:EXECUTABLE_BYTES};
  let firstCanonical=null,firstWalkthrough=null;
  for(const shape of [{name:'desktop',width:1440,height:1000,mobile:false},{name:'mobile',width:390,height:844,mobile:true}]){
    bounded();phase=shape.name+'-context';
    const view={name:shape.name,viewport:{width:shape.width,height:shape.height},deviceMode:shape.mobile?'MOBILE_VIEWPORT_EMULATION':'DESKTOP_VIEWPORT',status:'FAIL',ownerActionObserved:false,browserIdentityCleared:false,contextClosed:false};
    result.views.push(view);
    const context=await browser.newContext({viewport:view.viewport,deviceScaleFactor:1,isMobile:shape.mobile,hasTouch:shape.mobile,locale:'en-SG',timezoneId:'UTC',serviceWorkers:'block',acceptDownloads:false});
    activeContext=context;context.setDefaultTimeout(8000);context.setDefaultNavigationTimeout(25000);
    await context.route('**/*',async route=>{
      let allowed=false;try{const url=new URL(route.request().url());allowed=url.origin===ORIGIN&&!url.username&&!url.password;}catch{}
      if(!allowed){result.network.externalRequestsBlocked++;await route.abort('blockedbyclient');return;}
      await route.continue();
    });
    await context.routeWebSocket('**/*',socket=>{result.network.webSocketsBlocked++;socket.close();});
    const page=await context.newPage();page.on('popup',popup=>{void popup.close();});
    view.comparablesReadStatuses=[];
    page.on('response',response=>{try{const url=new URL(response.url());if(url.origin===ORIGIN&&url.pathname==='/api/owner/commerce/comparables')view.comparablesReadStatuses.push(response.status());}catch{}});
    let authenticated=false,viewError=null;
    try{
      phase=shape.name+'-native-ui-login';
      await page.goto(ORIGIN+'/login?next=%2Fcockpit%2Fproducts',{waitUntil:'domcontentloaded'});
      await page.locator('input[type="email"]').fill(cfg.founderEmail);
      await page.locator('input[type="password"]').fill(cfg.founderPassword);
      await Promise.all([page.waitForURL(url=>url.origin===ORIGIN&&url.pathname==='/cockpit/products'),page.locator('button[type="submit"]').click()]);
      authenticated=true;view.nativePrincipal=await verifyPrincipal(page);
      phase=shape.name+'-native-source-projection';
      const article=page.getByTestId('connector-source-candidate');await article.waitFor({state:'visible'});assert.equal(await article.count(),1);
      const capture=await readJSON(page,'/api/owner/commerce/portfolio?classification=REAL_READ_ONLY&page=1&pageSize=10','connector-portfolio-'+shape.name+'.json');
      const portfolio=capture.value;view.portfolioResponse=capture.receipt;
      assert.equal(portfolio.connectorSourceCandidates.availability,'RETAINED_AUTHENTICATED_CONNECTOR_SOURCE');
      assert.equal(portfolio.connectorSourceCandidates.grantsAuthority,false);assert.equal(portfolio.connectorSourceCandidates.candidates.length,1);
      const projection=portfolio.connectorSourceCandidates.candidates[0],record=canonical(projection),source=record.source;
      const walkthrough=canonicalWalkthrough(portfolio.connectorWalkthrough,record),extra=walkthrough.evidence;
      assert.equal(await article.getAttribute('data-candidate-id'),record.id);assert.equal(await article.getAttribute('data-record-digest'),record.digest);
      if(firstCanonical)assert.deepEqual(record,firstCanonical,'DESKTOP_MOBILE_CANONICAL_EQUALITY');else firstCanonical=record;
      if(firstWalkthrough)assert.deepEqual(walkthrough,firstWalkthrough,'DESKTOP_MOBILE_WALKTHROUGH_EQUALITY');else firstWalkthrough=walkthrough;
      phase=shape.name+'-actual-rendered-facts';
      assert.equal(normalize(await article.locator('h3').innerText()),normalize(source.title));
      assert.equal(normalize(await article.locator(':scope > p').first().innerText()),normalize(source.variantTitle+' · '+source.variantKey));
      const facts=await article.locator('dl > div').evaluateAll(nodes=>Object.fromEntries(nodes.map(node=>[node.querySelector('dt')?.textContent?.trim(),node.querySelector('dd')?.innerText?.replace(/\s+/g,' ').trim()])));
      assert.equal(Object.keys(facts).length,10);
      assert.equal(facts.Category,normalize(source.category));
      assert.equal(facts['Supplier product reference'],normalize(PID+' / '+VID+' SKU '+source.supplierSKU));
      assert.equal(facts['Supplier identity'],normalize(source.supplierName||'Unavailable in this source receipt'));
      assert.equal(facts['Observed supplier price'],normalize(String(source.observedPrice)+' · USD — documented CJ field units The response has no currency field. USD comes from the retained official definition of variantSellPrice; no FX conversion or future price guarantee is implied.'));
      assert.ok(facts['Connector read completed'].startsWith(normalize(source.readFinishedAtUTC)+' '));
      assert.match(facts['Connector read completed'],/\d+ hours since connector read$/);
      assert.equal(facts.Freshness,'Retained observation only. Provider observation time and expiry are unavailable; no assessment-time freshness has been admitted.');
      assert.equal(facts['Stock, lead time and shipping'],normalize('Retained CJ inventory observation: '+extra.inventory.factoryInventoryNum+' factory units; '+extra.inventory.cjInventoryNum+' CJ warehouse units; '+extra.inventory.totalInventoryNum+' total. '+extra.inventory.warehouse+' ('+extra.inventory.countryCode+'). Connector receipt: '+extra.inventory.connectorReceiptAtUTC+'. This is a retained observation, with no provider expiry or dispatch commitment. Fulfilment responsibility, processing time and verified delivery promise remain unavailable.'));
      assert.equal(facts['Competitor and market evidence'],'Unavailable in this selected receipt. No sales or demand estimate is supplied.');
      assert.equal(facts.Economics,'Unavailable. Conflicting suggested selling prices are excluded from all calculations.');
      assert.equal(facts.Images,'One accepted original photograph is shown for private factual review. Additional source image rights remain unverified; no additional gallery images are loaded.');
      const link=article.getByRole('link',{name:'Open the recorded CJ product reference',exact:true});
      assert.equal(await link.getAttribute('href'),source.sourceURL);assert.equal(await link.getAttribute('target'),'_blank');
      const rel=(await link.getAttribute('rel'))?.split(/\s+/);assert.ok(rel?.includes('noopener')&&rel.includes('noreferrer'));
      assert.equal(await article.locator('input,button,select,textarea').count(),0,'READ_ONLY_SOURCE_CARD_REQUIRED');
      assert.equal(await article.locator('img').count(),1,'SINGLE_AUTHORIZED_ORIGINAL_IMAGE_ONLY');
      const photo=article.getByTestId('retained-original-photo');assert.equal(await photo.count(),1);
      assert.equal(await photo.getAttribute('data-media-sha256'),MEDIA_SHA);
      const photoURI=await photo.getAttribute('src');assert.equal(photoURI,'data:image/jpeg;base64,'+extra.originalMedia.base64,'EXACT_ORIGINAL_DISPLAYED_BYTES');
      const decodedPhoto=await photo.evaluate(async image=>{await image.decode();return {complete:image.complete,width:image.naturalWidth,height:image.naturalHeight};});
      assert.equal(decodedPhoto.complete,true);assert.ok(decodedPhoto.width>0&&decodedPhoto.height>0,'ORIGINAL_PHOTO_NOT_DECODED');
      assert.equal(normalize(await article.locator('figure figcaption').innerText()),normalize('Retained original supplier photograph · source observed '+extra.originalMedia.sourceObservedAtUTC+'. Exact original bytes; private factual preparation only. No public listing permission or revised-media approval is granted.'));
      const screening=article.getByTestId('source-completeness-screening');assert.equal(await screening.count(),1);
      assert.equal(await screening.getAttribute('data-screening-digest'),walkthrough.digest);
      assert.equal(normalize(await screening.locator('h4').innerText()),'Source completeness screening — Deferred');
      assert.deepEqual((await screening.locator('li').allInnerTexts()).map(normalize),walkthrough.screening.reasons.map(reason=>{assert.ok(Object.hasOwn(SCREENING_REASON_TEXT,reason),'UNDOCUMENTED_SCREENING_REASON');return SCREENING_REASON_TEXT[reason];}));
      const screeningText=normalize(await screening.innerText());
      assert.ok(screeningText.includes('A separate software check was executed and saved at '+walkthrough.screening.atUTC+' against this exact candidate record.'));
      assert.ok(screeningText.includes('This is not a Pillow assessment, a qualified dossier or an owner decision.'));
      assert.ok(screeningText.includes('The check does not establish commercial viability, current stock availability, seller eligibility or a delivery commitment.'));
      const sourceDetails=article.locator('details').filter({hasText:'Saved source and record evidence'});assert.equal(await sourceDetails.count(),1);
      await sourceDetails.locator('summary').click();
      const renderedProjection=JSON.parse(await sourceDetails.locator('pre').innerText());
      assert.deepEqual(canonical(renderedProjection),record,'DISPLAYED_SAVED_RECORD_API_EQUALITY');
      await sourceDetails.locator('summary').click();assert.equal(await sourceDetails.getAttribute('open'),null);
      const walkthroughDetails=article.locator('details').filter({hasText:'Recorded screening and retained evidence'});assert.equal(await walkthroughDetails.count(),1);
      await walkthroughDetails.locator('summary').click();const displayedWalkthrough=JSON.parse(await walkthroughDetails.locator('pre').innerText());
      const expectedDisplayedWalkthrough={...walkthrough,evidence:{...extra,originalMedia:{...extra.originalMedia,base64:'[exact authenticated original JPEG shown above]'}}};
      assert.deepEqual(displayedWalkthrough,expectedDisplayedWalkthrough,'DISPLAYED_WALKTHROUGH_API_EQUALITY');
      await walkthroughDetails.locator('summary').click();assert.equal(await walkthroughDetails.getAttribute('open'),null);
      const publicText=await article.innerText();assertPublic(publicText);
      assert.ok(publicText.includes('not an executed business screening result, a Pillow recommendation or an owner decision.'));
      assert.ok(publicText.includes('Commerce remains locked and Pillow remains not born.'));
      assert.ok(publicText.includes('Owner decision stage: no linked decision; qualification review is deferred.'));
      assert.ok(publicText.includes('Historical operational records are not queried by this isolated view; no zero balance, completed settlement or healthy Assurance state is inferred.'));
      assert.ok(publicText.includes('No simulated sale, order, revenue or profit is represented by this card.'));
      phase=shape.name+'-bounded-private-safe-screenshot';
      await article.scrollIntoViewIfNeeded();const box=await article.boundingBox();assert.ok(box);
      assert.ok(box.x>=-1&&box.x+box.width<=shape.width+1&&box.width>100&&box.width<=shape.width+1&&box.height>100&&box.height<=14000,'ARTICLE_SCREENSHOT_BOUND');
      const horizontal=await article.evaluate(el=>({scrollWidth:el.scrollWidth,clientWidth:el.clientWidth}));
      assert.ok(horizontal.scrollWidth<=horizontal.clientWidth+1,'SOURCE_CARD_HORIZONTAL_OVERFLOW');
      const filename='connector-source-'+shape.name+'.png',target=path.join(OUTPUT,filename);assert.equal(fs.existsSync(target),false);
      await article.screenshot({path:target,animations:'disabled',caret:'hide',timeout:10000,
        mask:[page.getByText(cfg.founderEmail,{exact:false}),page.locator('input[type="email"],input[type="password"]')]});
      const image=fs.readFileSync(target);assert.ok(image.length>100&&image.length<=8388608);assert.equal(image.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
      assert.equal(image.readUInt32BE(8),13);assert.equal(image.subarray(12,16).toString(),'IHDR');
      const pixels={width:image.readUInt32BE(16),height:image.readUInt32BE(20)};assert.ok(pixels.width>100&&pixels.width<=shape.width+1&&pixels.height>100&&pixels.height<=14000,'PNG_PIXEL_BOUND');
      Object.assign(view,{status:'PASS_SOURCE_BOUND_AUTHENTICATED_RENDERING',canonicalCandidate:record,
        apiProjectionSHA256:digest(projection),displayedProjectionSHA256:digest(renderedProjection),displayedProjection:renderedProjection,renderedFacts:facts,
        walkthroughRecordDigest:walkthrough.digest,walkthroughRecordSHA256:digest(walkthrough),displayedWalkthrough,
        executedSourceCompletenessScreening:walkthrough.screening,
        retainedOriginalPhoto:{sha256:MEDIA_SHA,bytes:MEDIA_BYTES,mime:'image/jpeg',rights:'PRIVATE_FACTUAL_PREPARATION_ONLY',publicPublicationAllowed:false,actualDecodedDimensions:decodedPhoto,displayedDataURISHA256:sha(photoURI)},
        displayedSourceReference:source.sourceURL,recordDigest:record.digest,articleTextSHA256:sha(publicText),
        sourceDetailsReadbackMatched:true,walkthroughDetailsReadbackMatched:true,readOnlyCard:true,sourceImagesLoaded:true,sourceImageCount:1,
        screenshot:{path:filename,bytes:image.length,sha256:sha(image),scope:'VERIFIED_CANDIDATE_ARTICLE_ONLY',privateIdentityMaskApplied:true,articleBounds:box,pixels},
        horizontalOverflow:false,unrelatedPageAlertCount:await page.getByRole('alert').count()});
      assertPublic(view);
    }catch(error){
      viewError=error;view.status='FAIL';view.failurePhase=phase;throw error;
    }finally{
      const precedingPhase=phase;let cleanupError=null;
      if(authenticated){phase=shape.name+'-logout';try{await logout(page,view);}catch(error){view.cleanupFailure={name:error.name,messageSHA256:sha(String(error.message))};cleanupError=error;}}
      try{await context.close();view.contextClosed=true;activeContext=null;}catch(error){view.contextCleanupFailure={name:error.name,messageSHA256:sha(String(error.message))};cleanupError??=error;}
      if(viewError)phase=view.failurePhase;
      else if(cleanupError){view.status='FAIL_CLEANUP';throw cleanupError;}
      else phase=precedingPhase;
    }
  }
  result.sameCanonicalRecordAcrossViews=true;result.sameWalkthroughRecordAcrossViews=true;result.status='PASS_AUTHENTICATED_DESKTOP_MOBILE_CONNECTOR_SOURCE_RENDERING';
}catch(error){
  result.status='FAIL';result.firstFailure={phase,name:error.name,messageSHA256:sha(String(error.message)),
    sourceLocations:String(error.stack??'').split('\n').filter(line=>/^\s+at /.test(line)&&line.includes('/control/')).slice(0,3).map(line=>line.replace(/file:\/\/[^\s)]*/g,value=>value.replace(/\?.*$/,'')))};
  process.exitCode=1;
}finally{
  clearTimeout(timer);
  if(activeContext)try{await activeContext.close();}catch(error){result.contextCleanupFailure={name:error.name,messageSHA256:sha(String(error.message))};process.exitCode=1;}
  if(browser)try{await browser.close();result.browserClosed=true;}catch(error){result.browserCleanupFailure={name:error.name,messageSHA256:sha(String(error.message))};process.exitCode=1;}
  result.finishedAtMs=Date.now();result.deadlineExpired=deadlineExpired;
  if((result.browserStarted&&!result.browserClosed)||result.contextCleanupFailure||result.browserCleanupFailure)result.status='FAIL_CLEANUP';
  assertPublic(result);const encoded=JSON.stringify(result,null,2)+'\n';assert.ok(Buffer.byteLength(encoded)<=4194304);
  fs.writeFileSync(path.join(OUTPUT,'connector-browser-result.json'),encoded,{flag:'wx',mode:0o600});
  console.log(JSON.stringify({status:result.status,views:result.views.map(view=>({name:view.name,status:view.status})),browserClosed:result.browserClosed,wholeRowAccepted:false}));
}

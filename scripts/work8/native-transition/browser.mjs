import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {getDefaultResultOrder} from 'node:dns';

const {chromium}=createRequire('/frontend-package/package.json')('playwright');
const origin='http://localhost:43117',backend='http://native-backend:43100',deadline=Date.now()+480000;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const read=name=>JSON.parse(fs.readFileSync('/control/'+name,'utf8'));
const receipt={schema:'work8-v26-canonical-business-transition-v1',status:'FAIL',syntheticOwnerOnly:true,genuineKingObservation:false,productionEffects:false,wholeRowsAccepted:[],phases:[],operations:[]};
let browser,ownerPage,stage='START',cleanupMode=false;
const lifecycle=[];
function lifecycleEvent(event,extra={}){lifecycle.push({event,stage,cleanup:cleanupMode,...extra});fs.writeFileSync('/evidence/browser-lifecycle.json',JSON.stringify(lifecycle.slice(-120),null,2)+'\n');}
function check(value,code){assert.ok(value,code);}
function equal(actual,expected,code){assert.deepEqual(actual,expected,code);}
function safeFailure(error){
 const message=String(error?.message??''),named=message.match(/^([A-Z][A-Z0-9_]{3,90})(?:\n|$)/)?.[1];
 const patterns=[['FETCH_FAILED',/Failed to fetch/],['EXECUTION_CONTEXT_DESTROYED',/Execution context was destroyed/],['BROWSER_TARGET_CLOSED',/Target page, context or browser has been closed/],['NAVIGATION_NETWORK_ERROR',/net::ERR_[A-Z_]+/],['BROWSER_TIMEOUT',/Timeout \d+ms exceeded/]];
 return {name:['AssertionError','Error','TypeError','TimeoutError'].includes(error?.name)?error.name:'OTHER_ERROR',code:named??patterns.find(([,p])=>p.test(message))?.[0]??'UNCLASSIFIED_ERROR',sourceFrames:(String(error?.stack??'').match(/browser\.mjs:\d+:\d+/g)??[]).slice(0,8),browserConnected:browser?.isConnected()??false,ownerPageClosed:ownerPage?.isClosed()??null,arbitraryErrorValuesRetained:false};
}
function recordFailure(error){const failure=safeFailure(error);if(!receipt.failure){receipt.failedStage=stage;receipt.failure=failure;signal('browser-first-failure.json',{stage,...failure});console.error('WORK8_BROWSER_DIAGNOSTIC '+JSON.stringify({stage,firstFailure:true,...failure}));}else receipt.cleanupFailure=failure;receipt.status='FAIL';process.exitCode=1;}
function signal(name,value){fs.writeFileSync('/control/'+name+'.tmp',JSON.stringify(value));fs.renameSync('/control/'+name+'.tmp','/control/'+name);}
async function wait(name){while(!fs.existsSync('/control/'+name)){check(Date.now()<deadline,'OVERALL_TRANSITION_DEADLINE');await pause(50);}}
function observe(route,response,action){const code=response.body?.code??response.body?.error;receipt.operations.push({stage,route:route.split('?')[0],status:response.status,...(action?{action}:{}),...(typeof code==='string'&&/^[A-Z_]{3,80}$/.test(code)?{code}:{})});fs.writeFileSync('/evidence/transition-http-observations.json',JSON.stringify(receipt.operations,null,2)+'\n');return response;}
// These are the only time-of-read fields in the original NORMAL projection.
// No persisted order/event/history field, version, state or amount is omitted.
function frozenView(snapshot){const copy=structuredClone(snapshot);for(const record of copy.records??[])if(record.finance?.financial)delete record.finance.financial.cutoffAt;for(const probe of copy.assurance?.probes??[])if(probe.evidence)delete probe.evidence.observedAt;return copy;}
function validateFrozen(snapshot){
 equal(snapshot.session.status,'PAUSED','TWIN_NOT_PAUSED');equal(snapshot.session.version,3,'TWIN_VERSION_NOT_THREE');equal(snapshot.authority.status,'REVOKED','SCHEDULER_AUTHORITY_NOT_REVOKED');equal(snapshot.authority.version,2,'AUTHORITY_VERSION_NOT_TWO');
 equal(snapshot.liveCommerce,'LOCKED','COMMERCE_NOT_LOCKED');equal(snapshot.birth,'NOT_BORN','PILLOW_STATE_CHANGED');equal(snapshot.actualCashMovement,0,'NONZERO_ACTUAL_CASH');equal(snapshot.next,null,'SNAPSHOT_TRUNCATED');equal(snapshot.records.length,2,'RECORD_COUNT_NOT_TWO');equal(snapshot.tasks.length,2,'TASK_COUNT_NOT_TWO');
 check(snapshot.tasks.every(t=>t.status==='COMPLETE'&&t.cursor===t.stepCount&&t.paidInference===0),'NATIVE_TASKS_INCOMPLETE');
 for(const r of snapshot.records){equal(Object.keys(r.orders).length,1,'ORDER_COUNT_NOT_ONE');equal(r.version,10,'POPULATED_HISTORY_NOT_TEN');check(r.finance.events.length>0,'COMMITTED_FINANCE_EVENTS_ABSENT');equal(r.finance.actualCashMovement,0,'FINANCE_ACTUAL_CASH_NONZERO');equal(r.finance.classification,'SIMULATION_EXCLUDED_FROM_ACTUALS','FINANCE_CLASSIFICATION_CHANGED');check(Object.values(r.orders).every(o=>o.order.integrationMode==='SANDBOX'&&o.outcome==='DELIVERED'),'ORDER_ISOLATION_OR_OUTCOME_INVALID');}
}
try{
 equal(getDefaultResultOrder(),'ipv4first','DNS_ORDER_INCORRECT');check(/^[0-9]+$/.test(process.env.EXAM_ID??''),'EXAM_ID_INVALID');
 const views=read('component-identities.json');check(views.normal.image!==views.recovery.image&&views.normal.commit!==views.recovery.commit&&views.normal.buildId!==views.recovery.buildId,'FRONTEND_VERSIONS_NOT_DISTINCT');
 const runtimeReceipt=JSON.parse(fs.readFileSync('/evidence/actual-runtime-ready.json','utf8'));check(typeof runtimeReceipt.generation==='string'&&runtimeReceipt.generation.length>0,'GENERATION_RECEIPT_MISSING');const generation=runtimeReceipt.generation;
 const minimumCreatedAt=Math.max(Date.parse(views.normal.createdAt),Date.parse(views.recovery.createdAt));check(Number.isFinite(minimumCreatedAt),'COMPONENT_BUILD_TIMES_INVALID');
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});browser.on('disconnected',()=>lifecycleEvent('browser-disconnected'));
 const context=await browser.newContext({serviceWorkers:'block'}),page=ownerPage=await context.newPage();
 context.on('close',()=>lifecycleEvent('owner-context-close'));page.on('close',()=>lifecycleEvent('owner-page-close'));page.on('crash',()=>lifecycleEvent('owner-page-crash'));
 page.on('requestfailed',request=>{const code=request.failure()?.errorText;lifecycleEvent('request-failed',{code:['net::ERR_FAILED','net::ERR_ABORTED','net::ERR_CONNECTION_REFUSED','net::ERR_CONNECTION_RESET','net::ERR_EMPTY_RESPONSE'].includes(code)?code:'OTHER_REDACTED'});});
 async function api(route,body){return observe(route,await page.evaluate(async({route,body})=>{const response=await fetch(route,{method:body===undefined?'GET':'POST',credentials:'include',redirect:'error',cache:'no-store',headers:body===undefined?undefined:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});return {status:response.status,body:await response.json().catch(()=>null)};},{route,body}),body?.action);}
 async function post(body){const response=await api('/api/owner/commerce',body);equal(response.status,200,'FRONTEND_CANONICAL_COMMAND_REFUSED');return response.body;}
 const sid='work8_transition_'+process.env.EXAM_ID+'_commerce',route='/api/owner/commerce/twin?sessionId='+sid;
 async function snapshot(){const response=await api(route);equal(response.status,200,'CANONICAL_SNAPSHOT_UNAVAILABLE');return response.body;}
 stage='NORMAL_AUTHENTICATION_BOOTSTRAP';
 const bootstrap=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/auth/me'&&r.request().method()==='GET',{timeout:60000});
 const landing=await page.goto(origin+'/login',{waitUntil:'domcontentloaded'});equal(landing.status(),200,'NORMAL_LOGIN_PAGE_UNAVAILABLE');const initialized=await bootstrap;equal(initialized.status(),401,'AUTH_BOOTSTRAP_UNEXPECTED_STATUS');equal(await initialized.finished(),null,'AUTH_BOOTSTRAP_RESPONSE_UNFINISHED');
 const button=page.getByRole('button',{name:'Enter EmpireAI',exact:true});await button.waitFor({state:'visible',timeout:60000});check(await button.isEnabled(),'LOGIN_FORM_NOT_READY');
 stage='NORMAL_AUTHENTICATION';const login=await api('/api/auth/login',{email:'owner@work8.invalid',password:process.env.OWNER_PASSWORD});equal(login.status,200,'OWNER_LOGIN_FAILED');
 const auth=await api('/api/auth/me');equal(auth.status,200,'OWNER_READBACK_FAILED');const initialUser=auth.body.user;check(initialUser,'OWNER_IDENTITY_ABSENT');const initialSession=(await context.cookies(origin)).find(c=>c.name==='empireai_session');check(initialSession?.secure&&initialSession?.httpOnly&&initialSession?.sameSite==='Lax','SESSION_COOKIE_PROTECTIONS_INVALID');
 receipt.cookieProtections={secure:true,httpOnly:true,sameSite:'Lax',valuesRecorded:false};
 async function ownerContinuity(){const user=await api('/api/auth/me');equal(user.status,200,'OWNER_SESSION_LOST');equal(user.body.user,initialUser,'OWNER_IDENTITY_CHANGED');const cookie=(await context.cookies(origin)).find(c=>c.name==='empireai_session');check(cookie?.value===initialSession.value&&cookie?.secure&&cookie?.httpOnly&&cookie?.sameSite==='Lax','OWNER_SESSION_OR_PROTECTIONS_CHANGED');equal(JSON.parse(fs.readFileSync('/evidence/actual-runtime-ready.json','utf8')).generation,generation,'GENERATION_RECEIPT_CHANGED');}
 async function normalIdentity(){const identity=await api('/api/owner/runtime');equal(identity.status,200,'NORMAL_IDENTITY_UNAVAILABLE');equal(identity.body.verified,true,'NORMAL_PAIR_UNVERIFIED');equal(identity.body.backendRevision,process.env.EXPECTED_BACKEND,'BACKEND_REVISION_CHANGED');equal(identity.body.frontendRevision,views.normal.commit,'NORMAL_FRONTEND_REVISION_CHANGED');}
 stage='NORMAL_IDENTITY';await normalIdentity();
 stage='CANONICAL_TWIN_CREATE';const create={action:'twin_lifecycle',transition:{id:sid+'_create',sessionId:sid,expectedVersion:0,action:'CREATE'}};equal((await post(create)).session.status,'PAUSED','CREATED_TWIN_NOT_PAUSED');
 stage='CANONICAL_TWIN_RESUME';await post({action:'twin_lifecycle',transition:{id:sid+'_resume',sessionId:sid,expectedVersion:1,action:'RESUME'}});
 stage='CANONICAL_LABELLED_ADMISSION';const admissionRequest={action:'twin_examination',examination:{id:sid+'_admit',sessionId:sid,expectedVersion:2,count:2,authorizeLabelledFixtures:true}},admission=await post(admissionRequest);equal(admission.classification,'LABELLED_TEST_FIXTURES_NOT_GENUINE_PRODUCTS','ADMISSION_NOT_LABELLED');equal(admission.externalEffects,0,'ADMISSION_EXTERNAL_EFFECTS');equal(admission.paidInference,0,'ADMISSION_PAID_INFERENCE');equal(await post(admissionRequest),admission,'ADMISSION_REPLAY_NOT_IDENTICAL');
 stage='NATIVE_SCHEDULER_GRANT';const grantRequest={action:'twin_authority',authority:{action:'GRANT',id:sid+'_grant',sessionId:sid,expectedVersion:0,mode:'FIFTEEN_MINUTES'}},grant=await post(grantRequest);equal(grant.scope,'TWIN_SCHEDULER_ONLY','GRANT_SCOPE_INVALID');
 stage='REAL_TIMER_CANONICAL_PROGRESS';const progressDeadline=Date.now()+120000;let progress;
 for(;;){progress=await snapshot();equal(progress.scheduler.intervalMs,5000,'NATIVE_SCHEDULER_CADENCE_CHANGED');check(!progress.tasks.some(t=>t.status==='BLOCKED'),'CANONICAL_NATIVE_TASK_BLOCKED');if(progress.records.length===2&&progress.tasks.length===2&&progress.tasks.every(t=>t.status==='COMPLETE')&&progress.records.every(r=>Object.keys(r.orders).length===1&&r.finance.events?.length>0))break;check(Date.now()<progressDeadline,'CANONICAL_PROGRESS_DEADLINE');await pause(2000);}
 stage='CANONICAL_PAUSE_AND_REVOKE';const pauseRequest={action:'twin_lifecycle',transition:{id:sid+'_pause',sessionId:sid,expectedVersion:progress.session.version,action:'PAUSE'}},paused=await post(pauseRequest);const revokeRequest={action:'twin_authority',authority:{action:'REVOKE',id:sid+'_revoke',sessionId:sid,expectedVersion:progress.authority.version}},revoked=await post(revokeRequest);
 const frozen=await snapshot();validateFrozen(frozen);check(frozen.records.every(r=>Object.values(r.orders).every(o=>Date.parse(o.order.createdAt)>minimumCreatedAt)),'ORDERS_NOT_NEWER_THAN_BOTH_VERSIONS');
 equal(await post(pauseRequest),paused,'PAUSE_REPLAY_NOT_IDENTICAL');equal(await post(revokeRequest),revoked,'REVOKE_REPLAY_NOT_IDENTICAL');equal(frozenView(await snapshot()),frozenView(frozen),'NORMAL_REPLAY_CHANGED_CANONICAL_STATE');
 fs.writeFileSync('/control/expected-commerce.json',JSON.stringify({sessionId:sid,minimumCreatedAt,snapshot:frozen}));
 // A NORMAL same-origin document survives the switch solely to exercise the BFF.
 // The separate RECOVERY history document keeps its original strict CSP intact.
 equal((await page.goto(origin+'/rollback',{waitUntil:'domcontentloaded'})).status(),404,'NORMAL_STABLE_DOCUMENT_UNAVAILABLE');
 receipt.phases.push({phase:'NORMAL',...views.normal,sessionId:sid,snapshotSha256:sha(frozenView(frozen)),orderCount:2,missionCount:2,financeEventCounts:frozen.records.map(r=>r.finance.events.length),historyVersions:frozen.records.map(r=>r.version),nativeSchedulerMs:5000,admissionIdempotent:true,paused:true,authorityRevoked:true});
 signal('normal-complete.json',{sessionId:sid,canonicalBusinessFrozen:true});
 stage='RECOVERY_SWITCH';await wait('recovery-ready.json');await ownerContinuity();
 const ready=await fetch(backend+'/health/ready'),readyBody=await ready.json();equal(ready.status,200,'RECOVERY_BACKEND_NOT_READY');equal(readyBody.ownerWriteRestriction,'RESTRICTED','RECOVERY_POLICY_NOT_RESTRICTED');
 stage='RECOVERY_WRITES_AND_AUTHORITY_REFUSED';
 const forbidden=grantRequest; // The exact historical command; never a fresh grant.
 for(const body of [pauseRequest,forbidden]){const denied=await api('/api/owner/commerce',body);equal(denied.status,423,'RECOVERY_FRONTEND_WRITE_NOT_REFUSED');equal(denied.body?.code,'OWNER_WRITES_RESTRICTED','RECOVERY_FRONTEND_POLICY_CODE_MISMATCH');}
 const ordinary=await api(route);equal(ordinary.status,423,'GENERAL_COMMERCE_READ_UNEXPECTEDLY_UNLOCKED');
 const direct=await fetch(backend+'/api/owner/commerce',{method:'POST',headers:{authorization:'Bearer '+initialSession.value,'content-type':'application/json'},body:JSON.stringify(forbidden)});observe('DIRECT:/api/owner/commerce',{status:direct.status,body:await direct.json().catch(()=>null)},forbidden.action);equal(direct.status,423,'RECOVERY_DIRECT_AUTHORITY_WRITE_NOT_REFUSED');
 stage='RECOVERY_AUTHENTICATED_CANONICAL_PRESENTATION';const recoveryPage=await context.newPage();const shown=await recoveryPage.goto(origin+'/recovery/commerce?sessionId='+sid,{waitUntil:'domcontentloaded'});equal(shown.status(),200,'RECOVERY_PRESENTATION_UNAVAILABLE');check((shown.headers()['content-security-policy']??'').includes("default-src 'none'"),'RECOVERY_CSP_NOT_RESTRICTIVE');
 const presented=JSON.parse(await recoveryPage.locator('pre').innerText()),expected=read('expected-recovery-commerce.json'),{notice,...canonicalPresentation}=presented;check(typeof notice==='string'&&notice.includes('simulation'),'RECOVERY_SIMULATION_NOTICE_ABSENT');equal(canonicalPresentation,expected,'RECOVERY_FRONTEND_CANONICAL_MISMATCH');equal(await recoveryPage.locator('script,form').count(),0,'RECOVERY_PRESENTATION_MUTATING_ELEMENTS');
 check(presented.records.every(r=>r.history.length===10&&r.finance.events.length>0),'RECOVERY_HISTORY_OR_FINANCE_EMPTY');equal(presented.authority.grantsAuthority,false,'RECOVERY_AUTHORITY_RESTORED');
 await recoveryPage.screenshot({path:'/evidence/recovery-canonical-business.png',fullPage:true});await recoveryPage.close();
 receipt.phases.push({phase:'RECOVERY',...views.recovery,frontendPresentationSha256:sha(canonicalPresentation),authenticatedSameOwnerContext:true,canonicalDatabaseCompared:true,orderCount:2,historyCounts:presented.records.map(r=>r.history.length),financeEventCounts:presented.records.map(r=>r.finance.events.length),readOnly:true,frontendWriteStatus:423,directAuthorityWriteStatus:423,generalCommerceStillRestricted:true,writeAuthorityExpanded:false,recoveryWriteRefusalPreserved:true});signal('recovery-complete.json',{ok:true});
 stage='NORMAL_RETURN_SWITCH';await wait('return-ready.json');equal((await page.goto(origin+'/rollback',{waitUntil:'domcontentloaded'})).status(),404,'RETURN_NORMAL_DOCUMENT_UNAVAILABLE');await ownerContinuity();await normalIdentity();
 stage='NORMAL_RETURN_CANONICAL_EQUALITY';const returned=await snapshot();validateFrozen(returned);equal(frozenView(returned),frozenView(frozen),'RETURN_CANONICAL_RECORDS_OR_HISTORY_CHANGED');
 stage='NORMAL_RETURN_IDEMPOTENT_REPLAY';equal(await post(pauseRequest),paused,'RETURN_PAUSE_REPLAY_CHANGED');equal(await post(revokeRequest),revoked,'RETURN_REVOKE_REPLAY_CHANGED');
 // This is the original immutable request, not a new grant. Latest authority must
 // remain REVOKED. Independent SQL readback verifies no row was appended.
 equal(await post(grantRequest),grant,'RETURN_HISTORICAL_GRANT_REPLAY_CHANGED');const afterReplay=await snapshot();validateFrozen(afterReplay);equal(frozenView(afterReplay),frozenView(frozen),'RETURN_REPLAY_MUTATED_CANONICAL_STATE');await ownerContinuity();
 receipt.phases.push({phase:'NORMAL_RETURN',...views.normal,snapshotSha256:sha(frozenView(afterReplay)),sameOwnerSession:true,canonicalRecordsAndHistoryUnchanged:true,frontendIdempotentPauseAccepted:true,frontendIdempotentRevokeAccepted:true,historicalGrantReplayAddedNoAuthority:true,authorityRemainsRevoked:true,independentFinalDatabaseReadbackRequired:true});
 receipt.returnWriteEvidence={current:'FRONTEND_CANONICAL_IDEMPOTENT_COMMANDS',freshTechnicalRecord:'REUSED_ACCEPTED_V25_41205128907',noUnrelatedRecordAdded:true};receipt.generationSha256=sha(generation);receipt.generationIndependentlyCheckedByController=true;receipt.status='PASS_AWAITING_INDEPENDENT_BUSINESS_REVIEW';signal('browser-complete.json',{ok:true});
}catch(error){recordFailure(error);}
finally{cleanupMode=true;lifecycleEvent('cleanup-start',{browserConnected:browser?.isConnected()??false,ownerPageClosed:ownerPage?.isClosed()??null});try{await browser?.close();}catch(error){recordFailure(error);}fs.writeFileSync('/evidence/transition-browser-result.json',JSON.stringify(receipt,null,2)+'\n');}

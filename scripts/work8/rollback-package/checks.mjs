import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {lookup} from 'node:dns/promises';
const phase=process.argv[2];
assert.ok(['missing','malformed','expired','released','revoked','restart'].includes(phase));
const expected=process.env.EXPECTED_SOURCE_COMMIT;
assert.match(expected,/^[a-f0-9]{40}$/);
const restricted=phase!=='released';
const origin='http://localhost:43117',backend='http://owner-backend:43118';
const retained=JSON.parse(fs.readFileSync('/examination/assets/accepted-history.json','utf8'));
const receipt={phase,status:'FAIL',sourceCommit:expected,newDecisions:0,productionEffects:false,wholeRowsAccepted:[]};
let stage='backend-readiness';
const diagnostics={};
const safeAssertionValue=value=>typeof value==='boolean'||typeof value==='number'||value===null?value:typeof value==='string'&&['OWNER_WRITES_RESTRICTED','RESTRICTED','RELEASED','NOT_BORN','LOCKED'].includes(value)?value:{type:typeof value,length:typeof value==='string'?value.length:undefined};
const safeResponse=body=>({code:['OWNER_WRITES_RESTRICTED'].includes(body?.code)?body.code:body?.code===undefined?undefined:'UNRECOGNIZED_CODE',error:['Same-origin request required','Sign in to continue','Package too large','Route unavailable','Advisor service unavailable. No completion is confirmed.'].includes(body?.error)?body.error:body?.error===undefined?undefined:'UNRECOGNIZED_ERROR'});

let browser;
try{
 let ready,live;
 const deadline=Date.now()+180000;
 while(Date.now()<deadline){
  try{
   const a=await fetch(backend+'/health/live',{signal:AbortSignal.timeout(5000)});
   const b=await fetch(backend+'/health/ready',{signal:AbortSignal.timeout(5000)});
   diagnostics.backend={liveStatus:a.status,readyStatus:b.status};
   diagnostics.readinessCheck='live-http-status';assert.equal(a.status,200);
   diagnostics.readinessCheck='ready-http-status';assert.equal(b.status,200);live=await a.json();ready=await b.json();
   diagnostics.readinessCheck='source-commit';assert.equal(live.deploy.gitCommitSha,expected);
   diagnostics.readinessCheck='ready';assert.equal(ready.ready,true);
   diagnostics.readinessCheck='birth';assert.equal(ready.birth,'NOT_BORN');
   diagnostics.readinessCheck='commerce';assert.equal(ready.commerce,'LOCKED');
   diagnostics.readinessCheck='operational';assert.equal(ready.operational,false);
   diagnostics.readinessCheck='owner-write-restriction';assert.equal(ready.ownerWriteRestriction,restricted?'RESTRICTED':'RELEASED');break;
  }catch(error){
   const safe=v=>typeof v==='boolean'||typeof v==='number'||v===null?v:typeof v==='string'&&(/^[a-f0-9]{40}$/.test(v)||['NOT_BORN','BORN','LOCKED','RESTRICTED','RELEASED'].includes(v))?v:v===undefined?'UNAVAILABLE':'UNRECOGNIZED_VALUE';
   diagnostics.readinessFailure={check:diagnostics.readinessCheck||'transport',code:['ERR_ASSERTION','ECONNREFUSED','ETIMEDOUT'].includes(error?.code)?error.code:'READINESS_ERROR',actual:safe(error?.actual),expected:safe(error?.expected)};
   ready=null;await new Promise(r=>setTimeout(r,1000));
  }
 }
 assert.ok(ready,'complete readiness deadline');
 if(diagnostics.readinessFailure){diagnostics.transientBackendReadinessFailure=diagnostics.readinessFailure;delete diagnostics.readinessFailure;}
 receipt.readiness={ready:true,birth:ready.birth,commerce:ready.commerce,restriction:ready.ownerWriteRestriction};
 stage='frontend-readiness';
 diagnostics.frontendOrigin=origin;
 try{diagnostics.localhostAddresses=(await lookup('localhost',{all:true})).slice(0,8);}catch(error){diagnostics.localhostLookupError={code:error?.code||'LOOKUP_FAILED'};}
 const transportError=error=>{const chain=[];for(let item=error,depth=0;item&&depth<4;item=item.cause,depth++){const children=Array.isArray(item.errors)?item.errors.slice(0,8):[item];for(const child of children){chain.push({name:typeof child?.name==='string'?child.name.slice(0,60):'Error',code:typeof child?.code==='string'?child.code.slice(0,60):null,syscall:['connect','getaddrinfo'].includes(child?.syscall)?child.syscall:null,address:['127.0.0.1','::1'].includes(child?.address)?child.address:null,port:child?.port===43117?43117:null});}}return chain;};
 let frontendReady=false;const frontendDeadline=Date.now()+90000;
 while(Date.now()<frontendDeadline){
  try{const r=await fetch(origin+'/login',{redirect:'error',signal:AbortSignal.timeout(5000)});diagnostics.frontend={status:r.status,originMatched:new URL(r.url).origin===origin};await r.body?.cancel();if(r.status===200&&diagnostics.frontend.originMatched){frontendReady=true;break;}}
  catch(error){diagnostics.frontend={transportFailure:true,errors:transportError(error)};}
  await new Promise(r=>setTimeout(r,1000));
 }
 assert.ok(frontendReady,'frontend readiness deadline');
 stage='browser-start';
 const {chromium}=createRequire('/tools/package.json')('playwright');
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 const context=await browser.newContext({serviceWorkers:'block'});
 const page=await context.newPage();
 const landing=await page.goto(origin+'/login',{waitUntil:'domcontentloaded'});assert.equal(landing.status(),200);assert.equal(new URL(page.url()).origin,origin);
 async function api(route,body){const result=await page.evaluate(async({route,body})=>{
  const response=await fetch(route,{method:body===undefined?'GET':'POST',credentials:'include',redirect:'error',cache:'no-store',headers:body===undefined?undefined:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:response.status,body:await response.json()};
 },{route,body});diagnostics.lastRequest={path:route.split('?')[0],method:body===undefined?'GET':'POST',status:result.status,response:safeResponse(result.body)};return result;}
 stage='anonymous-history-refusal';
 assert.equal((await api('/api/owner/advisor/read?domain=memory&id='+retained.target)).status,401);
 stage='authentication';const login=await api('/api/auth/login',{email:process.env.OWNER_EMAIL,password:process.env.OWNER_PASSWORD});
 assert.equal(login.status,200);assert.equal(login.body.user.email,process.env.OWNER_EMAIL);
 const cookie=(await context.cookies(origin)).find(c=>c.name==='empireai_session');
 assert.ok(cookie?.secure&&cookie?.httpOnly);assert.equal((await api('/api/auth/me')).body.user.id,login.body.user.id);
 const read=async()=>{const r=await api('/api/owner/advisor/read?domain=memory&id='+retained.target);assert.equal(r.status,200);assert.deepEqual(r.body.data,retained.record);return r.body.data;};
 stage='authenticated-history';await read();
 if(restricted){
  stage='restricted-write-probes';
  // Invalid probe cannot create a decision even if a regression permits ingress.
  const probe={action:'work8_restriction_probe',noAuthority:true};
  const bff=await api('/api/owner/advisor/memory',probe);assert.equal(bff.status,423);assert.equal(bff.body.code,'OWNER_WRITES_RESTRICTED');
  const direct=await fetch(backend+'/api/owner/advisor/memory',{method:'POST',headers:{authorization:'Bearer '+cookie.value,'content-type':'application/json'},body:JSON.stringify(probe)});
  assert.equal(direct.status,423);assert.equal((await direct.json()).code,'OWNER_WRITES_RESTRICTED');
  receipt.writeRestriction={frontend:423,directBackend:423};
 }else{
  stage='explicit-release-invalid-probe';
  // Release is demonstrated by health and route admission only; no valid decision submitted.
  const direct=await fetch(backend+'/api/owner/advisor/memory',{method:'POST',headers:{authorization:'Bearer '+cookie.value,'content-type':'application/json'},body:'{"action":"work8_restriction_probe"}'});
  assert.equal(direct.status,400);receipt.explicitRelease={invalidCommandRefused:400,newDecision:false};
 }
 await read();receipt.authentication={anonymousRefused:true,secureCookie:true,httpOnly:true,ownerMatched:true};
 if(restricted){
  stage='recovery-view-readback';
  const views=[];
  for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
   await page.setViewportSize({width,height});const response=await page.goto(origin+'/rollback?id='+retained.target,{waitUntil:'domcontentloaded'});
   assert.equal(response.status(),200);const data=JSON.parse(await page.locator('pre').innerText());assert.deepEqual(data.data,retained.record);
   assert.equal(await page.locator('form[method="post"],script,input[type="submit"]').count(),0);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   views.push({name,width,historyDigest:createHash('sha256').update(JSON.stringify(data.data)).digest('hex')});
   if(phase==='restart')await page.screenshot({path:'/evidence/restart-'+name+'.png',fullPage:true});
  }
  assert.equal(views[0].historyDigest,views[1].historyDigest);receipt.views=views;
 }else{
  assert.equal((await page.goto(origin+'/rollback?id='+retained.target)).status(),503);
 }
 receipt.status='PASS';
}catch(error){receipt.failure=['ERR_ASSERTION','ECONNREFUSED','ETIMEDOUT'].includes(error?.code)?error.code:'EXAMINATION_FAILURE';receipt.failedStage=stage;receipt.assertion={operator:['strictEqual','deepStrictEqual','==','===','match','ok'].includes(error?.operator)?error.operator:'UNRECOGNIZED',actual:safeAssertionValue(error?.actual),expected:safeAssertionValue(error?.expected)};throw Error('Changed-pair examination stopped: '+phase+' at '+stage);}
finally{try{await browser?.close();}catch{receipt.browserCleanupFailed=true;receipt.status='FAIL';process.exitCode=1;}receipt.diagnostics=diagnostics;fs.writeFileSync('/evidence/'+phase+'.json',JSON.stringify(receipt,null,2)+'\n');}

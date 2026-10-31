import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const {chromium}=createRequire('/frontend-package/package.json')('playwright');
const origin='http://localhost:43117',backend='http://native-backend:43100',deadline=Date.now()+480000;
const pause=ms=>new Promise(r=>setTimeout(r,ms)),sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const receipt={schema:'work8-distinct-version-transition-v1',status:'FAIL',syntheticOwnerOnly:true,genuineKingObservation:false,productionEffects:false,wholeRowsAccepted:[],phases:[]};
let browser,stage='start';
const responseObservations=[];
function sanitized(value){
 if(Array.isArray(value))return value.map(sanitized);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,/(?:token|password|secret|nonce|authorization|cookie)/i.test(key)?'[REDACTED]':sanitized(item)]));
 if(typeof value==='string'){let text=value;for(const secret of [process.env.OWNER_PASSWORD].filter(Boolean))text=text.split(secret).join('[REDACTED]');return text.replace(/Bearer\s+[^\s"<>]+/gi,'Bearer [REDACTED]').replace(/empireai_session=[^;\s"<>]+/g,'empireai_session=[REDACTED]');}return value;
}
function observe(route,response){responseObservations.push({stage,route,status:response.status,body:sanitized(response.body)});if(responseObservations.length>80)responseObservations.shift();fs.writeFileSync('/evidence/transition-http-observations.json',JSON.stringify(responseObservations,null,2)+'\n');return response;}

function signal(name,value){fs.writeFileSync('/control/'+name+'.tmp',JSON.stringify(value));fs.renameSync('/control/'+name+'.tmp','/control/'+name);}
async function wait(name){while(!fs.existsSync('/control/'+name)){assert.ok(Date.now()<deadline,'OVERALL_TRANSITION_DEADLINE');await pause(50);}}
try{
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
 async function api(route,body){const response=await page.evaluate(async({route,body})=>{const r=await fetch(route,{method:body===undefined?'GET':'POST',credentials:'include',redirect:'error',cache:'no-store',headers:body===undefined?undefined:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});let data;try{data=await r.json();}catch{data=null;}return {status:r.status,body:data};},{route,body});return observe(route,response);}
 const history=async id=>{const r=await api('/api/owner/advisor/read?domain=memory&id='+id);assert.equal(r.status,200);assert.equal(r.body.data.id,id);return r.body.data;};
 const command=id=>({action:'synthetic_experience',experience:{id,scope:{domain:'work8_version_transition',entities:[]},belief:'SYNTHETIC: isolated version compatibility record.',decision:'No commercial action, owner approval or paid inference.',rationale:'Persist after both versions were built and preserve through an actual distinct frontend switch.',evidence:[],influences:[]}});
 const records=[];
 async function commit(id){const r=await api('/api/owner/advisor/memory',command(id));assert.equal(r.status,200);assert.equal(r.body.result.id,id);assert.equal(r.body.grantsAuthority,false);assert.equal(r.body.inferenceCalls,0);const row=await history(id);assert.equal(row.origin.authenticity,'SYNTHETIC');assert.equal(row.origin.actor,'SYSTEM');assert.equal(row.grantsAuthority,false);records.push(row);return row;}
 const views=JSON.parse(fs.readFileSync('/control/component-identities.json','utf8'));assert.notEqual(views.normal.image,views.recovery.image);assert.notEqual(views.normal.commit,views.recovery.commit);assert.notEqual(views.normal.buildId,views.recovery.buildId);
 stage='normal-authentication';await page.goto(origin+'/login',{waitUntil:'domcontentloaded'});
 assert.equal((await api('/api/owner/advisor/read?domain=memory')).status,401);
 const login=await api('/api/auth/login',{email:'owner@work8.invalid',password:process.env.OWNER_PASSWORD});assert.equal(login.status,200);assert.equal(login.body.user.email,'owner@work8.invalid');
 const initialUser=(await api('/api/auth/me')).body.user;assert.ok(initialUser);const initialSession=(await context.cookies(origin)).find(c=>c.name==='empireai_session');assert.ok(initialSession?.secure&&initialSession?.httpOnly);
 stage='normal-identity';const identity=await api('/api/owner/runtime');assert.equal(identity.status,200);assert.equal(identity.body.verified,true);assert.equal(identity.body.backendRevision,process.env.EXPECTED_BACKEND);assert.equal(identity.body.frontendRevision,views.normal.commit);
 stage='newer-committed-record';await commit('work8_transition_'+process.env.EXAM_ID+'_one');const newer=await commit('work8_transition_'+process.env.EXAM_ID+'_newer');assert.ok(Date.parse(newer.recordedAt)>Math.max(Date.parse(views.normal.createdAt),Date.parse(views.recovery.createdAt)));
 assert.equal((await page.goto(origin+'/rollback')).status(),404);receipt.phases.push({phase:'NORMAL',...views.normal,newerRecordId:newer.id,newerRecordSha256:sha(newer),authenticated:true});fs.writeFileSync('/control/expected-records.json',JSON.stringify(records));signal('normal-complete.json',{recordIds:records.map(r=>r.id)});
 stage='recovery-switch';await wait('recovery-ready.json');
 const readiness=await fetch(backend+'/health/ready');const readinessBody=await readiness.json().catch(()=>null);observe('DIRECT:/health/ready',{status:readiness.status,body:readinessBody});assert.equal(readiness.status,200);assert.equal(readinessBody?.ownerWriteRestriction,'RESTRICTED');
 for(const row of records)assert.deepEqual(await history(row.id),row);
 const invalid={action:'work8_restriction_probe',noAuthority:true};const denied=await api('/api/owner/advisor/memory',invalid);assert.equal(denied.status,423);assert.equal(denied.body.code,'OWNER_WRITES_RESTRICTED');
 const direct=await fetch(backend+'/api/owner/advisor/memory',{method:'POST',headers:{authorization:'Bearer '+initialSession.value,'content-type':'application/json'},body:JSON.stringify(invalid)});observe('DIRECT:/api/owner/advisor/memory',{status:direct.status,body:await direct.json().catch(()=>null)});assert.equal(direct.status,423);
 const equality=[];for(const [name,width,height]of [['desktop',1440,1000],['mobile',390,844]]){await page.setViewportSize({width,height});const r=await page.goto(origin+'/rollback?id='+newer.id,{waitUntil:'domcontentloaded'});assert.equal(r.status(),200);const seen=JSON.parse(await page.locator('pre').innerText()).data;assert.deepEqual(seen,newer);assert.equal(await page.locator('script,form[method=post]').count(),0);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));equality.push({name,sha256:sha(seen)});await page.screenshot({path:'/evidence/recovery-'+name+'.png',fullPage:true});}
 assert.equal(equality[0].sha256,equality[1].sha256);receipt.phases.push({phase:'RECOVERY',...views.recovery,writeRefusalStatus:423,views:equality});signal('recovery-complete.json',{ok:true});
 stage='return-switch';await wait('return-ready.json');await page.goto(origin+'/login',{waitUntil:'domcontentloaded'});
 const returned=await api('/api/owner/runtime');assert.equal(returned.status,200);assert.equal(returned.body.verified,true);assert.equal(returned.body.frontendRevision,views.normal.commit);assert.equal(returned.body.backendRevision,process.env.EXPECTED_BACKEND);
 assert.deepEqual((await api('/api/auth/me')).body.user,initialUser);assert.equal((await context.cookies(origin)).find(c=>c.name==='empireai_session').value,initialSession.value);
 for(const row of records)assert.deepEqual(await history(row.id),row);assert.equal((await page.goto(origin+'/rollback')).status(),404);
 await commit('work8_transition_'+process.env.EXAM_ID+'_returned');receipt.phases.push({phase:'NORMAL_RETURN',...views.normal,newerRecordsPreserved:true,sessionUnchanged:true,newSyntheticWriteAccepted:true});
 fs.writeFileSync('/control/expected-records.json',JSON.stringify(records));fs.writeFileSync('/evidence/technical-synthetic-records.json',JSON.stringify(records,null,2));receipt.status='PASS_AWAITING_INDEPENDENT_TECHNICAL_REVIEW';signal('browser-complete.json',{ok:true});
}catch(error){receipt.failedStage=stage;receipt.failure={name:error?.name,code:error?.code,operator:error?.operator,detail:'Sensitive assertion values and messages are withheld; bounded sanitized HTTP observations retain the response evidence.'};receipt.status='FAIL';process.exitCode=1;}
finally{try{await browser?.close();}catch{receipt.status='FAIL';process.exitCode=1;}fs.writeFileSync('/evidence/transition-browser-result.json',JSON.stringify(receipt,null,2)+'\n');}

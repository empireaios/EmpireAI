/** Loopback-only UI contract acceptance. This is NOT production recovery evidence. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.ASSURANCE_TEST_URL??'http://127.0.0.1:3123';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
test('desktop/mobile approval, auto-refresh, lost-response reconciliation and stale view',async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900}});await context.addCookies([{name:'empireai_session',value:'local-assurance-fixture-only',url:base}]);
  let unavailable=false,reads=0,posts=0;const receipts=[];const t=Date.now();
  const incident={id:'inc_fixture',capability:'evidence-reconciliation',classification:'DERIVED_VIEW_UNAVAILABLE',severity:'HIGH',summary:'Operational evidence view needs restoration.',status:'OWNER_ACTION_REQUIRED',firstAt:t,lastAt:t,revision:'fixture',runbookId:'derived-view-rebuild',recurrence:1,attempts:0};
  const approval={id:'apr_fixture',incidentId:incident.id,runbookId:'derived-view-rebuild',runbookVersion:'v1',revision:'fixture',decision:'PENDING',createdAt:t,expiresAt:t+3600000,consumed:false,title:'Restore operational evidence view',proposedAction:'Rebuild the derived view from preserved source receipts.',impact:'Operational context is unavailable.',alreadyDone:'Deterministic evidence checks completed.',approvalReason:'This scenario requires exact owner authority.',consequences:{approve:'Restore only the derived view.',reject:'Recovery stays blocked.',defer:'Decision stays deferred.',inaction:'The view remains unavailable.'}};
  const payload=()=>({observedAt:Date.now(),status:'DEGRADED',controlPlane:{schema:'assurance-control-plane-v1',observedAt:Date.now(),revision:'fixture',status:incident.status==='RECOVERED'?'HEALTHY':'DEGRADED',summary:{activeIncidents:incident.status==='RECOVERED'?0:1,automaticallyRecovered:0,ownerActionRequired:approval.decision==='PENDING'?1:0},paused:{paused:false},monitor:{fresh:true,heartbeat:{at:Date.now(),revision:'fixture'}},components:[{id:'reconciliation',capability:'evidence-reconciliation',status:'DEGRADED',summary:'Source view unavailable.',observedAt:Date.now()}],incidents:[incident],recoveries:[],approvals:[approval],events:[],checkpoints:[],lease:null,commands:receipts},reconciliation:{status:'VERIFIED',summary:'Original commercial assessment preserved.',derivedSha256:'a'.repeat(64)}});
  await context.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin!==base)return route.abort();if(!url.pathname.startsWith('/api/'))return route.continue();const json=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
   if(url.pathname==='/api/auth/me')return json({user:{id:'fixture-owner',email:'fixture@example.invalid',name:'King',role:'founder',workspaceId:'fixture',platformIdentity:'grand-king'}});
   if(url.pathname==='/api/owner/assurance'){reads++;return unavailable?json({error:'fixture transport unavailable'},503):json(payload());}
   if(url.pathname==='/api/owner/assurance/control'){posts++;const c=route.request().postDataJSON();assert.equal(c.type,'approve');assert.equal(c.approvalId,'apr_fixture');receipts.push({...c,status:'ACCEPTED',at:Date.now(),revision:'fixture'});approval.decision='APPROVED';approval.consumed=true;incident.status='RECOVERED';return route.abort();}
   return json({error:'not part of this fixture'},503);
  });
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/cockpit/assurance');await page.getByRole('button',{name:'Review approval',exact:true}).waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.getByRole('button',{name:'Review approval',exact:true}).click();await page.getByRole('button',{name:'Confirm approval',exact:true}).click();await page.getByText('Action recorded. Recovery success requires a verified recovery receipt below.',{exact:true}).waitFor();assert.equal(posts,1);assert.ok(reads>=2);assert.equal(await page.getByRole('button',{name:'Reconcile same action'}).count(),0);
  unavailable=true;await page.getByRole('button',{name:'Refresh view',exact:true}).click();await page.getByText('Evidence refresh failed. Saved observations remain below and may be out of date.',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Run health check'}).isDisabled(),true);assert.ok(await page.getByRole('heading',{name:'Functional health'}).isVisible());assert.deepEqual(errors,[]);
  await context.close();
 }}finally{await browser.close();}
});

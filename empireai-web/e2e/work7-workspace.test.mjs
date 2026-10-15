import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {chromium} from 'playwright';
import {installGeometryFixture} from './pillow-geometry-fixture.mjs';
const base=process.env.WORK7_TEST_URL??'http://127.0.0.1:3123';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
// Isolated collection contract. This proves UI identity/denial handling, not production data or backend policy.
test('workspace follows returned collection IDs and never substitutes a demo or denied record',async()=>{
 const browser=await chromium.launch({executablePath:process.env.WORK7_CHROMIUM_PATH||undefined});
 try{for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:844}});await installGeometryFixture(context,base);
  const record={id:randomUUID(),name:'Isolated returned business',category:'Fixture',status:'building',revenue:'Unavailable',margin:'Unavailable',agents:2};
  let denied=false;
  await context.route('**/api/brain/dispatch',async route=>{
   const request=route.request().postDataJSON();
   if(denied)return route.fulfill({status:403,json:{error:'Access denied for this workspace'}});
   return route.fulfill({json:{status:'ok',result:request.module==='store'?{companies:[record]}:{canonicalTruth:{pendingApprovals:0,activeMissionHuman:'Isolated acceptance'}}}});
  });
  const page=await context.newPage();await page.goto(base+'/cockpit/commerce/workspace');
  const link=page.getByRole('link',{name:record.name,exact:true});await link.waitFor();
  const returnedHref=await link.getAttribute('href');assert.equal(returnedHref,'/cockpit/commerce/workspace/'+record.id);
  await link.click();await page.getByRole('heading',{name:record.name,exact:true}).waitFor();
  assert.match(await page.locator('main').innerText(),/Recorded revenue/i);
  assert.equal(await page.getByRole('button',{name:'Approve next gate',exact:true}).isDisabled(),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.getByRole('link',{name:'Back to workspace',exact:false}).click();await link.waitFor();
  // An absent ID is explicitly synthetic; it is never presented as a production identifier.
  await page.goto(base+'/cockpit/commerce/workspace/'+randomUUID());await page.getByText('No matching workspace was returned for this session.',{exact:false}).waitFor();
  assert.equal(await page.getByRole('heading',{name:record.name,exact:true}).count(),0);
  // Even a former hard-coded demo ID cannot create a record absent from the collection.
  await page.goto(base+'/cockpit/commerce/workspace/vertex-saas');await page.getByText('No matching workspace was returned for this session.',{exact:false}).waitFor();
  denied=true;await context.clearCookies();await context.addCookies([{name:'empireai_session',value:'isolated-foreign-session',url:base}]);
  await page.goto(base+returnedHref);await page.getByText('The required source did not return usable records.',{exact:false}).waitFor();
  assert.equal(await page.getByRole('heading',{name:record.name,exact:true}).count(),0);
  assert.equal(await page.getByRole('link',{name:'Return to current owner view',exact:true}).getAttribute('href'),'/cockpit/commerce/workspace');
  await context.close();
 }}finally{await browser.close();}
});

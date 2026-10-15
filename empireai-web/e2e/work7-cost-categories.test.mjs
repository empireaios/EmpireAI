/** Owner controls against an isolated metadata transport; backend durability is tested separately. */
import {test} from 'node:test';import assert from 'node:assert/strict';import {chromium} from 'playwright';
import {installGeometryFixture} from './pillow-geometry-fixture.mjs';
const base=process.env.WORK7_TEST_URL??'http://127.0.0.1:3123';assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
test('category create edit archive and vendor mapping retain identities across UI reload',async()=>{
 const browser=await chromium.launch({executablePath:process.env.WORK7_CHROMIUM_PATH||undefined});
 try{for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:844}});await installGeometryFixture(context,base);
  let supported=true;const categories=[],mappings=[],commands=[];
  await context.route('**/api/owner/finance',async route=>{
   const req=route.request();if(req.method()==='POST'){const c=req.postDataJSON();commands.push(c);const target=c.type==='cost_category'?categories:mappings,key=c.type==='cost_category'?'id':'provider';const index=target.findIndex(x=>x[key]===c.data[key]);const row={...c.data,revision:c.id};if(index<0)target.push(row);else target[index]=row;return route.fulfill({json:{status:'RECORDED',receipt:{id:c.id}}});}
   return route.fulfill({json:{observedAt:new Date().toISOString(),providers:[{id:'openai',name:'OpenAI',category:'AI',commissioned:'YES',mandatory:true,billingAccess:'UNAVAILABLE',note:'Isolated'}],costs:[],alerts:[],accounting:{},...(supported?{directoryCapabilities:{standaloneCategories:true,providerCategoryMapping:true},costDirectory:{categories,mappings}}:{})}});
  });
  const page=await context.newPage();await page.goto(base+'/cockpit/cost-centre');await page.getByText('Manage cost categories',{exact:true}).click();
  await page.getByRole('button',{name:'Add category',exact:true}).click();await page.getByLabel('Category name',{exact:true}).fill('Isolated AI');await page.getByRole('button',{name:'Save category',exact:true}).click();
  await page.getByRole('button',{name:'Edit category · Isolated AI',exact:true}).waitFor();const stableId=categories[0].id;
  await page.getByLabel('Assign vendor',{exact:true}).selectOption('openai');await page.getByLabel('Assigned category',{exact:true}).selectOption(stableId);await page.getByRole('button',{name:'Save vendor category',exact:true}).click();await page.getByRole('button',{name:'Save vendor category',exact:true}).waitFor({state:'visible'});
  await page.getByRole('button',{name:'Edit category · Isolated AI',exact:true}).click();await page.getByLabel('Category name',{exact:true}).fill('Isolated model usage');await page.getByRole('button',{name:'Save category',exact:true}).click();await page.getByRole('button',{name:'Edit category · Isolated model usage',exact:true}).waitFor();
  await page.reload();await page.getByText('Manage cost categories',{exact:true}).click();await page.getByRole('button',{name:'Edit category · Isolated model usage',exact:true}).click();await page.getByLabel('Archive category',{exact:true}).check();await page.getByRole('button',{name:'Save category',exact:true}).click();await page.getByRole('form',{name:'Cost category editor'}).waitFor({state:'hidden'});
  await page.getByLabel('Show archived categories',{exact:true}).check();await page.getByRole('button',{name:'Edit category · Isolated model usage',exact:true}).waitFor();
  assert.equal(categories[0].id,stableId);assert.equal(categories[0].archived,true);assert.equal(mappings[0].categoryId,stableId);assert.equal(commands.length,4);assert.ok(commands.every(c=>['cost_category','provider_category'].includes(c.type)));
  supported=false;await page.reload();await page.getByText('Manage cost categories',{exact:true}).click();assert.equal(await page.getByRole('button',{name:'Add category',exact:true}).isEnabled(),false);
  await context.close();
 }}finally{await browser.close();}
});

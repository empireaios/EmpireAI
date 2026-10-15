import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {installGeometryFixture} from './pillow-geometry-fixture.mjs';
const base=process.env.WORK7_TEST_URL??'http://127.0.0.1:3123';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
test('legacy advertising denials preserve locks, explain refusal and return to their owner department',async()=>{
 const browser=await chromium.launch({executablePath:process.env.WORK7_CHROMIUM_PATH||undefined});
 try{for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:844}});await installGeometryFixture(context,base);const page=await context.newPage();
  for(const [route,parent] of [['ad-intelligence','eyes'],['ads','listings'],['marketing','listings']]){
   await page.goto(base+'/cockpit/commerce/'+route);await page.getByText('Retry is disabled because it cannot remove the authority restriction.',{exact:true}).first().waitFor();
   const buttons=await page.getByRole('button',{name:'Retry',exact:true}).all();assert.ok(buttons.length);for(const b of buttons)assert.equal(await b.isDisabled(),true);
   assert.match(await page.locator('main').innerText(),/NOT_BORN and Commerce LOCKED/);
   const links=page.getByRole('link',{name:'Return to current owner view',exact:true});for(const l of await links.all())assert.equal(await l.getAttribute('href'),'/cockpit/'+parent);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await links.first().click();await page.waitForURL(base+'/cockpit/'+parent);
   await page.goBack();await page.getByText('Retry is disabled because it cannot remove the authority restriction.',{exact:true}).first().waitFor();
  }
  await context.close();
 }}finally{await browser.close();}
});

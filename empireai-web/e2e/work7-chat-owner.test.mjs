/** Loopback-only presentation regression. No provider or production traffic. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import {installGeometryFixture} from './pillow-geometry-fixture.mjs';
const base=process.env.WORK7_TEST_URL??'http://127.0.0.1:3123';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
test('Pillow saved exchange selector, internal scroll, composer and parent context at desktop/mobile',async()=>{
 const browser=await chromium.launch();
 try{for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  const requests=await installGeometryFixture(context,base);const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/cockpit/development/pillow');
  const history=page.getByTestId('pillow-message-history');
  await history.getByText('Historical layout fixture',{exact:true}).waitFor();
  const selector=page.getByLabel('Conversation history',{exact:true});
  assert.equal(await selector.locator('option').count(),2);
  await selector.selectOption({index:1});
  await history.getByText('Local layout fixture: show the review steps.',{exact:true}).waitFor();
  const geometry=await page.evaluate(()=>{
    const history=document.querySelector('[data-testid="pillow-message-history"]');
    const composer=document.querySelector('[data-testid="pillow-composer"]');
    return{width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,documentHeight:document.documentElement.scrollHeight,history:history.getBoundingClientRect().toJSON(),historyOverflow:getComputedStyle(history).overflowY,composer:composer.getBoundingClientRect().toJSON()};
  });
  assert.ok(geometry.documentWidth<=width+1,JSON.stringify(geometry));
  assert.ok(geometry.documentHeight<=geometry.height+2,JSON.stringify(geometry));
  assert.ok(geometry.history.height>=180,JSON.stringify(geometry));
  assert.equal(geometry.historyOverflow,'auto');assert.ok(geometry.history.right<=width,JSON.stringify(geometry));
  assert.ok(geometry.composer.bottom<=geometry.height-(width===390?54:0),JSON.stringify(geometry));
  assert.match(await page.getByRole('navigation',{name:'Breadcrumb',exact:true}).innerText(),/Pillow[\s\S]*Chat/);
  assert.equal(await page.getByRole('navigation',{name:width===390?'Mobile quick navigation':'Owner navigation',exact:true}).getByRole('link',{name:width===390?'CEO':'Pillow (CEO)',exact:true}).getAttribute('aria-current'),'page');
  await history.focus();await page.keyboard.press('End');
  await page.getByTestId('pillow-composer').fill('Unsent local draft');
  assert.equal(await page.getByTestId('pillow-composer').inputValue(),'Unsent local draft');
  await page.getByTestId('pillow-composer').fill('');
  assert.equal(requests.filter(r=>r.method==='POST'&&!['/api/pillow/session','/api/brain/dispatch'].includes(r.path)).length,0,JSON.stringify(requests));
  assert.equal(requests.filter(r=>r.path==='/api/pillow/chat').length,0,'History selection and unsent draft must never request inference');
  const readable=await history.locator('ol li').first().evaluate(el=>({color:getComputedStyle(el).color,marker:getComputedStyle(el,'::marker').color}));
  assert.equal(readable.color,'rgb(41, 67, 99)','saved response text must remain readable on the light owner surface');
  assert.equal(readable.marker,'rgb(41, 67, 99)','list numbering must remain readable');
  assert.deepEqual(errors,[]);
  if(process.env.WORK7_SCREENSHOTS){await mkdir(process.env.WORK7_SCREENSHOTS,{recursive:true});await page.screenshot({path:`${process.env.WORK7_SCREENSHOTS}/Pillow__AUTHENTICATED_TEST__${width}.png`});}
  await context.close();
 }}finally{await browser.close();}
});

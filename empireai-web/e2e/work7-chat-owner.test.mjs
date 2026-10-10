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
 try{for(const [width,height] of [[400,464],[360,560],[360,740],[390,844],[1440,900]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  const requests=await installGeometryFixture(context,base);const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/cockpit/development/pillow');
  const history=page.getByTestId('pillow-message-history');
  await history.getByText('Historical layout fixture',{exact:true}).waitFor();
  if(width<=700) assert.equal(await page.getByTestId('pillow-composer').evaluate(el=>el===document.activeElement),false,'Mobile must open for reading without summoning the keyboard');
  if(width<=700&&height<=600){
   await page.getByRole('button',{name:'Open owner menu',exact:true}).click();
   assert.equal(await page.getByRole('navigation',{name:'Cockpit mobile menu',exact:true}).getByRole('link').count(),12);
   await page.getByRole('button',{name:'Close owner menu',exact:true}).click();
   const status=page.getByText('Status & evidence',{exact:true});
   await status.click();
   assert.equal(await page.getByText('NOT_BORN · Commerce locked',{exact:true}).last().isVisible(),true);
   await status.click();
  }
  const selector=page.getByLabel('Conversation history',{exact:true});
  assert.equal(await selector.locator('option').count(),2);
  await selector.selectOption({index:1});
  await history.getByText('Local layout fixture: show the review steps.',{exact:true}).waitFor();
  const jump=page.getByRole('button',{name:'Jump to latest',exact:true});
  await jump.waitFor();
  const jumpGeometry=await jump.evaluate(el=>({button:el.getBoundingClientRect().toJSON(),history:document.querySelector('[data-testid="pillow-message-history"]').getBoundingClientRect().toJSON(),footer:document.querySelector('[data-testid="pillow-composer-footer"]').getBoundingClientRect().toJSON()}));
  assert.ok(width<=700?jumpGeometry.button.bottom<=jumpGeometry.history.top:jumpGeometry.button.top>=jumpGeometry.history.bottom,JSON.stringify(jumpGeometry));
  assert.ok(jumpGeometry.button.bottom<=jumpGeometry.footer.top,JSON.stringify(jumpGeometry));
  await jump.click();
  await jump.waitFor({state:'hidden'});
  const geometry=await page.evaluate(()=>{
    const history=document.querySelector('[data-testid="pillow-message-history"]');
    const composer=document.querySelector('[data-testid="pillow-composer"]');
    return{width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,documentHeight:document.documentElement.scrollHeight,history:history.getBoundingClientRect().toJSON(),historyOverflow:getComputedStyle(history).overflowY,composer:composer.getBoundingClientRect().toJSON()};
  });
  assert.ok(geometry.documentWidth<=width+1,JSON.stringify(geometry));
  assert.ok(geometry.documentHeight<=geometry.height+2,JSON.stringify(geometry));
  assert.ok(geometry.history.height>=(width<=700?(height<=600?200:300):180),JSON.stringify(geometry));
  assert.equal(geometry.historyOverflow,'auto');assert.ok(geometry.history.right<=width,JSON.stringify(geometry));
  assert.ok(geometry.composer.bottom<=geometry.height-(width<=700&&height>600?54:0),JSON.stringify(geometry));
  if(height>600) assert.match(await page.getByRole('navigation',{name:'Breadcrumb',exact:true}).innerText(),/Pillow[\s\S]*Chat/);
  if(height>600) assert.equal(await page.getByRole('navigation',{name:width<=700?'Mobile quick navigation':'Owner navigation',exact:true}).getByRole('link',{name:width<=700?'CEO':'Pillow (CEO)',exact:true}).getAttribute('aria-current'),'page');
  await history.focus();await page.keyboard.press('End');
  await page.getByTestId('pillow-composer').fill('Unsent local draft');
  assert.equal(await page.getByTestId('pillow-composer').inputValue(),'Unsent local draft');
  await page.getByTestId('pillow-composer').fill('');
  assert.equal(requests.filter(r=>r.method==='POST'&&!['/api/pillow/session','/api/brain/dispatch'].includes(r.path)).length,0,JSON.stringify(requests));
  assert.equal(requests.filter(r=>r.path==='/api/pillow/chat').length,0,'History selection and unsent draft must never request inference');
  const readable=await history.locator('ol li').first().evaluate(el=>({color:getComputedStyle(el).color,marker:getComputedStyle(el,'::marker').color}));
  assert.equal(readable.color,'rgb(41, 67, 99)','saved response text must remain readable on the light owner surface');
  assert.equal(readable.marker,'rgb(41, 67, 99)','list numbering must remain readable');
  // Count actual complete text lines inside the scrollport, not just its box.
  async function readableLines(minimum){
   const item=history.locator('ol li').first();
   await item.evaluate(el=>{const pane=document.querySelector('[data-testid="pillow-message-history"]');pane.scrollTop+=el.getBoundingClientRect().top-pane.getBoundingClientRect().top-4;});
   const result=await history.evaluate(pane=>{
    const box=pane.getBoundingClientRect(), lines=new Set();
    for(const li of pane.querySelectorAll('ol li')){
     const walker=document.createTreeWalker(li,NodeFilter.SHOW_TEXT);
     while(walker.nextNode()){const range=document.createRange();range.selectNodeContents(walker.currentNode);for(const rect of range.getClientRects())if(rect.top>=box.top&&rect.bottom<=box.bottom)lines.add(Math.round(rect.top));}
    }
    return {lines:lines.size,font:getComputedStyle(pane.querySelector('ol li')).fontSize,height:box.height};
   });
   assert.ok(result.lines>=minimum,JSON.stringify(result));
   assert.equal(result.font,'16px');
   return result;
  }
  if(width<=700) console.log('Reading space',width,height,await readableLines(height<=600?6:8));
  if(process.env.WORK7_SCREENSHOTS){await mkdir(process.env.WORK7_SCREENSHOTS,{recursive:true});await page.screenshot({path:`${process.env.WORK7_SCREENSHOTS}/Pillow_reading_LOOPBACK_FIXTURE_${width}x${height}.png`});}
  const table=history.getByRole('region',{name:'Pillow response table',exact:true});
  await table.scrollIntoViewIfNeeded();
  assert.equal(await table.getByRole('columnheader').count(),2);
  assert.equal(await table.getByRole('cell',{name:'Customer value',exact:true}).count(),1);
  assert.equal(await table.getByRole('cell',{name:'<script>fixtureOnly()</script>',exact:true}).count(),1);
  assert.equal(await table.locator('script').count(),0,'Saved HTML must remain inert text');
  const tableGeometry=await table.evaluate(el=>({right:el.getBoundingClientRect().right,documentWidth:document.documentElement.scrollWidth,color:getComputedStyle(el.querySelector('td')).color}));
  assert.ok(tableGeometry.right<=width+1&&tableGeometry.documentWidth<=width+1,JSON.stringify(tableGeometry));
  assert.equal(tableGeometry.color,'rgb(41, 67, 99)');
  await table.focus();assert.equal(await table.evaluate(el=>el===document.activeElement),true);
  assert.deepEqual(errors,[]);
  if(process.env.WORK7_SCREENSHOTS){await mkdir(process.env.WORK7_SCREENSHOTS,{recursive:true});await page.screenshot({path:`${process.env.WORK7_SCREENSHOTS}/Pillow_table_LOOPBACK_FIXTURE_${width}x${height}.png`});}
  if(width<=700){
   // Emulate a keyboard that resizes only the visual viewport, as on mobile Chrome.
   await page.getByTestId('pillow-composer').focus();
   await page.evaluate(()=>{Object.defineProperty(window.visualViewport,'height',{configurable:true,get:()=>300});window.visualViewport.dispatchEvent(new Event('resize'));});
   await page.waitForFunction(()=>document.querySelector('[data-chat-compact="true"]'));
   const keyboard=await page.evaluate(()=>({history:document.querySelector('[data-testid="pillow-message-history"]').getBoundingClientRect().toJSON(),composer:document.querySelector('[data-testid="pillow-composer"]').getBoundingClientRect().toJSON(),font:getComputedStyle(document.querySelector('[data-testid="pillow-composer"]')).fontSize}));
   assert.ok(keyboard.history.height>=110,JSON.stringify(keyboard));
   assert.ok(keyboard.composer.bottom<=300,JSON.stringify(keyboard));
   assert.equal(keyboard.font,'16px');
   console.log('Keyboard reading space',width,height,await readableLines(3));
   if(process.env.WORK7_SCREENSHOTS)await page.screenshot({path:`${process.env.WORK7_SCREENSHOTS}/Pillow_keyboard_LOOPBACK_FIXTURE_${width}x${height}.png`});
   await page.evaluate(()=>{delete window.visualViewport.height;window.visualViewport.dispatchEvent(new Event('resize'));});
   await page.waitForFunction(()=>document.querySelector('[data-chat-keyboard="false"]'));
   // Also cover browsers whose layout viewport itself shrinks with the keyboard.
   await page.setViewportSize({width,height:300});
   await page.waitForFunction(()=>document.querySelector('[data-chat-tight="true"]'));
   await page.getByTestId('pillow-composer').fill('Unsent draft\nwith several lines\nto exercise the composer height cap');
   console.log('Resized viewport reading space',width,height,await readableLines(3));
   const resized=await page.getByTestId('pillow-composer').boundingBox();
   assert.ok(resized.y+resized.height<=300,JSON.stringify(resized));
   await page.getByTestId('pillow-composer').fill('');
   await page.setViewportSize({width,height});

  }
  await context.close();
 }}finally{await browser.close();}
});

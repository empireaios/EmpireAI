/** Focused regression for the owner's Android overlap. Loopback fixture only. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {installGeometryFixture} from './pillow-geometry-fixture.mjs';
const base=process.env.WORK7_TEST_URL??'http://127.0.0.1:3123';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
test('Other pages never covers historical chat controls across viewport resize',async()=>{
 const browser=await chromium.launch({executablePath:process.env.WORK7_CHROMIUM_PATH||undefined});
 try{for(const width of [344,320,390,400,1440]){
  const context=await browser.newContext({viewport:{width,height:740},hasTouch:width<=700});
  const requests=await installGeometryFixture(context,base);
  const page=await context.newPage();await page.goto(base+'/cockpit/development/pillow');
  const history=page.getByTestId('pillow-message-history');await history.getByText('Historical layout fixture',{exact:true}).waitFor();
  const picker=page.getByRole(width<=700?'button':'combobox',{name:'Conversation history',exact:true});
  async function selectOlder(){if(width<=700){await picker.click();await page.getByTestId('conversation-picker-options').locator('li>button').first().click();}else await picker.selectOption({index:1});}
  await selectOlder();
  const jump=page.getByRole('button',{name:'Jump to latest',exact:true});await jump.waitFor();
  const other=page.getByText('Other pages',{exact:true}),status=page.getByText('Status & evidence',{exact:true});
  async function check(){
   const controls=[picker,status,jump,...(await other.isVisible()?[other]:[])];
   const boxes=await Promise.all(controls.map(c=>c.boundingBox()));
   for(let i=0;i<boxes.length;i++){const a=boxes[i];assert.ok(a&&a.width>0&&a.x>=0&&a.x+a.width<=width+1,JSON.stringify({width,a}));for(let j=i+1;j<boxes.length;j++){const b=boxes[j];assert.ok(!(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y),JSON.stringify({width,i,j,a,b}));}}
  }
  await check();
  if(width<=700){
   for(const height of [464,400,300,740]){
    await page.setViewportSize({width,height});await page.waitForFunction(h=>{const shell=document.querySelector('[data-chat-compact]');return shell?.dataset.chatCompact===String(h<=600)&&Math.abs(shell.getBoundingClientRect().height-h)<2;},height);await check();
    await other.click();await check();await other.click();
    await status.click();assert.ok(await page.getByText('NOT_BORN · Commerce locked',{exact:true}).last().isVisible());await status.click();
    await page.getByTestId('pillow-composer').fill('Unsent draft\nSecond line');
    const composer=await page.getByTestId('pillow-composer').boundingBox();assert.ok(composer.y+composer.height<=height+1,JSON.stringify(composer));
    await page.getByTestId('pillow-composer').fill('');
   }
   // Android can shrink only visualViewport while keeping the layout height.
   await page.evaluate(()=>{Object.defineProperty(window.visualViewport,'height',{configurable:true,get:()=>400});window.visualViewport.dispatchEvent(new Event('resize'));});
   await page.waitForFunction(()=>document.querySelector('[data-chat-keyboard="true"]'));
   await check();await other.click();await check();await other.click();
   await page.evaluate(()=>{delete window.visualViewport.height;window.visualViewport.dispatchEvent(new Event('resize'));});
   await page.waitForFunction(()=>document.querySelector('[data-chat-keyboard="false"]'));
  }
  await jump.click();await jump.waitFor({state:'hidden'});
  assert.equal(requests.filter(r=>r.path==='/api/pillow/chat').length,0);
  await context.close();
 }}finally{await browser.close();}
});

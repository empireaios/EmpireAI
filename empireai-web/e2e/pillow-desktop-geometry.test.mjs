/** Read-only geometry acceptance against a deployed Pillow page.
 * Run with PILLOW_BASE_URL and a privately created PILLOW_AUTH_STATE file.
 * No credentials are embedded; no conversation submissions are permitted.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import { installGeometryFixture } from './pillow-geometry-fixture.mjs';

test('Pillow has no permanent rail and keeps safe text/composer geometry after preference restoration', async () => {
  assert.ok(process.env.PILLOW_BASE_URL, 'Explicit approved deployment URL required');
  const offline = process.env.PILLOW_GEOMETRY_FIXTURE === '1';
  assert.ok(offline || process.env.PILLOW_AUTH_STATE, 'Private authenticated browser state required');
  const browser = await chromium.launch({executablePath:process.env.PILLOW_CHROMIUM_PATH || undefined});
  const context = await browser.newContext({ storageState: offline ? undefined : process.env.PILLOW_AUTH_STATE });
  const fixtureRequests = offline ? await installGeometryFixture(context, process.env.PILLOW_BASE_URL) : null;
  const evidence = [];
  let inferenceAttempted = false;
  await context.route('**/api/pillow/chat*', async route => {
    if (route.request().method() === 'POST') { inferenceAttempted = true; await route.abort(); }
    else await route.continue();
  });
  const page = await context.newPage();
  page.on('pageerror', error => console.error('Browser error:',error.message));
  const assertGeometry = async () => {
    await page.getByTestId('pillow-composer').waitFor();
    const result = await page.evaluate(() => {
      const nav = document.querySelector('aside[aria-label="Cockpit navigation"]');
      const workspace = document.querySelector('[data-testid="pillow-conversation-workspace"]');
      const history = document.querySelector('[data-testid="pillow-message-history"]');
      const composer = document.querySelector('[data-testid="pillow-composer"]');
      if (nav) throw new Error('Permanent sidebar must not mount on Pillow');
      const boundary = 0;
      const positions = [];
      const walker = document.createTreeWalker(workspace, NodeFilter.SHOW_TEXT);
      for (let text = walker.nextNode(); text; text = walker.nextNode()) {
        if (!text.textContent.trim() || text.parentElement.closest('details:not([open]) > :not(summary), textarea')) continue;
        const range = document.createRange();
        const first = text.textContent.search(/\S/);
        range.setStart(text, first); range.setEnd(text, first + 1);
        const rect = range.getBoundingClientRect();
        if (rect.width && rect.height) positions.push({ label: text.textContent.trim().slice(0, 35), left: rect.left });
      }
      const markers = [...history.querySelectorAll('ol > li, ul > li')].filter(li => li.parentElement.tagName === 'OL' || getComputedStyle(li).listStyleType !== 'none');
      for (const li of markers) positions.push({label:'list marker safety area', left:li.getBoundingClientRect().left - 32});
      const rect = composer.getBoundingClientRect();
      positions.push({label:'composer placeholder', left:rect.left + parseFloat(getComputedStyle(composer).paddingLeft)});
      return {boundary, workspace:workspace.getBoundingClientRect().toJSON(), composer:rect.toJSON(), height:innerHeight, documentHeight:document.documentElement.scrollHeight, history:history.getBoundingClientRect().toJSON(), width:innerWidth, positions, markers:markers.length};
    });
    evidence.push(result);
    assert.ok(result.history.height >= result.height * 0.70, 'History must use at least70% viewport: '+JSON.stringify(result.history));
    assert.ok(result.documentHeight <= result.height + 2, 'Desktop page must not scroll outside conversation');
    assert.ok(result.composer.bottom <= result.height, 'Composer remains visible');
    assert.ok(result.workspace.left >= result.boundary + 16, JSON.stringify(result));
    assert.ok(result.workspace.right <= result.width, 'Workspace must stay within content viewport');
    assert.ok(result.composer.right <= result.workspace.right, 'Composer aligned within workspace');
    assert.ok(result.markers > 0, 'This regression requires persisted numbered/list history; empty history is not passing evidence');
    for (const position of result.positions) assert.ok(position.left >= result.boundary + 16, JSON.stringify({boundary:result.boundary,...position}));
  };
  try {
    for (const width of [1024, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(new URL('/cockpit/development/pillow', process.env.PILLOW_BASE_URL).href);
      await page.getByTestId('pillow-composer').waitFor();
      const nav = page.getByRole('complementary', { name:'Cockpit navigation' });
      for (const state of ['expanded', 'collapsed']) {
        await page.evaluate(value => localStorage.setItem('empireai.cockpit.sidebarCollapsed',value), state === 'collapsed' ? '1' : '0');
        await page.reload();
        await page.getByTestId('pillow-composer').waitFor();
        assert.equal(await nav.count(),0);
        assert.equal(await page.getByRole('link',{name:'Back to Executive Home'}).getAttribute('href'),'/cockpit');
        await assertGeometry();
        if(process.env.PILLOW_GEOMETRY_OUTPUT){
          await fs.mkdir(process.env.PILLOW_GEOMETRY_OUTPUT,{recursive:true});
          await page.screenshot({path:`${process.env.PILLOW_GEOMETRY_OUTPUT}/${width}-${state}.png`});
        }
        await page.reload();
        await page.getByTestId('pillow-composer').waitFor();

        await assertGeometry();
      }
    }
    const input = page.getByTestId('pillow-composer');
    const initial = await input.boundingBox();
    assert.ok(initial.height <= 48, 'Empty composer must be compact');
    await input.fill('Line one\nLine two\nLine three\nLine four');
    const grown = await input.boundingBox();
    assert.ok(grown.height > initial.height, 'Multiline draft grows');
    await input.fill(Array.from({length:30},(_,i)=>`Long certification prompt line ${i}`).join('\n'));
    assert.ok((await input.boundingBox()).height <= 194, 'Long draft must stop growing');
    assert.ok(await input.evaluate(el => el.scrollHeight > el.clientHeight && getComputedStyle(el).overflowY === 'auto'), 'Long draft scrolls internally');
    await input.fill('');
    assert.ok((await input.boundingBox()).height <= 48, 'Cleared composer shrinks');
    await page.setViewportSize({width:390,height:844});
    await page.reload();
    await page.getByTestId('pillow-composer').waitFor();
    assert.equal(await page.getByRole('complementary',{name:'Cockpit navigation'}).isVisible(),false);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile page must not overflow horizontally');
    await page.getByText('Context ▸', {exact:true}).scrollIntoViewIfNeeded();
    assert.ok(await page.getByText('Context ▸', {exact:true}).isVisible(), 'Mobile context remains accessible');
    const composer = await page.getByTestId('pillow-composer').boundingBox();
    assert.ok(composer && composer.x >= 0 && composer.x + composer.width <= 390, 'Phone composer remains within viewport');
    if(process.env.PILLOW_GEOMETRY_OUTPUT)await page.screenshot({path:`${process.env.PILLOW_GEOMETRY_OUTPUT}/phone.png`,fullPage:true});
    const back = page.getByRole('link', {name:'Back to Executive Home'});
    await back.scrollIntoViewIfNeeded();
    assert.ok(await back.isVisible(), 'Phone Back control remains visible');
    await back.click();
    await page.waitForURL('**/cockpit', {timeout:10000}).catch(error => { throw new Error('Back navigation failed at '+page.url()+': '+error.message); });
    await page.goBack();
    await page.getByTestId('pillow-composer').waitFor();
    assert.equal(inferenceAttempted,false,'Geometry acceptance must not trigger paid inference');
  } finally {
    if(process.env.PILLOW_GEOMETRY_OUTPUT){
      await fs.mkdir(process.env.PILLOW_GEOMETRY_OUTPUT,{recursive:true});
      await page.screenshot({path:`${process.env.PILLOW_GEOMETRY_OUTPUT}/at-completion.png`,fullPage:true}).catch(()=>{});
      await fs.writeFile(`${process.env.PILLOW_GEOMETRY_OUTPUT}/geometry.json`,JSON.stringify({scope:offline?'OFFLINE_TRANSPORT_FIXTURE_NOT_PRODUCTION':'AUTHENTICATED_DEPLOYMENT',inferenceAttempted,fixtureRequests,evidence},null,2));
    }
    await context.close(); await browser.close();
  }
});

/** Read-only geometry acceptance against a deployed Pillow page.
 * Run with PILLOW_BASE_URL and a privately created PILLOW_AUTH_STATE file.
 * No credentials are embedded; no conversation submissions are permitted.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

test('Pillow text and composer stay beyond navigation through resize, toggle and refresh', async () => {
  assert.ok(process.env.PILLOW_BASE_URL, 'Explicit approved deployment URL required');
  assert.ok(process.env.PILLOW_AUTH_STATE, 'Private authenticated browser state required');
  const browser = await chromium.launch();
  const context = await browser.newContext({ storageState: process.env.PILLOW_AUTH_STATE });
  let inferenceAttempted = false;
  await context.route('**/api/pillow/chat*', async route => {
    if (route.request().method() === 'POST') { inferenceAttempted = true; await route.abort(); }
    else await route.continue();
  });
  const page = await context.newPage();
  const assertGeometry = async () => {
    await page.getByTestId('pillow-composer').waitFor();
    const result = await page.evaluate(() => {
      const nav = document.querySelector('aside[aria-label="Cockpit navigation"]');
      const workspace = document.querySelector('[data-testid="pillow-conversation-workspace"]');
      const history = document.querySelector('[data-testid="pillow-message-history"]');
      const composer = document.querySelector('[data-testid="pillow-composer"]');
      const boundary = nav.getBoundingClientRect().right;
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
      return {boundary, workspace:workspace.getBoundingClientRect().toJSON(), composer:rect.toJSON(), width:innerWidth, positions, markers:markers.length};
    });
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
        if (await nav.getAttribute('data-sidebar-state') !== state) {
          await page.getByRole('button', {name:state === 'expanded' ? 'Expand sidebar' : 'Collapse sidebar',exact:true}).click();
        }
        await assertGeometry();
        await page.reload();
        await page.getByTestId('pillow-composer').waitFor();
        await page.waitForFunction(expected => document.querySelector('aside[aria-label="Cockpit navigation"]')?.dataset.sidebarState === expected, state);
        await assertGeometry();
      }
    }
    await page.setViewportSize({width:390,height:844});
    await page.reload();
    await page.getByTestId('pillow-composer').waitFor();
    assert.equal(await page.getByRole('complementary',{name:'Cockpit navigation'}).isVisible(),false);
    const composer = await page.getByTestId('pillow-composer').boundingBox();
    assert.ok(composer && composer.x >= 0 && composer.x + composer.width <= 390, 'Phone composer remains within viewport');
    assert.equal(inferenceAttempted,false,'Geometry acceptance must not trigger paid inference');
  } finally { await context.close(); await browser.close(); }
});

// Actual mobile browser -> Next BFF -> real login/session middleware -> persisted fixture.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, createWriteStream } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root=resolve(fileURLToPath(new URL('../..',import.meta.url)));
const output=resolve(root,'commerce-browser-evidence');
mkdirSync(output,{recursive:true});
const children=[];
function start(name,args,cwd,extra={}) {
  const log=createWriteStream(resolve(output,name+'.log'));
  const child=spawn(process.execPath,args,{cwd,env:{...process.env,...extra},detached:true,stdio:['ignore','pipe','pipe']});
  child.stdout.pipe(log); child.stderr.pipe(log); children.push(child); return child;
}
function stop(child) { if(child.exitCode===null) {try{process.kill(-child.pid,'SIGTERM');}catch{}} }
async function ready(url,status,child) {
  const deadline=Date.now()+90_000;
  while(Date.now()<deadline) {
    if(child.exitCode!==null) throw new Error('Server exited before readiness: '+url);
    try{if((await fetch(url,{signal:AbortSignal.timeout(2000)})).status===status)return;}catch{}
    await new Promise(resolve=>setTimeout(resolve,500));
  }
  throw new Error('Bounded readiness timeout: '+url);
}
let browser;
try {
  const backend=start('backend',['--import','tsx','scripts/serve-offline-commerce.ts'],resolve(root,'backend'));
  await ready('http://127.0.0.1:4100/auth/me',401,backend);
  const web=start('web',['node_modules/next/dist/bin/next','dev','--webpack','--hostname','127.0.0.1','--port','3100'],
    resolve(root,'empireai-web'),{BRAIN_API_URL:'http://127.0.0.1:4100',NEXT_TELEMETRY_DISABLED:'1'});
  await ready('http://127.0.0.1:3100/login',200,web);
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1' ? route.continue() : route.abort());
  assert.equal((await page.request.get('http://127.0.0.1:3100/api/owner/overview')).status(),401);
  await page.goto('http://127.0.0.1:3100/cockpit');
  await page.waitForURL('**/login?next=*');
  await page.getByLabel('Email',{exact:true}).fill('offline-owner@example.test');
  await page.getByLabel('Password',{exact:true}).fill('offline-browser-only');
  const overview=page.waitForResponse(r=>r.url().includes('/api/owner/overview') && r.status()===200,{timeout:60_000});
  await page.getByRole('button',{name:'Enter EmpireAI'}).click();
  const saved=await (await overview).json();
  assert.equal(saved.mode,'HISTORICAL_PROVIDER_EVIDENCE');
  assert.equal(saved.authority.approvalAllowed,false);
  await page.getByRole('heading',{name:'Executive Home',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:resolve(output,'phone-home.png'),fullPage:true});
  const nav=page.getByRole('navigation',{name:'Owner navigation'});
  await nav.getByRole('link',{name:'Commerce',exact:true}).click();
  await page.getByRole('heading',{name:'Products',exact:true}).waitFor();
  await page.getByLabel('Show stage',{exact:true}).selectOption('qualified');
  await page.getByText('No products in this stage.',{exact:true}).waitFor();
  await page.getByLabel('Show stage',{exact:true}).selectOption('REJECT');
  await page.getByRole('link',{name:'Review mirror',exact:true}).click();
  await page.getByRole('heading',{name:'Pillow: reject',exact:true}).waitFor();
  assert.match(await page.locator('body').innerText(),/US\$52\.25/);
  assert.match(await page.locator('body').innerText(),/12273/);
  assert.match(await page.locator('body').innerText(),/SUPPLIER_SHIPPED_PRODUCT/);
  assert.match(await page.locator('body').innerText(),/Projected profit \/ margin\s+Unknown/);
  assert.equal(await page.getByRole('button',{name:'Approve — locked',exact:true}).isDisabled(),true);
  await page.getByText('Inspect evidence',{exact:true}).click();
  assert.match(await page.locator('body').innerText(),/SHA-256/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.notEqual(await nav.evaluate(el=>getComputedStyle(el).position),'fixed');
  await page.screenshot({path:resolve(output,'phone-product.png'),fullPage:true});
  assert.equal((await page.request.post('http://127.0.0.1:3100/api/owner/overview')).status(),405);
  assert.equal((await page.request.get('http://127.0.0.1:3100/api/owner/overview?workspaceId=other')).status(),400);
  const response=page.waitForResponse(r=>r.url().includes('/api/commerce/transactions?') && r.status()===200,{timeout:60_000});
  await nav.getByRole('link',{name:'Orders',exact:true}).click();
  const payload=await (await response).json();
  assert.equal(payload.evidenceMode,'OFFLINE_FIXTURE');
  assert.equal(payload.realCommerceVerified,false);
  assert.equal(payload.transactions.length,1);
  assert.equal(payload.transactions[0].simulated.economics.actual.realisedContributionUsd,15.95);
  assert.deepEqual(payload.transactions[0].simulated.supplierCredits,{issuedCents:320,cashReceivedCents:320,outstandingCents:0});
  await page.getByRole('heading',{name:'Transaction lifecycle',exact:true}).waitFor();
  await page.getByText('Cancellation: DECLINED',{exact:true}).waitFor();
  await page.getByText('Outstanding supplier credit: US$0.00',{exact:true}).waitFor();
  assert.match(await page.locator('body').innerText(),/Nonproduction evidence/);
  await page.getByRole('heading',{name:'Historical provider observations'}).waitFor();
  assert.match(await page.locator('body').innerText(),/CJYD3209759/);
  assert.match(await page.locator('body').innerText(),/18 variants at US\$11\.28 each/);
  assert.match(await page.locator('body').innerText(),/freight skipped, landed cost and profit unknown/);
  assert.match(await page.locator('body').innerText(),/not BUYABLE/);
  assert.match(await page.locator('body').innerText(),/Not linked to a transaction/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,'phone page overflows');
  await page.getByText('Accounting and source evidence',{exact:true}).click();
  await page.screenshot({path:resolve(output,'phone-transaction.png'),fullPage:true});
  assert.equal((await page.request.get('http://127.0.0.1:3100/api/commerce/transactions?workspaceId=other')).status(),400);
  assert.equal((await page.request.post('http://127.0.0.1:3100/api/auth/logout')).status(),200);
  assert.equal((await page.request.get('http://127.0.0.1:3100/api/commerce/transactions')).status(),401);
  assert.equal((await page.request.get('http://127.0.0.1:3100/api/owner/overview')).status(),401);
  await page.reload();
  await page.waitForURL('**/login?next=*');
  assert.deepEqual(errors,[],'browser runtime errors');
  writeFileSync(resolve(output,'receipt.json'),JSON.stringify({evidenceMode:'OFFLINE_FIXTURE',
    sourceHead:process.env.GITHUB_SHA??'local',terminalRejectionVisible:true,productStageFilterVerified:true,ownerHomeProductsEvidenceJourney:true,ownerHistoricalProviderSnapshot:true,approvalLocked:true,ownerApiWriteDenied:true,browserLogin:true,phoneViewport:[390,844],
    bffBackendDiskReadback:true,realAuthMiddleware:true,sessionBackend:'isolated in-memory',
    logoutRevokesSession:true,foreignWorkspaceQueryRefused:true,providerAuthenticity:false,
    transactionKey:payload.transactions[0].transactionKey,realisedFixtureContributionUsd:15.95,
    authorityChanged:false,productionTouched:false},null,2));
  console.log('PASS: real phone browser, login/session, BFF, persisted integrated transaction and logout; fixtures only');
} finally {
  await browser?.close();
  for(const child of children)stop(child);
}

// Production acceptance through normal login. No inference, credential output or stored auth state.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin='https://empire-ai.co';
const out=process.argv[2];assert.ok(out);
const auth=await fetch(origin+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:process.env.FOUNDER_EMAIL,password:process.env.FOUNDER_PASSWORD})});
assert.equal(auth.status,200);
const cookie=auth.headers.getSetCookie().map(x=>x.split(';')[0]).find(x=>x.startsWith('empireai_session='));assert.ok(cookie);
const evidence={at:new Date().toISOString(),loginStatus:auth.status,paidRequests:0,viewports:[],denials:[]};
const proxyUrl=process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : null;
const proxy=proxyUrl ? {server:proxyUrl.protocol+'//'+proxyUrl.host,username:decodeURIComponent(proxyUrl.username),password:decodeURIComponent(proxyUrl.password)} : undefined;
const browser=await chromium.launch({proxy,executablePath:'/workspace/scratch/f9131502d532/geometry-browser/chromium'});
const context=await browser.newContext();
// Relay authentic production responses through Node's configured CA trust; never disable TLS verification.
await context.route('**/*',async route=>{
 const request=route.request(),u=new URL(request.url());
 if(u.origin!==origin){await route.abort();return;}
 if(request.method()==='POST'&&u.pathname.startsWith('/api/pillow/chat')){evidence.paidRequests++;await route.abort();return;}
 try{const headers=await request.allHeaders();delete headers.host;delete headers['content-length'];
 const upstream=await fetch(request.url(),{method:request.method(),headers,body:['GET','HEAD'].includes(request.method())?undefined:request.postDataBuffer(),redirect:'manual',signal:AbortSignal.timeout(60000)});
 const responseHeaders=Object.fromEntries(upstream.headers);delete responseHeaders['content-encoding'];delete responseHeaders['content-length'];
 await route.fulfill({status:upstream.status,headers:responseHeaders,body:Buffer.from(await upstream.arrayBuffer())});
 }catch{await route.abort();}
});
evidence.transport='Actual production responses; TLS-verified Node relay using environment CA';
await context.addCookies([{name:'empireai_session',value:cookie.slice('empireai_session='.length),domain:'empire-ai.co',path:'/',httpOnly:true,secure:true,sameSite:'Lax'}]);
await context.route('**/api/pillow/chat*',async route=>{if(route.request().method()==='POST'){evidence.paidRequests++;await route.abort();}else await route.continue();});
const page=await context.newPage();
try{
 await fs.mkdir(out,{recursive:true});
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:width===390?844:900});
  await page.goto(origin+'/cockpit/development/pillow');
  evidence.renderedRevisions ??= []; const rv=await fetch(origin+'/api/owner/runtime',{headers:{cookie},signal:AbortSignal.timeout(30000)}); evidence.renderedRevisions.push(await rv.json());
  const composer=page.getByTestId('pillow-composer');await composer.waitFor({timeout:45000});
  const history=page.getByTestId('pillow-message-history');
  await page.waitForFunction(()=>document.querySelector('[data-testid="pillow-message-history"]')?.textContent.includes('Saved history'),{timeout:30000});
  const before=await history.innerText();assert.ok(before.length>100);
  await composer.fill('Unsent acceptance draft');await composer.fill('');
  const geometry=await page.evaluate(()=>{const c=document.querySelector('[data-testid="pillow-composer"]').getBoundingClientRect();const h=document.querySelector('[data-testid="pillow-message-history"]').getBoundingClientRect();return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,composer:{x:c.x,right:c.right,height:c.height},historyHeight:h.height,railCount:document.querySelectorAll('aside[aria-label="Cockpit navigation"]').length};});
  assert.ok(geometry.scrollWidth<=width);assert.equal(geometry.railCount,0);assert.ok(geometry.composer.x>=0&&geometry.composer.right<=width);assert.ok(geometry.composer.height<=48);
  await page.reload();await composer.waitFor();await page.waitForFunction(()=>document.querySelector('[data-testid="pillow-message-history"]')?.textContent.includes('Saved history'),{timeout:30000});
  assert.equal(await history.innerText(),before);
  const back=page.getByRole('link',{name:'Back to Executive Home'});await back.click();await page.waitForURL('**/cockpit');await page.goBack();await composer.waitFor();
  const summary=page.locator('summary').filter({hasText:'Status & context'});if(await summary.count()){await summary.click();await page.getByTestId('pillow-verification-status').waitFor();evidence.statusText=await page.getByTestId('pillow-verification-status').innerText();}
  await page.screenshot({path:out+'/'+width+'.png',fullPage:true});
  await composer.scrollIntoViewIfNeeded();await composer.focus();await page.screenshot({path:out+'/'+width+'-composer.png'});
  evidence.viewports.push({...geometry,historyReloadEqual:true,backNavigation:true});
 }
 const runtime=await fetch(origin+'/api/owner/runtime',{headers:{cookie}});evidence.runtime=await runtime.json();assert.equal(runtime.status,200);assert.equal(evidence.runtime.birth,'NOT_BORN');assert.equal(evidence.runtime.commerce,'LOCKED');
 assert.equal(evidence.paidRequests,0);
 evidence.result='PASS';
}catch(e){evidence.result='FAIL';evidence.error=String(e);await page.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});process.exitCode=1;}
finally{await browser.close();await fetch(origin+'/api/auth/logout',{method:'POST',headers:{cookie},signal:AbortSignal.timeout(20000)}).catch(()=>{});await fs.writeFile(out+'/evidence.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));}

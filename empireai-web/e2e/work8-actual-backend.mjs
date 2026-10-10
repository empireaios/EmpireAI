/** Isolated actual browser -> Next BFF -> candidate Fastify. No business API mocks. */
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createInterface} from 'node:readline';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
const web=process.cwd(),backend=resolve(process.env.WORK8_BACKEND_ROOT??'../../backend/backend');
const launcher=process.env.WORK8_INCOMING_ONLY_LAUNCHER;assert.ok(launcher,'Incoming-only seccomp launcher required');
const root=mkdtempSync(join(tmpdir(),'work8-owner-integration-')),out=resolve(process.env.WORK8_OWNER_QA_OUT??'../docs/work8/actual-owner');mkdirSync(out,{recursive:true});mkdirSync(join(root,'commissioning'));
const base='http://localhost:3128',api='http://127.0.0.1:3148',revision=execFileSync('git',['rev-parse','HEAD'],{cwd:backend,encoding:'utf8'}).trim();
const env={PATH:process.env.PATH,NODE_ENV:'test',FOUNDER_EMAIL:'owner@example.invalid',RAILWAY_VOLUME_MOUNT_PATH:root,DATABASE_PATH:join(root,'legacy.sqlite'),EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',EMPIRE_ENGINEERING_TEST_MODE:'true',INTELLIGENCE_DISABLED:'true',LOG_LEVEL:'fatal',CORS_ORIGIN:base,RAILWAY_GIT_COMMIT_SHA:revision};
const imp=p=>JSON.stringify(join(backend,p));const documents=resolve(backend,'../docs/work8');
const source=`import Fastify from ${imp('node_modules/fastify/fastify.js')};
import cookie from ${imp('node_modules/@fastify/cookie/plugin.js')};
import {registerFinancialCentre} from ${imp('src/finance/runtime.ts')};
import {registerGovernedCommerce,productionCommerce} from ${imp('src/runtime/commerce-runtime/governed/runtime.ts')};
import {productionIntelligence} from ${imp('src/intelligence/store.ts')};
import {createAuthMiddleware} from ${imp('src/auth/middleware.ts')};
import {InMemorySessionStore} from ${imp('src/auth/session-store.ts')};
import {installLockedCommissioning} from ${imp('src/runtime/locked-commissioning.ts')};
import fs from 'node:fs';
globalThis.fetch=async()=>{throw Error('EXTERNAL_FETCH_FORBIDDEN')};
const app=Fastify(),sessions=new InMemorySessionStore();await app.register(cookie);
const auth=createAuthMiddleware(sessions);installLockedCommissioning(app);registerFinancialCentre(app,auth);registerGovernedCommerce(app,auth);
app.get('/auth/me',{preHandler:auth},async req=>({user:req.user}));
const user={id:'isolated-owner',email:'owner@example.invalid',name:'Isolated owner',role:'founder',workspaceId:'ws_empire_1'};
for(const file of ['source-authentic-readback.json','source-marketplace-readback.json']){const raw=JSON.parse(fs.readFileSync(${JSON.stringify(documents)}+'/'+file,'utf8'));for(const record of raw){const e=record.data;productionIntelligence().evidence(user.workspaceId,e);}}
const tokens={};for(const [key,u] of Object.entries({owner:user,foreign:{...user,workspaceId:'other'},admin:{...user,role:'admin'}}))tokens[key]=(await sessions.create(u)).token;
await app.listen({host:'127.0.0.1',port:3148});console.log(JSON.stringify(tokens));`;
writeFileSync(join(root,'server.mjs'),source);
writeFileSync(join(root,'fixture-config.json'),JSON.stringify(env));
writeFileSync(join(root,'bootstrap.mjs'),`import fs from 'node:fs';if(process.env.WORK8_KERNEL_EGRESS!=='CONNECT_DENIED_LISTEN_ALLOWED')throw Error('KERNEL_ISOLATION_REQUIRED');Object.assign(process.env,JSON.parse(fs.readFileSync(process.argv[2],'utf8')));await import('./server.mjs');`);
const guard=join(root,'local-connect-only.cjs');writeFileSync(guard,`const net=require('node:net');const original=net.Socket.prototype.connect;net.Socket.prototype.connect=function(...args){let a=args[0];if(Array.isArray(a))a=a[0];let host=typeof a==='object'?a.host:typeof args[1]==='string'?args[1]:'localhost';let port=typeof a==='object'?a.port:a;if(!['localhost','127.0.0.1','::1',undefined].includes(host)||![3128,3148].includes(Number(port)))throw Error('NONLOCAL_CONNECT_FORBIDDEN');return original.apply(this,args)};const oldFetch=globalThis.fetch;globalThis.fetch=(input,options)=>{const u=new URL(typeof input==='string'||input instanceof URL?input:input.url);if(!['localhost','127.0.0.1'].includes(u.hostname)||![3128,3148].includes(Number(u.port)))throw Error('NONLOCAL_FETCH_FORBIDDEN');return oldFetch(input,options)};`);

let child,next,browser,tokens;const checks=[],log=[],blocked=[];
async function start(){child=spawn('python',[launcher,process.execPath,'--import',join(backend,'node_modules/tsx/dist/loader.mjs'),join(root,'bootstrap.mjs'),join(root,'fixture-config.json')],{cwd:root,env,stdio:['ignore','pipe','pipe']});child.stderr.on('data',x=>log.push(String(x)));const lines=createInterface({input:child.stdout});const line=await Promise.race([once(lines,'line').then(([s])=>s),once(child,'exit').then(()=>{throw Error(log.join(''))})]);tokens=JSON.parse(line);lines.close();}
async function stop(){if(child&&child.exitCode===null){child.kill();await once(child,'exit');}}
async function req(path,method='GET',body,who='owner',origin=base){const r=await fetch(base+path,{method,headers:{...(who?{cookie:'empireai_session='+tokens[who]}:{}),origin,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,body:await r.json()};}
async function banner(page){await page.evaluate(()=>{const el=document.createElement('div');el.textContent='LOCAL ISOLATED EXAM · Retained source observations / simulated orders · NOT PRODUCTION';el.style.cssText='background:#271d08;color:#ffe6a6;padding:12px;font:14px sans-serif';document.body.prepend(el);});}
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
try{
 await start();
 next=spawn(process.execPath,[resolve(web,'../node_modules/next/dist/bin/next'),'dev','--webpack','--hostname','127.0.0.1','--port','3128'],{cwd:web,env:{PATH:process.env.PATH,NODE_ENV:'development',BRAIN_API_URL:api,NEXT_TELEMETRY_DISABLED:'1',NODE_OPTIONS:'--require='+guard},stdio:['ignore','pipe','pipe']});next.stdout.on('data',x=>{log.push(String(x));process.stdout.write(String(x))});next.stderr.on('data',x=>{log.push(String(x));process.stderr.write(String(x))});
 let ready=false;for(let i=0;i<120;i++){try{if((await fetch(base+'/login',{signal:AbortSignal.timeout(1500)})).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}assert.ok(ready,'Next server ready');
 const ppath='/api/owner/commerce/portfolio?classification=ALL',cpath='/api/owner/commerce';
 for(const who of [null,'foreign','admin'])assert.equal((await req(ppath,'GET',undefined,who)).status,who===null?401:403);checks.push('Actual BFF auth: anonymous401 and foreign/admin403');
 assert.equal((await req(cpath,'POST',{action:'scenario',id:'isolated-owner-walkthrough'})).status,200);
 let task;for(let i=0;i<30;i++){const r=await req(cpath,'POST',{action:'advance',id:'isolated-owner-walkthrough'});assert.equal(r.status,200,JSON.stringify(r));task=r.body.task;if(task.status==='COMPLETE')break;assert.notEqual(task.status,'BLOCKED',JSON.stringify(task));}assert.equal(task.status,'COMPLETE');checks.push('Canonical isolated scenario completed through authenticated BFF commands');
 const portfolio=await req(ppath),commerce=await req(cpath);assert.equal(portfolio.status,200);assert.equal(commerce.status,200);
 assert.equal(portfolio.body.observedCandidates.products.length,10);assert.equal(portfolio.body.marketContext.observations.length,1);assert.equal(portfolio.body.marketContext.observations[0].price,18.99);assert.equal(commerce.body.birth,'NOT_BORN');assert.equal(commerce.body.commerce,'LOCKED');assert.equal(commerce.body.externalEffects,0);
 writeFileSync(join(out,'backend-readback.json'),JSON.stringify({portfolio:portfolio.body,commerce:commerce.body},null,2));
 browser=await chromium.launch({executablePath:process.env.WORK8_CHROMIUM_PATH??'/tmp/chromium',args:['--no-sandbox']});
 const screenshots=[];for(const width of [1440,390]){const ctx=await browser.newContext({viewport:{width,height:950}});await ctx.addCookies([{name:'empireai_session',value:tokens.owner,url:base,httpOnly:true,sameSite:'Lax'}]);await ctx.route('**/*',route=>{if(new URL(route.request().url()).origin!==base){blocked.push(new URL(route.request().url()).origin);return route.abort();}return route.continue();});const page=await ctx.newPage();
  const responsePromise=page.waitForResponse(r=>r.url().includes('/api/owner/commerce/portfolio')&&r.status()===200);await page.goto(base+'/cockpit/products');const actual=await (await responsePromise).json();assert.deepEqual(actual.observedCandidates,portfolio.body.observedCandidates);assert.deepEqual(actual.marketContext,portfolio.body.marketContext);
  for(const product of actual.observedCandidates.products)await page.getByText(product.title,{exact:true}).first().waitFor();await page.getByText(actual.marketContext.observations[0].title,{exact:true}).waitFor();assert.ok(await page.getByText(/18.99 USD/).count());assert.equal(await page.locator('main img').count(),0);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await banner(page);const pfile='portfolio-'+width+'.png';await page.screenshot({path:join(out,pfile),fullPage:true});screenshots.push(pfile);
  const orderResponse=page.waitForResponse(r=>new URL(r.url()).pathname===cpath&&r.status()===200);await page.goto(base+'/cockpit/orders');const orders=await (await orderResponse).json();assert.deepEqual(orders.simulatedFinancials,commerce.body.simulatedFinancials);await page.getByRole('button',{name:'Test order history',exact:true}).click();await page.getByRole('heading',{name:'Simulated order finances',exact:true}).waitFor();const finance=page.getByRole('region',{name:'Simulated order finances'});for(const m of orders.simulatedFinancials)for(const o of m.orders){const formatted=new Intl.NumberFormat('en-SG',{style:'currency',currency:o.currency,currencyDisplay:'code',minimumFractionDigits:o.minorUnitDigits,maximumFractionDigits:o.minorUnitDigits}).format(o.quotedRevenueMinor/10**o.minorUnitDigits);assert.ok(await finance.getByText(formatted,{exact:true}).count());}assert.ok(await finance.getByText('Settlement: Unknown',{exact:true}).count());assert.ok(await page.getByText(/SIMULATION/).count());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await banner(page);const ofile='orders-'+width+'.png';await page.screenshot({path:join(out,ofile),fullPage:true});screenshots.push(ofile);await ctx.close();checks.push(width+'px Portfolio/Orders actual BFF data equals verified backend projections, no overflow');
 }
 const before=hash(commerce.body.missions);await stop();await start();const after=await req(cpath);assert.equal(hash(after.body.missions),before);checks.push('Backend process restart preserves canonical receipts exactly');
 const candidateDigests={backendDiffSha256:hash(execFileSync('git',['diff','--binary','HEAD'],{cwd:backend,encoding:'utf8'})),frontendDiffSha256:hash(execFileSync('git',['diff','--binary','HEAD'],{cwd:web,encoding:'utf8'})),harnessSha256:createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex')};const receipt={candidateDigests,status:'PASS',scope:'ISOLATED_AUTHENTICATED_BROWSER_NEXT_BFF_ACTUAL_CANDIDATE_FASTIFY',at:new Date().toISOString(),backendRevision:revision,frontendRevision:execFileSync('git',['rev-parse','HEAD'],{cwd:web,encoding:'utf8'}).trim(),checks,sourceMode:'AUTHENTIC_RETAINED_OBSERVATIONS_NOT_PROVIDER_REFRESH',providerCredentials:false,productionAccess:false,externalEffects:0,paidInference:0,backendConnect:'DENIED_BY_REQUIRED_SECCOMP_LAUNCHER',frontendIsolation:'Clean fixture environment and JavaScript localhost/fixed-port guards; not a kernel IP filter',blockedBrowserOrigins:[...new Set(blocked)],portfolioDigest:hash(portfolio.body.observedCandidates),marketDigest:hash(portfolio.body.marketContext),missionDigest:before,screenshots};writeFileSync(join(out,'receipt.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
}catch(e){const failurePage=browser?.contexts().at(-1)?.pages().at(-1);if(failurePage){await failurePage.screenshot({path:join(out,'failure.png'),fullPage:true});writeFileSync(join(out,'failure.html'),await failurePage.content());}writeFileSync(join(root,'failure.log'),log.join(''));console.error(e);console.error('Diagnostics '+join(root,'failure.log'));process.exitCode=1;}finally{await browser?.close();await stop();if(next&&next.exitCode===null){next.kill();await once(next,'exit');}}

/** No-cost actual PR111 finance integration. Never accepts a hosted URL or production credentials. */
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createInterface} from 'node:readline';
import {once} from 'node:events';
import {chromium} from 'playwright';
const web=process.cwd(),backend=resolve(process.env.WORK7_BACKEND_ROOT??'../../EmpireAI-costs/backend');
const expected='e6d98fb57537c893c85afc552626235a38ba874c';
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:backend,encoding:'utf8'}).trim(),expected);
const root=mkdtempSync(join(tmpdir(),'work7-integration-')),base='http://localhost:3123',api='http://127.0.0.1:3140';
const env={PATH:process.env.PATH,NODE_ENV:'test',FOUNDER_EMAIL:'owner@example.invalid',RAILWAY_VOLUME_MOUNT_PATH:root,DATABASE_PATH:join(root,'legacy.sqlite'),EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',EMPIRE_ENGINEERING_TEST_MODE:'true',LOG_LEVEL:'fatal',CORS_ORIGIN:base,RAILWAY_GIT_COMMIT_SHA:expected};
const imp=p=>JSON.stringify(join(backend,p));
const source=`import Fastify from ${imp('node_modules/fastify/fastify.js')};
import cookie from ${imp('node_modules/@fastify/cookie/plugin.js')};
import {registerFinancialCentre} from ${imp('src/finance/runtime.ts')};
import {createAuthMiddleware} from ${imp('src/auth/middleware.ts')};
import {InMemorySessionStore} from ${imp('src/auth/session-store.ts')};
import {installLockedCommissioning} from ${imp('src/runtime/locked-commissioning.ts')};
globalThis.fetch=async()=>{throw Error('EXTERNAL_FETCH_FORBIDDEN')};
const app=Fastify(),sessions=new InMemorySessionStore();await app.register(cookie);
const auth=createAuthMiddleware(sessions);installLockedCommissioning(app);registerFinancialCentre(app,auth);
app.get('/auth/me',{preHandler:auth},async req=>({user:req.user}));
const user={id:'isolated-owner',email:'owner@example.invalid',name:'Isolated owner',role:'founder',workspaceId:'ws_empire_1'};
const tokens={};for(const [key,u] of Object.entries({owner:user,foreign:{...user,workspaceId:'other'},admin:{...user,role:'admin'},wrongEmail:{...user,email:'other@example.invalid'}}))tokens[key]=(await sessions.create(u)).token;
await app.listen({host:'127.0.0.1',port:3140});console.log(JSON.stringify(tokens));`;
writeFileSync(join(root,'server.mjs'),source);
let child,next,browser,ctx,tokens;const checks=[],log=[];
async function start(){child=spawn(process.execPath,['--import',join(backend,'node_modules/tsx/dist/loader.mjs'),join(root,'server.mjs')],{cwd:root,env,stdio:['ignore','pipe','pipe']});child.stderr.on('data',x=>log.push(String(x)));const lines=createInterface({input:child.stdout});const line=await Promise.race([once(lines,'line').then(([s])=>s),once(child,'exit').then(()=>{throw Error(log.join(''))})]);tokens=JSON.parse(line);lines.close();}
async function stop(){if(child&&child.exitCode===null){child.kill();await once(child,'exit');}}
async function request(path='/api/owner/finance',method='GET',data,identity='owner',origin=base){const r=await fetch(base+path,{method,headers:{...(identity?{cookie:'empireai_session='+tokens[identity]}:{}),'content-type':'application/json',origin},body:data===undefined?undefined:JSON.stringify(data)});return {status:r.status,body:await r.json()};}
async function snapshot(){const r=await request();assert.equal(r.status,200);return r.body;}
async function auth(){await ctx.clearCookies();await ctx.addCookies([{name:'empireai_session',value:tokens.owner,url:base,httpOnly:true,sameSite:'Lax'}]);}
try{
 await start();
 next=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3123'],{cwd:web,env:{PATH:process.env.PATH,NODE_ENV:'development',BRAIN_API_URL:api},stdio:['ignore','pipe','pipe']});next.stdout.on('data',x=>log.push(String(x)));next.stderr.on('data',x=>log.push(String(x)));
 for(let i=0;i<60;i++){try{if((await fetch(base+'/login')).ok)break;}catch{}await new Promise(r=>setTimeout(r,500));}
 const seed={id:'isolated-preserved-cost',type:'cost',data:{entityId:'isolated-charge',provider:'vercel',service:'Isolated synthetic historical charge',category:'TECHNOLOGY',classification:'VARIABLE',stage:'INVOICED',amountMicro:10000000,currency:'SGD',periodStart:'2026-10-01T00:00:00Z',periodEnd:'2026-11-01T00:00:00Z',invoiceNumber:'isolated-only',authenticity:'SYNTHETIC',evidence:[{kind:'INVOICE',reference:'isolated test only',sha256:'a'.repeat(64),observedAt:'2026-10-01T00:00:00Z'}],attribution:{project:'Isolated',environment:'test',workload:'fixture',purpose:'Preservation acceptance'}}};
 const seeded=await request('/api/owner/finance','POST',seed);assert.equal(seeded.status,200,JSON.stringify(seeded));
 const before=await snapshot();assert.equal(before.entries.length,1);checks.push('BFF actual backend synthetic journal baseline');
 browser=await chromium.launch({executablePath:process.env.WORK7_CHROMIUM_PATH||undefined});ctx=await browser.newContext({viewport:{width:390,height:844}});await auth();
 await ctx.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!==base)return route.abort();if(!u.pathname.startsWith('/api/')||['/api/auth/me','/api/owner/finance'].includes(u.pathname))return route.continue();return route.fulfill({status:503,json:{error:'Secondary service unavailable in isolated acceptance'}});});
 const page=await ctx.newPage();await page.goto(base+'/cockpit/cost-centre');await page.getByText('Manage cost categories',{exact:true}).click();
 await page.getByRole('button',{name:'Add category',exact:true}).click();await page.getByLabel('Category name',{exact:true}).fill('Isolated AI');await page.getByRole('button',{name:'Save category',exact:true}).click();await page.getByRole('button',{name:'Edit category · Isolated AI',exact:true}).waitFor();
 const created=await snapshot(),category=created.costDirectory.categories.find(c=>c.name==='Isolated AI');assert.ok(category);checks.push('Authenticated UI -> BFF -> actual backend create');
 await page.getByLabel('Assign vendor',{exact:true}).selectOption('openai');await page.getByLabel('Assigned category',{exact:true}).selectOption(category.id);
 const mappedResponse=page.waitForResponse(r=>r.url()===base+'/api/owner/finance'&&r.request().method()==='POST');await page.getByRole('button',{name:'Save vendor category',exact:true}).click();assert.equal((await mappedResponse).status(),200);
 await page.getByRole('button',{name:'Edit category · Isolated AI',exact:true}).click();await page.getByLabel('Category name',{exact:true}).fill('Isolated model usage');await page.getByRole('button',{name:'Save category',exact:true}).click();await page.getByRole('button',{name:'Edit category · Isolated model usage',exact:true}).waitFor();checks.push('UI vendor mapping and rename retain category identity');
 const priorRestart=await snapshot();await stop();await start();await auth();const restored=await snapshot();assert.deepEqual(restored.entries,priorRestart.entries);assert.deepEqual(restored.costDirectory,priorRestart.costDirectory);checks.push('Killed backend process / new process: exact journal and directory persistence');
 await page.reload();await page.getByText('Manage cost categories',{exact:true}).click();await page.getByRole('button',{name:'Edit category · Isolated model usage',exact:true}).click();await page.getByLabel('Archive category',{exact:true}).check();await page.getByRole('button',{name:'Save category',exact:true}).click();await page.getByRole('form',{name:'Cost category editor'}).waitFor({state:'hidden'});await page.getByLabel('Show archived categories',{exact:true}).check();await page.getByRole('button',{name:'Edit category · Isolated model usage',exact:true}).waitFor();
 const archived=await snapshot();assert.equal(archived.costDirectory.categories[0].archived,true);assert.equal(archived.costDirectory.mappings[0].categoryId,category.id);checks.push('UI archive survives reload and retains vendor mapping');
 const stale={id:'stale-attempt',type:'cost_category',data:{id:category.id,name:'Stale edit',description:'',archived:false,expectedRevision:category.revision}};
 assert.equal((await request('/api/owner/finance','POST',stale)).status,409);
 for(const who of [null,'foreign','admin','wrongEmail'])for(const method of ['GET','POST'])assert.equal((await request('/api/owner/finance',method,method==='POST'?stale:undefined,who)).status,who===null?401:403);
 assert.equal((await request('/api/owner/finance','POST',stale,'owner','https://foreign.invalid')).status,403);checks.push('Actual auth: anonymous401; foreign workspace/admin/wrong email403; wrong-origin403; stale revision409');
 const after=await snapshot();assert.deepEqual(after.entries,archived.entries);assert.deepEqual(after.entries.slice(0,before.entries.length),before.entries);assert.deepEqual(after.totals,before.totals);assert.deepEqual(after.kpis,before.kpis);assert.deepEqual(after.costs,before.costs);assert.equal(after.entries.length,5);checks.push('Failed writes add no entries; original entry content/financial totals/KPIs/costs preserved');
 for(const path of ['/api/listings/publish','/api/orders','/api/payments','/api/ads','/api/inventory','/api/refunds','/api/pillow/birth']){const r=await fetch(api+path,{method:'POST',headers:{authorization:'Bearer '+tokens.owner,'content-type':'application/json'},body:'{}'});assert.equal(r.status,423);const b=await r.json();assert.equal(b.birth,'NOT_BORN');assert.equal(b.commerce,'LOCKED');}checks.push('Seven actual locked-runtime effect routes423; NOT_BORN/LOCKED');
 await page.reload();await page.getByText('Manage cost categories',{exact:true}).click();await page.getByLabel('Show archived categories',{exact:true}).check();await page.getByRole('button',{name:'Edit category · Isolated model usage',exact:true}).waitFor();checks.push('Final authenticated browser reload verifies archived persisted category');
 const result={status:'PASS',scope:'ISOLATED_ACTUAL_FRONTEND_BFF_PR111_HTTP_BACKEND_NOT_HOSTED',frontend:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),backend:expected,at:new Date().toISOString(),checks,productionAccess:false,providerCalls:false,billableInfrastructure:false,baselineJournalCount:before.entries.length,finalJournalCount:after.entries.length};writeFileSync(process.env.WORK7_INTEGRATION_RECEIPT??join(root,'receipt.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}catch(e){console.error(e);writeFileSync(join(root,'failure.log'),log.join(''));console.error('Diagnostics: '+join(root,'failure.log'));process.exitCode=1;}finally{await browser?.close();await stop();if(next&&next.exitCode===null){next.kill();await once(next,'exit');}}

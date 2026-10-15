/** Focused continuation of Work8 media acceptance. Existing UI/BFF/auth/services; no live effects. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createInterface} from 'node:readline';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
const web=resolve(dirname(fileURLToPath(import.meta.url)),'..'),repo=resolve(web,'..'),backend=join(repo,'backend');
const out=join(repo,'commerce-browser-evidence','work8-media');mkdirSync(out,{recursive:true});
const root=mkdtempSync(join(tmpdir(),'work8-media-'));mkdirSync(join(root,'commissioning'));
const base='http://localhost:3138',api='http://127.0.0.1:3158';
const launcher=join(repo,'scripts/work8/incoming-only-exec.py');
const sha=b=>createHash('sha256').update(b).digest('hex');
const svg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><rect width="220" height="220" fill="#225577"/><text x="10" y="110" fill="white">Owner-directed test media</text></svg>');
writeFileSync(join(out,'owner-directed-test.svg'),svg);
// Original one-second color fixture, generated locally; no third-party media or external export.
const video=Buffer.from('GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGFOAZwEAAAAAAAJEEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHYTbuMU6uEElTDZ1OsggEeTbuMU6uEHFO7a1OsggIu7AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmsirXsYMPQkBNgI1MYXZmNjAuMTYuMTAwV0GNTGF2ZjYwLjE2LjEwMESJiECPQAAAAAAAFlSua8GuAQAAAAAAADjXgQFzxYjlaudTH7sigZyBACK1nIN1bmSIgQCGhVZfVlA5g4EBI+ODhAvrwgDgibCBELqBEJqBAhJUw2dAgHNzoGPAgGfImkWjh0VOQ09ERVJEh41MYXZmNjAuMTYuMTAwc3PaY8CLY8WI5WrnUx+7IoFnyKVFo4dFTkNPREVSRIeYTGF2YzYwLjMxLjEwMiBsaWJ2cHgtdnA5Z8ihRaOIRFVSQVRJT05Eh5MwMDowMDowMS4wMDAwMDAwMDAAH0O2dUCE54EAo6uBAACAgkmDQgAA8AD2ADgkHBhKAAAwYAAAEL///BCx/////yKs///+f8AAo5OBAMgAhgBAkpwAUAAAAyAAAEJAo5OBAZAAhgBAkpwATuAAAyAAAEJAo5OBAlgAhgBAkpwAUAAAAyAAAEJAo5OBAyAAhgBAkpwATUAAAyAAAEJAHFO7a5G7j7OBALeK94EB8YIBpPCBAw==','base64');writeFileSync(join(out,'owner-created-test.webm'),video);
const env={PATH:process.env.PATH,NODE_ENV:'test',FOUNDER_EMAIL:'owner@example.invalid',RAILWAY_VOLUME_MOUNT_PATH:root,DATABASE_PATH:join(root,'legacy.sqlite'),EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',EMPIRE_ENGINEERING_TEST_MODE:'true',INTELLIGENCE_DISABLED:'true',LOG_LEVEL:'fatal',CORS_ORIGIN:base};
const imp=p=>JSON.stringify(join(backend,p));
const server=`import fs from 'node:fs';
if(process.env.WORK8_KERNEL_EGRESS!=='CONNECT_DENIED_LISTEN_ALLOWED')throw Error('KERNEL_ISOLATION_REQUIRED');
Object.assign(process.env,JSON.parse(fs.readFileSync(process.argv[2],'utf8')));
globalThis.fetch=async()=>{throw Error('EXTERNAL_FETCH_FORBIDDEN')};
const {default:Fastify}=await import(${imp('node_modules/fastify/fastify.js')}),{default:cookie}=await import(${imp('node_modules/@fastify/cookie/plugin.js')});
const {registerGovernedCommerce,productionCommerce}=await import(${imp('src/runtime/commerce-runtime/governed/runtime.ts')});
const {createAuthMiddleware}=await import(${imp('src/auth/middleware.ts')}),{InMemorySessionStore}=await import(${imp('src/auth/session-store.ts')});
const {installLockedCommissioning}=await import(${imp('src/runtime/locked-commissioning.ts')});
const {GovernedCommerceEngine}=await import(${imp('src/runtime/commerce-runtime/governed/engine.ts')}),{acceptanceScenario}=await import(${imp('src/runtime/commerce-runtime/governed/scenario.ts')});
const app=Fastify(),sessions=new InMemorySessionStore();await app.register(cookie);const auth=createAuthMiddleware(sessions);installLockedCommissioning(app);registerGovernedCommerce(app,auth);app.get('/auth/me',{preHandler:auth},async req=>({user:req.user}));
const user={id:'isolated-owner',email:'owner@example.invalid',name:'Isolated owner',role:'founder',workspaceId:'ws_empire_1'},p={workspace:user.workspaceId,owner:user.id},c=productionCommerce();
const session=c.twin.transition(p,{id:'create',sessionId:'media',expectedVersion:0,action:'CREATE'}),f=acceptanceScenario(session.twinWorkspace,user.id,Date.now());
const receipt=new GovernedCommerceEngine(c.store).execute(f.actors.PROPOSER,{id:'research',missionId:'media-test',expectedVersion:0,command:f.steps[0].command});
const reference={sessionId:'media',missionId:receipt.missionId,receiptDigest:receipt.digest};
const asset={id:'test-media',url:'https://media.example.invalid/test.svg',kind:'IMAGE',sha256:${JSON.stringify(sha(svg))},sourceIdentity:'owner-directed-local-test',rightsEvidence:'Original local SVG created under owner test directive',rightsStatus:'OWNER_REVIEWED',provenance:'Synthetic test approval metadata; not personal owner attestation or supplier evidence'};
c.twinRuntime.media.command(p,{action:'PROPOSE',id:'proposal',reference,expectedVersion:0,instructions:'Exact media approval examination',assets:[asset,{...asset,id:'test-media-2'}],editingReceipt:'Local original test bytes; no Canva export'});
const tokens={};for(const [key,u]of Object.entries({owner:user,foreign:{...user,workspaceId:'other'},admin:{...user,role:'admin'}}))tokens[key]=(await sessions.create(u)).token;
await app.listen({host:'127.0.0.1',port:3158});console.log(JSON.stringify({tokens,reference}));`;
writeFileSync(join(root,'server.mjs'),server);writeFileSync(join(root,'env.json'),JSON.stringify(env));
const guard=join(root,'local-only.cjs');writeFileSync(guard,`const net=require('node:net'),old=net.Socket.prototype.connect;net.Socket.prototype.connect=function(...a){let x=Array.isArray(a[0])?a[0][0]:a[0];let h=typeof x==='object'?x.host:typeof a[1]==='string'?a[1]:'localhost';let p=typeof x==='object'?x.port:x;if(!['localhost','127.0.0.1','::1',undefined].includes(h)||![3138,3158].includes(Number(p)))throw Error('EXTERNAL_CONNECT_FORBIDDEN');return old.apply(this,a)};`);
let child,next,browser;const logs=[],checks=[],failures=[];let tokens,reference;
const manifestPaths=['backend/src/runtime/commerce-runtime/governed/runtime.ts','backend/src/runtime/commerce-runtime/governed/work8-twin-media.ts','backend/src/auth/middleware.ts','empireai-web/components/owner/work8/TwinMedia.tsx','empireai-web/components/owner/work8/TwinWorkspace.tsx','empireai-web/e2e/work8-media-native.mjs','scripts/work8/incoming-only-exec.py'];
const manifest=()=>manifestPaths.map(path=>({path,sha256:sha(readFileSync(join(repo,path)))}));
const before=manifest();
async function req(path,method='GET',body,who='owner'){const r=await fetch(base+path,{method,headers:{...(who?{cookie:'empireai_session='+tokens[who]}:{}),'content-type':'application/json',origin:base},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,body:await r.json()};}
async function view(){const r=await req('/api/owner/commerce/twin?sessionId=media');assert.equal(r.status,200);return r.body.records.find(r=>r.missionId===reference.missionId).media;}
async function command(action,extra={}){const m=await view();return req('/api/owner/commerce','POST',{action:'twin_media',media:{id:crypto.randomUUID(),action,reference,expectedVersion:m.version,...(['REQUEST_EDIT','PROPOSE'].includes(action)?{}:{batchDigest:m.proposal.batchDigest}),...extra}});}
async function check(name,fn){try{await fn();checks.push(name)}catch(e){failures.push({name,error:String(e)})}}
async function stop(p){
 if(!p||p.exitCode!==null||p.signalCode!==null)return;
 const waitExit=()=>new Promise(resolve=>{if(p.exitCode!==null||p.signalCode!==null)return resolve(true);const done=()=>{clearTimeout(timer);p.off('exit',done);resolve(true)},timer=setTimeout(()=>{p.off('exit',done);resolve(false)},5000);p.once('exit',done)});
 let exited=waitExit();p.kill('SIGTERM');if(await exited)return;
 exited=waitExit();p.kill('SIGKILL');if(!await exited)throw Error('MEDIA_CHILD_CLEANUP_TIMEOUT');
}
try{
 child=spawn('python3',[launcher,process.execPath,'--import',join(backend,'node_modules/tsx/dist/loader.mjs'),join(root,'server.mjs'),join(root,'env.json')],{cwd:root,env,stdio:['ignore','pipe','pipe']});child.stderr.on('data',x=>logs.push(String(x)));
 const lines=createInterface({input:child.stdout});const started=JSON.parse(await Promise.race([once(lines,'line').then(([x])=>x),once(child,'exit').then(()=>{throw Error(logs.join(''))}),new Promise((_,reject)=>setTimeout(()=>reject(Error('BACKEND_START_TIMEOUT')),60000))]));({tokens,reference}=started);lines.close();
 next=spawn(process.execPath,[join(web,'node_modules/next/dist/bin/next'),'dev','--webpack','--hostname','127.0.0.1','--port','3138'],{cwd:web,env:{PATH:process.env.PATH,NODE_ENV:'development',BRAIN_API_URL:api,NEXT_TELEMETRY_DISABLED:'1',NODE_OPTIONS:'--require='+guard},stdio:['ignore','pipe','pipe']});next.stdout.on('data',x=>logs.push(String(x)));next.stderr.on('data',x=>logs.push(String(x)));
 let ready=false;for(let i=0;i<120;i++){try{if((await fetch(base+'/login',{signal:AbortSignal.timeout(1500)})).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,500))}assert(ready,'NEXT_READY');
 for(const who of [null,'foreign','admin'])await check('Authenticated BFF refusal '+who,async()=>assert.equal((await req('/api/owner/commerce/twin?sessionId=media','GET',undefined,who)).status,who===null?401:403));
 await check('Authenticated premature external approval refused',async()=>assert.notEqual((await command('APPROVE_EXTERNAL')).status,200));
 await check('Authenticated forged receipt and version refused',async()=>{const m=await view();for(const patch of [{reference:{...reference,receiptDigest:'0'.repeat(64)}},{expectedVersion:9999}]){const r=await req('/api/owner/commerce','POST',{action:'twin_media',media:{id:crypto.randomUUID(),action:'APPROVE_INTERNAL',reference,expectedVersion:m.version,batchDigest:m.proposal.batchDigest,...patch}});assert.notEqual(r.status,200)}});
 browser=await chromium.launch({headless:true});
 for(const width of [1440,390]){
 const ctx=await browser.newContext({viewport:{width,height:950}});try{
 await ctx.addCookies([{name:'empireai_session',value:tokens.owner,url:base,httpOnly:true,sameSite:'Lax'}]);await ctx.addInitScript(()=>localStorage.setItem('empireai-twin:ws_empire_1:isolated-owner','media'));
 await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin===base)return r.continue();if(u.hostname==='media.example.invalid')return r.fulfill({contentType:'image/svg+xml',body:svg});return r.abort()});
 const page=await ctx.newPage();await page.goto(base+'/cockpit/products');const region=page.getByRole('region',{name:'Product media versions'});await region.waitFor({timeout:60000});
 await check('Unapproved/reapproved selection has no external approval '+width,async()=>{await region.getByRole('button',{name:width===1440?'Select and approve test-media':'Approve revised batch internally',exact:true}).click();await region.getByText('Approved internally; separate publication approval is outstanding.',{exact:true}).waitFor({timeout:20000});const m=await view();assert.equal(m.externalStatus,'NOT_SUBMITTED');assert.equal(m.current.assets.length,width===1440?1:2);assert(m.current.assets.every(a=>a.sha256===sha(svg)))});
 await check('Separate selected-version intercepted submission '+width,async()=>{await region.getByRole('button',{name:'Authorise simulated submission of selected version',exact:true}).click();await region.getByText(/simulated submission intercepted/).first().waitFor({timeout:20000});const m=await view();assert.equal(m.externalStatus,'SIMULATED_SUBMISSION_INTERCEPTED');assert(m.history.every(e=>e.externalEffects===0))});
 await check('Archive collapsed toggle preserves selected bytes '+width,async()=>{const a=region.locator('details').filter({has:page.getByText('Archive',{exact:true})});assert.equal(await a.getAttribute('open'),null);const selected=(await view()).current;await a.locator('summary').click();await a.locator('summary').click();assert.deepEqual((await view()).current,selected)});
 await check('Relevant media visible and no horizontal overflow '+width,async()=>{assert.equal(await region.locator('img').count(),width===1440?3:4);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))});
 await region.screenshot({path:join(out,'media-'+width+'.png')});
 }finally{await ctx.close()}}
 await check('Changed version invalidates approval and preserves archived original',async()=>{const old=await view(),assets=old.proposal.assets;assert.equal((await command('PROPOSE',{instructions:'New version',assets,editingReceipt:'Original permitted local bytes new version'})).status,200);const m=await view();assert.equal(m.externalStatus,'NOT_SUBMITTED');assert.notEqual(m.proposal.batchDigest,old.proposal.batchDigest);assert(m.history.some(e=>e.batchDigest===old.proposal.batchDigest));});
 await check('Pending edit invalidates applicable approval',async()=>{assert.equal((await command('APPROVE_INTERNAL')).status,200);assert.equal((await command('REQUEST_EDIT',{instructions:'Revise before any external submission',assetIds:['test-media']})).status,200);const r=await command('APPROVE_EXTERNAL',{assetIds:['test-media','test-media-2']});assert.notEqual(r.status,200,'Pending edit must require renewed internal approval; existing source gap must fail this gate')});
 await check('Rejected version cannot submit',async()=>{assert.equal((await command('REJECT')).status,200);assert.notEqual((await command('APPROVE_EXTERNAL')).status,200);assert.equal((await view()).externalStatus,'NOT_SUBMITTED')});
 // Separate image/video import and nonempty archive examination on the same authenticated canonical workflow.
 for(const width of [1440,390]){
  const ctx=await browser.newContext({viewport:{width,height:950}});try{
   await ctx.addCookies([{name:'empireai_session',value:tokens.owner,url:base,httpOnly:true,sameSite:'Lax'}]);await ctx.addInitScript(()=>localStorage.setItem('empireai-twin:ws_empire_1:isolated-owner','media'));
   await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin===base)return r.continue();if(u.hostname==='media.example.invalid')return r.fulfill({contentType:u.pathname.endsWith('.webm')?'video/webm':'image/svg+xml',headers:{'access-control-allow-origin':base},body:u.pathname.endsWith('.webm')?video:svg});return r.abort()});
   const page=await ctx.newPage();await page.goto(base+'/cockpit/products');const region=page.getByRole('region',{name:'Product media versions'});await region.waitFor({timeout:60000});
   await check('Authenticated image/video import, selection and durable archive '+width,async()=>{
    const before=await view(),importer=region.locator('details').filter({has:page.getByText('Import revised images or videos',{exact:true})});
    await importer.locator('summary').click();
    const identities=[{kind:'IMAGE',url:'https://media.example.invalid/import-'+width+'.svg',bytes:svg},{kind:'VIDEO',url:'https://media.example.invalid/import-'+width+'.webm',bytes:video}];
    for(const a of identities){
     await importer.getByLabel('Asset link',{exact:true}).fill(a.url);await importer.getByLabel('Media type',{exact:true}).selectOption(a.kind);
     await importer.getByLabel('Source or editing provider',{exact:true}).fill('Owner-created examination fixture');
     await importer.getByLabel('Usage-rights evidence',{exact:true}).fill('Original local test bytes under owner directive; no supplier licence claimed');
     await importer.getByLabel('I reviewed permission to use this exact asset.',{exact:true}).check();
     await importer.getByLabel('Origin and editing history',{exact:true}).fill('Original local test fixture, no Canva or third-party content');
     await importer.getByLabel('Asset SHA-256 checksum',{exact:true}).fill(sha(a.bytes));await importer.getByRole('button',{name:'Add asset to proposed batch',exact:true}).click();
    }
    assert.equal(await importer.getByRole('button',{name:'Remove',exact:true}).count(),2);
    await importer.getByLabel('Changes made',{exact:true}).fill('Owner-created image/video revision '+width);
    await importer.getByLabel('Editing receipt or provenance reference',{exact:true}).fill('Local fixture originals '+sha(svg)+' '+sha(video));
    const saved=page.waitForResponse(r=>r.url()===base+'/api/owner/commerce'&&r.request().method()==='POST');
    await importer.getByRole('button',{name:'Save revised batch for review',exact:true}).click();assert.equal((await saved).status(),200);
    await page.reload();await region.waitFor();const proposed=await view();assert.equal(proposed.version,before.version+1);assert.equal(proposed.current,null);assert.equal(proposed.externalStatus,'NOT_SUBMITTED');
    assert.deepEqual(proposed.proposal.assets.map(a=>({kind:a.kind,url:a.url,sha256:a.sha256})),identities.map(a=>({kind:a.kind,url:a.url,sha256:sha(a.bytes)})));
    const visibleVideo=region.locator('video').first();await visibleVideo.evaluate(v=>{v.muted=true;v.load()});await page.waitForFunction(()=>Array.from(document.querySelectorAll('video')).some(v=>v.readyState>=1&&v.videoWidth===16));
    assert.equal(await visibleVideo.evaluate(v=>v.videoWidth),16);
    const byteHashes=await page.evaluate(async urls=>Promise.all(urls.map(async url=>{const b=await (await fetch(url)).arrayBuffer();return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).map(x=>x.toString(16).padStart(2,'0')).join('')})),identities.map(a=>a.url));assert.deepEqual(byteHashes,identities.map(a=>sha(a.bytes)));
    await region.getByRole('button',{name:'Approve revised batch internally',exact:true}).click();await region.getByText('Approved internally; separate publication approval is outstanding.',{exact:true}).waitFor({timeout:20000});
    const approved=await view();assert.equal(approved.current.assets.length,2);assert.equal(approved.externalStatus,'NOT_SUBMITTED');
    const archive=region.locator('details').filter({has:page.getByText('Archive',{exact:true})});assert.equal(await archive.getAttribute('open'),null);await archive.locator('summary').click();
    assert(await archive.locator('article').count()>0);assert((await view()).history.some(e=>e.digest===before.proposal.digest));
    await archive.getByText('Version '+before.proposal.version+' · '+before.proposal.status,{exact:true}).first().waitFor();
    await archive.locator('summary').click();assert.deepEqual((await view()).current,approved.current);
    await page.reload();await region.waitFor();const restored=await view();assert.deepEqual(restored,approved);assert.equal(await region.locator('details').filter({has:page.getByText('Archive',{exact:true})}).getAttribute('open'),null);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await region.screenshot({path:join(out,'media-gallery-'+width+'.png')});
   });
  }finally{await ctx.close()}
 }
 writeFileSync(join(out,'final-media.json'),JSON.stringify(await view(),null,2));assert.deepEqual(manifest(),before,'Executed source changed during examination');
}catch(e){failures.push({name:'Harness execution',error:String(e),stack:e.stack})}finally{
 // Preserve examination facts even if a cleanup defect occurs; final receipt includes cleanup failures.
 writeFileSync(join(out,'checks-before-cleanup.json'),JSON.stringify({checks,failures,sourceManifest:before},null,2));
 if(browser)try{await browser.close()}catch(e){failures.push({name:'Browser cleanup',error:String(e)})}
 for(const p of [next,child])try{await stop(p)}catch(e){failures.push({name:'Process cleanup',error:String(e)})}
 writeFileSync(join(out,'server.log'),logs.join(''));
 writeFileSync(join(out,'receipt.json'),JSON.stringify({status:failures.length?'FAIL':'PASS',scope:'FOCUSED_A11_NATIVE_TWO_STAGE_EXAM_NOT_AUTOMATIC_FULL_45_PLUS_19_CERTIFICATION',checks,failures,sourceManifest:before,harnessSha256:sha(readFileSync(fileURLToPath(import.meta.url))),assetSha256:sha(svg),videoSha256:sha(video),externalEffects:0,paidInference:0,fixture:'Owner-directed original test media; synthetic principal/rights approval metadata, actual auth/session middleware. No genuine supplier or Canva claim.',limitations:['A9 software gallery/import/archive examined with owner-created bytes; genuine supplier journey remains separate','A10 actual Canva editing/export remains pending','No personal owner execution inferred','Existing source pending-edit gap is asserted, never waived'],completedAt:new Date().toISOString()},null,2));
}
if(failures.length)throw Error('A11 native examination failed; inspect commerce-browser-evidence/work8-media/receipt.json');

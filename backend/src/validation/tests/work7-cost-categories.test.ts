import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {FinancialCentre,productionFinance} from '../../finance/financial-centre.js';
import Fastify from 'fastify';
import {registerFinancialCentre} from '../../finance/runtime.js';
import {createAuthMiddleware} from '../../auth/middleware.js';
import {InMemorySessionStore} from '../../auth/session-store.js';
import {env} from '../../config/env.js';
import {installLockedCommissioning} from '../../runtime/locked-commissioning.js';
const category=(id='cat-ai',name='AI services',expectedRevision:string|null=null,archived=false)=>({id,name,description:'Owner directory only',expectedRevision,archived});
test('standalone categories survive reopen; edit/archive preserve original entries and monetary projection',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'work7-categories-'));const file=path.join(dir,'evidence.sqlite');let f=new FinancialCentre(file);
 try{
  const baseline=f.snapshot('owner');const create={id:'create-ai',type:'cost_category',data:category()};
  const original=f.append('owner','king',create);assert.deepEqual(f.append('owner','king',create),original);
  f.append('owner','king',{id:'map-ai',type:'provider_category',data:{provider:'openai',categoryId:'cat-ai',expectedRevision:null}});
  f.append('owner','king',{id:'rename-ai',type:'cost_category',data:category('cat-ai','Model usage','create-ai')});
  f.close();f=new FinancialCentre(file);
  assert.equal(f.snapshot('owner').costDirectory.categories[0]?.name,'Model usage');
  f.append('owner','king',{id:'archive-ai',type:'cost_category',data:category('cat-ai','Model usage','rename-ai',true)});
  const after=f.snapshot('owner');assert.deepEqual(after.entries[0],original);assert.deepEqual(after.totals,baseline.totals);assert.deepEqual(after.costs,baseline.costs);assert.deepEqual(after.providers,baseline.providers);
  assert.equal(after.costDirectory.mappings[0]?.categoryId,'cat-ai');assert.equal(after.costDirectory.categories[0]?.archived,true);
  assert.equal(f.snapshot('other').costDirectory.categories.length,0);
 }finally{f.close();fs.rmSync(dir,{recursive:true});}
});
test('category and mapping writes reject stale edits, duplicate names, absent vendors and archived targets',()=>{
 const f=new FinancialCentre(':memory:');try{
  f.append('owner','king',{id:'a',type:'cost_category',data:category()});
  const failures=[
   {id:'stale',type:'cost_category',data:category()},
   {id:'dup',type:'cost_category',data:category('another',' ai SERVICES ')},
   {id:'unknown',type:'provider_category',data:{provider:'missing',categoryId:'cat-ai',expectedRevision:null}},
   {id:'missing',type:'provider_category',data:{provider:'openai',categoryId:'missing',expectedRevision:null}},
  ];for(const c of failures)assert.throws(()=>f.append('owner','king',c));assert.equal(f.entries('owner').length,1);
  f.append('owner','king',{id:'m',type:'provider_category',data:{provider:'openai',categoryId:'cat-ai',expectedRevision:null}});
  assert.throws(()=>f.append('owner','king',{id:'stale-map',type:'provider_category',data:{provider:'openai',categoryId:null,expectedRevision:null}}),/MAPPING_REVISION_CONFLICT/);
  f.append('owner','king',{id:'archive',type:'cost_category',data:category('cat-ai','AI services','a',true)});
  assert.throws(()=>f.append('owner','king',{id:'archived-map',type:'provider_category',data:{provider:'vercel',categoryId:'cat-ai',expectedRevision:null}}),/ACTIVE_CATEGORY_REQUIRED/);
  f.append('owner','king',{id:'clear',type:'provider_category',data:{provider:'openai',categoryId:null,expectedRevision:'m'}});
  assert.equal(f.snapshot('owner').costDirectory.mappings[0]?.categoryId,null);
  assert.throws(()=>f.append('owner','king',{id:'a',type:'cost_category',data:category('cat-ai','Changed')}),/IDEMPOTENCY_CONFLICT/);
 }finally{f.close();}
});
test('real authenticated owner route saves categories while foreign identities and live effects remain denied',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'work7-category-route-'));
 const keys=['RAILWAY_VOLUME_MOUNT_PATH','EMPIRE_RUNTIME_PROFILE','EMPIRE_ENGINEERING_TEST_MODE'] as const;
 const previous=keys.map(k=>process.env[k]);process.env.RAILWAY_VOLUME_MOUNT_PATH=root;process.env.EMPIRE_RUNTIME_PROFILE='LOCKED_COMMISSIONING_V1';process.env.EMPIRE_ENGINEERING_TEST_MODE='true';
 const app=Fastify(),sessions=new InMemorySessionStore();installLockedCommissioning(app);registerFinancialCentre(app,createAuthMiddleware(sessions));
 const owner={id:'isolated-owner',email:env.FOUNDER_EMAIL,name:'Owner',role:'founder' as const,workspaceId:'ws_empire_1'};
 const payload={id:'route-category',type:'cost_category',data:category()};
 try{
  assert.equal((await app.inject({method:'POST',url:'/api/owner/finance',payload})).statusCode,401);
  for(const user of [{...owner,workspaceId:'foreign'},{...owner,email:'other@example.invalid'},{...owner,role:'admin' as const}]){
   const token=(await sessions.create(user)).token;
   assert.equal((await app.inject({method:'POST',url:'/api/owner/finance',headers:{authorization:'Bearer '+token},payload})).statusCode,403);
  }
  const token=(await sessions.create(owner)).token,headers={authorization:'Bearer '+token};
  assert.equal((await app.inject({method:'POST',url:'/api/owner/finance',headers:{...headers,origin:'https://evil.invalid'},payload})).statusCode,403);
  const result=await app.inject({method:'POST',url:'/api/owner/finance',headers,payload});assert.equal(result.statusCode,200);assert.equal(result.json().receipt.id,payload.id);
  const read=await app.inject({url:'/api/owner/finance',headers});assert.equal(read.statusCode,200);assert.equal(read.json().costDirectory.categories[0].name,'AI services');
  for(const url of ['/api/listings/publish','/api/orders','/api/payments','/api/ads','/api/inventory','/api/refunds','/api/pillow/birth'])assert.equal((await app.inject({method:'POST',url,headers,payload:{}})).statusCode,423);
 }finally{await app.close();productionFinance().close();keys.forEach((k,i)=>{if(previous[i]===undefined)delete process.env[k];else process.env[k]=previous[i];});fs.rmSync(root,{recursive:true});}
});

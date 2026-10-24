import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import Fastify from 'fastify';
import {registerFinancialCentre} from '../../finance/runtime.js';import {productionFinance,hash} from '../../finance/financial-centre.js';
import {createAuthMiddleware} from '../../auth/middleware.js';import {InMemorySessionStore} from '../../auth/session-store.js';import {env} from '../../config/env.js';import {installLockedCommissioning} from '../../runtime/locked-commissioning.js';
test('authenticated isolated birth command cannot choose workspace or change actual journal; seven live effects stay denied',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'birth-route-')),old={RAILWAY_VOLUME_MOUNT_PATH:process.env.RAILWAY_VOLUME_MOUNT_PATH,EMPIRE_RUNTIME_PROFILE:process.env.EMPIRE_RUNTIME_PROFILE,EMPIRE_ENGINEERING_TEST_MODE:process.env.EMPIRE_ENGINEERING_TEST_MODE};
 Object.assign(process.env,{RAILWAY_VOLUME_MOUNT_PATH:dir,EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',EMPIRE_ENGINEERING_TEST_MODE:'true'});
 const app=Fastify(),sessions=new InMemorySessionStore();installLockedCommissioning(app);registerFinancialCentre(app,createAuthMiddleware(sessions));
 try{
  const owner={id:'owner',email:env.FOUNDER_EMAIL,name:'Owner',role:'founder' as const,workspaceId:'ws_empire_1'},token=(await sessions.create(owner)).token,headers={authorization:'Bearer '+token};
  const payload={type:'work8_birth_rehearsal',periodId:'rehearsal-1',cutoff:'2026-01-01T00:00:00Z',confirmation:'ISOLATED_ONLY'};
  assert.equal((await app.inject({method:'POST',url:'/api/owner/finance',payload})).statusCode,401);
  const before=hash(productionFinance().entries('ws_empire_1'));
  assert.equal((await app.inject({method:'POST',url:'/api/owner/finance',headers:{...headers,origin:'https://evil.invalid'},payload})).statusCode,403);
  assert.equal((await app.inject({method:'POST',url:'/api/owner/finance',headers,payload:{...payload,workspace:'ws_empire_1'}})).statusCode,409);
  const response=await app.inject({method:'POST',url:'/api/owner/finance',headers,payload});assert.equal(response.statusCode,200);assert.equal(response.json().receipt.liveActivation,false);assert.equal(hash(productionFinance().entries('ws_empire_1')),before);
  for(const url of ['/api/listings/publish','/api/orders','/api/payments','/api/ads','/api/inventory','/api/refunds','/api/pillow/birth'])assert.equal((await app.inject({method:'POST',url,headers,payload:{}})).statusCode,423);
 }finally{await app.close();productionFinance().close();for(const [k,v] of Object.entries(old))if(v===undefined)delete process.env[k];else process.env[k]=v;fs.rmSync(dir,{recursive:true,force:true});}
});

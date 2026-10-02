import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import Fastify from 'fastify';
import { readCommissioningAccounting, registerOwnerCommissioningReadback } from '../../runtime/owner-commissioning-readback.js';
import { InMemorySessionStore } from '../../auth/session-store.js';
import { createAuthMiddleware } from '../../auth/middleware.js';
import { env } from '../../config/env.js';

test('existing ledger snapshot preserves uncertain reservations and distinguishes estimates from invoices', () => {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'readback-')),file=path.join(root,'ledger.sqlite');
 const db=new DatabaseSync(file);db.exec(`CREATE TABLE calls(id TEXT,timestamp TEXT,reserved_micro_usd INTEGER,estimated_micro_usd INTEGER,invoice_actual_micro_usd INTEGER,status TEXT); PRAGMA application_id=1162430793; PRAGMA user_version=1; INSERT INTO calls VALUES('a','2026-10-02',2000000,400000,NULL,'usage_recorded'),('b','2026-10-02',3000000,NULL,NULL,'failed_uncertain');`);db.close();fs.writeFileSync(file+'.initialized','1');
 try {
  const before=fs.readFileSync(file);const r=readCommissioningAccounting(file);
  assert.equal(r.recordCount,2);assert.equal(r.heldMicroUsd,5000000);assert.equal(r.ceilingMicroUsd,40000000);assert.equal(r.remainingMicroUsd,35000000);assert.equal(r.invoiceActualMicroUsd,null);assert.equal(r.invoiceUnknownCount,2);assert.equal(r.recordedEstimateMicroUsd,400000);assert.equal(r.estimateUnknownCount,1);assert.deepEqual(fs.readFileSync(file),before);
  assert.ok(!JSON.stringify(r).includes('failed_uncertain'));assert.equal(readCommissioningAccounting(file).recordDigestSha256,r.recordDigestSha256);
  fs.unlinkSync(file);assert.throws(()=>readCommissioningAccounting(file));assert.equal(fs.existsSync(file),false);
  fs.writeFileSync(file,'broken');assert.throws(()=>readCommissioningAccounting(file));
 } finally {fs.rmSync(root,{recursive:true,force:true});}
});

test('HTTP readback requires configured founder and workspace and fails closed without leaking errors',async()=>{
 const old=process.env.EMPIRE_RUNTIME_PROFILE;process.env.EMPIRE_RUNTIME_PROFILE='LOCKED_COMMISSIONING_V1';
 const app=Fastify(),sessions=new InMemorySessionStore();let reads=0,fail=false;
 registerOwnerCommissioningReadback(app,createAuthMiddleware(sessions),()=>{reads++;if(fail)throw Error('/private/path sensitive');return {remainingMicroUsd:15000000} as ReturnType<typeof readCommissioningAccounting>;});
 const user={id:'founder',email:env.FOUNDER_EMAIL,name:'Owner',role:'founder' as const,workspaceId:'ws_empire_1'};
 try {
  assert.equal((await app.inject('/api/pillow/commissioning-accounting')).statusCode,401);
  assert.equal((await app.inject('/api/pillow/answer-gate-diagnostics/pcr_private')).statusCode,401);
  assert.equal((await app.inject('/api/pillow/commissioning-provider-receipts/pcr_private')).statusCode,401);
  for(const other of [{...user,email:'other@example.com'},{...user,workspaceId:'other'},{...user,role:'admin' as const}]){const token=(await sessions.create(other)).token;assert.equal((await app.inject({url:'/api/pillow/commissioning-accounting',headers:{authorization:'Bearer '+token}})).statusCode,403);assert.equal((await app.inject({url:'/api/pillow/answer-gate-diagnostics/pcr_private',headers:{authorization:'Bearer '+token}})).statusCode,403);assert.equal((await app.inject({url:'/api/pillow/commissioning-provider-receipts/pcr_private',headers:{authorization:'Bearer '+token}})).statusCode,403);}
  assert.equal(reads,0);const token=(await sessions.create(user)).token;const options={url:'/api/pillow/commissioning-accounting',headers:{authorization:'Bearer '+token}};
  let r=await app.inject(options);assert.equal(r.statusCode,200);assert.equal(r.headers['cache-control'],'private, no-store');
  fail=true;r=await app.inject(options);assert.equal(r.statusCode,503);assert.ok(!r.body.includes('private/path'));assert.ok(!r.body.includes('15000000'));
  delete process.env.EMPIRE_RUNTIME_PROFILE;assert.equal((await app.inject(options)).statusCode,404);assert.equal(reads,2);
 }finally{await app.close();if(old===undefined)delete process.env.EMPIRE_RUNTIME_PROFILE;else process.env.EMPIRE_RUNTIME_PROFILE=old;}
});

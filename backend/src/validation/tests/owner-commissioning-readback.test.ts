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
  assert.equal((await app.inject({method:'POST',url:'/api/pillow/assurance-demo/inject'})).statusCode,401);
  assert.equal((await app.inject('/api/pillow/assurance')).statusCode,401);
  assert.equal((await app.inject('/api/pillow/commissioning-accounting')).statusCode,401);
  assert.equal((await app.inject('/api/pillow/answer-gate-diagnostics/pcr_private')).statusCode,401);
  assert.equal((await app.inject('/api/pillow/commissioning-provider-receipts/pcr_private')).statusCode,401);
  for(const other of [{...user,email:'other@example.com'},{...user,workspaceId:'other'},{...user,role:'admin' as const}]){const token=(await sessions.create(other)).token;assert.equal((await app.inject({method:'POST',url:'/api/pillow/assurance-demo/inject',headers:{authorization:'Bearer '+token}})).statusCode,403);assert.equal((await app.inject({url:'/api/pillow/assurance',headers:{authorization:'Bearer '+token}})).statusCode,403);assert.equal((await app.inject({url:'/api/pillow/commissioning-accounting',headers:{authorization:'Bearer '+token}})).statusCode,403);assert.equal((await app.inject({url:'/api/pillow/answer-gate-diagnostics/pcr_private',headers:{authorization:'Bearer '+token}})).statusCode,403);assert.equal((await app.inject({url:'/api/pillow/commissioning-provider-receipts/pcr_private',headers:{authorization:'Bearer '+token}})).statusCode,403);}
  assert.equal(reads,0);const token=(await sessions.create(user)).token;const options={url:'/api/pillow/commissioning-accounting',headers:{authorization:'Bearer '+token}};
  let r=await app.inject(options);assert.equal(r.statusCode,200);assert.equal(r.headers['cache-control'],'private, no-store');
  fail=true;r=await app.inject(options);assert.equal(r.statusCode,503);assert.ok(!r.body.includes('private/path'));assert.ok(!r.body.includes('15000000'));
  delete process.env.EMPIRE_RUNTIME_PROFILE;assert.equal((await app.inject(options)).statusCode,404);assert.equal(reads,2);
 }finally{await app.close();if(old===undefined)delete process.env.EMPIRE_RUNTIME_PROFILE;else process.env.EMPIRE_RUNTIME_PROFILE=old;}
});

import {installLockedCommissioning} from '../../runtime/locked-commissioning.js';
import {execFileSync} from 'node:child_process';
test('real locked onRequest boundary permits only the two founder isolated demo actions and independent observation',async()=>{
 const saved={profile:process.env.EMPIRE_RUNTIME_PROFILE,engineering:process.env.EMPIRE_ENGINEERING_TEST_MODE,root:process.env.RAILWAY_VOLUME_MOUNT_PATH};
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'locked-assurance-demo-'));fs.mkdirSync(path.join(root,'commissioning'));
 process.env.EMPIRE_RUNTIME_PROFILE='LOCKED_COMMISSIONING_V1';process.env.EMPIRE_ENGINEERING_TEST_MODE='true';process.env.RAILWAY_VOLUME_MOUNT_PATH=root;
 const filename=path.join(root,'commissioning','assurance.sqlite');
 const engineUrl=new URL('../../assurance/independent-assurance.mjs',import.meta.url).href;
 const demoUrl=new URL('../../assurance/owner-demo.mjs',import.meta.url).href;
 const {AssuranceStore}=await import(engineUrl);new AssuranceStore(filename).close();
 const observer=()=>execFileSync(process.execPath,['--input-type=module','-e',`import {observeDemo} from ${JSON.stringify(demoUrl)};observeDemo(${JSON.stringify(filename)});`],{stdio:'pipe'});
 observer();
 const app=Fastify(),sessions=new InMemorySessionStore();installLockedCommissioning(app);
 registerOwnerCommissioningReadback(app,createAuthMiddleware(sessions),()=>({remainingMicroUsd:22355288}) as ReturnType<typeof readCommissioningAccounting>);
 const user={id:'founder',email:env.FOUNDER_EMAIL,name:'Owner',role:'founder' as const,workspaceId:'ws_empire_1'};
 try{
  for(const action of ['inject','correct'])assert.equal((await app.inject({method:'POST',url:'/api/pillow/assurance-demo/'+action})).statusCode,401);
  for(const other of [{...user,email:'other@example.invalid'},{...user,workspaceId:'other'},{...user,role:'admin' as const}]){
   const token=(await sessions.create(other)).token;
   assert.equal((await app.inject({method:'POST',url:'/api/pillow/assurance-demo/inject',headers:{authorization:'Bearer '+token}})).statusCode,403);
  }
  const token=(await sessions.create(user)).token,headers={authorization:'Bearer '+token};
  const read=async()=>{const r=await app.inject({url:'/api/pillow/assurance',headers});assert.equal(r.statusCode,200,r.body);return r.json();};
  assert.equal((await read()).demonstration.history[0].status,'HEALTHY');
  const injected=await app.inject({method:'POST',url:'/api/pillow/assurance-demo/inject',headers,payload:{path:'/real-business',force:true}});
  assert.equal(injected.statusCode,200,injected.body);assert.equal(injected.json().awaitingIndependentObservation,true);
  assert.equal((await read()).demonstration.history[0].status,'HEALTHY');
  observer();const detected=await read();assert.equal(detected.demonstration.history[0].status,'DEGRADED');
  const finding=detected.findings.find((f:{source:string})=>f.source==='isolated-demonstration');assert.ok(finding);assert.equal(finding.status,'OPEN');assert.equal(finding.severity,'HIGH');
  assert.equal((await app.inject({method:'POST',url:'/api/pillow/assurance-demo/correct',headers})).statusCode,200);
  observer();const recovered=await read();assert.deepEqual(recovered.demonstration.history.map((x:{status:string})=>x.status),['HEALTHY','DEGRADED','HEALTHY']);
  assert.equal(recovered.findings.find((f:{id:string})=>f.id===finding.id).status,'RESOLVED');
  for(const url of ['/api/pillow/assurance-demo/buy','/api/pillow/assurance-demo/inject/extra','/pillow-commissioning/birth/authorise','/payments','/live-cj-fulfillment/submit-live','/api/pillow/mission-runtime/execute'])assert.equal((await app.inject({method:'POST',url,headers,payload:{approved:true,force:true}})).statusCode,423,url);
  for(const method of ['PUT','PATCH','DELETE'] as const)assert.equal((await app.inject({method,url:'/api/pillow/assurance-demo/inject',headers})).statusCode,423);
 }finally{await app.close();for(const [key,value]of Object.entries({EMPIRE_RUNTIME_PROFILE:saved.profile,EMPIRE_ENGINEERING_TEST_MODE:saved.engineering,RAILWAY_VOLUME_MOUNT_PATH:saved.root})){if(value===undefined)delete process.env[key];else process.env[key]=value;}fs.rmSync(root,{recursive:true,force:true});}
});

import {createHash} from 'node:crypto';
test('commissioning operator reads accounting without founder credentials and cannot use mutation or founder routes',async()=>{
 const keys=['EMPIRE_RUNTIME_PROFILE','EMPIRE_ENGINEERING_TEST_MODE','COMMISSIONING_OPERATOR_TOKEN_SHA256','COMMISSIONING_OPERATOR_EXPIRES_AT'];
 const saved=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 const token='b'.repeat(43);process.env.EMPIRE_RUNTIME_PROFILE='LOCKED_COMMISSIONING_V1';process.env.EMPIRE_ENGINEERING_TEST_MODE='true';
 process.env.COMMISSIONING_OPERATOR_TOKEN_SHA256=createHash('sha256').update(token).digest('hex');process.env.COMMISSIONING_OPERATOR_EXPIRES_AT=String(Date.now()+60000);
 const app=Fastify(),sessions=new InMemorySessionStore();installLockedCommissioning(app);let reads=0;
 registerOwnerCommissioningReadback(app,createAuthMiddleware(sessions),()=>{reads++;return {remainingMicroUsd:22355288} as ReturnType<typeof readCommissioningAccounting>;});
 const url='/api/commissioning/read-only/accounting',headers={'x-empire-commissioning-token':token};
 try{
  assert.equal((await app.inject(url)).statusCode,403);assert.equal(reads,0);
  const allowed=await app.inject({url,headers});assert.equal(allowed.statusCode,200);assert.equal(allowed.json().remainingMicroUsd,22355288);assert.equal(allowed.headers['cache-control'],'private, no-store');
  assert.equal((await app.inject({url:url+'?scope=founder',headers})).statusCode,403);
  assert.equal((await app.inject({url:'/api/pillow/commissioning-accounting',headers})).statusCode,401);
  assert.equal((await app.inject({method:'POST',url:'/api/pillow/assurance-demo/inject',headers})).statusCode,401);
  assert.equal((await app.inject({method:'POST',url:'/payments',headers})).statusCode,423);
  assert.equal((await app.inject({method:'POST',url,headers})).statusCode,423);
  assert.equal(reads,1);process.env.COMMISSIONING_OPERATOR_EXPIRES_AT=String(Date.now()-1);
  assert.equal((await app.inject({url,headers})).statusCode,403);assert.equal(reads,1);
 }finally{await app.close();for(const key of keys){if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key];}}
});

import {runLegacyBusinessBootstrap} from '../../runtime/startup-bootstrap-policy.js';
test('locked startup preserves existing business rows and refuses deferred fixture bootstrap',()=>{
 const db=new DatabaseSync(':memory:');db.exec("CREATE TABLE business(id TEXT, value TEXT); INSERT INTO business VALUES('existing','preserve')");
 const before=db.prepare('SELECT * FROM business').all();let calls=0;
 const destructiveBootstrap=()=>{calls++;db.exec("UPDATE business SET value='fixture'; INSERT INTO business VALUES('demo','synthetic')")};
 try{
 for(const profile of ['LOCKED_COMMISSIONING_V1','UNKNOWN_EXPLICIT_PROFILE']){
 assert.equal(runLegacyBusinessBootstrap(destructiveBootstrap,profile),false);
 assert.equal(calls,0);assert.deepEqual(db.prepare('SELECT * FROM business').all(),before);
 }
 assert.equal(runLegacyBusinessBootstrap(destructiveBootstrap,''),true);assert.equal(calls,1);
 }finally{db.close();}
});

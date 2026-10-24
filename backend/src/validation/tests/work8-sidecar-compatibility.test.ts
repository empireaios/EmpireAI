import {DurableSimulatedFinance} from '../../runtime/commerce-runtime/governed/work8-durable-finance.js';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import ts from 'typescript';
import {GovernedCommerceStore,digest} from '../../runtime/commerce-runtime/governed/store.js';
import {GovernedCommerceEngine} from '../../runtime/commerce-runtime/governed/engine.js';
import {CommerceWorker} from '../../runtime/commerce-runtime/governed/worker.js';
import {makeWork8FulfilmentProbes} from '../../assurance/work8-fulfilment-probes.js';
const fixtureRoot=new URL('../fixtures/work7-sidecar-baseline/',import.meta.url),now=Date.parse('2026-10-11T00:00:00Z'),workspace='synthetic:compatibility';
async function baseline(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'w8-baseline-reader-'));const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',fixtureRoot),'utf8')) as {revision:string;files:Record<string,string>};
 assert.equal(manifest.revision,'608f3f5382e32d295ebe3733194846ac7cbb9d57');
 for(const [name,sha] of Object.entries(manifest.files)){const source=fs.readFileSync(new URL(name+'.fixture',fixtureRoot),'utf8');assert.equal(createHash('sha256').update(source).digest('hex'),sha);const target=path.join(root,name.replace(/\.ts$/,'.js'));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,verbatimModuleSyntax:false}}).outputText);}
 fs.writeFileSync(path.join(root,'package.json'),'{"type":"module"}');fs.mkdirSync(path.join(root,'node_modules'));fs.symlinkSync(path.dirname(createRequire(import.meta.url).resolve('zod/package.json')),path.join(root,'node_modules','zod'));
 const base=path.join(root,'backend/src/runtime/commerce-runtime/governed');const [{GovernedCommerceStore:Store},{GovernedCommerceEngine:Engine},{CommerceWorker:Worker}]=await Promise.all(['store','engine','worker'].map(n=>import(pathToFileURL(path.join(base,n+'.js')).href)));
 return {root,Store,Engine,Worker};
}
test('exact Work7 writer sidecar is read and resumed by Work8 with immutable receipt/task prefix intact',async()=>{const b=await baseline(),file=path.join(b.root,'sidecar.sqlite');let old=new b.Store(file);try{const w=new b.Worker(new b.Engine(old,()=>now));let t=w.enqueue(workspace,'owner','from-seven');t=w.runBounded(workspace,t.id,4);const history=old.history(workspace,t.mission),task=w.get(workspace,t.id);old.close();old=null;
 const current=new GovernedCommerceStore(file);try{const currentWorker=new CommerceWorker(new GovernedCommerceEngine(current,()=>now));assert.equal(digest(current.history(workspace,t.mission)),digest(history));assert.equal(digest(currentWorker.get(workspace,t.id)),digest(task));assert.ok(current.db.prepare("SELECT name FROM sqlite_master WHERE type='trigger' AND name='immutable_commerce_task_plan'").get());const resumed=currentWorker.tick(workspace,t.id,t.fence);assert.equal(resumed.cursor,5);assert.equal(digest(current.history(workspace,t.mission).slice(0,4)),digest(history));assert.throws(()=>currentWorker.tick(workspace,t.id,t.fence),/FENCE/);}finally{current.close();}
 }finally{old?.close();fs.rmSync(b.root,{recursive:true,force:true});}});
test('exact Work7 reader opens Work8 additive task trigger and fulfilment cursor without mutating canonical data',async()=>{const b=await baseline(),file=path.join(b.root,'sidecar.sqlite');const current=new GovernedCommerceStore(file);try{const w=new CommerceWorker(new GovernedCommerceEngine(current,()=>now));let t=w.enqueue(workspace,'owner','from-eight');t=w.runBounded(workspace,t.id,4);t=w.runBounded(workspace,t.id,4);makeWork8FulfilmentProbes({store:current,now:()=>now}).probes(workspace);new DurableSimulatedFinance(current,w,()=>now);assert.equal(current.db.prepare("SELECT count(*) n FROM sqlite_master WHERE type='table' AND name LIKE 'work8_sim_finance_%'").get()!.n,4);const before={history:current.history(workspace,t.mission),task:w.get(workspace,t.id),derived:current.db.prepare('SELECT * FROM work8_fulfilment_scan').all()};current.close();
 const old=new b.Store(file);try{const reader=new b.Worker(new b.Engine(old,()=>now));assert.equal(digest(old.history(workspace,t.mission)),digest(before.history));assert.equal(digest(reader.get(workspace,t.id)),digest(before.task));assert.equal(digest(old.db.prepare('SELECT * FROM work8_fulfilment_scan').all()),digest(before.derived));assert.ok(old.db.prepare("SELECT name FROM sqlite_master WHERE name='immutable_commerce_task_plan'").get());}finally{old.close();}
 const again=new GovernedCommerceStore(file);try{const reader=new CommerceWorker(new GovernedCommerceEngine(again,()=>now));assert.equal(digest(again.history(workspace,t.mission)),digest(before.history));assert.equal(digest(reader.get(workspace,t.id)),digest(before.task));assert.equal(digest(again.db.prepare('SELECT * FROM work8_fulfilment_scan').all()),digest(before.derived));}finally{again.close();}
 }finally{try{current.close();}catch{}fs.rmSync(b.root,{recursive:true,force:true});}});
test('both exact Work7 and Work8 readers refuse incompatible version, missing required schema and truncation',async()=>{const b=await baseline();try{for(const mode of ['version','schema','truncated']){const file=path.join(b.root,mode+'.sqlite'),s=new GovernedCommerceStore(file);s.close();if(mode==='truncated')fs.truncateSync(file,0);else{const db=new DatabaseSync(file);db.exec(mode==='version'?'PRAGMA user_version=99':'DROP TABLE commerce_runtime_tasks');db.close();}const before=fs.readFileSync(file);assert.throws(()=>new b.Store(file),/CORRUPT/);assert.throws(()=>new GovernedCommerceStore(file),/CORRUPT/);assert.deepEqual(fs.readFileSync(file),before);}}finally{fs.rmSync(b.root,{recursive:true,force:true});}});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {AssuranceStore,reconcileSnapshot} from '../../assurance/independent-assurance.mjs';
import {createWorkerCollector,createInspectorCollector,createSpendingCollector} from '../../assurance/internal-collectors.mjs';

test('worker and independent inspector failures cannot inherit healthy evidence',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'assurance-internal-'));
 try{
  const worker=body=>createWorkerCollector({origin:'https://runtime.example',clock:()=>100000,fetchImpl:async()=>Response.json(body)});
  assert.equal(reconcileSnapshot(await worker({workerReady:true,checks:{redis:{ok:true}}})(),100000,1000).status,'PASS');
  assert.equal(reconcileSnapshot(await worker({})(),100000,1000).status,'FAIL');
  const file=path.join(dir,'watchdog');fs.writeFileSync(file,JSON.stringify({observedAt:1000}));
  assert.equal(reconcileSnapshot(await createInspectorCollector(file,()=>100000)(),100000,120000).status,'FAIL');
  fs.writeFileSync(file,JSON.stringify({observedAt:100001}));await assert.rejects(createInspectorCollector(file,()=>100000)());
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('independent reservation baseline detects deletion, mutation and cap breach without ledger writes',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'assurance-money-')),file=path.join(dir,'ledger.sqlite');
 const source=new DatabaseSync(file),store=new AssuranceStore(path.join(dir,'assurance.sqlite'));
 try{
  source.exec('PRAGMA application_id=1162430793; PRAGMA user_version=1; CREATE TABLE calls(id TEXT PRIMARY KEY,timestamp TEXT,reserved_micro_usd INTEGER,estimated_micro_usd INTEGER)');
  fs.writeFileSync(file+'.initialized','');source.prepare('INSERT INTO calls VALUES(?,?,?,?)').run('one','2026-10-02',1000000,null);
  const collector=createSpendingCollector(file,store,()=>1000),check=async()=>reconcileSnapshot(await collector(),1000,100);
  const before=fs.readFileSync(file);assert.equal((await check()).status,'PASS');assert.deepEqual(fs.readFileSync(file),before);
  source.exec('DELETE FROM calls');assert.equal((await check()).status,'FAIL');
  source.prepare('INSERT INTO calls VALUES(?,?,?,?)').run('one','changed',1000000,null);assert.equal((await check()).status,'FAIL');
  source.exec("UPDATE calls SET timestamp='2026-10-02',reserved_micro_usd=41000000");assert.equal((await check()).status,'FAIL');
 }finally{source.close();store.close();fs.rmSync(dir,{recursive:true,force:true});}
});

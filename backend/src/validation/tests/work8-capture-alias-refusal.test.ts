import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {EmpireDatabase} from '../../brain/sqlite-database.js';
import {openShadowCeoRepository} from '../../orchestration/shadow-ceo/repository.js';
import {withQuiescedBrainAndShadowCapture} from '../../orchestration/shadow-ceo-integration/coordinated-sqlite-capture.js';

test('coordinated capture refuses clean and dirty duplicate Shadow handles before any source persistence',async()=>{
 for(const dirty of [false,true]){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'duplicate-shadow-capture-'));
  const primaryFile=path.join(dir,'brain.db'),shadowFile=path.join(dir,'shadow.db');
  const primary=new EmpireDatabase(primaryFile),shadow=openShadowCeoRepository({dbPath:shadowFile});
  let duplicate:EmpireDatabase|undefined;
  try{
   primary.exec('CREATE TABLE guard(value TEXT); INSERT INTO guard VALUES (\'original\')');
   await primary.requestCriticalPersist();
   const fence=shadow.acquireCaptureFence();try{await fence.persist();}finally{fence.release();}
   const beforeBrain=fs.readFileSync(primaryFile),beforeShadow=fs.readFileSync(shadowFile);
   duplicate=new EmpireDatabase(shadowFile);
   if(dirty)duplicate.exec('CREATE TABLE duplicate_only(value TEXT); INSERT INTO duplicate_only VALUES (\'unpersisted\')');
   // Primary dirty RAM must not be persisted before discovering the second handle.
   primary.exec('INSERT INTO guard VALUES (\'pending\')');
   let callback=false;
   await assert.rejects(withQuiescedBrainAndShadowCapture(primary,shadow,()=>{callback=true;}),/independently opened SQL.js handle/);
   assert.equal(callback,false);
   assert.deepEqual(fs.readFileSync(primaryFile),beforeBrain);
   assert.deepEqual(fs.readFileSync(shadowFile),beforeShadow);
   // Failed coordination releases the first fence and retains pending RAM.
   assert.equal(primary.prepare('SELECT count(*) AS n FROM guard').get()?.n,2);
   primary.exec('INSERT INTO guard VALUES (\'after refusal\')');
  }finally{duplicate?.close();shadow.close();primary.close();fs.rmSync(dir,{recursive:true,force:true});}
 }
});

test('coordinated capture refuses newly constructed same-file SQL.js handles while both fences remain held',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'construction-shadow-capture-'));
 const primaryFile=path.join(dir,'brain.db'),shadowFile=path.join(dir,'shadow.db');
 const primary=new EmpireDatabase(primaryFile),shadow=openShadowCeoRepository({dbPath:shadowFile});
 try{
  primary.exec('CREATE TABLE guard(value TEXT)');
  await withQuiescedBrainAndShadowCapture(primary,shadow,()=>{
   const beforeBrain=fs.readFileSync(primaryFile),beforeShadow=fs.readFileSync(shadowFile);
   assert.throws(()=>new EmpireDatabase(primaryFile),/another SQL.js handle cannot open/);
   assert.throws(()=>new EmpireDatabase(shadowFile),/another SQL.js handle cannot open/);
   assert.deepEqual(fs.readFileSync(primaryFile),beforeBrain);assert.deepEqual(fs.readFileSync(shadowFile),beforeShadow);
  });
 }finally{shadow.close();primary.close();fs.rmSync(dir,{recursive:true,force:true});}
});

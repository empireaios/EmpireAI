import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import {EmpireDatabase} from '../../brain/sqlite-database.js';
import {openShadowCeoRepository} from '../../orchestration/shadow-ceo/repository.js';
import {withExistingShadowCapture} from '../../orchestration/shadow-ceo-integration/coordinated-sqlite-capture.js';
import {CaptureHttpAdmission} from '../../runtime/capture-http-admission.js';
function fixture(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'shadow-owned-capture-'));const file=path.join(dir,'shadow.db');const brain=new EmpireDatabase(path.join(dir,'brain.db'));const seed=openShadowCeoRepository({dbPath:file});seed.close();const writer=new EmpireDatabase(file);writer.exec('CREATE TABLE accepted_business_record(id TEXT PRIMARY KEY)');writer.close();return {dir,file,brain,close(){brain.close();fs.rmSync(dir,{recursive:true,force:true});}};}
function count(file:string){const d=new DatabaseSync(file,{readOnly:true});try{return d.prepare('SELECT count(*) n FROM accepted_business_record').get()!.n;}finally{d.close();}}
for(const refuse of [false,true])test(`owned Shadow loads after admitted writer commit and closes inside exclusion (${refuse?'callback refusal':'success'})`,async()=>{
 const f=fixture();const gate=new CaptureHttpAdmission();const writer=new EmpireDatabase(f.file);const finishRequest=gate.admit();
 try{
  let captured=-1;let bytes:Buffer|undefined;
  const pending=gate.withDrainedAdmission(()=>withExistingShadowCapture(f.brain,f.file,shadow=>{
   captured=Number(count(f.file));bytes=fs.readFileSync(f.file);
   assert.throws(()=>new EmpireDatabase(f.file),/capture active/);
   assert.equal(shadow.dbPath,f.file);
   if(refuse)throw Error('injected capture refusal');return 'captured';
  }));
  writer.exec("INSERT INTO accepted_business_record VALUES('accepted-during-drain')");writer.close();assert.equal(count(f.file),1);finishRequest();
  if(refuse)await assert.rejects(pending,/injected capture refusal/);else assert.equal(await pending,'captured');
  assert.equal(captured,1);assert.deepEqual(fs.readFileSync(f.file),bytes);assert.equal(count(f.file),1);
  // A later admitted writer must not be overwritten by deferred recovery close.
  const after=new EmpireDatabase(f.file);after.exec("INSERT INTO accepted_business_record VALUES('after-release')");after.close();
  await new Promise<void>(resolve=>setImmediate(resolve));assert.equal(count(f.file),2);
 }finally{finishRequest();writer.close();f.close();}
});
test('surviving dirty Shadow alias refuses without flushing or erasing either source or pending RAM',async()=>{
 const f=fixture();const writer=new EmpireDatabase(f.file);const before=fs.readFileSync(f.file);
 try{
  writer.exec("INSERT INTO accepted_business_record VALUES('pending-owner-record')");let callback=false;
  await assert.rejects(withExistingShadowCapture(f.brain,f.file,()=>{callback=true;}),/independently opened SQL.js handle/);
  assert.equal(callback,false);assert.deepEqual(fs.readFileSync(f.file),before);
  assert.equal(writer.prepare('SELECT count(*) n FROM accepted_business_record').get()!.n,1);
  writer.close();assert.equal(count(f.file),1);
 }finally{writer.close();f.close();}
});
test('capture-only database never migrates, creates, quarantines, checkpoints or persists on close',async()=>{
 const f=fixture();try{
  const before=fs.readFileSync(f.file);const view=new EmpireDatabase(f.file,true);
  assert.throws(()=>view.exec('CREATE TABLE forbidden(value TEXT)'),/read-only/);
  assert.throws(()=>view.prepare('INSERT INTO accepted_business_record VALUES(\'bad\')').run(),/read-only/);
  assert.throws(()=>view.prepare('DELETE FROM accepted_business_record').get(),/read-only/);
  assert.throws(()=>view.prepare('PRAGMA query_only=OFF').all(),/read-only/);
  assert.throws(()=>view.pragma('wal_checkpoint=TRUNCATE'),/read-only/);
  assert.throws(()=>view.pragma('query_only(OFF)'),/read-only/);
  assert.equal(view.pragma('query_only',{simple:true}),1);
  await view.requestCriticalPersist();view.close();assert.deepEqual(fs.readFileSync(f.file),before);
  const absent=path.join(f.dir,'absent.db');assert.throws(()=>openShadowCeoRepository({dbPath:absent,captureReadOnly:true}),/existing disk/);assert.equal(fs.existsSync(absent),false);
  const corrupt=path.join(f.dir,'corrupt.db');fs.writeFileSync(corrupt,'broken');assert.throws(()=>openShadowCeoRepository({dbPath:corrupt,captureReadOnly:true}),/original file retained/);assert.equal(fs.readFileSync(corrupt,'utf8'),'broken');
  const missingSchema=path.join(f.dir,'missing-schema.db');const db=new DatabaseSync(missingSchema);db.exec('CREATE TABLE unrelated(value TEXT)');db.close();const original=fs.readFileSync(missingSchema);
  assert.throws(()=>openShadowCeoRepository({dbPath:missingSchema,captureReadOnly:true}),/no such table/);assert.deepEqual(fs.readFileSync(missingSchema),original);
  assert.equal(fs.readdirSync(f.dir).some(x=>x.includes('quarantine')),false);
 }finally{f.close();}
});

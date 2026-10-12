import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const root=process.env.RAILWAY_VOLUME_MOUNT_PATH!;
const base=path.dirname(root);
let shutdown:(()=>Promise<void>)|undefined;
try{
 const {buildApp}=await import('../../../app.js');
 const {getDatabase}=await import('../../../brain/database.js');
 const {EmpireDatabase}=await import('../../../brain/sqlite-database.js');
 const {openShadowCeoRepository}=await import('../../../orchestration/shadow-ceo/repository.js');
 const app=await buildApp({startWorkers:false,startScheduler:false,pillowEnabled:false,earlyListen:true});shutdown=app.shutdown;
 const shadowPath=path.join(process.env.SHADOW_CEO_DATA_DIR!,'shadow-ceo.db');
 const seed=openShadowCeoRepository({dbPath:shadowPath});seed.close();
 {
  const primaryPath=process.env.DATABASE_PATH!;
  const stores=require('../../../../../deployment/work8-system-vault.cjs').STORES as Record<string,string>;
  for(const [id,relative] of Object.entries(stores)){
   const file=path.join(root,relative);fs.mkdirSync(path.dirname(file),{recursive:true});const db=new DatabaseSync(file);
   try{db.exec('CREATE TABLE IF NOT EXISTS recovery_fixture(id TEXT PRIMARY KEY,value TEXT)');db.prepare('INSERT OR REPLACE INTO recovery_fixture VALUES(?,?)').run('source',id);}finally{db.close();}
  }
  for(const [suffix,appId,version,ddl] of [
   ['.missions.sqlite',0x454d5352,3,'CREATE TABLE mission_snapshot(value TEXT)'],
   ['.mission-execution.sqlite',0x454d4558,1,'CREATE TABLE execution_events(value TEXT);CREATE TABLE execution_jobs(value TEXT);CREATE TABLE execution_meta(value TEXT)']
  ] as const){const file=primaryPath+suffix;if(!fs.existsSync(file)){const db=new DatabaseSync(file);try{db.exec(`${ddl};PRAGMA application_id=${appId};PRAGMA user_version=${version}`);}finally{db.close();}}}
  const authority=path.join(process.env.SHADOW_CEO_DATA_DIR!,'shadow-ceo-authority');fs.mkdirSync(authority,{recursive:true});fs.writeFileSync(path.join(authority,'authority-store.json'),JSON.stringify({approvals:[],blocked:[]}));fs.writeFileSync(path.join(process.env.SHADOW_CEO_DATA_DIR!,'shadow-ceo-request-owners.json'),'{}');
  getDatabase().exec("CREATE TABLE recovery_app_fixture(value TEXT);INSERT INTO recovery_app_fixture VALUES('retained')");
  const request={destination:path.join(base,'capture'),sourceCommit:'a'.repeat(40),frontendRevision:'b'.repeat(40)};
  await assert.rejects(app.captureWork8Recovery(request),/FULL_RUNTIME_CAPTURE_UNPROVEN/);
  const seedRecords=new EmpireDatabase(shadowPath);seedRecords.exec('CREATE TABLE accepted_business_record(id TEXT PRIMARY KEY)');seedRecords.close();
  const count=(file:string)=>{const db=new DatabaseSync(file,{readOnly:true});try{return Number(db.prepare('SELECT count(*) n FROM accepted_business_record').get()!.n);}finally{db.close();}};
  let admitted!:()=>void,allowCommit!:()=>void;let writerId='accepted-during-drain';
  let admittedSignal=new Promise<void>(resolve=>{admitted=resolve;});
  let commitSignal=new Promise<void>(resolve=>{allowCommit=resolve;});
  app.app.get('/fixture/admitted-shadow-writer',async()=>{
   const writer=new EmpireDatabase(shadowPath);admitted();
   try{await commitSignal;writer.prepare('INSERT INTO accepted_business_record VALUES(@id)').run({id:writerId});}
   finally{writer.close();}return {committed:true};
  });
  const inflight=app.app.inject({method:'GET',url:'/fixture/admitted-shadow-writer'});
  await admittedSignal;
  let settled=false;
  const capture=app.captureWork8Recovery({...request,requireComplete:false}).finally(()=>{settled=true;});
  await new Promise(resolve=>setTimeout(resolve,100));assert.equal(settled,false);
  allowCommit();assert.equal((await inflight).statusCode,200);
  const result=await capture;
  assert.equal(count(shadowPath),1);assert.equal(count(path.join(result.directory,'shadow','checkpoint.db')),1);
  const after=new EmpireDatabase(shadowPath);after.exec("INSERT INTO accepted_business_record VALUES('after-release')");after.close();
  await new Promise<void>(resolve=>setImmediate(resolve));assert.equal(count(shadowPath),2);
  const recovery=require('../../../../../deployment/work8-recovery-set.cjs');const manifest=recovery.verifyRuntimeRecoverySet(result);
  assert.equal(manifest.completeLiveState,false);assert.equal(Object.keys(manifest.stores).length,13);
  assert.equal(fs.existsSync(path.join(result.directory,'runtime-recovery.pending.json')),false);
  const copied=new DatabaseSync(path.join(result.directory,'brain','checkpoint.db'),{readOnly:true});try{assert.equal(copied.prepare('SELECT value FROM recovery_app_fixture').get()!.value,'retained');}finally{copied.close();}
  const missing=path.join(root,stores.liveCostCentre!);fs.renameSync(missing,missing+'.retained');
  admittedSignal=new Promise<void>(resolve=>{admitted=resolve;});commitSignal=new Promise<void>(resolve=>{allowCommit=resolve;});writerId='accepted-before-refusal';
  const inflightRefusal=app.app.inject({method:'GET',url:'/fixture/admitted-shadow-writer'});await admittedSignal;
  const refused=app.captureWork8Recovery({...request,destination:path.join(base,'missing-capture'),requireComplete:false});
  const expectedRefusal=assert.rejects(refused,/ENOENT|missing/);allowCommit();assert.equal((await inflightRefusal).statusCode,200);await expectedRefusal;assert.equal(count(shadowPath),3);
  fs.renameSync(missing+'.retained',missing);
  const alias=new EmpireDatabase(shadowPath);alias.exec("INSERT INTO accepted_business_record VALUES('pending-alias')");const beforeAlias=fs.readFileSync(shadowPath);
  try{await assert.rejects(app.captureWork8Recovery({...request,destination:path.join(base,'alias-refusal'),requireComplete:false}),/independently opened SQL.js handle/);assert.deepEqual(fs.readFileSync(shadowPath),beforeAlias);assert.equal(alias.prepare('SELECT count(*) n FROM accepted_business_record').get()!.n,4);}finally{alias.close();}
  assert.equal(count(shadowPath),4);
  assert.equal(fs.existsSync(path.join(base,'missing-capture','runtime-recovery.json')),false);
  process.send!({event:'result',result:{digest:result.digest,stores:13,completeLiveState:false,bootAllowed:false,sourceRecord:'retained',missingStoreRefused:true,concurrentShadowPreserved:true,postReleaseWritePreserved:true,aliasRefusalPreserved:true}});
 }
}catch(error){process.send?.({event:'error',error:error instanceof Error?error.stack:String(error)});process.exitCode=1;}
finally{await shutdown?.();process.disconnect();}

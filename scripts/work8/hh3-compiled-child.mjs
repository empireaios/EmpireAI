import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
const require=createRequire(import.meta.url),mode=process.argv[2];
assert.ok(['timeout','observer-error','invalidate-error'].includes(mode));
const {createGeneratedCaptureScope}=await import('../../backend/dist/runtime/work8-generated-capture-hold.js');
let app,server;
const scope=createGeneratedCaptureScope({timeoutMs:5000,onHeld:async notice=>{
 process.send({event:'held',notice,port,root});
 await new Promise(resolve=>process.once('message',message=>{assert.equal(message.action,'observed');resolve();}));
 if(mode!=='timeout')throw Error('HH3_LABELLED_OBSERVER_FAILURE');
}});
const root=scope.volumeRoot;
Object.assign(process.env,{DATABASE_PATH:root+'/brain.db',RAILWAY_VOLUME_MOUNT_PATH:root,SHADOW_CEO_DATA_DIR:root+'/shadow',EMPIRE_ROLE:'brain-worker',REDIS_OPTIONAL:'false'});
const port=await new Promise((resolve,reject)=>{const listener=createServer();listener.once('error',reject);listener.listen(0,'127.0.0.1',()=>{const a=listener.address();listener.close(()=>resolve(a.port));});});
const redisDir=path.join(root,'redis');fs.mkdirSync(redisDir);
try{
 server=spawn('/usr/bin/redis-server',['--bind','127.0.0.1','--port',String(port),'--dir',redisDir,'--save','','--appendonly','no'],{stdio:['ignore','pipe','inherit']});
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('HH3 Redis startup timeout')),10000);server.once('error',reject);server.once('exit',code=>reject(Error('Redis exited '+code)));server.stdout.on('data',data=>{if(String(data).includes('Ready to accept connections')){clearTimeout(timer);resolve();}});});
 process.env.REDIS_URL='redis://127.0.0.1:'+port;
 const {buildApp}=await import('../../backend/dist/app.js');
 const {getDatabase}=await import('../../backend/dist/brain/database.js');
 const {openShadowCeoRepository}=await import('../../backend/dist/orchestration/shadow-ceo/repository.js');
 app=await buildApp({startWorkers:false,startScheduler:false,pillowEnabled:false,earlyListen:true});
 // Reuse only the published integration fixture's explicitly synthetic inventory.
 // This is coordinator fault coverage, never full-domain initializer acceptance.
 const shadowPath=path.join(process.env.SHADOW_CEO_DATA_DIR,'shadow-ceo.db');
 const seed=openShadowCeoRepository({dbPath:shadowPath});seed.close();
 {
  const primaryPath=process.env.DATABASE_PATH;
  const stores=require('../../deployment/work8-system-vault.cjs').STORES;
  for(const [id,relative] of Object.entries(stores)){
   const file=path.join(root,relative);fs.mkdirSync(path.dirname(file),{recursive:true});const db=new DatabaseSync(file);
   try{db.exec('CREATE TABLE IF NOT EXISTS recovery_fixture(id TEXT PRIMARY KEY,value TEXT)');db.prepare('INSERT OR REPLACE INTO recovery_fixture VALUES(?,?)').run('source',id);}finally{db.close();}
  }
  for(const [suffix,appId,version,ddl] of [
   ['.missions.sqlite',0x454d5352,3,'CREATE TABLE mission_snapshot(value TEXT)'],
   ['.mission-execution.sqlite',0x454d4558,1,'CREATE TABLE execution_events(value TEXT);CREATE TABLE execution_jobs(value TEXT);CREATE TABLE execution_meta(value TEXT)']
  ]){const file=primaryPath+suffix;if(!fs.existsSync(file)){const db=new DatabaseSync(file);try{db.exec(`${ddl};PRAGMA application_id=${appId};PRAGMA user_version=${version}`);}finally{db.close();}}}
  const authority=path.join(process.env.SHADOW_CEO_DATA_DIR,'shadow-ceo-authority');fs.mkdirSync(authority,{recursive:true});fs.writeFileSync(path.join(authority,'authority-store.json'),JSON.stringify({approvals:[],blocked:[]}));fs.writeFileSync(path.join(process.env.SHADOW_CEO_DATA_DIR,'shadow-ceo-request-owners.json'),'{}');
  getDatabase().exec("CREATE TABLE recovery_app_fixture(value TEXT);INSERT INTO recovery_app_fixture VALUES('retained')");

 }

 const destination=scope.captureRoot+'/capture';
 let error;
 try{await app.captureWork8Recovery({destination,sourceCommit:process.env.HH3_SOURCE,frontendRevision:process.env.HH3_SOURCE,requireComplete:false},scope);throw Error('HH3_UNEXPECTED_SUCCESS');}
 catch(e){error=String(e);}
 assert.match(error,mode==='timeout'?/HELD_EPOCH_EXPIRED/:/HH3_LABELLED_OBSERVER_FAILURE/);
 assert.equal(fs.existsSync(destination+'/runtime-recovery.json'),false);
 process.send({event:'settled',error,destination});
 await new Promise(resolve=>process.once('message',message=>{assert.equal(message.action,'cleanup');resolve();}));
} catch(error){process.send?.({event:'failed',error:String(error),stack:error.stack});process.exitCode=1;}
finally{
 await app?.shutdown();
 if(server&&server.exitCode===null&&server.signalCode===null){const exited=once(server,'exit');server.kill('SIGKILL');await exited;}
 fs.rmSync(path.dirname(root),{recursive:true,force:true});
 process.disconnect();
}


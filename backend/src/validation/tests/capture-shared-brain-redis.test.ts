import fs from "node:fs";
import {createHash} from "node:crypto";
import os from "node:os";
import { DatabaseSync } from "node:sqlite";
import { once } from "node:events";
import { createRequire } from "node:module";
import { withExclusiveWork8DomainCapture } from "../../runtime/native-store-capture.js";
import assert from "node:assert/strict";
import childProcess, { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { BRAIN_QUEUE_NAME, TaskQueue } from "../../brain/task-queue.js";

async function until(check: () => Promise<boolean>, message: string): Promise<void> {
  for (let i = 0; i < 200; i++) {
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  throw new Error(message);
}

test("real Redis shared Brain pause drains independent BullMQ worker and refuses overlap", async t => {
  const dir = await mkdtemp(path.join(tmpdir(), "brain-global-capture-"));
  const port = await new Promise<number>((resolve, reject) => {
    const listener = createServer(); listener.once("error", reject);
    listener.listen(0, "127.0.0.1", () => {
      const address = listener.address();
      if (!address || typeof address === "string") return reject(new Error("No test port"));
      listener.close(() => resolve(address.port));
    });
  });
  const server: ChildProcess = spawn(process.env.PILLOW_TEST_REDIS_SERVER ?? "redis-server", [
    "--bind", "127.0.0.1", "--port", String(port), "--dir", dir,
    "--save", "", "--appendonly", "yes", "--appendfsync", "always",
  ], { stdio: ["ignore", "pipe", "pipe"] });
  let queue: Queue | undefined;
  let competingQueue: Queue | undefined;
  let reader: Redis | undefined;
  let worker: Worker | undefined;
  let release: (() => void) | undefined;
  t.after(async () => {
    release?.();
    await worker?.close();
    reader?.disconnect();
    await competingQueue?.close();
    await queue?.close();
    if (server.exitCode === null && server.signalCode === null) {
      const exited = new Promise<void>(resolve => server.once("exit", () => resolve()));
      server.kill("SIGKILL"); await exited;
    }
    await rm(dir, { recursive: true, force: true });
  });
  await new Promise<void>((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => reject(new Error("Redis startup timed out")), 10_000);
    server.once("error", reject);
    server.once("exit", code => reject(new Error(`Redis exited ${code}: ${output.slice(-500)}`)));
    server.stdout!.on("data", chunk => {
      output += String(chunk);
      if (output.includes("Ready to accept connections")) { clearTimeout(timeout); resolve(); }
    });
  });
  const connection = { host: "127.0.0.1", port };
  queue = new Queue(BRAIN_QUEUE_NAME, { connection });
  competingQueue = new Queue(BRAIN_QUEUE_NAME, { connection });
  reader = new Redis(connection);
  const owner = Object.assign(Object.create(TaskQueue.prototype), { queue }) as TaskQueue;
  const competitor = Object.assign(Object.create(TaskQueue.prototype), { queue: competingQueue }) as TaskQueue;
  let active!: () => void;
  const activeJob = new Promise<void>(resolve => { active = resolve; });
  const workGate = new Promise<void>(resolve => { release = resolve; });
  worker = new Worker(BRAIN_QUEUE_NAME, async () => { active(); await workGate; }, { connection });
  await queue.add("capture-test", { value: 1 });
  await activeJob;
  let captured = false;
  const capture = owner.withPausedSharedProcessing(async () => {
    assert.equal(await queue.getActiveCount(), 0);
    assert.equal(await competingQueue.isPaused(), true);
    captured = true;
  }, 5000);
  await until(() => queue.isPaused(), "queue did not globally pause");
  assert.equal(captured, false);
  await assert.rejects(competitor.withPausedSharedProcessing(() => { throw new Error("overlap ran"); }), /already owned/);
  await assert.rejects(competitor.registerScheduledJob({ name: "capture-repeat", cron: "* * * * *", payload: {} as never }), /production withheld/);
  await assert.rejects(competitor.enqueue({ type: "noop" } as never), /production withheld/);
  release!();
  await capture;
  assert.equal(captured, true);
  assert.equal(await queue.isPaused(), false);
  assert.equal(await reader.get(queue.toKey("capture-owner")), null);
  await assert.rejects(owner.withPausedSharedProcessing(async () => {
    await competingQueue.add("during-capture", { value: 3 });
  }), /queue changed during capture/);
  assert.equal(await queue.isPaused(), false);
  assert.equal(await reader.get(queue.toKey("capture-owner")), null);
  await queue.add("scheduled", { value: 2 }, { repeat: { every: 60_000 }, jobId: "schedule-fixture" });
  await until(async () => (await queue.getRepeatableJobs(0, 0)).length > 0, "repeat scheduler absent");
  let copiedWithScheduler = false;
  await assert.rejects(owner.withPausedSharedProcessing(() => { copiedWithScheduler = true; }), /repeat schedulers/);
  assert.equal(copiedWithScheduler, false);
  assert.equal(await queue.isPaused(), false);
});

// Compound Redis/domain coverage requires the Redis-enabled CI lane.
const require=createRequire(import.meta.url);
const {STORES}=require('../../../../deployment/work8-system-vault.cjs') as {STORES:Record<string,string>};
const write=(file:string)=>spawnSync(process.execPath,['-e',`
const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync(process.argv[1],{timeout:0});
try {db.exec("BEGIN IMMEDIATE; INSERT INTO evidence VALUES('later',2); COMMIT");}
catch(e){process.stderr.write(String(e));process.exitCode=7;}finally{db.close();}`,file],{encoding:'utf8',timeout:5000});
function setup(mode:'wal'|'delete'){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'domain-capture-'));const dbs:DatabaseSync[]=[];
 for(const relative of Object.values(STORES)){const file=path.join(root,relative);fs.mkdirSync(path.dirname(file),{recursive:true});const db=new DatabaseSync(file);db.exec(`PRAGMA journal_mode=${mode}; CREATE TABLE evidence(id TEXT PRIMARY KEY,n INTEGER); INSERT INTO evidence VALUES('original',1)`);dbs.push(db);}
 return {root,dbs,close(){for(const db of dbs)db.close();fs.rmSync(root,{recursive:true,force:true});}};
}

test('Redis loss during nine-domain capture refuses success and retains shared owner after AOF restart',async()=>{
 const {Queue}=await import('bullmq');const {Redis}=await import('ioredis');const {TaskQueue,BRAIN_QUEUE_NAME}=await import('../../brain/task-queue.js');
 const {createServer}=await import('node:net');
 const x=setup('wal');const redisDir=path.join(x.root,'redis');fs.mkdirSync(redisDir);
 const port=await new Promise<number>((resolve,reject)=>{const listener=createServer();listener.on('error',reject);listener.listen(0,'127.0.0.1',()=>{const a=listener.address();if(!a||typeof a==='string')return reject(Error('port'));listener.close(()=>resolve(a.port));});});
 let server:ChildProcess|undefined;let queue:InstanceType<typeof Queue>|undefined;let reader:InstanceType<typeof Redis>|undefined;
 const start=async()=>{server=childProcess.spawn(process.env.PILLOW_TEST_REDIS_SERVER??'redis-server',['--bind','127.0.0.1','--port',String(port),'--dir',redisDir,'--save','','--appendonly','yes','--appendfsync','always'],{stdio:['ignore','pipe','pipe']});
  await new Promise<void>((resolve,reject)=>{let text='';const timeout=setTimeout(()=>reject(Error('Redis startup timeout')),5000);server!.once('error',e=>{clearTimeout(timeout);reject(e);});server!.stdout!.on('data',d=>{text+=String(d);if(text.includes('Ready to accept connections')){clearTimeout(timeout);resolve();}});});};
 try{
  await start();const connection={host:'127.0.0.1',port,maxRetriesPerRequest:0,enableOfflineQueue:false,retryStrategy:()=>null};
  queue=new Queue(BRAIN_QUEUE_NAME,{connection});queue.on('error',()=>{});await queue.waitUntilReady();
  const owner=Object.assign(Object.create(TaskQueue.prototype),{queue}) as InstanceType<typeof TaskQueue>;
  const job=await queue.add('retained',{kind:'synthetic'},{jobId:'one-durable-job'});assert.ok(job.id);
  let entered=false;
  await assert.rejects(owner.withPausedSharedProcessing(()=>withExclusiveWork8DomainCapture(x.root,async()=>{
   entered=true;const stopped=once(server!,'exit');server!.kill('SIGKILL');await stopped;
   assert.equal(write(path.join(x.root,STORES.commerce!)).status,7,'SQLite lock remains held despite broker death');
  })),/closed|connect|retries|ECONN|Socket/i);
  assert.equal(entered,true);await queue.close();queue=undefined;
  await start();reader=new Redis({host:'127.0.0.1',port});reader.on('error',()=>{});await once(reader,'ready');
  queue=new Queue(BRAIN_QUEUE_NAME,{connection:{host:'127.0.0.1',port}});queue.on('error',()=>{});await queue.waitUntilReady();
  assert.ok(await reader.get(queue.toKey('capture-owner')),'uncertain capture owner is not silently removed');assert.equal(await queue.isPaused(),true);
  assert.equal((await queue.getJob('one-durable-job'))?.id,'one-durable-job');
  const later=Object.assign(Object.create(TaskQueue.prototype),{queue}) as InstanceType<typeof TaskQueue>;
  await assert.rejects(later.withPausedSharedProcessing(()=>assert.fail('uncertain capture resumed')),/already owned/);
  for(const db of x.dbs)assert.equal(db.prepare('SELECT count(*) n FROM evidence').get()?.n,1);
 }finally{reader?.disconnect();await queue?.close();if(server&&server.exitCode===null&&server.signalCode===null){const stopped=once(server,'exit');server.kill('SIGKILL');await stopped;}x.close();}
});

test('runtime recovery Redis inventory preserves binary keys, values and expiry and refuses disconnected source',async()=>{
 const {captureRedisInventory}=await import('../../runtime/work8-recovery-capture.js');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'recovery-redis-inventory-'));
 const port=await new Promise<number>((resolve,reject)=>{const listener=createServer();listener.once('error',reject);listener.listen(0,'127.0.0.1',()=>{const address=listener.address();if(!address||typeof address==='string')return reject(Error('Missing port'));listener.close(()=>resolve(address.port));});});
 const server=spawn(process.env.PILLOW_TEST_REDIS_SERVER??'redis-server',['--bind','127.0.0.1','--port',String(port),'--dir',dir,'--save','','--appendonly','no'],{stdio:['ignore','pipe','pipe']});
 let source:Redis|undefined,target:Redis|undefined;
 try{
  await new Promise<void>((resolve,reject)=>{let output='';const timeout=setTimeout(()=>reject(Error('Redis startup timeout: '+output.slice(-500))),5000);server.once('error',error=>{clearTimeout(timeout);reject(error);});server.once('exit',code=>{clearTimeout(timeout);reject(Error('Redis exited '+code+': '+output.slice(-500)));});server.stdout!.on('data',chunk=>{output+=String(chunk);if(output.toLowerCase().includes('ready to accept connections')){clearTimeout(timeout);resolve();}});});
  source=new Redis({host:'127.0.0.1',port,db:0,maxRetriesPerRequest:0,enableOfflineQueue:false});target=new Redis({host:'127.0.0.1',port,db:1});
  await until(async()=>source!.status==='ready'&&target!.status==='ready','Redis clients not ready');
  const key=Buffer.from([0,255,17]),value=Buffer.from([255,0,123]);await source.set(key,value);await source.set('expires','value','PX',60000);await source.hset('pending','job','retained');
  const owner={queue:{client:Promise.resolve(source)}} as unknown as TaskQueue;
  const rows=await captureRedisInventory(owner);assert.equal(rows.length,3);assert.ok(rows.some(row=>row.ttl>0));
  assert.equal(await target.dbsize(),0);
  for(const row of rows)await target.restore(Buffer.from(row.key,'base64'),row.ttl===-1?0:row.ttl,Buffer.from(row.dump,'base64'));
  assert.deepEqual(await target.getBuffer(key),value);assert.equal(await target.hget('pending','job'),'retained');assert.ok((await target.pttl('expires'))>0);
  source.disconnect();await assert.rejects(captureRedisInventory(owner));
 }finally{source?.disconnect();target?.disconnect();if(server.exitCode===null){const done=once(server,'exit');server.kill('SIGKILL');await done;}fs.rmSync(dir,{recursive:true,force:true});}
});

test('actual app recovery entrypoint composes inherited primary IPC, local fences and real Redis', {timeout:180000},async()=>{
 const {installPrimaryCaptureParticipant}=await import('../../runtime/work8-primary-capture.js');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'app-recovery-integration-'));const root=path.join(dir,'volume');fs.mkdirSync(root);
 const port=await new Promise<number>((resolve,reject)=>{const listener=createServer();listener.once('error',reject);listener.listen(0,'127.0.0.1',()=>{const address=listener.address();if(!address||typeof address==='string')return reject(Error('Missing port'));listener.close(()=>resolve(address.port));});});
 const server=spawn(process.env.PILLOW_TEST_REDIS_SERVER??'redis-server',['--bind','127.0.0.1','--port',String(port),'--dir',dir,'--save','','--appendonly','no'],{stdio:['ignore','pipe','pipe']});
 let child:ChildProcess|undefined;let remove:(()=>void)|undefined;let fences=0;let childOutput='';
 try{
  await new Promise<void>((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Redis timeout')),5000);server.once('error',reject);server.once('exit',code=>{clearTimeout(timer);reject(Error('Redis exited '+code+': '+output));});server.stdout!.on('data',chunk=>{output+=String(chunk);if(output.toLowerCase().includes('ready to accept connections')){clearTimeout(timer);resolve();}});});
  child=childProcess.fork(new URL('./fixtures/work8-app-recovery-child.ts',import.meta.url),[],{execArgv:['--import','tsx'],stdio:['ignore','pipe','pipe','ipc'],env:{...process.env,NODE_OPTIONS:'--max-old-space-size=8192',NODE_ENV:'test',EMPIRE_ROLE:'brain-worker',EMPIRE_ENGINEERING_TEST_MODE:'true',DATABASE_PATH:path.join(root,'brain.db'),RAILWAY_VOLUME_MOUNT_PATH:root,SHADOW_CEO_DATA_DIR:path.join(root,'shadow'),REDIS_URL:`redis://127.0.0.1:${port}`,WORK8_RECOVERY_EXAMINATION:'false',OPENAI_API_KEY:'',ANTHROPIC_API_KEY:'',GOOGLE_API_KEY:'',GEMINI_API_KEY:''}});
  child.stdout!.on('data',chunk=>{childOutput=(childOutput+String(chunk)).slice(-6000);});child.stderr!.on('data',chunk=>{childOutput=(childOutput+String(chunk)).slice(-6000);});
  remove=installPrimaryCaptureParticipant(child,async held=>{fences++;await held();});
  const result=await new Promise<any>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Worker result timeout: '+childOutput)),150000);child!.on('message',(v:any)=>{if(v?.event==='result'){clearTimeout(timer);resolve(v.result);}if(v?.event==='error'){clearTimeout(timer);reject(Error(v.error));}});child!.once('error',error=>{clearTimeout(timer);reject(error);});child!.once('exit',code=>{clearTimeout(timer);reject(Error('Worker exited '+code+' before result: '+childOutput));});});
  assert.equal(result.stores,13);assert.equal(result.completeLiveState,false);assert.equal(result.missingStoreRefused,true);assert.equal(result.sourceRecord,'retained');assert.equal(result.concurrentShadowPreserved,true);assert.equal(result.postReleaseWritePreserved,true);assert.equal(result.aliasRefusalPreserved,true);assert.equal(result.automationWritersDrained,true);assert.equal(fences,3);
 }finally{remove?.();for(const process of [child,server]){if(process&&process.exitCode===null&&process.signalCode===null){const done=once(process,'exit');process.kill('SIGKILL');await done;}}fs.rmSync(dir,{recursive:true,force:true});}
});

test('concurrent runtime writers capture with actual pending missions then replay once while restored Redis stays fenced',{timeout:180000},async()=>{
 const {restoreWork8RedisInspection}=await import('../../runtime/work8-recovery-capture.js');
 const {installPrimaryCaptureParticipant}=await import('../../runtime/work8-primary-capture.js');
 const {createMissionRuntime}=await import('@empireai/pillow');
 const {PillowHost}=await import('../../orchestration/pillow-host/pillow-host.js');
 const {createMissionExecutionService}=await import('../../orchestration/pillow-host/mission-execution/service.js');
 const {ExecutionConflict}=await import('../../orchestration/pillow-host/mission-execution/contract.js');
 const require=createRequire(import.meta.url),recovery=require('../../../../deployment/work8-recovery-set.cjs');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pending-replay-')),root=path.join(dir,'volume');fs.mkdirSync(root);
 const port=await new Promise<number>((resolve,reject)=>{const listener=createServer();listener.once('error',reject);listener.listen(0,'127.0.0.1',()=>{const address=listener.address();if(!address||typeof address==='string')return reject(Error('Missing port'));listener.close(()=>resolve(address.port));});});
 let server=spawn(process.env.PILLOW_TEST_REDIS_SERVER??'redis-server',['--bind','127.0.0.1','--port',String(port),'--dir',dir,'--save','','--appendonly','no'],{stdio:['ignore','pipe','pipe']});
 let replacement:ChildProcess|undefined;let child:ChildProcess|undefined,remove:(()=>void)|undefined,target:Redis|undefined,targetQueue:TaskQueue|undefined,stopMission:(()=>Promise<void>)|undefined;let output='';
 try{
  await new Promise<void>((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('Redis timeout')),5000);server.once('error',reject);server.once('exit',code=>{clearTimeout(timer);reject(Error('Redis exited '+code+': '+log));});server.stdout!.on('data',chunk=>{log+=String(chunk);if(log.toLowerCase().includes('ready to accept connections')){clearTimeout(timer);resolve();}});});
  const revision=spawnSync('git',['rev-parse','HEAD'],{cwd:path.resolve(import.meta.dirname,'../../../..'),encoding:'utf8'});assert.equal(revision.status,0);const sourceSha=revision.stdout.trim();assert.match(sourceSha,/^[a-f0-9]{40}$/);
  child=childProcess.fork(new URL('./fixtures/work8-replay-capture-child.ts',import.meta.url),[],{execArgv:['--import','tsx'],stdio:['ignore','pipe','pipe','ipc'],env:{...process.env,NODE_OPTIONS:'--max-old-space-size=8192',NODE_ENV:'test',EMPIRE_ROLE:'brain-worker',EMPIRE_ENGINEERING_TEST_MODE:'true',DATABASE_PATH:path.join(root,'brain.db'),RAILWAY_VOLUME_MOUNT_PATH:root,SHADOW_CEO_DATA_DIR:path.join(root,'shadow'),REDIS_URL:`redis://127.0.0.1:${port}/0`,WORK8_RECOVERY_EXAMINATION:'false',WORK8_REPLAY_SOURCE_SHA:sourceSha,OPENAI_API_KEY:'',ANTHROPIC_API_KEY:'',GOOGLE_API_KEY:'',GEMINI_API_KEY:''}});
  child.stdout!.on('data',chunk=>{output=(output+String(chunk)).slice(-7000);});child.stderr!.on('data',chunk=>{output=(output+String(chunk)).slice(-7000);});remove=installPrimaryCaptureParticipant(child,async held=>{await held();});
  const result=await new Promise<any>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Worker result timeout: '+output)),140000);child!.on('message',(v:any)=>{if(v?.event==='result'){clearTimeout(timer);resolve(v.result);}if(v?.event==='error'){clearTimeout(timer);reject(Error(v.error));}});child!.once('error',error=>{clearTimeout(timer);reject(error);});child!.once('exit',code=>{clearTimeout(timer);reject(Error('Worker exited '+code+': '+output));});});
  // Stop the source completely before reading/restoring. No source root is used
  // by the restored component; preserve it under a quarantined diagnostic name.
  if(child.exitCode===null&&child.signalCode===null){const exited=once(child,'exit');child.kill('SIGKILL');await exited;}remove();remove=undefined;fs.renameSync(root,path.join(dir,'quarantined-source'));
  const manifest=recovery.verifyRuntimeRecoverySet(result);assert.equal(manifest.bootAllowed,false);assert.equal(manifest.completeLiveState,false);
  const staged=recovery.stageRuntimeRecoveryInspection({...result,destination:path.join(dir,'inspection')});assert.equal(staged.bootAllowed,false);
  const isolated=path.join(dir,'isolated-readonly-replay');fs.mkdirSync(isolated);const primary=path.join(isolated,'restored.db');
  fs.copyFileSync(path.join(staged.directory,'sealed-evidence','missions','checkpoint.db'),primary+'.missions.sqlite');fs.copyFileSync(path.join(staged.directory,'sealed-evidence','execution','checkpoint.db'),primary+'.mission-execution.sqlite');
  const targetPort=await new Promise<number>((resolve,reject)=>{const listener=createServer();listener.once('error',reject);listener.listen(0,'127.0.0.1',()=>{const address=listener.address();if(!address||typeof address==='string')return reject(Error('Missing port'));listener.close(()=>resolve(address.port));});});
  const targetRoot=path.join(dir,'replacement');fs.mkdirSync(targetRoot);const password='isolated-examination-only';
  const startReplacement=async()=>{replacement=spawn(process.env.PILLOW_TEST_REDIS_SERVER??'redis-server',['--bind','127.0.0.1','--port',String(targetPort),'--dir',targetRoot,'--save','','--appendonly','yes','--appendfsync','always','--requirepass',password],{stdio:['ignore','pipe','pipe']});await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Replacement timeout')),5000);replacement!.once('error',reject);replacement!.stdout!.on('data',chunk=>{if(String(chunk).toLowerCase().includes('ready to accept connections')){clearTimeout(timer);resolve();}});});};
  await startReplacement();target=new Redis({host:'127.0.0.1',port:targetPort,db:0,password});await target.ping();assert.equal(await target.dbsize(),0);
  const targetRunId=(await target.info('server')).match(/^run_id:([a-f0-9]{40})\r?$/m)![1]!;assert.notEqual(targetRunId,manifest.redisIdentity.runId);
  const unauthorized=new Redis({host:'127.0.0.1',port:targetPort,lazyConnect:true,enableReadyCheck:false,retryStrategy:()=>null});unauthorized.on('error',()=>{});try{await assert.rejects(unauthorized.ping(),/NOAUTH/);}finally{unauthorized.disconnect();}
  const redisRows=JSON.parse(fs.readFileSync(path.join(staged.directory,'sealed-evidence','redis.json'),'utf8')) as Array<{key:string;dump:string;ttl:number}>;
  const restoreRequest={expectedSource:{runId:manifest.redisIdentity.runId,db:manifest.redisIdentity.db},directory:result.directory,digest:result.digest,expectedCaptureOwner:manifest.redisIdentity.owner,mode:'inspection-only' as const};
  await assert.rejects(restoreWork8RedisInspection({...restoreRequest,mode:undefined},target),/EXPLICIT_MODE/);
  await assert.rejects(restoreWork8RedisInspection({...restoreRequest,digest:'0'.repeat(64)},target));
  await assert.rejects(restoreWork8RedisInspection({...restoreRequest,expectedCaptureOwner:'stale-owner'},target),/STALE_CAPTURE_OWNER/);
  const sourceClient=new Redis({host:'127.0.0.1',port,db:0});try{await sourceClient.ping();await assert.rejects(restoreWork8RedisInspection(restoreRequest,sourceClient),/SOURCE_TARGET_REDIS_ALIAS/);}finally{sourceClient.disconnect();}
  await target.set('preexisting','must-survive');await assert.rejects(restoreWork8RedisInspection({...restoreRequest,expectedTarget:{runId:targetRunId,db:0}},target),/TARGET_NOT_EMPTY/);assert.equal(await target.get('preexisting'),'must-survive');await target.del('preexisting');
  const failureTarget=new Redis({host:'127.0.0.1',port,db:2});
  try{
   await failureTarget.ping();await failureTarget.select(0);await assert.rejects(restoreWork8RedisInspection(restoreRequest,failureTarget),/SOURCE_TARGET_REDIS_ALIAS/);await failureTarget.select(2);
   const mismatched=path.join(dir,'mismatched-owner');fs.cpSync(result.directory,mismatched,{recursive:true});
   for(const identity of [undefined,{...manifest.redisIdentity,runId:'0'.repeat(40)}]){
    const changed=JSON.stringify({...manifest,redisIdentity:identity});fs.writeFileSync(path.join(mismatched,'runtime-recovery.json'),changed);
    await assert.rejects(restoreWork8RedisInspection({...restoreRequest,directory:mismatched,digest:createHash('sha256').update(changed).digest('hex')},failureTarget),/CAPTURE_REDIS_IDENTITY_REQUIRED|SOURCE_REDIS_IDENTITY_CHANGED/);assert.equal(await failureTarget.dbsize(),0);
   }
   const altered={...manifest,redisIdentity:{...manifest.redisIdentity,owner:'incorrect-captured-owner'}};
   const encoded=JSON.stringify(altered),digest=createHash('sha256').update(encoded).digest('hex');fs.writeFileSync(path.join(mismatched,'runtime-recovery.json'),encoded);
   await assert.rejects(restoreWork8RedisInspection({directory:mismatched,digest,mode:'inspection-only',expectedCaptureOwner:altered.redisIdentity.owner},failureTarget),/CAPTURE_OWNER_MISMATCH/);
   assert.ok((await failureTarget.get(manifest.redisIdentity.ownerKey))?.includes('inspection-only'));
   await assert.rejects(restoreWork8RedisInspection(restoreRequest,failureTarget),/TARGET_NOT_EMPTY/);
   await failureTarget.select(3);
   const corruptDirectory=path.join(dir,'corrupt-late-dump');fs.cpSync(result.directory,corruptDirectory,{recursive:true});
   const corruptedRows=redisRows.map(row=>({...row}));corruptedRows.push({key:Buffer.from('zz-invalid-late-dump').toString('base64'),dump:Buffer.from('invalid-dump').toString('base64'),ttl:-1});
   const corruptedBytes=JSON.stringify(corruptedRows);fs.writeFileSync(path.join(corruptDirectory,'redis.json'),corruptedBytes);
   const corruptManifest=JSON.stringify({...manifest,redisDigest:createHash('sha256').update(corruptedBytes).digest('hex')});fs.writeFileSync(path.join(corruptDirectory,'runtime-recovery.json'),corruptManifest);
   const corruptRequest={...restoreRequest,directory:corruptDirectory,digest:createHash('sha256').update(corruptManifest).digest('hex')};
   await assert.rejects(restoreWork8RedisInspection(corruptRequest,failureTarget),/DUMP|checksum|version/i);
   assert.ok((await failureTarget.get(manifest.redisIdentity.ownerKey))?.includes('inspection-only'));assert.equal(await failureTarget.pttl(manifest.redisIdentity.ownerKey),-1);assert.equal(await failureTarget.hget(manifest.redisIdentity.metaKey,'paused'),'1');
   await assert.rejects(restoreWork8RedisInspection(restoreRequest,failureTarget),/TARGET_NOT_EMPTY/);
  }finally{failureTarget.disconnect();}
  await new Promise(resolve=>setTimeout(resolve,60));
  await assert.rejects(restoreWork8RedisInspection(restoreRequest,target),/REPLACEMENT_TARGET_IDENTITY_REQUIRED/);
  await assert.rejects(restoreWork8RedisInspection({...restoreRequest,expectedTarget:{runId:'0'.repeat(40),db:0}},target),/TARGET_REDIS_IDENTITY_CHANGED/);
  const canonical=async(client:Redis,key:Buffer)=>{const type=await client.type(key);switch(type){
   case 'string':return [type,(await client.getBuffer(key))!.toString('base64')];
   case 'hash':{const pairs=await client.hgetallBuffer(key);return [type,Object.entries(pairs).map(([k,v])=>[k,v.toString('base64')]).sort((a,b)=>a[0]!.localeCompare(b[0]!))];}
   case 'list':return [type,(await client.lrangeBuffer(key,0,-1)).map(v=>v.toString('base64'))];
   case 'set':return [type,(await client.smembersBuffer(key)).map(v=>v.toString('base64')).sort()];
   case 'zset':return [type,(await client.zrangeBuffer(key,0,-1,'WITHSCORES')).map(v=>v.toString('base64'))];
   case 'stream':return [type,await client.xrange(key,'-','+')];
   default:throw Error('Unsupported captured type '+type);
  }};
  const oracle=new Redis({host:'127.0.0.1',port,db:4}),expected=new Map<string,unknown>();
  try{await oracle.ping();assert.equal(await oracle.dbsize(),0);for(const row of redisRows){const key=Buffer.from(row.key,'base64');await oracle.restore(key,0,Buffer.from(row.dump,'base64'));expected.set(row.key,await canonical(oracle,key));}}finally{oracle.disconnect();}
  const sourceStopped=once(server,'exit');server.kill('SIGKILL');await sourceStopped;
  const realEval=target.eval.bind(target);
  // Inject an impossible target server clock into the actual Redis Lua path.
  // Refusal must precede owner/meta writes, leaving the isolated target empty.
  (target as any).eval=async(...args:any[])=>{
   assert.ok(args[0].includes("local clock=redis.call('TIME')"));
   const beforeCapture=manifest.redisCapturedAt-1;
   args[0]=args[0].replace("local clock=redis.call('TIME')",
    `local clock={${Math.floor(beforeCapture/1000)},${(beforeCapture%1000)*1000}}`);
   return (realEval as any)(...args);
  };
  await assert.rejects(restoreWork8RedisInspection({...restoreRequest,expectedTarget:{runId:targetRunId,db:0}},target),/TARGET_REDIS_CLOCK_BEFORE_CAPTURE/);
  assert.equal(await target.dbsize(),0,'backwards target clock must not partially restore any records');
  (target as any).eval=async(...args:any[])=>{args[4]='0'.repeat(40);return (realEval as any)(...args);};
  await assert.rejects(restoreWork8RedisInspection({...restoreRequest,expectedTarget:{runId:targetRunId,db:0}},target),/TARGET_REDIS_IDENTITY_CHANGED/);assert.equal(await target.dbsize(),0);
  (target as any).eval=async(...args:any[])=>{await target!.select(1);return (realEval as any)(...args);};
  const inspection=await restoreWork8RedisInspection({...restoreRequest,expectedTarget:{runId:targetRunId,db:0}},target);
  (target as any).eval=realEval;await target.select(1);assert.equal(await target.dbsize(),0);await target.select(0);assert.equal(inspection.bootAllowed,false);assert.equal(inspection.noExecutionAuthority,true);
  await assert.rejects(restoreWork8RedisInspection({...restoreRequest,expectedTarget:{runId:targetRunId,db:0}},target),/TARGET_NOT_EMPTY/);
  assert.equal(await target.get(manifest.redisIdentity.ownerKey),inspection.owner);
  const verifyCompleteInventory=async()=>{for(const row of redisRows){const key=Buffer.from(row.key,'base64');if(key.toString()===manifest.redisIdentity.ownerKey)continue;
   if(row.ttl!==-1&&manifest.redisCapturedAt+row.ttl<=Date.now())continue;
   assert.deepEqual(await canonical(target!,key),expected.get(row.key),'changed captured key '+key.toString());
  }};await verifyCompleteInventory();
  // Restore the original authenticated principal, not a newly minted session.
  // This replacement HTTP app uses the production auth middleware/SessionStore;
  // the historical archive retains its inspection fence and grants no execution.
  const {default:Fastify}=await import('fastify');
  const {default:cookie}=await import('@fastify/cookie');
  const {SessionStore}=await import('../../auth/session-store.js');
  const {createAuthMiddleware}=await import('../../auth/middleware.js');
  const verifyOriginalSession=async()=>{
   const store=new SessionStore(target!);const recovered=await store.get(result.originalSession.token);
   assert.deepEqual(recovered,result.originalSession,'original token/principal/workspace/expiry changed');
   const app=Fastify();await app.register(cookie);
   app.get('/auth/me',{preHandler:createAuthMiddleware(store)},async request=>({user:request.user}));
   try{
    for(const headers of [{authorization:'Bearer '+result.originalSession.token},{cookie:'empireai_session='+result.originalSession.token}]){
     const reply=await app.inject({method:'GET',url:'/auth/me',headers});assert.equal(reply.statusCode,200);
     const {token,expiresAt,createdAt,...user}=result.originalSession;assert.deepEqual(reply.json().user,user);
    }
    assert.equal((await app.inject({method:'GET',url:'/auth/me',headers:{authorization:'Bearer forged-'+result.originalSession.token}})).statusCode,401);
    assert.equal((await app.inject({method:'GET',url:'/auth/me'})).statusCode,401);
    const key='empireai:session:'+result.originalSession.token;
    const ttl=await target!.pttl(key);assert.ok(ttl>0);assert.ok(ttl<=Date.parse(result.originalSession.expiresAt)-Date.now()+1000,'restoration extended session lifetime');
    assert.equal(await target!.get(manifest.redisIdentity.ownerKey),inspection.owner,'authentication released inspection fence');
   }finally{await app.close();}
  };
  await verifyOriginalSession();
  const capturedExpiry=redisRows.find(row=>Buffer.from(row.key,'base64').toString()==='inspection-expiring-fixture')!;assert.ok(capturedExpiry.ttl>0);assert.ok(await target.pttl('inspection-expiring-fixture')<=capturedExpiry.ttl-50);
  target.disconnect();const stopped=once(replacement!,'exit');replacement!.kill('SIGKILL');await stopped;
  await startReplacement();target=new Redis({host:'127.0.0.1',port:targetPort,db:0,password});await target.ping();assert.equal(await target.get(manifest.redisIdentity.ownerKey),inspection.owner);assert.equal(fs.existsSync(path.join(targetRoot,'dump.rdb')),false);await verifyCompleteInventory();await verifyOriginalSession();
  const restartedUnauthorized=new Redis({host:'127.0.0.1',port:targetPort,lazyConnect:true,enableReadyCheck:false,retryStrategy:()=>null});restartedUnauthorized.on('error',()=>{});try{await assert.rejects(restartedUnauthorized.ping(),/NOAUTH/);}finally{restartedUnauthorized.disconnect();}

  targetQueue=new TaskQueue({host:'127.0.0.1',port:targetPort,db:0,password},{write(){assert.fail('restored queue must not admit new work');}} as any);
  assert.equal(await targetQueue.queue.isPaused(),true);assert.ok(await target.get(targetQueue.queue.toKey('capture-owner')));
  const restoredJob=await targetQueue.queue.getJob(result.queueJobId);assert.ok(restoredJob);assert.deepEqual(restoredJob.data,result.payload);
  await assert.rejects(targetQueue.enqueue(result.payload,{jobId:'unauthorized-restored-admission'}),/production withheld/);
  const restoredNative=new DatabaseSync(path.join(staged.directory,'sealed-evidence','liveCostCentre','checkpoint.db'),{readOnly:true});try{assert.equal(restoredNative.prepare('SELECT phase FROM integrated_capture_writer WHERE kind=?').get('native-background')!.phase,'committed');}finally{restoredNative.close();}
  const engine=createMissionRuntime({repositoryRoot:path.resolve(import.meta.dirname,'../../../..')} as any,{persistenceFile:primary+'.missions.sqlite',persistenceScope:result.scope});await engine.initialize();
  const host=new PillowHost();host.lifecycle='running';host.pillowSession={missionRuntime:engine,contextBuilder:{}} as any;
  const service=createMissionExecutionService({databasePath:primary,scope:result.scope,buildSha:result.buildSha,host});stopMission=()=>service.runner.stop();
  assert.deepEqual(service.getTrustedReceipt(result.completed.jobId),result.completed.receipt);assert.equal(service.get(result.pending.jobId)!.status,'queued');
  service.runner.resume();await service.runner.tick();await service.runner.stop();
  const continued=service.get(result.pending.jobId)!;assert.equal(continued.status,'completed');assert.equal(continued.attempts,1);assert.equal(continued.reconciled,true);
  assert.equal(continued.receipt!.output.authority.birthStatus,'NOT_BORN');assert.equal(continued.receipt!.output.authority.commerceStatus,'LOCKED');assert.equal(continued.receipt!.certificationCredit,false);
  assert.deepEqual(service.getTrustedReceipt(result.completed.jobId),result.completed.receipt);
  const receipt=continued.receipt;service.runner.resume();await service.runner.tick();await service.runner.tick();await service.runner.stop();assert.deepEqual(service.getTrustedReceipt(result.pending.jobId),receipt);
  const replay=service.enqueue(result.pending.missionId,result.pending.dispatchId);assert.equal(replay.created,false);assert.equal(replay.job.attempts,1);
  assert.throws(()=>service.enqueue(result.pending.missionId,'forged-dispatch'),ExecutionConflict);
  const db=new DatabaseSync(primary+'.mission-execution.sqlite',{readOnly:true});let outputs:number;try{outputs=Number(db.prepare("SELECT count(*) n FROM execution_events WHERE event='readonly_output_and_receipt_committed'").get()!.n);assert.equal(outputs,2);}finally{db.close();}
  assert.equal(await targetQueue.queue.isPaused(),true);assert.ok(await target.get(targetQueue.queue.toKey('capture-owner')));
  const receiptSummary={integratedWriterClasses:['http','native-background','presale-timer','executive-timer'],sourceSha,captureDigest:result.digest,stores:Object.keys(manifest.stores).length,sourceQuarantined:true,restoredQueuePaused:true,restoredProducerRefused:true,completedReceiptByteEquivalent:true,pendingContinuedOnce:true,pendingReconciled:true,committedOutputEvents:outputs,duplicateReadSuppressed:true,changedDispatchRefused:true,birth:'NOT_BORN',commerce:'LOCKED',fullRuntimeRestored:false,protectedCustody:false,inspectionOwnerBoundToManifest:true,redisRestartFencePreserved:true,distinctReplacementInstance:true,sourceRedisStoppedBeforeRestore:true,completeSurvivingRedisInventoryValueEquivalent:true,passwordAuthenticationRequired:true,originalSessionPrincipalAndExpiryPreserved:true,originalBearerAndCookieAuthenticateAfterReplacementAndAofRestart:true,forgedAndAbsentSessionsDenied:true,aofOnlyCrashRecovery:true,defaultAndStaleAndWrongManifestAndSourceAndNonemptyRefused:true,remaining:'Inspection ownership transferred; queue transport remains fenced. No operational release or full-runtime restore claimed'};
  if(process.env.WORK8_REPLAY_EVIDENCE_DIRECTORY){
   const evidence=process.env.WORK8_REPLAY_EVIDENCE_DIRECTORY;
   fs.writeFileSync(path.join(evidence,'READONLY-REPLAY-RECEIPT.json'),JSON.stringify(receiptSummary,null,2)+'\n',{mode:0o600});
   fs.writeFileSync(path.join(evidence,'READONLY-REPLAY-ACTUAL-RECEIPTS.json'),JSON.stringify({historical:result.completed.receipt,continued:receipt,queuedPayload:result.payload,manifest},null,2)+'\n',{mode:0o600});
   fs.copyFileSync(primary+'.mission-execution.sqlite',path.join(evidence,'readonly-replay-execution.sqlite'));
   fs.copyFileSync(path.join(staged.directory,'sealed-evidence','brain','checkpoint.db'),path.join(evidence,'integrated-brain.sqlite'));
   fs.copyFileSync(path.join(staged.directory,'sealed-evidence','liveCostCentre','checkpoint.db'),path.join(evidence,'integrated-native-domain.sqlite'));
   fs.copyFileSync(primary+'.missions.sqlite',path.join(evidence,'readonly-replay-missions.sqlite'));
  }
 }finally{await stopMission?.();await targetQueue?.close();target?.disconnect();remove?.();for(const process of [child,server,replacement])if(process&&process.exitCode===null&&process.signalCode===null){const done=once(process,'exit');process.kill('SIGKILL');await done;}fs.rmSync(dir,{recursive:true,force:true});}
});

async function producerFenceFixture(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'producer-capture-'));
 const port=await new Promise<number>((resolve,reject)=>{const listener=createServer();listener.once('error',reject);listener.listen(0,'127.0.0.1',()=>{const address=listener.address();if(!address||typeof address==='string')return reject(Error('Missing port'));listener.close(()=>resolve(address.port));});});
 const server=spawn(process.env.PILLOW_TEST_REDIS_SERVER??'redis-server',['--bind','127.0.0.1','--port',String(port),'--dir',dir,'--save','','--appendonly','no'],{stdio:['ignore','pipe','pipe']});
 await new Promise<void>((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('Redis timeout: '+log)),5000);server.once('error',reject);server.stdout!.on('data',chunk=>{log+=String(chunk);if(log.toLowerCase().includes('ready to accept connections')){clearTimeout(timer);resolve();}});});
 const reader=new Redis({host:'127.0.0.1',port});await reader.ping();const owner=new TaskQueue({host:'127.0.0.1',port},{write(){}} as any);await owner.queue.waitUntilReady();
 const file=path.join(dir,'producer-audit.sqlite');
 const child=childProcess.fork(new URL('./fixtures/work8-producer-capture-child.ts',import.meta.url),[],{execArgv:['--import','tsx'],stdio:['ignore','ignore','pipe','ipc'],env:{...process.env,WORK8_REDIS_PORT:String(port),WORK8_PRODUCER_AUDIT:file}});
 await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Producer did not reach admission')),10000);child.on('message',(message:any)=>{if(message?.event==='admitted-before-add'){clearTimeout(timer);resolve();}else if(message?.event==='failed'){clearTimeout(timer);reject(Error(message.error));}});child.once('error',reject);});
 return {dir,port,reader,owner,child,file,async close(){if(child.connected)child.send({action:'release'});if(child.exitCode===null&&child.signalCode===null){const exited=once(child,'exit');child.kill('SIGKILL');await exited;}await owner.close();reader.disconnect();if(server.exitCode===null&&server.signalCode===null){const exited=once(server,'exit');server.kill('SIGKILL');await exited;}fs.rmSync(dir,{recursive:true,force:true});}};
}

test('shared capture waits for cross-process producer admission through queue and audit settlement',async()=>{
 const f=await producerFenceFixture();let attempt:Promise<void>|undefined;
 try{
  let entered=false;
  attempt=f.owner.withPausedSharedProcessing(async()=>{entered=true;assert.ok(await f.owner.queue.getJob('admitted-job'));const db=new DatabaseSync(f.file,{readOnly:true});try{assert.equal(db.prepare('SELECT count(*) n FROM audit').get()!.n,1);}finally{db.close();}},2000);
  void attempt.catch(()=>{});
  await new Promise(resolve=>setTimeout(resolve,80));assert.equal(entered,false,'capture escaped a producer admitted before its queue mutation');
  await assert.rejects(f.owner.enqueue({type:'tool.execute',workspaceId:'isolated-producer',toolName:'fixture-no-consumer',input:{}}),/production withheld/);
  const exited=once(f.child,'exit');f.child.send({action:'release'});await attempt;await exited;assert.equal(entered,true);
  assert.equal(await f.reader.scard(f.owner.queue.toKey('capture-producers')),0);
 }finally{await attempt?.catch(()=>{});await f.close();}
});

test('shared capture refuses crashed producer admission and uncertain failures retain every admission',async()=>{
 const f=await producerFenceFixture();
 try{
  const exited=once(f.child,'exit');f.child.kill('SIGKILL');await exited;
  assert.equal(await f.reader.scard(f.owner.queue.toKey('capture-producers')),1);
  assert.equal(await f.reader.pttl(f.owner.queue.toKey('capture-producers')),-1);
  let entered=false;await assert.rejects(f.owner.withPausedSharedProcessing(()=>{entered=true;},30),/producers did not drain/);assert.equal(entered,false);
  const original=f.owner.queue.add.bind(f.owner.queue);
  let expectedAdmissions=2;
  f.owner.queue.add=async()=>{assert.equal(await f.reader.scard(f.owner.queue.toKey('capture-producers')),expectedAdmissions++);throw Error('injected add failure');};
  await assert.rejects(f.owner.enqueue({type:'tool.execute',workspaceId:'isolated-producer',toolName:'fixture-no-consumer',input:{}}),/injected add failure/);
  await assert.rejects(f.owner.registerScheduledJob({name:'fixture',cron:'* * * * *',payload:{type:'tool.execute',workspaceId:'isolated-producer',toolName:'fixture-no-consumer',input:{},correlationId:'schedule'}}),/injected add failure/);
  f.owner.queue.add=original;
  assert.equal(await f.reader.scard(f.owner.queue.toKey('capture-producers')),3,'failed operations retain admission and cannot retire a crashed sibling');
  await assert.rejects(f.owner.withPausedSharedProcessing(()=>assert.fail('crashed producer allowed capture'),30),/producers did not drain/);
  const client=await f.owner.queue.client as unknown as {eval:(...args:any[])=>Promise<any>};const evalOriginal=client.eval.bind(client);
  client.eval=async(...args:any[])=>{if(String(args[0]).includes('srem'))throw Error('producer release uncertain');return evalOriginal(...args);};
  try{await assert.rejects(f.owner.enqueue({type:'tool.execute',workspaceId:'isolated-producer',toolName:'fixture-no-consumer',input:{}},{jobId:'release-unknown'}),/release uncertain/);}finally{client.eval=evalOriginal;}
  assert.ok(await f.owner.queue.getJob('release-unknown'));assert.equal(await f.reader.scard(f.owner.queue.toKey('capture-producers')),4);
  await assert.rejects(f.owner.withPausedSharedProcessing(()=>assert.fail('uncertain release allowed capture'),30),/producers did not drain/);
  const auditFailure=new TaskQueue({host:'127.0.0.1',port:f.port},{write(){throw Error('audit write failed');}} as any);
  try{await assert.rejects(auditFailure.enqueue({type:'tool.execute',workspaceId:'isolated-producer',toolName:'fixture-no-consumer',input:{}},{jobId:'audit-unknown'}),/audit write failed/);}finally{await auditFailure.close();}
  assert.ok(await f.owner.queue.getJob('audit-unknown'));assert.equal(await f.reader.scard(f.owner.queue.toKey('capture-producers')),5);
  await assert.rejects(f.owner.withPausedSharedProcessing(()=>assert.fail('failed audit admitted capture'),30),/producers did not drain/);


 }finally{await f.close();}
});

test('shared capture refuses a rejected producer whose real Redis command can still commit later',async()=>{
 const f=await producerFenceFixture();let release!:()=>void,late:Promise<unknown>|undefined;
 try{
  const exited=once(f.child,'exit');f.child.send({action:'release'});await exited;
  const original=f.owner.queue.add.bind(f.owner.queue);const unresolved=new Promise<void>(resolve=>{release=resolve;});
  // Fault-injected transport contract: rejected promise does not cancel the
  // separately pending real Redis mutation. This is not a production trace.
  f.owner.queue.add=async(...args:Parameters<typeof original>)=>{late=unresolved.then(()=>original(...args));throw Error('reply lost; operation outcome unknown');};
  await assert.rejects(f.owner.enqueue({type:'tool.execute',workspaceId:'isolated-producer',toolName:'fixture-no-consumer',input:{}},{jobId:'late-unknown'}),/outcome unknown/);
  let entered=false;await assert.rejects(f.owner.withPausedSharedProcessing(()=>{entered=true;},30),/producers did not drain/);assert.equal(entered,false);
  assert.equal(await f.reader.scard(f.owner.queue.toKey('capture-producers')),1);
  release();await late;assert.ok(await f.owner.queue.getJob('late-unknown'));
  await assert.rejects(f.owner.withPausedSharedProcessing(()=>assert.fail('unknown outcome admitted capture'),30),/producers did not drain/);
 }finally{release?.();await late?.catch(()=>{});await f.close();}
});

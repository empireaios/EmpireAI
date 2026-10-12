import fs from "node:fs";
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
  assert.equal(result.stores,13);assert.equal(result.completeLiveState,false);assert.equal(result.missingStoreRefused,true);assert.equal(result.sourceRecord,'retained');assert.equal(result.concurrentShadowPreserved,true);assert.equal(result.postReleaseWritePreserved,true);assert.equal(result.aliasRefusalPreserved,true);assert.equal(fences,3);
 }finally{remove?.();for(const process of [child,server]){if(process&&process.exitCode===null&&process.signalCode===null){const done=once(process,'exit');process.kill('SIGKILL');await done;}}fs.rmSync(dir,{recursive:true,force:true});}
});

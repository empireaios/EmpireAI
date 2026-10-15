import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const root=process.env.RAILWAY_VOLUME_MOUNT_PATH!,base=path.dirname(root),buildSha=process.env.WORK8_REPLAY_SOURCE_SHA!;
let shutdown:(()=>Promise<void>)|undefined;
let stopMission:(()=>Promise<void>)|undefined;
const releaseWriters:Array<()=>void>=[],restoreAutomations:Array<()=>Promise<void>>=[];
try{
 const {buildApp}=await import('../../../app.js');
 const {TaskQueue}=await import('../../../brain/task-queue.js');
 const {openShadowCeoRepository}=await import('../../../orchestration/shadow-ceo/repository.js');
 const {createMissionRuntime}=await import('@empireai/pillow');
 const {PillowHost}=await import('../../../orchestration/pillow-host/pillow-host.js');
 const {createMissionExecutionService}=await import('../../../orchestration/pillow-host/mission-execution/service.js');
 const {AUTHORITY_WORKER}=await import('../../../orchestration/pillow-host/mission-execution/contract.js');
 const app=await buildApp({startWorkers:false,startScheduler:false,pillowEnabled:false,earlyListen:true});shutdown=app.shutdown;
 const primary=process.env.DATABASE_PATH!,scope={workspaceId:'ws_empire_1' as const,ownerEmail:'replay-owner@invalid.test'};
 const engine=createMissionRuntime({repositoryRoot:path.resolve(import.meta.dirname,'../../../../..')} as any,{persistenceFile:primary+'.missions.sqlite',persistenceScope:scope});
 await engine.initialize();const host=new PillowHost();host.lifecycle='running';host.pillowSession={missionRuntime:engine,contextBuilder:{}} as any;
 const service=createMissionExecutionService({databasePath:primary,scope,buildSha,host});stopMission=()=>service.runner.stop();
 const done=engine.execute({missionName:'Completed readonly capture exam',workers:[AUTHORITY_WORKER],pillowConfirmed:true,grandKingApproved:true,highRisk:false});
 assert.ok(done.authorityExecution?.jobId);service.runner.resume();await service.runner.tick();await service.runner.stop();
 const completed=service.get(done.authorityExecution!.jobId!)!;assert.equal(completed.status,'completed');assert.equal(completed.reconciled,true);
 const next=engine.execute({missionName:'Pending readonly capture exam',workers:[AUTHORITY_WORKER],pillowConfirmed:true,grandKingApproved:true,highRisk:false});
 assert.ok(next.authorityExecution?.jobId);const pending=service.get(next.authorityExecution!.jobId!)!;assert.equal(pending.status,'queued');
 const shadow=openShadowCeoRepository({dbPath:path.join(process.env.SHADOW_CEO_DATA_DIR!,'shadow-ceo.db')});shadow.close();
 const stores=require('../../../../../deployment/work8-system-vault.cjs').STORES as Record<string,string>;
 for(const [id,relative] of Object.entries(stores)){const file=path.join(root,relative);fs.mkdirSync(path.dirname(file),{recursive:true});const db=new DatabaseSync(file);try{db.exec('CREATE TABLE IF NOT EXISTS replay_fixture(id TEXT PRIMARY KEY,value TEXT)');db.prepare('INSERT OR REPLACE INTO replay_fixture VALUES(?,?)').run('source',id);}finally{db.close();}}
 const authority=path.join(process.env.SHADOW_CEO_DATA_DIR!,'shadow-ceo-authority');fs.mkdirSync(authority,{recursive:true});fs.writeFileSync(path.join(authority,'authority-store.json'),JSON.stringify({approvals:[],blocked:[]}));fs.writeFileSync(path.join(process.env.SHADOW_CEO_DATA_DIR!,'shadow-ceo-request-owners.json'),'{}');
 assert.ok(app.brain.taskQueue instanceof TaskQueue);const queue=app.brain.taskQueue;
 const {SessionStore}=await import('../../../auth/session-store.js');
 const originalSession=await new SessionStore(await queue.queue.client as unknown as import('ioredis').Redis).create({id:'hh4-recovery-owner',email:'hh4-recovery-owner@example.test',name:'Synthetic recovery owner',role:'founder',workspaceId:scope.workspaceId});
 const payload={type:'tool.execute' as const,workspaceId:scope.workspaceId,toolName:'authority.snapshot.v1',input:{executionJobId:pending.jobId,examinationOnly:true},correlationId:'readonly-recovery-exam'};
 const first=await queue.enqueue(payload,{jobId:'readonly-pending-replay'}),second=await queue.enqueue(payload,{jobId:'readonly-pending-replay'});assert.equal(first.jobId,second.jobId);
 await (await queue.queue.client as unknown as import('ioredis').Redis).set('inspection-expiring-fixture','historical-only','PX',60000);
 // One integrated boundary: known admitted HTTP, registered native background,
 // and both real automation timer lifecycles coexist with actual pending work.
 const {getDatabase}=await import('../../../brain/database.js');
 const {runCaptureAwareBackground}=await import('../../../runtime/work8-background-capture.js');
 const {getPillowCommercePresaleAutomationServer}=await import('../../../orchestration/pillow-commerce-presale/automation/pillow-commerce-presale-automation.js');
 const {getPillowExecutiveLoopAutomationServer}=await import('../../../orchestration/pillow-commissioning/executive-operating-loop/automation.js');
 getDatabase().exec('CREATE TABLE integrated_capture_writer(kind TEXT PRIMARY KEY,phase TEXT)');
 const admitted:Array<Promise<void>>=[];
 const writer=(kind:string,native=false)=>{
  let begin!:()=>void,release!:()=>void;admitted.push(new Promise<void>(resolve=>{begin=resolve;}));
  const gate=new Promise<void>(resolve=>{release=resolve;});releaseWriters.push(release);
  return async()=>{begin();await gate;
   if(native){const db=new DatabaseSync(path.join(root,stores.liveCostCentre!));try{db.exec('CREATE TABLE integrated_capture_writer(kind TEXT PRIMARY KEY,phase TEXT)');db.prepare('INSERT INTO integrated_capture_writer VALUES(?,?)').run(kind,'committed');}finally{db.close();}}
   else getDatabase().prepare('INSERT INTO integrated_capture_writer VALUES(@kind,@phase)').run({kind,phase:'committed'});
  };
 };
 const httpWriter=writer('http');app.app.get('/fixture/integrated-writer',async()=>{await httpWriter();return {committed:true};});
 const originalAuthentication=await app.app.inject({method:'GET',url:'/auth/me',headers:{authorization:'Bearer '+originalSession.token}});assert.equal(originalAuthentication.statusCode,200);
 const http=app.app.inject({method:'GET',url:'/fixture/integrated-writer'});
 const background=runCaptureAwareBackground(writer('native-background',true));
 for(const [kind,server,delay] of [
  ['presale',getPillowCommercePresaleAutomationServer(),'PILLOW_COMMERCE_PRESALE_BOOT_DELAY_MS'],
  ['executive',getPillowExecutiveLoopAutomationServer(),'PILLOW_EXECUTIVE_LOOP_BOOT_DELAY_MS']
 ] as const){
  const task=(server as unknown as {task:{options:{run:()=>Promise<unknown>|unknown}}}).task;
  const original=task.options.run;task.options.run=writer(kind);
  restoreAutomations.push(async()=>{await server.stop();task.options.run=original;});
  process.env[delay]='0';process.env.EMPIRE_ENGINEERING_TEST_MODE='false';server.start();
 }
 await Promise.all(admitted);process.env.EMPIRE_ENGINEERING_TEST_MODE='true';
 let settled=false;
 const capturing=app.captureWork8Recovery({destination:path.join(base,'capture'),sourceCommit:buildSha,frontendRevision:buildSha,requireComplete:false}).finally(()=>{settled=true;});
 // Release one writer class at a time. No capture may complete while any of
 // these already-admitted writers still owns a future commit.
 for(const release of releaseWriters){await new Promise(resolve=>setTimeout(resolve,30));assert.equal(settled,false,'capture completed before admitted writer committed');release();}
 assert.equal((await http).statusCode,200);await background;
 const captured=await capturing;
 const brainCopy=new DatabaseSync(path.join(captured.directory,'brain','checkpoint.db'),{readOnly:true});
 try{assert.deepEqual(brainCopy.prepare('SELECT kind,phase FROM integrated_capture_writer ORDER BY kind').all().map(row=>({...row})),[{kind:'executive',phase:'committed'},{kind:'http',phase:'committed'},{kind:'presale',phase:'committed'}]);}finally{brainCopy.close();}
 const nativeCopy=new DatabaseSync(path.join(captured.directory,'liveCostCentre','checkpoint.db'),{readOnly:true});
 try{assert.equal(nativeCopy.prepare('SELECT phase FROM integrated_capture_writer WHERE kind=?').get('native-background')!.phase,'committed');}finally{nativeCopy.close();}

 process.send!({event:'result',result:{directory:captured.directory,digest:captured.digest,completed,pending,scope,buildSha,queueJobId:first.jobId,payload,originalSession,originalAuthentication:originalAuthentication.json()}});
}catch(error){process.send?.({event:'error',error:error instanceof Error?error.stack:String(error)});process.exitCode=1;}
finally{process.env.EMPIRE_ENGINEERING_TEST_MODE='true';for(const release of releaseWriters)release();for(const restore of restoreAutomations)await restore();await stopMission?.();await shutdown?.();process.disconnect();}

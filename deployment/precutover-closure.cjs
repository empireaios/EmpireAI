'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawn,spawnSync}=require('node:child_process');
const {DatabaseSync}=require('node:sqlite');
const {createRequire}=require('node:module');
const req=createRequire(path.resolve('backend/package.json'));const {Redis}=req('ioredis');
const {ACK,backup,restore}=require('./locked-state-bundle.cjs');
const {configuration}=require('./locked-runtime.cjs');
const root=fs.mkdtempSync('/data/precutover-'),repo=path.resolve(__dirname,'..');
const output=path.resolve(process.env.PRECUTOVER_EVIDENCE_DIR||'precutover-evidence');fs.mkdirSync(output,{recursive:true});
const buildSha=process.env.PR_HEAD_SHA||process.env.GITHUB_SHA||spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim();
const secret=()=>crypto.randomBytes(32).toString('hex'),password=secret();
const base={PATH:process.env.PATH,HOME:process.env.HOME,EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',EMPIRE_LOCKED_REDIS_HOST:'127.0.0.1',
 FOUNDER_EMAIL:'closure-owner@example.invalid',ADMIN_EMAIL:'closure-admin@example.invalid',FOUNDER_PASSWORD:secret(),ADMIN_PASSWORD:secret(),SESSION_SECRET:secret(),CORS_ORIGIN:'https://empire-ai.co',RAILWAY_GIT_COMMIT_SHA:buildSha};
let app,redisProcess,redis,logs='',port=4250,redisPort=6391;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function child(command,args,env){const p=spawn(command,args,{cwd:repo,env,stdio:['ignore','pipe','pipe']});p.stdout.on('data',b=>{logs+=b});p.stderr.on('data',b=>{logs+=b});return p;}
async function stop(p){
 if(!p||p.exitCode!==null)return;
 const ended=new Promise((resolve,reject)=>{
  const t=setTimeout(()=>{p.kill('SIGKILL');reject(Error('Unclean stop'));},25000);
  p.once('exit',(code,signal)=>{clearTimeout(t);code===0&&!signal?resolve():reject(Error('Unclean child exit'));});
 });
 p.kill('SIGTERM');await ended;
}
async function http(route,method='GET',body,cookie){const r=await fetch(`http://127.0.0.1:${port}${route}`,{method,headers:{...(body?{'content-type':'application/json'}:{}),...(cookie?{cookie}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(10000)});return{status:r.status,data:await r.json(),headers:r.headers};}
async function launch(volume,redisDir){
 fs.mkdirSync(volume,{recursive:true});fs.mkdirSync(redisDir,{recursive:true});
 redisProcess=child(process.env.PILLOW_TEST_REDIS_SERVER||'redis-server',['--bind','127.0.0.1','--port',String(redisPort),'--dir',redisDir,'--save','','--appendonly','yes','--appendfsync','always','--requirepass',password],{PATH:process.env.PATH});
 redis=new Redis({host:'127.0.0.1',port:redisPort,password,retryStrategy:()=>100,maxRetriesPerRequest:1});redis.on('error',()=>{});
 for(let i=0;i<50;i++){try{if(await redis.ping()==='PONG')break;}catch{}await pause(100);}
 const env={...base,PORT:String(port),REDIS_URL:`redis://default:${password}@127.0.0.1:${redisPort}/0`,RAILWAY_VOLUME_MOUNT_PATH:volume,DATABASE_PATH:path.join(volume,'commissioning','empireai-brain.db')};
 configuration(env);app=child(process.execPath,['deployment/locked-runtime.cjs'],env);
 for(let i=0;i<240;i++){assert.equal(app.exitCode,null,'Runtime exited');try{const r=await http('/health/ready');if(r.status===200&&r.data.ready){assert.equal(r.data.operational,false);assert.equal(r.data.birth,'NOT_BORN');assert.equal(r.data.commerce,'LOCKED');return env;}}catch(e){if(/Runtime exited/.test(String(e)))throw e;}await pause(500);}
 throw Error('Permanent runtime readiness timeout');
}
async function login(){const r=await http('/auth/login','POST',{email:base.FOUNDER_EMAIL,password:base.FOUNDER_PASSWORD});assert.equal(r.status,200);const cookie=r.headers.get('set-cookie').match(/empireai_session=([^;]+)/)[0];return{cookie,id:r.data.user.id};}
async function locks(cookie){const birth=await http('/pillow-commissioning/birth','GET',undefined,cookie);assert.equal(birth.status,200);assert.equal(birth.data.status,'NOT_BORN');assert.equal(birth.data.authority.realCommerceAuthorized,false);
 for(const route of ['/pillow-commerce-presale/run','/pillow-commissioning/birth','/amazon/publish','/amazon/inventory','/amazon/price','/cj/orders','/fulfilment','/api/pillow/mission-runtime/execute'])assert.equal((await http(route,'POST',{approved:true,force:true},cookie)).status,423,route);
}
async function terminal(id,cookie){for(let i=0;i<180;i++){const r=await http('/api/pillow/chat-request/'+id,'GET',undefined,cookie);if(r.data.request?.status==='COMPLETED')return r.data.request;assert.notEqual(r.data.request?.status,'FAILED_FATAL','Authority request failed');await pause(500);}throw Error('Terminal timeout');}
function shadow(env,mode){
 const code=`import assert from 'node:assert/strict';import {openShadowCeoRepository} from './backend/dist/orchestration/shadow-ceo/repository.js';import {persistRequestOwner,getRequestOwner} from './backend/dist/orchestration/shadow-ceo-integration/request-owner.js';import {attemptExternalActionAndPersist,listBlockedActions} from './backend/dist/orchestration/shadow-ceo-authority/index.js';
 const repo=openShadowCeoRepository();const row={id:'closure-shadow',kind:'objective',objectiveId:'closure',idempotencyKey:'closure-shadow',createdAt:'2026-10-01T00:00:00Z',updatedAt:'2026-10-01T00:00:00Z',continuity:'preserved'};
 if(${JSON.stringify(mode)}==='seed'){repo.upsert(row);persistRequestOwner({requestId:'closure-owner',runId:'closure',correlationId:'closure',completeInstruction:'do not execute commerce',suppliedProducts:[],eligibilityRules:{},requestedBusinessOperation:'none',permittedActions:[],prohibitedActions:['commerce'],requestedAnswerFormat:{expectedLineCount:null,fieldNames:[],requiredToken:null,prohibitsExtraProse:false,template:'unspecified'},operatingMode:'SYNTHETIC',birthStatus:'NOT_BORN',realCommerceAuthority:'unauthorized',createdAt:row.createdAt,workspaceId:'ws_empire_1',instructionDigest:'closure-owner'});assert.equal(attemptExternalActionAndPersist({kind:'money_move',mode:'SYNTHETIC',approvalStatus:'none'}).decision,'BLOCKED');}
 assert.deepEqual(repo.getByIdempotencyKey('objective','closure-shadow'),row);assert.equal(repo.upsert(row).id,'closure-shadow');assert.equal(getRequestOwner('closure-owner').realCommerceAuthority,'unauthorized');assert.equal(listBlockedActions().length,1);repo.close();console.log('SHADOW_CONTINUITY_OK');`;
 const result=spawnSync(process.execPath,['--input-type=module','-e',code],{cwd:repo,env:configuration(env),encoding:'utf8',timeout:20000});assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/SHADOW_CONTINUITY_OK/);
}
function accounts(filename){const db=new DatabaseSync(filename,{readOnly:true});try{assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');return db.prepare('SELECT id,email,role,workspace_id FROM users ORDER BY id').all();}finally{db.close();}}
(async()=>{let receipt={schema:'precutover-closure-v1',buildSha,productionTouched:false,commerce:'LOCKED',birth:'NOT_BORN',passed:false};
try{
 const volume=path.join(root,'source-volume'),redisDir=path.join(root,'source-redis');const env=await launch(volume,redisDir);const owner=await login();await locks(owner.cookie);
 const created=await http('/api/pillow/mission-runtime/create-mission','POST',{missionName:'LOCKED_CLOSURE_UNAPPROVED',missionType:'enterprise',workers:[],highRisk:true,pillowConfirmed:false,grandKingApproved:false},owner.cookie);assert.equal(created.status,200);const mission=created.data.report.mission;assert.ok(mission.missionId);
 const body={sessionId:'closure-authority',message:'What is your current authority? Do not execute tools, commerce or spending.'};const accepted=await http('/api/pillow/chat','POST',body,owner.cookie);assert.ok([200,202].includes(accepted.status));const id=accepted.headers.get('x-empire-pillow-request-id')||accepted.data.result.requestId;const result=await terminal(id,owner.cookie);assert.equal(result.attemptCount,1);
 // Observe ongoing process under permanent settings; this is a bounded closure, not 24/7 certification.
 for(let i=0;i<6;i++){await pause(5000);assert.equal((await http('/health/ready')).status,200);await locks(owner.cookie);}
 const history=(await http('/api/pillow/mission-runtime/history','POST',{},owner.cookie)).data;
 await stop(app);app=null;redis.disconnect();await stop(redisProcess);redisProcess=null;
 assert.match(logs,/locked_runtime_stop/);assert.ok(!logs.includes('"forcedTermination":true'),'Forced shutdown cannot support backup');
 shadow(env,'seed');const identities=accounts(env.DATABASE_PATH);
 const bound=backup({acknowledgement:ACK,buildSha,applicationRoot:path.dirname(env.DATABASE_PATH),redisRoot:redisDir,destination:path.join(root,'bundle'),shutdownReceiptSha256:crypto.createHash('sha256').update(logs).digest('hex')});
 const restored=restore({acknowledgement:ACK,buildSha,bundle:path.join(root,'bundle'),destination:path.join(root,'restore'),manifestSha256:bound.manifestSha256});
 // Remove access to source roots before starting independent restored processes.
 fs.renameSync(volume,volume+'.quarantined');fs.renameSync(redisDir,redisDir+'.quarantined');
 const restoredVolume=path.join(root,'restored-volume');fs.mkdirSync(restoredVolume);fs.renameSync(restored.applicationRoot,path.join(restoredVolume,'commissioning'));
 port++;redisPort++;const afterEnv=await launch(restoredVolume,restored.redisRoot);const after=await login();assert.equal(after.id,owner.id);await locks(after.cookie);
 assert.equal((await http('/auth/me','GET',undefined,owner.cookie)).status,200,'Redis session continuity');
 assert.deepEqual((await http('/api/pillow/mission-runtime/history','POST',{},after.cookie)).data.report.missions,history.report.missions);
 const reread=await terminal(id,after.cookie);assert.deepEqual(reread.finalResult,result.finalResult);assert.equal(reread.attemptCount,1);
 assert.deepEqual(accounts(afterEnv.DATABASE_PATH),identities);
 // Redis loss must degrade real readiness; locked authority remains explicit.
 redis.disconnect();await stop(redisProcess);redisProcess=null;await pause(1500);const unhealthy=await http('/health/ready');assert.equal(unhealthy.status,503);assert.equal(unhealthy.data.operational,false);assert.equal(unhealthy.data.commerce,'LOCKED');
 redisProcess=child(process.env.PILLOW_TEST_REDIS_SERVER||'redis-server',['--bind','127.0.0.1','--port',String(redisPort),'--dir',restored.redisRoot,'--save','','--appendonly','yes','--appendfsync','always','--requirepass',password],{PATH:process.env.PATH});
 for(let i=0;i<30;i++){await pause(500);if((await http('/health/ready')).status===200)break;}
 await stop(app);app=null;await stop(redisProcess);redisProcess=null;shadow(afterEnv,'read');
 for(const file of bound.inventory.application.filter(f=>/\.(db|sqlite)$/.test(f.path))){const db=new DatabaseSync(path.join(restoredVolume,'commissioning',file.path),{readOnly:true});assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');db.close();}
 // Hash binding rejects altered backup, without touching restored state.
 fs.appendFileSync(path.join(root,'bundle','application','empireai-brain.db'),'tamper');assert.throws(()=>restore({acknowledgement:ACK,buildSha,bundle:path.join(root,'bundle'),destination:path.join(root,'invalid'),manifestSha256:bound.manifestSha256}));
 receipt={...receipt,passed:true,permanentProfile:true,noExpiry:true,observedSteadySeconds:30,independentVolumeRestore:true,sourceRootsQuarantinedBeforeReopen:true,identityContinuity:true,missionHistoryContinuity:true,shadowOwnershipAuthorityContinuity:true,redisSessionAndTerminalContinuity:true,noDuplicateTerminalExecution:true,providerCredentials:0,mutationGuards:true,unavailableRedisReadiness503:true,manifestSha256:bound.manifestSha256,inventory:bound.inventory,limitations:['bounded CI production-mode process proof, not 24/7 certification','no legacy state imported','new production services and routing not activated','provider accounts absent; real commerce unavailable']};
}catch(e){receipt.error=String(e).slice(0,1500);throw e;}
finally{fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify(receipt,null,2));redis?.disconnect();for(const p of [app,redisProcess])if(p&&p.exitCode===null){try{await stop(p);}catch{}}if(!receipt.passed){let safe=logs;for(const s of [password,base.FOUNDER_PASSWORD,base.ADMIN_PASSWORD,base.SESSION_SECRET])safe=safe.split(s).join('[REDACTED]');fs.writeFileSync(path.join(output,'failure.log'),safe);}fs.rmSync(root,{recursive:true,force:true});}
console.log('PRE_CUTOVER_CLOSURE_PASS');})().catch(e=>{console.error(String(e));process.exitCode=1;});

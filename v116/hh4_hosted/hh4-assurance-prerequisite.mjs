// Actual native observer initialization on the original fresh HH4 fixture only.
// No claim of healthy production, owner approval, birth, or operating recovery.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {performance} from 'node:perf_hooks';
const require=createRequire(import.meta.url),source=process.argv[2];
const expected='6c1e63ba20619ee480742fd87dc810ca93152e22';
const hash=b=>createHash('sha256').update(b).digest('hex');
const now=()=>new Date().toISOString(),delay=ms=>new Promise(r=>setTimeout(r,ms));
const out='/evidence/hh4-assurance-prerequisite.json',origin=performance.now(),startedWall=Date.now();
const result={schema:'v116-hh4-real-observer-prerequisite-v1',status:'FAIL_CLOSED',startedUTC:now(),source,originalHoldChanged:false,healthyRuntimeClaim:false,ownerApproval:false,birth:'NOT_BORN',commerce:'LOCKED',paidInference:0,externalEffects:0,children:[],events:[]};
let stop,firstFailure,stage='source-and-fresh-fixture-admission',outputBytes=0;
const children=[],bootId=fs.readFileSync('/proc/sys/kernel/random/boot_id','utf8').trim();
const identity=pid=>{const raw=fs.readFileSync(`/proc/${pid}/stat`,'utf8'),f=raw.slice(raw.lastIndexOf(')')+2).split(/\s+/);return{pid,parentPid:Number(f[1]),startTicks:f[19],state:f[0],bootId};};
const safeJson=file=>{const s=fs.lstatSync(file);assert(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&s.size<=1048576);return JSON.parse(fs.readFileSync(file,'utf8'));};
const fail=error=>{firstFailure??=error;};
const deadline=setTimeout(()=>fail(Error('HH4_OBSERVER_PREREQUISITE_DEADLINE')),45000);
try{
 assert.equal(source,expected);assert(!fs.existsSync(out));
 const inputs=safeJson('/control/hh4-assurance-source-inputs.json');
 for(const [rel,digest]of Object.entries(inputs.appSHA256))assert.equal(hash(fs.readFileSync(path.join('/app',rel))),digest,rel);
 assert.equal(require('/app/deployment/runtime-revision.cjs').resolveRuntimeRevision('/app',undefined),source);
 assert.equal(fs.readFileSync('/proc/net/route','utf8').trim().split('\n').length,1);
 assert(fs.readFileSync('/proc/net/ipv6_route','utf8').trim().split('\n').every(x=>!x||x.trim().endsWith('lo')));
 assert(!fs.existsSync('/var/run/docker.sock')&&!fs.existsSync('/run/docker.sock'));
 const ready=safeJson('/evidence/hh4-worker-ready.json');
 assert.equal(ready.source,source);assert.equal(ready.event,'hh4-worker-ready');assert.equal(ready.stage,'ACTUAL_INDEX_STARTUP_COMPLETE');
 assert.equal(ready.inventory.classification,'LABELLED_SYNTHETIC_INITIALIZATION');assert.equal(ready.inventory.workspace,'synthetic:hh4');
 assert.equal(ready.inventory.paidInference,0);assert.equal(ready.inventory.externalEffects,0);assert.equal(ready.inventory.externalInspectorRequiredBeforeCapture,true);
 const root=ready.inventory.root;assert.match(root,/^\/tmp\/work8-generated-capture-[^/]+\/volume$/);assert.equal(fs.realpathSync(root),root);
 const parent=fs.statSync(path.dirname(root));assert.equal(parent.uid,process.getuid());assert.equal(parent.mode&0o777,0o700);
 assert(Number.isSafeInteger(ready.workerPid)&&ready.workerPid>1);const worker=identity(ready.workerPid);assert.equal(worker.startTicks,ready.workerStartTicks);assert(!['Z','X'].includes(worker.state));
 const argv=fs.readFileSync(`/proc/${worker.pid}/cmdline`,'utf8').split('\0').filter(Boolean);assert.equal(argv.length,2);assert.equal(argv[1],'/app/scripts/work8/hh4-generated-worker.mjs');
 // Endpoint strings in process argv/environ are not stable identity evidence.
 // Preserve the real worker/direct-child/source guards, then bind the actual
 // kernel-owned loopback listener to native Redis PID/run/directory readback.
 const endpointModule='/control/hh4-redis-endpoint.mjs';assert.equal(hash(fs.readFileSync(endpointModule)),inputs.redisEndpointModuleSHA256);
 const {discoverNativeRedisEndpoint}=await import(endpointModule);
 const {redis,redisProcess,port,evidence:endpointEvidence}=await discoverNativeRedisEndpoint({worker,root,redisServerSHA256:inputs.redisServerSHA256});
 result.fixture={root,worker,redisProcess,readySHA256:hash(fs.readFileSync('/evidence/hh4-worker-ready.json')),redisLoopbackPort:port,endpointEvidence};
 stage='start-real-native-observers-and-await-real-progress';
 const {superviseAssurance}=require('/app/deployment/assurance-supervisor.cjs');
 stop=superviseAssurance({cwd:'/app',env:{PATH:'/usr/local/bin:/usr/bin:/bin',RAILWAY_VOLUME_MOUNT_PATH:root,RAILWAY_GIT_COMMIT_SHA:source,REDIS_URL:redis,ASSURANCE_RUNTIME_ORIGIN:'https://isolated.example.invalid'},spawnImpl:(command,args,options)=>{
  assert.equal(command,process.execPath);assert.equal(args.length,1);assert(['backend/src/assurance/permanent-worker.mjs','backend/src/assurance/permanent-inspector.mjs'].includes(args[0]));
  const child=spawn(command,args,{...options,stdio:['ignore','pipe','pipe','ipc']});
  const row={component:path.basename(args[0]),identity:identity(child.pid),progressCount:0,lastProgressUTC:null,exit:null};children.push({child,row});result.children.push(row);
  for(const stream of [child.stdout,child.stderr])stream.on('data',b=>{outputBytes+=b.length;if(outputBytes>1048576)fail(Error('NATIVE_OBSERVER_OUTPUT_CAP'));});
  child.on('message',m=>{if(m?.type==='assurance_progress'){row.progressCount++;row.lastProgressUTC=now();}});
  child.on('error',e=>fail(e));child.once('exit',(code,signal)=>{row.exit={code,signal,atUTC:now()};if(stage==='start-real-native-observers-and-await-real-progress')fail(Error('NATIVE_OBSERVER_EXIT_BEFORE_PREREQUISITE_COMPLETE'));});
  return child;
 },onEvent:event=>{assert(result.events.length<128);result.events.push({...event,atUTC:now()});if(['assurance_restart_quarantined','assurance_process_unavailable'].includes(event.event))fail(Error('NATIVE_OBSERVER_COVERAGE_LOST'));}});
 while(!result.children.every(x=>x.progressCount>0)||result.children.length!==2){if(firstFailure)throw firstFailure;await delay(20);}
 if(firstFailure)throw firstFailure;
 stage='read-actual-independent-schema-and-watchdog-verdict';
 const database=path.join(root,'commissioning/assurance.sqlite'),watchdog=database+'.watchdog';
 const db=new DatabaseSync(database,{readOnly:true,allowExtension:false,timeout:1000});
 try{assert.equal(db.prepare("SELECT type FROM sqlite_schema WHERE name='assurance_cycles'").get()?.type,'table');result.assuranceSchemaPresent=true;result.actualCycleCount=db.prepare('SELECT count(*) n FROM assurance_cycles').get().n;}finally{db.close();}
 const verdict=safeJson(watchdog);assert(Number.isSafeInteger(verdict.observedAt)&&verdict.observedAt>=startedWall&&verdict.observedAt<=Date.now()&&Date.now()-verdict.observedAt<=90000);
 result.actualWatchdog=verdict;result.watchdogSHA256=hash(fs.readFileSync(watchdog));result.observedNativeOutputBytes=outputBytes;
 if(firstFailure)throw firstFailure;assert(children.length===2&&children.every(({child,row})=>row.exit===null&&child.exitCode===null&&child.signalCode===null));
 stage='stop-only-actual-prerequisite-observers-before-capture';stop();
 const until=performance.now()+4000;while(children.some(({child})=>child.exitCode===null&&child.signalCode===null)&&performance.now()<until)await delay(20);
 for(const {child}of children)if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');
 const killed=performance.now()+2000;while(children.some(({child})=>child.exitCode===null&&child.signalCode===null)&&performance.now()<killed)await delay(20);
 assert(children.length===2&&children.every(({child,row})=>row.progressCount>0&&row.exit&&(child.exitCode!==null||child.signalCode!==null)));
 const finalWorker=identity(worker.pid);assert.equal(finalWorker.startTicks,worker.startTicks);assert(!['Z','X'].includes(finalWorker.state));
 result.allPrerequisiteObserversStopped=true;result.generatedWorkerStillSameIdentity=true;result.status='PASS_REAL_OBSERVER_PREREQUISITE_ONLY';
}catch(error){result.firstFailure={stage,type:error.name,message:String(error)};}
finally{
 clearTimeout(deadline);stop?.();
 for(const{child}of children)if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');
 const limit=performance.now()+2000;while(children.some(({child})=>child.exitCode===null&&child.signalCode===null)&&performance.now()<limit)await delay(20);
 result.allPrerequisiteObserversStopped=children.every(({child})=>child.exitCode!==null||child.signalCode!==null);
 if(!result.allPrerequisiteObserversStopped)result.status='FAIL_CLOSED';
 result.elapsedMilliseconds=performance.now()-origin;result.finishedUTC=now();fs.writeFileSync(out,JSON.stringify(result,null,2),{flag:'wx',mode:0o600});
}
process.exitCode=result.status==='PASS_REAL_OBSERVER_PREREQUISITE_ONLY'?0:1;

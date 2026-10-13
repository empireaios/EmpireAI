'use strict';
// Runs only inside the network-none examination container. Real supervision and
// real compiled primary/worker; fixture identities, empty dedicated stores.
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const mode=process.argv[2],root='/evidence';
const diagnostic=e=>{const record={...e,pid:process.pid,mode:mode??'bootstrap',at:new Date().toISOString()};try{fs.appendFileSync(root+'/startup-events.jsonl',JSON.stringify(record)+'\n')}catch(error){console.error('F29 diagnostic write failed',String(error));}console.error(JSON.stringify(record));};
process.on('uncaughtException',error=>{diagnostic({event:'uncaught_exception',error:String(error),stack:error.stack});process.exit(1)});
process.on('unhandledRejection',error=>{diagnostic({event:'unhandled_rejection',error:String(error)});process.exit(1)});
diagnostic({event:'process_start',cwd:process.cwd(),uid:process.getuid(),gid:process.getgid(),node:process.version});
if(process.env.WORK8_F29_EXAM!=='NETWORK_NONE_ISOLATED')throw Error('Explicit isolated examination required');
const repo=process.cwd(),source=require(path.join(repo,'deployment/runtime-revision.cjs')).resolveRuntimeRevision(repo,undefined);
if(mode==='launcher'){
 const {runSupervisedRuntime}=require(path.join(repo,'deployment/locked-supervision.cjs'));
 const env={PATH:process.env.PATH,NODE_ENV:'test',EMPIRE_ENGINEERING_TEST_MODE:'true',EMPIRE_TIER0_ISOLATION:'force',EMPIRE_BRAIN_WORKER_PORT:'4101',EMPIRE_BRAIN_WORKER_SPAWN_DELAY_MS:'10',PORT:'4100',HOST:'127.0.0.1',REDIS_OPTIONAL:'true',DATABASE_PATH:root+'/volume/brain.db',RAILWAY_VOLUME_MOUNT_PATH:root+'/volume',SHADOW_CEO_DATA_DIR:root+'/volume/shadow',RAILWAY_GIT_COMMIT_SHA:source,ASSURANCE_RUNTIME_ORIGIN:'https://fixture.invalid',FOUNDER_EMAIL:'f29-owner@example.test',FOUNDER_PASSWORD:'isolated-f29-owner-fixture-password',ADMIN_EMAIL:'f29-admin@example.test',ADMIN_PASSWORD:'isolated-f29-admin-fixture-password',EMPIREAI_REPO_ROOT:repo};
 fs.mkdirSync(env.RAILWAY_VOLUME_MOUNT_PATH+'/commissioning',{recursive:true});
 const record=e=>fs.appendFileSync(root+'/events.jsonl',JSON.stringify({...e,at:new Date().toISOString()})+'\n');
 record({event:'launcher',pid:process.pid,source});
 runSupervisedRuntime({cwd:repo,env,command:process.execPath,args:[path.join(repo,'backend/dist/index.js')],stdio:['ignore','inherit','inherit'],onSpawn:c=>record({event:'guard',pid:c.pid}),supervisorOptions:{spawnImpl:(command,args,options)=>{const child=spawn(command,args,options);record({event:'observer',pid:child.pid,component:path.basename(args[0])});return child;}},onEvent:record}).then(result=>{record({event:'launcher_exit',result});process.exit(result.coverageLost?1:0)}).catch(e=>{record({event:'launcher_failure',error:String(e)});process.exit(1)});
}else{
 // Deliberately survives child loss. It is not a watchdog: only the host-side
 // outer controller is permitted to detect and contain the missing pair.
 (async()=>{diagnostic({event:'financial_seed_started'});await require('/financial-proof.cjs').seed(root);diagnostic({event:'financial_seed_complete'});
 const launcher=spawn(process.execPath,[__filename,'launcher'],{stdio:'inherit',env:{PATH:process.env.PATH,WORK8_F29_EXAM:'NETWORK_NONE_ISOLATED'}});diagnostic({event:'launcher_spawned',childPid:launcher.pid});launcher.on('error',error=>{diagnostic({event:'launcher_spawn_failed',error:String(error)});fs.writeFileSync(root+'/startup-failed.json',JSON.stringify({error:String(error)}));});launcher.on('exit',(code,signal)=>{diagnostic({event:'launcher_exited',code,signal});if(!fs.existsSync(root+'/ready.json'))fs.writeFileSync(root+'/startup-failed.json',JSON.stringify({error:'Launcher exited before readiness',code,signal}));});
 setInterval(()=>{},1000);
 (async()=>{for(let i=0;i<360;i++){try{const results=await Promise.all([4100,4101].map(p=>fetch('http://127.0.0.1:'+p+'/health/live',{signal:AbortSignal.timeout(1000)})));if(results.every(r=>r.status===200)){diagnostic({event:'actual_primary_worker_ready'});fs.writeFileSync(root+'/ready.json',JSON.stringify({source,primary:true,worker:true}));return;}}catch{}await new Promise(r=>setTimeout(r,500));}fs.writeFileSync(root+'/startup-failed.json',JSON.stringify({error:'actual primary/worker not ready'}));})();
 })().catch(error=>{diagnostic({event:'bootstrap_failed',error:String(error),stack:error.stack});fs.writeFileSync(root+'/startup-failed.json',JSON.stringify({error:String(error)}));process.exitCode=1});
}

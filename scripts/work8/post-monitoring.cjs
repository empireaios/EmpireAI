'use strict';
// Scoped use of the existing application supervisor. No production entrypoint.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {performance}=require('node:perf_hooks');
const root='/evidence', mode=process.argv[2];
assert.equal(process.env.WORK8_KERNEL_EGRESS,'AF_UNIX_ONLY');
const event=x=>fs.appendFileSync(root+'/events.jsonl',JSON.stringify({at:new Date().toISOString(),ms:performance.now(),...x})+'\n');
const env={WORK8_KERNEL_EGRESS:process.env.WORK8_KERNEL_EGRESS,PATH:process.env.PATH,RAILWAY_VOLUME_MOUNT_PATH:root,RAILWAY_GIT_COMMIT_SHA:'d69fe8aaa2bb1801aa3561e9db4beabc8eb614b5',ASSURANCE_RUNTIME_ORIGIN:'https://work8-isolated.invalid',REDIS_URL:'redis://127.0.0.1:1'};
if(mode==='writer'){
 let n=0; fs.writeFileSync(root+'/writer-pid.json',JSON.stringify({pid:process.pid}));
 setInterval(()=>fs.appendFileSync(root+'/writer.jsonl',JSON.stringify({n:++n,at:Date.now()})+'\n'),100);
 process.on('SIGTERM',()=>{event({kind:'WRITER_STOP'});process.exit(0);});
}else if(mode==='launcher'){
 fs.mkdirSync(root+'/commissioning',{recursive:true});
 const {runSupervisedRuntime}=require('../../deployment/locked-supervision.cjs');
 const pairs=new Map();let generation=0,injections=0;
 runSupervisedRuntime({cwd:process.cwd(),env,command:process.execPath,args:[__filename,'writer'],
 onSpawn:c=>{fs.writeFileSync(root+'/identity.json',JSON.stringify({launcher:process.pid,guard:c.pid}));event({kind:'GUARD',pid:c.pid});},
 onEvent:e=>event({kind:'SUPERVISOR',...e}),
 supervisorOptions:{spawnImpl:(exe,args,opts)=>{
 const c=spawn(exe,args,opts),name=path.basename(args[0]);event({kind:'OBSERVER_START',name,pid:c.pid});
 let ready=false;c.on('message',m=>{if(ready||m?.type!=='assurance_progress')return;ready=true;
 if(!pairs.has(name))pairs.set(name,c);
 if(process.argv[3]==='observers'&&pairs.size===2&&injections<6){
 const current=[...pairs.entries()];pairs.clear();injections++;generation++;
 event({kind:'BOTH_OBSERVERS_SIGKILL',generation,pids:current.map(([_,p])=>p.pid)});
 for(const [_,p] of current)p.kill('SIGKILL');
 }
 });return c;}}
 }).then(result=>{event({kind:'RESULT',result,injections});process.exit(result.coverageLost?0:2);}).catch(e=>{event({kind:'ERROR',error:String(e)});process.exit(1);});
}else if(mode==='hold'){
 // Container init survives injected launcher loss so the external controller must contain descendants.
 const c=spawn(process.execPath,[__filename,'launcher',process.argv[3]],{env:process.env,stdio:'inherit'});
 c.on('exit',(code,signal)=>{event({kind:'LAUNCHER_EXIT',code,signal});if(process.argv[3]==='observers')process.exit(code??1);});
 setInterval(()=>{},1000);
}else if(mode==='kill-pair'){
 const p=JSON.parse(fs.readFileSync(root+'/identity.json'));
 const begin=performance.now();
 for(const pid of [p.launcher,p.guard])process.kill(pid,'SIGSTOP');
 for(const pid of [p.launcher,p.guard])process.kill(pid,'SIGKILL');
 event({kind:'LAUNCHER_GUARD_SIGKILL',pids:[p.launcher,p.guard],signalWindowMs:performance.now()-begin});
}else throw Error('MODE');

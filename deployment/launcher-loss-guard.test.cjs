'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {running}=require('./process-state.test-support.cjs');

for(const fault of ['kill','stall'])test(`independent runtime guard contains launcher ${fault} and preserves shutdown state`,{timeout:10000},async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'work8-launcher-loss-'));fs.mkdirSync(path.join(root,'commissioning'));
 const childCode=`
 const fs=require('node:fs'),{spawn}=require('node:child_process');
 const descendant=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});console.log('READY');setInterval(()=>{},1000)"],{stdio:['ignore','pipe','ignore']});
 descendant.stdout.once('data',()=>{fs.writeFileSync('pids.json',JSON.stringify([process.pid,descendant.pid]));console.log('RUNTIME_READY')});
 process.on('SIGTERM',()=>{fs.writeFileSync('saved.json',JSON.stringify({retained:'business-state',shutdown:'orderly'}));process.exit(0)});setInterval(()=>{},1000);
 `;
 const launcherCode=`
 const {EventEmitter}=require('node:events');
 const {runSupervisedRuntime}=require(${JSON.stringify(path.join(__dirname,'locked-supervision.cjs'))});
 process.on('message',m=>{if(m==='stall')while(true){}});
 runSupervisedRuntime({cwd:${JSON.stringify(root)},env:{PATH:process.env.PATH,RAILWAY_VOLUME_MOUNT_PATH:${JSON.stringify(root)},ASSURANCE_RUNTIME_ORIGIN:'https://twin.example.invalid'},command:process.execPath,args:['-e',${JSON.stringify(childCode)}],guardLeaseMs:400,graceMs:300,stdio:['ignore','pipe','ignore'],onEvent:()=>{},
 supervisorOptions:{spawnImpl:()=>{const e=new EventEmitter();e.kill=()=>{};return e;}},onSpawn:c=>{console.log('GUARD_PID:'+c.pid);c.stdout.pipe(process.stdout);}}).then(r=>{console.log(JSON.stringify(r));process.exit(r.coverageLost?1:0)});
 `;
 const launcher=spawn(process.execPath,['-e',launcherCode],{stdio:['ignore','pipe','pipe','ipc']});
 let output='',guardPid,pids=[];
 const deadline=setTimeout(()=>launcher.kill('SIGKILL'),7000);
 try{
  await new Promise((resolve,reject)=>{
   launcher.once('error',reject);launcher.once('exit',()=>{if(!output.includes('RUNTIME_READY'))reject(Error('launcher exited before readiness'));});
   launcher.stdout.on('data',chunk=>{output+=chunk;if(output.includes('RUNTIME_READY'))resolve();});
  });
  guardPid=Number(output.match(/GUARD_PID:(\d+)/)[1]);pids=JSON.parse(fs.readFileSync(path.join(root,'pids.json'),'utf8'));
  if(fault==='kill')launcher.kill('SIGKILL');else launcher.send('stall');
  const until=Date.now()+4000;
  while(Date.now()<until&&[guardPid,...pids].some(running))await new Promise(resolve=>setTimeout(resolve,20));
  for(const pid of [guardPid,...pids])assert.equal(running(pid),false,`contained process ${pid}`);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'saved.json'),'utf8')),{retained:'business-state',shutdown:'orderly'});
  const receipts=fs.readFileSync(path.join(root,'commissioning/assurance-containment.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(receipts.length,1);assert.equal(receipts[0].reason,fault==='kill'?'LAUNCHER_DISCONNECTED':'LAUNCHER_LEASE_EXPIRED');
  assert.equal(receipts[0].recoveryVerified,false);
 }finally{
  clearTimeout(deadline);launcher.kill('SIGKILL');
  for(const pid of [guardPid,...pids].filter(Boolean)){try{process.kill(pid,'SIGKILL');}catch{}}
  fs.rmSync(root,{recursive:true,force:true});
 }
});

'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process');
test('actual observers release IPC and allow supervised launcher to exit cleanly', {timeout:15000},async()=>{
 assert.equal(process.env.WORK8_KERNEL_EGRESS,'DENIED');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'work8-clean-stop-'));
 fs.mkdirSync(path.join(root,'commissioning'));
 const repo=path.resolve(__dirname,'..');
 const env={PATH:process.env.PATH,RAILWAY_GIT_COMMIT_SHA:'a'.repeat(40),RAILWAY_VOLUME_MOUNT_PATH:root,REDIS_URL:'redis://127.0.0.1:1',ASSURANCE_RUNTIME_ORIGIN:'https://twin.example.invalid'};
 const code=`const {spawn}=require('node:child_process');
 require(${JSON.stringify(path.join(__dirname,'locked-supervision.cjs'))}).runSupervisedRuntime({cwd:${JSON.stringify(repo)},env:${JSON.stringify(env)},command:process.execPath,args:['-e',"process.on('SIGTERM',()=>process.exit(0));console.log('APP_READY');setInterval(()=>{},1000)"],graceMs:3000,
 supervisorOptions:{spawnImpl:(command,args,options)=>{const child=spawn(command,args,options);child.on('message',m=>{if(m?.type==='assurance_progress')console.log('PROGRESS:'+args[0]);});return child;}}}).then(result=>console.log('STOP:'+JSON.stringify(result)));`;
 const launcher=spawn(process.execPath,['-e',code],{env:{PATH:process.env.PATH},stdio:['ignore','pipe','pipe']});
 let output='';const exit=new Promise((resolve,reject)=>{launcher.once('error',reject);launcher.once('exit',(code,signal)=>resolve({code,signal}));});
 const deadline=setTimeout(()=>launcher.kill('SIGKILL'),12000);
 try{
  await new Promise((resolve,reject)=>{
   launcher.once('exit',()=>reject(Error('Launcher exited before all components ready')));
   launcher.stdout.on('data',chunk=>{output+=chunk;if(output.includes('APP_READY')&&output.includes('PROGRESS:backend/src/assurance/permanent-worker.mjs')&&output.includes('PROGRESS:backend/src/assurance/permanent-inspector.mjs'))resolve();});
   launcher.stderr.on('data',()=>{});
  });
  launcher.kill('SIGTERM');assert.deepEqual(await exit,{code:0,signal:null});
  const result=JSON.parse(output.split('\n').find(l=>l.startsWith('STOP:')).slice(5));
  assert.equal(result.code,0);assert.equal(result.forcedTermination,false);assert.equal(result.coverageLost,false);
  assert.equal((output.match(/"event":"assurance_process_exit"/g)||[]).length,2);
 }finally{clearTimeout(deadline);launcher.kill('SIGKILL');fs.rmSync(root,{recursive:true,force:true});}
});

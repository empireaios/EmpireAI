'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
// Changed native policy only. This does not replace distinct-principal or actual
// application-graph hosted acceptance. No skip path: missing compiler fails.
test('native writer policy rejects processes/group escape and preserves Node threads',{timeout:30000},()=>{
 assert.equal(process.platform,'linux');assert.ok(['x64','arm64'].includes(process.arch));
 const external=process.env.WORK8_NATIVE_ARTIFACT_DIRECTORY;
 const temp=external?fs.realpathSync(external):fs.mkdtempSync(path.join(os.tmpdir(),'work8-native-policy-'));
 try{
  const library=path.join(temp,'writer.so'),probe=path.join(temp,'probe');
  const compile=(args)=>{const r=spawnSync('cc',args,{encoding:'utf8',timeout:10000});assert.equal(r.status,0,r.error?.message||r.stderr);};
  if(external){
   const manifest=JSON.parse(fs.readFileSync(path.join(temp,'manifest.json'),'utf8'));const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
   assert.equal(manifest.librarySha256,hash(library));assert.equal(manifest.probeSha256,hash(probe));assert.equal(manifest.sourceSha256,hash(path.join(__dirname,'native/runtime-writer-isolation.c')));assert.equal(manifest.probeSourceSha256,hash(path.join(__dirname,'fixtures/runtime-writer-isolation-probe.c')));
  }else{
  compile(['-shared','-fPIC','-O2','-std=c11','-Wall','-Wextra','-Werror','-Wl,-z,relro,-z,now',path.join(__dirname,'native/runtime-writer-isolation.c'),'-o',library]);
  compile(['-O2','-std=c11','-Wall','-Wextra','-Werror',path.join(__dirname,'fixtures/runtime-writer-isolation-probe.c'),'-o',probe]);
  }
  const cases=['clone','clone3','execve','execveat','setsid','setpgid','unshare','setns','ptrace','process_vm_writev','process_vm_readv','pidfd_getfd'];
  if(process.arch==='x64')cases.push('fork','vfork','legacy-x32');
  for(const name of cases){const r=spawnSync(probe,[name],{encoding:'utf8',timeout:2000,env:{PATH:process.env.PATH,LD_PRELOAD:library}});assert.equal(r.status,0,`${name}: ${r.error?.message||r.stderr}`);assert.match(r.stdout,new RegExp('^DENIED:'+name+':'));
  }
  if(process.arch==='x64'){const abi=spawnSync(probe,['x32-abi'],{encoding:'utf8',timeout:2000,env:{PATH:process.env.PATH,LD_PRELOAD:library}});assert.equal(abi.signal,'SIGSYS');}
  const script=`const {Worker}=require('node:worker_threads');const assert=require('node:assert/strict');const {spawnSync}=require('node:child_process');assert.equal(spawnSync(process.execPath,['-e','process.exit(0)']).error.code,'EPERM');const worker=new Worker('const c=require("node:child_process").spawnSync(process.execPath,["-e","process.exit(0)"]);require("node:worker_threads").parentPort.postMessage(c.error.code)',{eval:true});worker.once('message',value=>{assert.equal(value,'EPERM');console.log('THREAD_OK_PROCESS_DENIED')});worker.once('error',e=>{throw e});`;
  const r=spawnSync(process.execPath,['-e',script],{encoding:'utf8',timeout:5000,env:{PATH:process.env.PATH,LD_PRELOAD:library}});assert.equal(r.status,0,r.error?.message||r.stderr);assert.match(r.stdout,/THREAD_OK_PROCESS_DENIED/);
  console.log(JSON.stringify({scope:'NATIVE_POLICY_ONLY',deniedSyscalls:cases,nodeThreadCreation:true,nodeProcessCreationDenied:true,distinctPrincipalAcceptance:false}));
 }finally{if(!external)fs.rmSync(temp,{recursive:true,force:true});}
});

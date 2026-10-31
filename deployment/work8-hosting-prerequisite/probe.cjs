'use strict';
// Exact O33 prerequisite probe. No application, provider credentials, network,
// customer records, production mounts, or owner session is used.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {fork}=require('node:child_process');
const {prepareWriterIsolation}=require('./runtime-writer-isolation.cjs');
const started=Date.now(),receipt={schema:'work8-hosting-prerequisite-v1',status:'NO_GO',sourceBaseline:'3b86fe119fdfc3b5463b9ae4c1be3c61924d899b',applicationStarted:false,productionAccess:false,providerCalls:0,checks:{},wholeRowsAccepted:[]};
let child,finished=false;
function finish(code){if(finished)return;finished=true;if(child?.pid){try{child.kill('SIGKILL');}catch{}}
 receipt.elapsedMs=Date.now()-started;process.stdout.write(JSON.stringify(receipt)+'\n',()=>process.exit(code));}
const timer=setTimeout(()=>{receipt.failure='HARD_DEADLINE';finish(1);},25000);
process.on('SIGTERM',()=>{receipt.failure='TERMINATED';finish(1);});
process.on('uncaughtException',()=>{receipt.failure='UNEXPECTED_PROBE_FAILURE';finish(1);});
(async()=>{
 let stage='runtime-version';
 try{
  assert.equal(process.versions.node,'22.23.2');receipt.checks.node='22.23.2';
  stage='operator-uid';assert.equal(process.getuid(),0);assert.equal(process.getgid(),0);receipt.checks.rootOperator=true;
  stage='operator-capabilities';
  const status=fs.readFileSync('/proc/self/status','utf8'),hex=status.match(/^CapEff:\s*([a-f0-9]+)$/m)?.[1];
  assert.ok(hex);const caps=BigInt('0x'+hex);const required={CHOWN:0,DAC_OVERRIDE:1,KILL:5,SETGID:6,SETUID:7,SYS_PTRACE:19};
  receipt.checks.capabilities=Object.fromEntries(Object.entries(required).map(([name,bit])=>[name,(caps&(1n<<BigInt(bit)))!==0n]));
  receipt.checks.operatorFownerAbsent=(caps&8n)===0n;
  const wanted=Object.values(required).reduce((n,b)=>n|(1n<<BigInt(b)),0n);
  for(const field of ['CapEff','CapPrm','CapBnd'])assert.equal(BigInt('0x'+status.match(new RegExp('^'+field+':\\s*([a-f0-9]+)$','m'))[1]),wanted);
  for(const field of ['CapInh','CapAmb'])assert.equal(BigInt('0x'+status.match(new RegExp('^'+field+':\\s*([a-f0-9]+)$','m'))[1]),0n);
  assert.match(status,/^NoNewPrivs:\s*1$/m);
  receipt.checks.exactSixCapabilityMask=true;
  assert.ok(Object.values(receipt.checks.capabilities).every(Boolean));
  stage='native-artifact';const native='/probe/runtime-writer-isolation.so',sha=crypto.createHash('sha256').update(fs.readFileSync(native)).digest('hex');
  const expected=fs.readFileSync('/probe/native.sha256','utf8').trim();assert.equal(sha,expected);
  const isolation=prepareWriterIsolation({library:native,sha256:sha,operatorUid:0});receipt.nativeSha256=sha;
  stage='runtime-demotion';process.setgroups([]);
  child=fork('/probe/child.cjs',[],{uid:65534,gid:65534,env:{PATH:'/usr/local/bin:/usr/bin:/bin',LD_PRELOAD:native},stdio:['ignore','ignore','ignore','ipc']});
  await new Promise((resolve,reject)=>{const bound=setTimeout(()=>reject(Error('CHILD_DEADLINE')),6000);child.once('error',reject);child.once('exit',()=>reject(Error('CHILD_EXITED')));child.once('message',message=>{try{
   assert.deepEqual(message,{ready:true,uid:65534,gid:65534,policyWriteRefused:true,processCreationRefused:true});
   receipt.checks.demotedRuntime=true;receipt.checks.operatorOwnedPolicyNotWritable=true;receipt.checks.processCreationRefused=true;
   stage='native-attestation-and-cross-uid-read';receipt.checks.nativeIsolation=isolation.verify(child.pid);clearTimeout(bound);resolve();
  }catch(error){reject(error);}});});
  stage='operator-protection';assert.equal(receipt.checks.operatorFownerAbsent,true);
  receipt.status='PASS_PREREQUISITES_ONLY';receipt.fullApplicationHosted=false;receipt.ownerAccessVerified=false;clearTimeout(timer);finish(0);
 }catch{receipt.failure=stage;clearTimeout(timer);finish(1);}
})();

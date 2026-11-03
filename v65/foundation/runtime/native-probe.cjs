'use strict';
const fs=require('fs'),cp=require('child_process'),crypto=require('crypto');
const assert=require('node:assert/strict');
const CAPS=0x800e3n;
const status=(pid='self')=>Object.fromEntries(fs.readFileSync('/proc/'+pid+'/status','utf8').split('\n').filter(l=>l.includes(':')).map(l=>[l.split(':')[0],l.slice(l.indexOf(':')+1).trim()]));
const library='/native/runtime-writer-isolation.so';
const expected='5048f19ec38c708dd1b139f7a3f60cb8eb5e9146cd4fdb6e978caffbcac87a1b';
const {prepareWriterIsolation}=require('/app/deployment/runtime-writer-isolation.cjs');
let child=null,step='OPERATOR_IDENTITY';
(async()=>{
 assert.equal(process.getuid(),0);assert.equal(process.getgid(),0);const op=status();assert.equal(BigInt('0x'+op.CapEff),CAPS);assert.equal(BigInt('0x'+op.CapPrm),CAPS);assert.equal(op.NoNewPrivs,'1');
 step='NATIVE_LIBRARY_IDENTITY';assert.equal(crypto.createHash('sha256').update(fs.readFileSync(library)).digest('hex'),expected);
 step='READONLY_ROOT';let readOnly=false;try{fs.writeFileSync('/a5-readonly-probe','x')}catch(e){readOnly=e.code==='EROFS'}assert(readOnly);
 step='NATIVE_LIBRARY_ADMISSION';const isolation=prepareWriterIsolation({library,sha256:expected,operatorUid:0});
 const source=`const fs=require('fs'),cp=require('child_process');const s=Object.fromEntries(fs.readFileSync('/proc/self/status','utf8').split('\\n').filter(x=>x.includes(':')).map(x=>[x.split(':')[0],x.slice(x.indexOf(':')+1).trim()]));const p=cp.spawnSync('/bin/true');let privateDenied=false;try{fs.readFileSync('/control/qualification-request.json')}catch(e){privateDenied=e.code==='EACCES'};console.log(JSON.stringify({uid:process.getuid(),gid:process.getgid(),caps:s.CapEff,prm:s.CapPrm,nnp:s.NoNewPrivs,seccomp:s.Seccomp,spawnDenied:p.error?.code==='EPERM',privateDenied}));setTimeout(()=>{},30000);`;
 step='WRITER_PROCESS_START';child=cp.spawn(process.execPath,['-e',source],{uid:65534,gid:65534,env:{PATH:'/usr/bin:/bin',...isolation.environment},stdio:['ignore','pipe','ignore']});
 const row=await new Promise((resolve,reject)=>{let data='';const timer=setTimeout(()=>reject(Error('WRITER_DEADLINE')),5000);child.once('error',reject);child.stdout.on('data',b=>{data+=b;if(data.length>4096)reject(Error('WRITER_RECEIPT_BOUND'));if(data.includes('\n')){clearTimeout(timer);resolve(JSON.parse(data.split('\n')[0]));}});child.once('exit',()=>reject(Error('WRITER_EXIT')));});
 step='WRITER_IDENTITY_AND_DENIAL';assert.equal(row.uid,65534);assert.equal(row.gid,65534);assert(/^0+$/.test(row.caps)&&/^0+$/.test(row.prm));assert.equal(row.nnp,'1');assert.equal(row.seccomp,'2');assert(row.spawnDenied);assert(row.privateDenied);
 step='CROSS_PRINCIPAL_PROC_ATTESTATION';const verified=isolation.verify(child.pid);for(const member of ['status','stat','cmdline','maps','environ'])fs.readFileSync('/proc/'+child.pid+'/'+member);const ownNs=fs.readlinkSync('/proc/self/ns/pid');assert.equal(fs.readlinkSync('/proc/'+child.pid+'/ns/pid'),ownNs);
 // The pinned constructor installs seccomp using TSYNC. Its mapped hash,
 // exactly one additional filter and actual spawn refusal are measured here.
 step='THREAD_SYNCHRONIZED_FILTERS';const threads=fs.readdirSync('/proc/'+child.pid+'/task').map(t=>status(child.pid+'/task/'+t));assert(threads.every(x=>x.Seccomp==='2'&&Number(x.Seccomp_filters)===verified.seccompFilters));
 step='PRIVATE_FILE_EXCHANGE';const control='/control/qualification-request.json';const input=JSON.parse(fs.readFileSync(control));assert.equal(input.schema,'work8-v62-private-exchange-probe-v1');assert.equal(fs.statSync(control).mode&0o777,0o600);assert.equal(fs.statSync(control).uid,1001);assert.equal(fs.statSync('/control').mode&0o777,0o700);
 const response={schema:'work8-v62-private-exchange-response-v1',nonceSHA256:crypto.createHash('sha256').update(input.nonce).digest('hex')};const tmp='/control/qualification-response.pending';fs.writeFileSync(tmp,JSON.stringify(response),{flag:'wx',mode:0o600});const fd=fs.openSync(tmp,'r');fs.fsyncSync(fd);fs.closeSync(fd);fs.chownSync(tmp,1001,1001);fs.renameSync(tmp,'/control/qualification-response.json');
 console.log(JSON.stringify({schema:'work8-v62-native-capability-observation-v1',status:'PASS_NATIVE_CAPABILITY_ONLY',operatorCapabilities:op.CapEff,requiredCapabilities:['SETUID','SETGID','CHOWN','DAC_OVERRIDE','KILL','SYS_PTRACE'],writer:row,seccompTSYNC:true,nativeAttestation:verified,threadCount:threads.length,crossPrincipalProcReadback:true,readonlyRootVerified:true,privateFileExchangeResponseWritten:true,pidNamespace:ownNs,applicationStarted:false}));
})().catch(e=>{console.log(JSON.stringify({schema:'work8-v62-native-capability-observation-v1',status:'FAIL',assertion:step,errorClass:e.name,errorCode:/^[A-Z_]{1,80}$/.test(e.code||'')?e.code:null,rawErrorRetained:false,applicationStarted:false}));process.exitCode=1;}).finally(()=>{if(child&&!child.killed)child.kill('SIGTERM');});

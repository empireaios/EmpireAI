'use strict';
const fs=require('fs'),cp=require('child_process'),crypto=require('crypto');
const assert=require('node:assert/strict');
const {observeChild,expectedTermination}=require('./qualification-child-observation.cjs');
const CAPS=0x800e3n;
const status=(pid='self')=>Object.fromEntries(fs.readFileSync('/proc/'+pid+'/status','utf8').split('\n').filter(l=>l.includes(':')).map(l=>[l.split(':')[0],l.slice(l.indexOf(':')+1).trim()]));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const namespaceIds=(pid='self')=>Object.fromEntries(['pid','mnt','net','ipc','uts','user','cgroup'].map(k=>[k,fs.readlinkSync('/proc/'+pid+'/ns/'+k)]));
const startTicks=pid=>{const value=fs.readFileSync('/proc/'+pid+'/stat','utf8');return value.slice(value.lastIndexOf(')')+2).split(' ')[19];};
const library='/native/runtime-writer-isolation.so';
const expected='5048f19ec38c708dd1b139f7a3f60cb8eb5e9146cd4fdb6e978caffbcac87a1b';
const observerPath='/qualification/native-security-observer.node';
const observerReceipt='/qualification/native-observer-build.json';
const sourcePath='/qualification/native-security-observer.c';
const entrypointPins={
 '/app/backend/dist/index.js':'62cda9b7f8829056e877481f95e264a88d246336d1ef3f60aeaac7d66a0393f3',
 '/app/deployment/runtime-membership-controller.cjs':'59e7ea679ad41cd8663d80c1e98364242fcec00c98744e77f682814a8d124f1b',
 '/app/deployment/runtime-membership-bootstrap.mjs':'84bd06b3cd85727cf8f48ee2668065361349323e5285429f63b90978b7856ea5',
 '/app/deployment/runtime-writer-isolation.cjs':'dff08c2dd38678875da9c53322a591f147a66c1afeb4a002c85a526662d6a2d2'
};
let child=null,step='OPERATOR_IDENTITY',childFailure=null,childObservation=null,childTermination=null;
(async()=>{
 assert.equal(process.getuid(),0);assert.equal(process.getgid(),0);assert.equal(process.geteuid(),0);assert.equal(process.getegid(),0);
 const op=status();assert.equal(BigInt('0x'+op.CapEff),CAPS);assert.equal(BigInt('0x'+op.CapPrm),CAPS);assert.equal(op.NoNewPrivs,'1');
 const operator={uid:0,gid:0,euid:0,egid:0,capEff:op.CapEff,capPrm:op.CapPrm,noNewPrivs:1};
 step='NATIVE_LIBRARY_IDENTITY';assert.equal(hash(library),expected);
 step='READONLY_ROOT';let readOnly=false;try{fs.writeFileSync('/a5-readonly-probe','x')}catch(e){readOnly=e.code==='EROFS'}assert(readOnly);
 step='OBSERVER_IDENTITY';
 for(const file of [observerPath,observerReceipt]){const s=fs.lstatSync(file);assert(s.isFile()&&s.nlink===1);assert.equal(fs.realpathSync(file),file);assert.equal(s.uid,0);assert.equal(s.gid,0);assert.equal(s.mode&0o777,0o444);}
 const build=JSON.parse(fs.readFileSync(observerReceipt));assert.equal(build.schema,'work8-v75-native-observer-build-v1');assert.equal(build.status,'COMPILED_AWAITING_ACTUAL_PROTECTED_NODE_LOAD');assert.equal(build.applicationModified,false);assert.equal(build.hostedExecutorQualified,false);assert.equal(build.sourceSHA256,hash(sourcePath));assert.equal(build.binarySHA256,hash(observerPath));
 let observerReadOnly=false;try{const f=fs.openSync(observerPath,'r+');fs.closeSync(f);}catch(e){observerReadOnly=e.code==='EROFS';}assert(observerReadOnly);
 const observer={sourceSHA256:build.sourceSHA256,binarySHA256:build.binarySHA256,uid:0,gid:0,mode:0o444,readOnly:true};
 step='PROTECTED_ENTRYPOINTS';
 const protectedEntrypoints=Object.entries(entrypointPins).map(([path,digest])=>{const s=fs.lstatSync(path);assert(s.isFile()&&s.nlink===1);assert.equal(fs.realpathSync(path),path);assert.equal(s.uid,0);assert.equal(s.mode&0o022,0);assert.equal(hash(path),digest);return {path,uid:s.uid,gid:s.gid,mode:s.mode&0o777,sha256:digest};});
 step='NATIVE_LIBRARY_ADMISSION';const {prepareWriterIsolation}=require('/app/deployment/runtime-writer-isolation.cjs');const isolation=prepareWriterIsolation({library,sha256:expected,operatorUid:0});
 const source=`let stage='OBSERVER_BYTES_IDENTITY';try{const fs=require('fs'),cp=require('child_process'),crypto=require('crypto');
 const observerPath=${JSON.stringify(observerPath)},expectedObserver=${JSON.stringify(observer.binarySHA256)};
 if(crypto.createHash('sha256').update(fs.readFileSync(observerPath)).digest('hex')!==expectedObserver)throw Error('OBSERVER_BYTES_CHANGED');
 stage='OBSERVER_MODULE_LOAD';const observe=require(observerPath);
 stage='CURRENT_NON_DUMPABILITY';const dumpable=observe();
 const s=Object.fromEntries(fs.readFileSync('/proc/self/status','utf8').split('\\n').filter(x=>x.includes(':')).map(x=>[x.split(':')[0],x.slice(x.indexOf(':')+1).trim()]));
 stage='WRITER_ACCESS_CONTROLS';const p=cp.spawnSync('/bin/true');let privateDenied=false,privateWriteDenied=false;
 try{fs.readFileSync('/control/qualification-request.json')}catch(e){privateDenied=e.code==='EACCES'};
 try{const f=fs.openSync('/control/qualification-request.json','r+');fs.closeSync(f)}catch(e){privateWriteDenied=e.code==='EACCES'};
 const denied=Object.fromEntries(${JSON.stringify(Object.keys(entrypointPins))}.map(path=>{let denied=false;try{const f=fs.openSync(path,'r+');fs.closeSync(f)}catch(e){denied=e.code==='EROFS'||e.code==='EACCES'};return [path,denied]}));
 stage='WRITER_NAMESPACE_OBSERVATION';const namespaceIds=Object.fromEntries(['pid','mnt','net','ipc','uts','user','cgroup'].map(k=>[k,fs.readlinkSync('/proc/self/ns/'+k)]));
 const stat=fs.readFileSync('/proc/self/stat','utf8');
 console.log(JSON.stringify({uid:process.getuid(),gid:process.getgid(),euid:process.geteuid(),egid:process.getegid(),groups:process.getgroups(),caps:s.CapEff,prm:s.CapPrm,nnp:s.NoNewPrivs,seccomp:s.Seccomp,dumpable,dumpabilityMethod:'PR_GET_DUMPABLE_SAME_PROCESS',observerSHA256:expectedObserver,pid:process.pid,startTicks:stat.slice(stat.lastIndexOf(')')+2).split(' ')[19],namespaceIds,entrypointWriteDenials:denied,spawnDenied:p.error?.code==='EPERM',privateDenied,privateWriteDenied}));setTimeout(()=>{},30000);
 }catch(e){console.log(JSON.stringify({status:'FAIL_CHILD_SECURITY_PROBE',stage,errorClass:['Error','TypeError','RangeError','SyntaxError','ReferenceError'].includes(e.name)?e.name:'Error',errorCode:typeof e.code==='string'&&/^[A-Z_0-9]{1,80}$/.test(e.code)?e.code:null,rawErrorRetained:false}));process.exitCode=1;}`;
 step='WRITER_PROCESS_START';child=cp.spawn(process.execPath,['-e',source],{uid:65534,gid:65534,env:{PATH:'/usr/bin:/bin',...isolation.environment},stdio:['ignore','pipe','pipe']});
 childObservation=observeChild(child);const row=await childObservation.observation;
 if(row.status==='FAIL_CHILD_SECURITY_PROBE'){childFailure=row;throw Error('CHILD_SECURITY_PROBE_FAILED');}
 step='WRITER_IDENTITY_AND_DENIAL';assert.equal(row.uid,65534);assert.equal(row.gid,65534);assert.equal(row.euid,65534);assert.equal(row.egid,65534);assert(row.groups.every(x=>x===65534));assert(/^0+$/.test(row.caps)&&/^0+$/.test(row.prm));assert.equal(row.nnp,'1');assert.equal(row.seccomp,'2');assert(row.spawnDenied);assert(row.privateDenied);assert(row.privateWriteDenied);
 step='CURRENT_NON_DUMPABILITY';assert.equal(row.dumpabilityMethod,'PR_GET_DUMPABLE_SAME_PROCESS');assert.equal(row.dumpable,0);assert.equal(row.observerSHA256,observer.binarySHA256);
 step='PROTECTED_ENTRYPOINT_DENIAL';for(const item of protectedEntrypoints){assert.equal(row.entrypointWriteDenials[item.path],true);item.writerWriteDenied=true;}
 step='CROSS_PRINCIPAL_PROC_ATTESTATION';const verified=isolation.verify(child.pid);for(const member of ['status','stat','cmdline','maps','environ'])fs.readFileSync('/proc/'+child.pid+'/'+member);assert.equal(row.pid,child.pid);assert.equal(row.startTicks,startTicks(child.pid));
 step='NAMESPACE_OBSERVATIONS';const ownNs=namespaceIds(),writerNs=namespaceIds(child.pid);assert.deepEqual(writerNs,ownNs);assert.deepEqual(row.namespaceIds,writerNs);
 // The exact pinned constructor installs TSYNC before Node starts. Observe every
 // current thread's filter count/NNP/capabilities; no claim of later app outcomes.
 step='THREAD_SYNCHRONIZED_FILTERS';const threadObservations=fs.readdirSync('/proc/'+child.pid+'/task').map(t=>{const s=status(child.pid+'/task/'+t);return {tid:Number(t),seccomp:Number(s.Seccomp),seccompFilters:Number(s.Seccomp_filters),NoNewPrivs:Number(s.NoNewPrivs),capEff:s.CapEff};});assert(threadObservations.length>0);assert(threadObservations.every(x=>x.seccomp===2&&x.seccompFilters===verified.seccompFilters&&x.NoNewPrivs===1&&/^0+$/.test(x.capEff)));
 step='PRIVATE_FILE_EXCHANGE';const control='/control/qualification-request.json';const input=JSON.parse(fs.readFileSync(control));assert.equal(input.schema,'work8-v62-private-exchange-probe-v1');const privateStat=fs.lstatSync(control);assert(privateStat.isFile()&&privateStat.nlink===1);assert.equal(privateStat.mode&0o777,0o600);assert.equal(privateStat.uid,1001);assert.equal(privateStat.gid,1001);assert.equal(fs.statSync('/control').mode&0o777,0o700);assert.equal(fs.statSync('/control').uid,1001);assert.equal(fs.statSync('/control').gid,1001);
 const response={schema:'work8-v62-private-exchange-response-v1',nonceSHA256:crypto.createHash('sha256').update(input.nonce).digest('hex')};const tmp='/control/qualification-response.pending';fs.writeFileSync(tmp,JSON.stringify(response),{flag:'wx',mode:0o600});fs.chownSync(tmp,1001,1001);const fd=fs.openSync(tmp,'r');fs.fsyncSync(fd);fs.closeSync(fd);fs.renameSync(tmp,'/control/qualification-response.json');const dir=fs.openSync('/control','r');fs.fsyncSync(dir);fs.closeSync(dir);
 step='NATIVE_DIAGNOSTIC_COMPLETENESS';childTermination=await childObservation.finish();if(!expectedTermination(childTermination))throw Error('WRITER_UNEXPECTED_TERMINATION');assert.equal(childObservation.diagnostic().bytes,0);
 console.log(JSON.stringify({schema:'work8-v75-native-capability-observation-v2',status:'PASS_NATIVE_CAPABILITY_ONLY',operator,operatorCapabilities:op.CapEff,requiredCapabilities:['SETUID','SETGID','CHOWN','DAC_OVERRIDE','KILL','SYS_PTRACE'],writer:row,observer,protectedEntrypoints,namespaceIds:ownNs,writerNs,seccompTSYNC:true,nativeAttestation:verified,threadObservations,threadCount:threadObservations.length,crossPrincipalProcReadback:true,readonlyRootVerified:true,privateFileExchangeResponseWritten:true,pidNamespace:ownNs.pid,nonDumpabilityScope:'CURRENT_QUALIFICATION_WRITER_ONLY',childTermination,childStderr:childObservation.diagnostic(),applicationStarted:false}));
})().catch(async e=>{if(childObservation){childTermination=await childObservation.finish();childFailure=childFailure||childObservation.firstFailure();}console.log(JSON.stringify({schema:'work8-v75-native-capability-observation-v2',status:'FAIL',assertion:step,errorClass:e.name,errorCode:/^[A-Z_0-9]{1,80}$/.test(e.code||'')?e.code:/^[A-Z_0-9]{1,80}$/.test(e.message||'')?e.message:null,childFailure,childTermination,childStderr:childObservation?childObservation.diagnostic():null,rawErrorRetained:false,applicationStarted:false}));process.exitCode=1;});

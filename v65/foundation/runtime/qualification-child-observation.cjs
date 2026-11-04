'use strict';
// Bounded qualification-only child output. Raw buffers are never exported.
const crypto=require('node:crypto');
function observeChild(child,{observationDeadlineMs=5000,terminationDeadlineMs=2000}={}){
 let stdout='',stdoutBytes=0,stderr='',stderrBytes=0,closed=false,closeValue=null,settled=false,firstFailure=null,finishPromise=null,outputViolation=null;
 const hash=crypto.createHash('sha256');let resolveObservation,rejectObservation,resolveClose;
 const observation=new Promise((resolve,reject)=>{resolveObservation=resolve;rejectObservation=reject;});
 const closePromise=new Promise(resolve=>{resolveClose=resolve;});
 const fail=(code,extra={})=>{if(settled)return;settled=true;clearTimeout(timer);firstFailure={stage:'NATIVE_WRITER_STARTUP',errorCode:code,...extra,rawErrorRetained:false};const error=Error(code);error.code=code;rejectObservation(error);};
 const timer=setTimeout(()=>fail('WRITER_DEADLINE'),observationDeadlineMs);
 child.once('error',e=>fail('WRITER_SPAWN_FAILED',{systemCode:/^[A-Z_0-9]{1,80}$/.test(e.code||'')?e.code:null}));
 child.stdout.on('data',b=>{stdoutBytes+=b.length;if(stdoutBytes>8192){outputViolation='WRITER_RECEIPT_BOUND';fail(outputViolation);return;}stdout+=b.toString('utf8');if(!settled&&stdout.includes('\n')){try{const row=JSON.parse(stdout.split('\n')[0]);settled=true;clearTimeout(timer);resolveObservation(row);}catch(e){fail('WRITER_RECEIPT_INVALID');}}});
 const captureStderr=b=>{stderrBytes+=b.length;hash.update(b);if(stderr.length<4096)stderr+=b.toString('utf8').slice(0,4096-stderr.length);if(stderrBytes>4096){outputViolation='WRITER_DIAGNOSTIC_BOUND';fail(outputViolation);}};
 child.stderr.on('data',captureStderr);
 child.once('close',(exitCode,signal)=>{closed=true;closeValue={exitCode,signal};clearTimeout(timer);resolveClose(closeValue);if(!settled){const constructorRefused=exitCode===126&&signal===null&&stderrBytes<=4096&&stderr==='WRITER_ISOLATION_INSTALL_REFUSED\n';fail(constructorRefused?'WRITER_ISOLATION_INSTALL_REFUSED':'WRITER_EXIT_BEFORE_SECURITY_OBSERVATION',{exitCode,signal});}});
 const waitClose=ms=>closed?Promise.resolve(true):new Promise(resolve=>{const t=setTimeout(()=>resolve(false),ms);closePromise.then(()=>{clearTimeout(t);resolve(true);});});
 async function finish(){
  if(finishPromise)return finishPromise;
  finishPromise=(async()=>{let forcedKill=false,requestedSignal=null;if(!closed){requestedSignal='SIGTERM';child.kill('SIGTERM');if(!await waitClose(terminationDeadlineMs)){forcedKill=true;child.kill('SIGKILL');await waitClose(terminationDeadlineMs);}}
   if(!closed)child.stderr.removeListener('data',captureStderr);
   if(stdout.trim().split('\n').filter(Boolean).length>1)outputViolation=outputViolation||'WRITER_EXTRA_STDOUT';
   return {closed,forcedKill,requestedSignal,outputViolation,...(closeValue||{exitCode:null,signal:null})};})();
  return finishPromise;
 }
 return {observation,finish,firstFailure:()=>firstFailure,diagnostic:()=>({bytes:stderrBytes,sha256:hash.copy().digest('hex'),streamComplete:closed,rawOutputRetained:false})};
}
function expectedTermination(t){return t.closed===true&&t.forcedKill===false&&t.requestedSignal==='SIGTERM'&&t.exitCode===null&&t.signal==='SIGTERM'&&t.outputViolation===null;}
module.exports={observeChild,expectedTermination};

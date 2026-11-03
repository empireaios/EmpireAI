'use strict';
// Non-production diagnostic observer only. Never changes admission, authority,
// permissions, exit status or error handling; no application/SQL imports.
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const allow=JSON.parse(fs.readFileSync(path.join(__dirname,'native-diagnostic-codes.json'),'utf8'));
const codes=new Set(allow.codes),errnos=new Set(allow.errnos),roles=new Set(allow.startupRoles),messages=allow.startupMessages;
const frames=new Set(allow.startupFrameFiles),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
let first=false;
function identity(){
 const fields=Object.fromEntries(fs.readFileSync('/proc/self/status','utf8').split('\n').filter(s=>s.includes(':')).map(s=>{const i=s.indexOf(':');return [s.slice(0,i),s.slice(i+1).trim()];}));
 return {pid:process.pid,effectiveUid:process.geteuid(),effectiveGid:process.getegid(),capabilities:Object.fromEntries(['CapInh','CapPrm','CapEff','CapBnd','CapAmb'].filter(k=>/^[a-f0-9]{16}$/.test(fields[k])).map(k=>[k,fields[k]])),noNewPrivileges:fields.NoNewPrivs==='1',seccomp:Number(fields.Seccomp)};
}
function roleForAdmission(){return roles.has(process.env.WORK8_MEMBERSHIP_ROLE)?process.env.WORK8_MEMBERSHIP_ROLE:'admitted-child';}
function observe(error,stage,role){
 if(first)return;first=true;
 try{
  const message=String(error?.message??''),code=typeof error?.code==='string'?error.code:null;
  const assertion=codes.has(message)?message:messages[message]??(errnos.has(code)?code:'UNCLASSIFIED_NATIVE_STARTUP_ERROR');
  const stat=fs.readFileSync('/proc/self/stat','utf8'),entry=process.argv[1],knownEntry=allow.startupEntrypoints.includes(entry);
  const source=process.env.RAILWAY_GIT_COMMIT_SHA,generation=process.env.EMPIRE_GENERATION;
  const origin={role:roles.has(role)?role:'admitted-child',pid:process.pid,parentPid:process.ppid,startTicks:stat.slice(stat.lastIndexOf(')')+2).split(' ')[19],entrypoint:knownEntry?path.basename(entry):'UNRECOGNIZED_ENTRY',entrySha256:knownEntry?sha(fs.readFileSync(entry)):null,source:/^[a-f0-9]{40}$/.test(source??'')?source:null,generationSha256:/^[a-f0-9-]{36}$/.test(generation??'')?sha(generation):null,observedMonotonicNs:process.hrtime.bigint().toString(),messageSha256:sha(message)};
  const sourceFrames=(String(error?.stack??'').match(/[A-Za-z0-9_-]+\.(?:cjs|mjs|js):[0-9]+:[0-9]+/g)??[]).filter(s=>frames.has(s.split(':')[0])).slice(0,6);
  const record={schema:'work8-v31-native-first-failure-v1',firstFailure:true,stage:codes.has(stage)?stage:'NATIVE_CHILD_STARTUP',assertion,operation:'OBSERVE_ORIGINAL_CHILD_FAILURE',errno:errnos.has(code)?code:null,sourceFrames,identityScope:'NATIVE_STARTUP_PROCESS',identity:identity(),state:{moduleInitialized:null,applicationInitialized:null,captureRequestReached:null,privateReceiptWritten:null,captureFenceAcquired:null,captureFenceReleased:null,persistenceCompleted:null},containerLifecycle:{role:'backend',status:null,exitCode:null,oomKilled:null},origin,rawErrorOrRecordsRetained:false};
  const bytes=Buffer.from('WORK8_NATIVE_FIRST_FAILURE '+JSON.stringify(record)+'\n');
  // One <=PIPE_BUF write prevents interleaving with another failing child.
  if(bytes.length>4096)throw Error('CHILD_DIAGNOSTIC_BOUND');fs.writeSync(2,bytes);
 }catch{
  try{fs.writeSync(2,'WORK8_NATIVE_DIAGNOSTIC_UNAVAILABLE {"assertion":"CHILD_SAFE_OBSERVER_UNAVAILABLE","rawOutputRetained":false}\n');}catch{}
 }
}
function install(stage,role){process.on('uncaughtExceptionMonitor',error=>observe(error,stage,typeof role==='function'?role():role));}
module.exports={observe,install,roleForAdmission};

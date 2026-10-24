'use strict';
const {spawn}=require('node:child_process');
const {randomUUID}=require('node:crypto');
const {protocol,valid}=require('./observer-capture.cjs');
const LEGACY_ORIGIN='https://empireai-locked-runtime-production.up.railway.app';
// A service-specific target prevents an isolated twin from observing production.
function assuranceRuntimeOrigin(env){
 const raw=env.ASSURANCE_RUNTIME_ORIGIN??(env.RAILWAY_PUBLIC_DOMAIN?`https://${env.RAILWAY_PUBLIC_DOMAIN}`:LEGACY_ORIGIN);
 let url;try{url=new URL(raw);}catch{throw Error('Invalid Assurance runtime origin');}
 if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash||url.port)throw Error('Invalid Assurance runtime origin');
 return url.origin;
}
// These children remain independent of Pillow and are restarted independently.
function superviseAssurance({cwd,env,spawnImpl=spawn,onEvent=e=>console.log(JSON.stringify(e)),retryMs=1000,maxRestarts=5,windowMs=300000,clock=Date.now,onCaptureFailure=()=>{},captureTimeoutMs=20000,stallMs={ 'permanent-worker.mjs':600000, 'permanent-inspector.mjs':90000 }}) {
  const origin=assuranceRuntimeOrigin(env);
  let stopping=false;const children=new Set(),timers=new Set(),failures=new Map();
  let runtime,capture;
  const send=(child,m)=>{if(child?.connected)child.send(m,error=>{if(error&&capture)failCapture();});else if(capture)failCapture();};
  const failCapture=()=>{
    if(!capture)return;
    clearTimeout(capture.timer);capture=null;stopping=true;
    // Never reopen writers after a lost requester. Contain both observers and
    // abort the supervised runtime; existing watchdogs are not postponed.
    for(const child of children)child.kill('SIGKILL');
    onCaptureFailure();
  };
  function observerMessage(child,m){
    if(!capture||!valid(m)||m.id!==capture.id||!capture.members.has(child))return;
    if(m.action===capture.expected&&typeof m.generation==='string'){
      if(capture.members.get(child)!==null&&capture.members.get(child)!==m.generation){failCapture();return;}
      capture.members.set(child,m.generation);capture.acks.add(child);
      if(capture.acks.size===2){
        send(runtime,{protocol,id:capture.id,action:capture.expected,generation:capture.generation});
        if(capture.expected==='released'){clearTimeout(capture.timer);capture=null;}
      }
    }else failCapture();
  }
  function attachRuntime(child){
    runtime=child;
    child.on('message',m=>{
      if(!valid(m))return;
      if(m.action==='acquire'){
        if(capture||children.size!==2||stopping){send(child,{protocol,id:m.id,action:'refused'});return;}
        capture={id:m.id,generation:randomUUID(),members:new Map([...children].map(c=>[c,null])),acks:new Set(),expected:'held'};
        capture.timer=setTimeout(failCapture,captureTimeoutMs);
        for(const c of capture.members.keys())send(c,{protocol,id:m.id,action:'acquire'});
      }else if(m.action==='release'&&capture&&m.id===capture.id&&m.generation===capture.generation&&capture.acks.size===2){
        capture.expected='released';capture.acks.clear();
        for(const [c,generation] of capture.members)send(c,{protocol,id:m.id,action:'release',generation});
      }else if(capture)failCapture();
    });
    child.on('disconnect',failCapture);child.on('exit',failCapture);
  }
  function start(name){
    if(stopping)return;
    const childEnv={NODE_OPTIONS:env.NODE_OPTIONS,EMPIRE_GENERATION_DIRECTORY:env.EMPIRE_GENERATION_DIRECTORY,EMPIRE_GENERATION:env.EMPIRE_GENERATION,EMPIRE_CUTOVER_DIGEST:env.EMPIRE_CUTOVER_DIGEST,EMPIRE_GENERATION_DEVICE:env.EMPIRE_GENERATION_DEVICE,EMPIRE_GENERATION_INODE:env.EMPIRE_GENERATION_INODE,PATH:env.PATH,RAILWAY_VOLUME_MOUNT_PATH:env.RAILWAY_VOLUME_MOUNT_PATH,RAILWAY_GIT_COMMIT_SHA:env.RAILWAY_GIT_COMMIT_SHA,ASSURANCE_RUNTIME_ORIGIN:origin};
    if(name==='permanent-worker.mjs')childEnv.REDIS_URL=env.REDIS_URL;
    let child,queued=false,progressTimer;
    const clearProgress=()=>{clearTimeout(progressTimer);timers.delete(progressTimer);};
    const armProgress=()=>{
      clearProgress();
      progressTimer=setTimeout(()=>{
        timers.delete(progressTimer);
        if(stopping||queued)return;
        queued=true;
        // A hung observer cannot certify its own recovery. Quarantine rather
        // than silently restarting forever outside the short crash budget.
        try{onEvent({event:'assurance_restart_quarantined',component:name,reason:'NO_PROGRESS',monitoringCoverage:'LOST'});}
        finally{child.kill('SIGKILL');}
      },stallMs[name]);timers.add(progressTimer);
    };
    const restart=()=>{
      clearProgress();
      if(capture){failCapture();return;}
      if(queued)return;queued=true;children.delete(child);
      if(stopping)return;
      const now=clock(),recent=(failures.get(name)||[]).filter(at=>now-at<windowMs);recent.push(now);failures.set(name,recent);
      if(recent.length>maxRestarts){onEvent({event:'assurance_restart_quarantined',component:name,attempts:recent.length,monitoringCoverage:'LOST'});return;}
      const backoff=Math.min(60000,retryMs*2**(recent.length-1));
      const timer=setTimeout(()=>{timers.delete(timer);start(name);},backoff);timers.add(timer);
    };
    try{
      child=spawnImpl(process.execPath,['backend/src/assurance/'+name],{cwd,env:childEnv,stdio:['ignore','inherit','inherit','ipc']});children.add(child);
      child.on('message',message=>{observerMessage(child,message);if(!queued&&!stopping&&message?.type==='assurance_progress')armProgress();});
      armProgress();
      child.once('error',()=>{onEvent({event:'assurance_process_unavailable',component:name});restart();});
      child.once('exit',(code,signal)=>{onEvent({event:'assurance_process_exit',component:name,code,signal});restart();});
    }catch{onEvent({event:'assurance_process_unavailable',component:name});restart();}
  }
  for(const name of ['permanent-worker.mjs','permanent-inspector.mjs'])start(name);
  const stop=()=>{stopping=true;if(capture)clearTimeout(capture.timer);for(const timer of timers)clearTimeout(timer);for(const child of children)child.kill('SIGTERM');};
  stop.attachRuntime=attachRuntime;return stop;
}
module.exports={superviseAssurance,assuranceRuntimeOrigin};


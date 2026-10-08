'use strict';
const {spawn}=require('node:child_process');
// These children remain independent of Pillow and are restarted independently.
function superviseAssurance({cwd,env,spawnImpl=spawn,onEvent=e=>console.log(JSON.stringify(e)),retryMs=1000,maxRestarts=5,windowMs=300000,clock=Date.now}) {
  let stopping=false;const children=new Set(),timers=new Set(),failures=new Map();
  function start(name){
    if(stopping)return;
    const childEnv={PATH:env.PATH,RAILWAY_VOLUME_MOUNT_PATH:env.RAILWAY_VOLUME_MOUNT_PATH,RAILWAY_GIT_COMMIT_SHA:env.RAILWAY_GIT_COMMIT_SHA,ASSURANCE_RUNTIME_ORIGIN:'https://empireai-locked-runtime-production.up.railway.app'};
    if(name==='permanent-worker.mjs')childEnv.REDIS_URL=env.REDIS_URL;
    let child,queued=false;
    const restart=()=>{
      if(queued)return;queued=true;children.delete(child);
      if(stopping)return;
      const now=clock(),recent=(failures.get(name)||[]).filter(at=>now-at<windowMs);recent.push(now);failures.set(name,recent);
      if(recent.length>maxRestarts){onEvent({event:'assurance_restart_quarantined',component:name,attempts:recent.length,monitoringCoverage:'LOST'});return;}
      const backoff=Math.min(60000,retryMs*2**(recent.length-1));
      const timer=setTimeout(()=>{timers.delete(timer);start(name);},backoff);timers.add(timer);
    };
    try{
      child=spawnImpl(process.execPath,['backend/src/assurance/'+name],{cwd,env:childEnv,stdio:['ignore','inherit','inherit']});children.add(child);
      child.once('error',()=>{onEvent({event:'assurance_process_unavailable',component:name});restart();});
      child.once('exit',(code,signal)=>{onEvent({event:'assurance_process_exit',component:name,code,signal});restart();});
    }catch{onEvent({event:'assurance_process_unavailable',component:name});restart();}
  }
  for(const name of ['permanent-worker.mjs','permanent-inspector.mjs'])start(name);
  return ()=>{stopping=true;for(const timer of timers)clearTimeout(timer);for(const child of children)child.kill('SIGTERM');};
}
module.exports={superviseAssurance};

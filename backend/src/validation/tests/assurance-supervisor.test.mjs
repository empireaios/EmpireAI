import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {superviseAssurance} from '../../../../deployment/assurance-supervisor.cjs';
test('collector and inspector restart independently and cannot receive provider or founder secrets',async()=>{
 const launched=[],events=[];
 const stop=superviseAssurance({cwd:'/safe',env:{PATH:'/bin',REDIS_URL:'redis-test',FOUNDER_PASSWORD:'never-forward',OPENAI_API_KEY:'never-forward'},retryMs:5,onEvent:e=>events.push(e),spawnImpl:(_exe,args,options)=>{const c=new EventEmitter();c.kill=()=>{c.killed=true;};launched.push({c,args,options});return c;}});
 try{
  assert.equal(launched.length,2);
  assert.equal(launched[0].options.env.REDIS_URL,'redis-test');assert.equal(launched[1].options.env.REDIS_URL,undefined);
  for(const x of launched){assert.equal(x.options.env.FOUNDER_PASSWORD,undefined);assert.equal(x.options.env.OPENAI_API_KEY,undefined);}
  launched[0].c.emit('exit',1,null);await new Promise(r=>setTimeout(r,20));
  assert.equal(launched.length,3);assert.match(launched[2].args[0],/permanent-worker/);assert.equal(launched[1].c.killed,undefined);
  stop();launched[2].c.emit('exit',0,null);await new Promise(r=>setTimeout(r,20));assert.equal(launched.length,3);assert.equal(launched[1].c.killed,true);
 }finally{stop();}
});
test('actual inspector restarts, reports missing durable cycles and stops promptly',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'assurance-inspector-'));fs.mkdirSync(path.join(root,'commissioning'));
 const entry=fileURLToPath(new URL('../../assurance/permanent-inspector.mjs',import.meta.url));
 try{
  for(let attempt=0;attempt<2;attempt++){
   const child=spawn(process.execPath,[entry],{env:{PATH:process.env.PATH,RAILWAY_VOLUME_MOUNT_PATH:root},stdio:['ignore','pipe','pipe']});
   let output='';
   const exit=new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(code,signal)=>resolve({code,signal}));});
   const timer=setTimeout(()=>child.kill('SIGKILL'),3000);
   try{
    await new Promise((resolve,reject)=>{child.once('error',reject);child.stdout.on('data',chunk=>{output+=chunk; if(output.includes('\n'))resolve();});child.once('exit',()=>{if(!output)reject(Error('Inspector exited without evidence'));});});
    const report=JSON.parse(output.split('\n')[0]);assert.equal(report.event,'independent_assurance_watchdog');assert.equal(report.healthy,false);assert.equal(report.status,'SOURCE_UNAVAILABLE');
    assert.equal(report.observerFailed,true);assert.equal(report.heartbeatRenewed,false);
    assert.equal(fs.existsSync(path.join(root,'commissioning/assurance.sqlite.watchdog')),false);
    child.kill('SIGTERM');const stopped=await exit;assert.equal(stopped.code,0);assert.equal(stopped.signal,null);
   }finally{clearTimeout(timer);if(child.exitCode===null)child.kill('SIGKILL');}
  }
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('repeated child failures exhaust bounded restart budget',async()=>{
 const children=[],events=[];
 const stop=superviseAssurance({cwd:'/safe',env:{PATH:'/bin'},retryMs:1,maxRestarts:1,onEvent:e=>events.push(e),spawnImpl:()=>{const child=new EventEmitter();child.kill=()=>{};children.push(child);return child;}});
 try{children[0].emit('exit',1,null);await new Promise(r=>setTimeout(r,10));assert.equal(children.length,3);children[2].emit('exit',1,null);await new Promise(r=>setTimeout(r,10));assert.equal(children.length,3);assert.ok(events.some(e=>e.event==='assurance_restart_quarantined'));}finally{stop();}
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
for(const name of ['permanent-worker.mjs','permanent-inspector.mjs'])test(`actual ${name} publishes loop progress and exits after launcher disconnect`,{timeout:15000},async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'assurance-parent-loss-'));fs.mkdirSync(path.join(root,'commissioning'));
 const entry=fileURLToPath(new URL('../../assurance/'+name,import.meta.url));
 const child=spawn(process.execPath,[entry],{env:{PATH:process.env.PATH,RAILWAY_GIT_COMMIT_SHA:'a'.repeat(40),RAILWAY_VOLUME_MOUNT_PATH:root,REDIS_URL:'redis://127.0.0.1:1',ASSURANCE_RUNTIME_ORIGIN:'https://twin.example.invalid'},stdio:['ignore','ignore','pipe','ipc']});
 let errors='';child.stderr.on('data',chunk=>{errors+=chunk;});
 const exit=new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(code,signal)=>resolve({code,signal}));});
 const deadline=setTimeout(()=>child.kill('SIGKILL'),12000);
 try{
  await new Promise((resolve,reject)=>{child.once('error',reject);child.on('message',message=>{if(message?.type==='assurance_progress')resolve();});child.once('exit',()=>reject(Error('Observer exited before progress: '+errors)));});
  child.disconnect();const result=await exit;assert.equal(result.code,0);assert.equal(result.signal,null);
 }finally{clearTimeout(deadline);child.kill('SIGKILL');fs.rmSync(root,{recursive:true,force:true});}
});

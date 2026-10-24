import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
const protocol='work8-observer-capture-v1';
for(const name of ['permanent-worker.mjs','permanent-inspector.mjs'])test(`actual ${name} fences startup and changes generation after interruption`,{timeout:15000},async()=>{
 assert.equal(process.env.WORK8_KERNEL_EGRESS,'DENIED');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'assurance-capture-restart-'));fs.mkdirSync(path.join(root,'commissioning'));
 let previous;
 try{for(let restart=0;restart<2;restart++){
  const child=spawn(process.execPath,[fileURLToPath(new URL('../../assurance/'+name,import.meta.url))],{env:{PATH:process.env.PATH,RAILWAY_GIT_COMMIT_SHA:'a'.repeat(40),RAILWAY_VOLUME_MOUNT_PATH:root,REDIS_URL:'redis://127.0.0.1:1',ASSURANCE_RUNTIME_ORIGIN:'https://twin.example.invalid'},stdio:['ignore','ignore','ignore','ipc']});
  const exit=new Promise(resolve=>child.once('exit',resolve));
  const wait=action=>new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{child.off('message',receive);reject(Error('capture acknowledgement deadline'));},5000);const receive=m=>{if(m.protocol===protocol&&m.action===action){clearTimeout(timeout);child.off('message',receive);resolve(m);}};child.on('message',receive);});
  try{
   const id=randomUUID(),held=wait('held');child.send({protocol,id,action:'acquire'});const ack=await held;
   assert.equal(ack.id,id);assert.equal(typeof ack.generation,'string');assert.notEqual(ack.generation,previous);previous=ack.generation;
   if(name==='permanent-worker.mjs')assert.ok(fs.existsSync(path.join(root,'commissioning/assurance.sqlite')));
   const released=wait('released');child.send({protocol,id,action:'release',generation:ack.generation});assert.equal((await released).generation,ack.generation);
   const next=randomUUID(),heldAgain=wait('held');child.send({protocol,id:next,action:'acquire'});assert.equal((await heldAgain).generation,ack.generation);
  }finally{child.kill('SIGKILL');await exit;}
 }}finally{fs.rmSync(root,{recursive:true,force:true});}
});

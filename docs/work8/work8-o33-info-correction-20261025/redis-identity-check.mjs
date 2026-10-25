import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import * as url from 'node:url';
const root=path.resolve('o33-correction');
const code=fs.readFileSync(root+'/backend/dist/runtime/work8-admitted-application.js','utf8');
const volume=fs.mkdtempSync('/tmp/work8-info-');
const st=fs.statSync(volume),expected='a'.repeat(40);
const results=[];
try {
 for(const [name,info,db,pass] of [
 ['full INFO sections matching identity','# Server\r\nredis_version:7.4.2\r\nrun_id:'+expected+'\r\n# Clients\r\nconnected_clients:1\r\n',0,true],
 ['LF response matching identity','run_id:'+expected+'\n',0,true],
 ['different Redis identity','run_id:'+'b'.repeat(40)+'\r\n',0,false],
 ['missing identity','# Server\r\nredis_version:7.4.2\r\n',0,false],
 ['malformed identity','run_id:invalid\r\n',0,false],
 ['nonzero database','run_id:'+expected+'\r\n',1,false],
 ]) {
  let args;
  class TaskQueue {queue={client:Promise.resolve({info:async(...a)=>{args=a;return info;}})}}
  const grant={schema:'work8-isolated-application-v1',source:'c'.repeat(40),generation:'g',nonce:'n',mode:'target',expiresAt:Date.now()+10000,volume:{root:volume,dev:st.dev,ino:st.ino},redis:{runId:expected,db},recipient:{role:'brain-worker',pid:123,id:'id',nonce:'rn'}};
  const context=vm.createContext({process:{pid:123,connected:true,send(){},env:{WORK8_MEMBERSHIP_ROLE:'brain-worker',WORK8_MEMBERSHIP_ID:'id',WORK8_MEMBERSHIP_NONCE:'rn',RAILWAY_GIT_COMMIT_SHA:grant.source,EMPIRE_GENERATION:'g',RAILWAY_VOLUME_MOUNT_PATH:volume,WORK8_REAL_GRAPH:'1'}},setTimeout,clearTimeout});
  context[Symbol.for('work8.admitted.isolated.application')]=grant;
  const module=new vm.SourceTextModule(code,{context,identifier:root+'/backend/dist/runtime/work8-admitted-application.js'});
  await module.link(spec=>{
   const exports=spec==='node:assert/strict'?{default:assert}:spec==='node:fs'?{default:fs}:spec==='node:path'?{default:path}:spec==='node:url'?{pathToFileURL:url.pathToFileURL}:spec.includes('task-queue')?{TaskQueue}:{getActiveMembershipCapture:()=>undefined};
   return new vm.SyntheticModule(Object.keys(exports),function(){for(const [k,v]of Object.entries(exports))this.setExport(k,v);},{context});
  });
  await module.evaluate();
  const invoke=()=>module.namespace.initializeAdmittedApplicationIfPresent({brain:{taskQueue:new TaskQueue()}});
  if(pass)await invoke();else await assert.rejects(invoke,{code:'ERR_ASSERTION'});
  assert.deepEqual(args,[]);
  results.push({name,status:'PASS',expected:pass?'accept':'refuse',infoArguments:args});
 }
 console.log(JSON.stringify({scope:'Actual compiled initializer; synthetic TaskQueue/client and admission environment; no live Redis or hosted topology claim',node:process.version,tests:results.length,results},null,2));
}finally{fs.rmSync(volume,{recursive:true,force:true});}

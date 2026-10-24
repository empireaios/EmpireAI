import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'node:net';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
const {createGeneratedCaptureScope}=await import('../../backend/dist/runtime/work8-generated-capture-hold.js');
const {GeneratedStartupProtocol}=await import('../../backend/dist/runtime/work8-generated-startup-protocol.js');
let redisServer;
let stage='ROOTS';
function fail(error){fs.writeSync(2,JSON.stringify({event:'hh4-startup-failed',stage,error:String(error)})+'\n');redisServer?.kill('SIGKILL');process.exit(1);}
process.on('SIGTERM',()=>fail(Error('HH4_PARENT_TERMINATED')));
process.on('uncaughtException',fail);process.on('unhandledRejection',fail);
process.once('disconnect',()=>{redisServer?.kill('SIGKILL');process.kill(process.pid,'SIGKILL');});
const runId=randomUUID(),source=process.env.HH4_SOURCE;assert.match(source,/^[a-f0-9]{40}$/);
const scope=createGeneratedCaptureScope({timeoutMs:5000,onHeld:notice=>{process.send({event:'hh4-held',runId,source,notice});}});
const redisPort=await new Promise((resolve,reject)=>{const s=createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const a=s.address();s.close(()=>resolve(a.port));});});
const protocol=new GeneratedStartupProtocol(runId,source);
function waitForTransition(transition){return new Promise((resolve,reject)=>{const done=(error)=>{clearTimeout(timer);process.off('message',receive);error?reject(error):resolve();};const receive=m=>{try{transition(m);done();}catch(error){done(error);}};const timer=setTimeout(()=>done(Error('HH4_ADOPTION_TIMEOUT')),protocol.remaining());process.once('message',receive);});}
const prepare=waitForTransition(m=>protocol.prepare(m));
process.send({event:'hh4-new-root',runId,source,volumeRoot:scope.volumeRoot,captureRoot:scope.captureRoot,redisPort});
await prepare;stage='INFRASTRUCTURE_PREPARATION';
const premature=()=>fail(Error('HH4_MESSAGE_DURING_INFRASTRUCTURE_PREPARATION'));process.on('message',premature);
Object.assign(process.env,{RAILWAY_VOLUME_MOUNT_PATH:scope.volumeRoot,DATABASE_PATH:scope.volumeRoot+'/commissioning/empireai-brain.db',SHADOW_CEO_DATA_DIR:scope.volumeRoot+'/shadow',REDIS_URL:'redis://127.0.0.1:'+redisPort,REDIS_OPTIONAL:'false',EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',MISSION_AUTHORITY_EXECUTOR_ENABLED:'true',RAILWAY_GIT_COMMIT_SHA:source,EMPIRE_ROLE:'brain-worker',EMPIRE_TIER0_ISOLATION:'false',PORT:'4101',HOST:'127.0.0.1',FOUNDER_EMAIL:'hh4-owner@example.test',FOUNDER_PASSWORD:'generated-hh4-owner-password',ADMIN_EMAIL:'hh4-admin@example.test',ADMIN_PASSWORD:'generated-hh4-admin-password'});
// Optional visual/session stores still initialize in headless mode. Bind their
// persistent directories to this generated root without making the image writable.
const repositoryRoot=path.resolve(import.meta.dirname,'../..');
for(const [name,directory] of [['VISUAL_MEMORY_STORAGE_ROOT','pillow-visual-memory'],['SESSION_CONTINUITY_STORAGE_ROOT','pillow-session-continuity']]){
 const destination=path.join(scope.volumeRoot,directory),relative=path.relative(repositoryRoot,destination);
 assert.equal(path.join(repositoryRoot,relative),destination);
 process.env[name]=relative;
}
fs.mkdirSync(scope.volumeRoot+'/commissioning');fs.mkdirSync(scope.volumeRoot+'/redis');
const server=redisServer=spawn('/usr/bin/redis-server',['--bind','127.0.0.1','--port',String(redisPort),'--dir',scope.volumeRoot+'/redis','--save','','--appendonly','yes','--appendfsync','always'],{stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{
 let settled=false,output='';
 const done=error=>{if(settled)return;settled=true;clearTimeout(timer);server.off('error',failed);server.off('exit',exited);server.stdout.off('data',data);error?reject(error):resolve();};
 const failed=error=>done(error),exited=()=>done(Error('HH4_REDIS_EXIT'));
 const data=chunk=>{output=(output+String(chunk)).slice(-4096);if(output.includes('Ready to accept connections'))done();};
 const timer=setTimeout(()=>done(Error('HH4_REDIS_STARTUP_TIMEOUT')),Math.min(10000,protocol.remaining()));
 server.once('error',failed);server.once('exit',exited);server.stdout.on('data',data);
});
server.on('error',fail);server.on('exit',()=>fail(Error('HH4_REDIS_EXIT')));
process.off('message',premature);
protocol.infrastructureReady();stage='INFRASTRUCTURE_READY';
const admission=waitForTransition(m=>protocol.admit(m));
process.send({event:'hh4-infrastructure-ready',runId,source,redisPort});
await admission;stage='ADMITTED';
process.on('message',message=>{if(message?.action==='hh4-admit'||message?.action==='hh4-prepare-infrastructure')fail(Error('HH4_DUPLICATE_STARTUP_TRANSITION'));});
const {registerGeneratedWorkerLifecycle}=await import('../../backend/dist/runtime/work8-generated-worker-lifecycle.js');registerGeneratedWorkerLifecycle(scope,source,runId);
await import('../../backend/dist/index.js');

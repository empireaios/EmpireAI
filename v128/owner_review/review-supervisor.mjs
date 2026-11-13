// Nonroot native service supervisor. Root host owns the sole public ingress,
// signed provisioning, immutable absolute timeout and forced termination.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const CONTROL='/control/owner_review',started=Date.now();
assert.equal(process.getuid(),1001);assert.equal(process.getgid(),1001);
for(const key of ['NODE_OPTIONS','NODE_PATH','LD_PRELOAD','LD_LIBRARY_PATH'])assert.ok(!process.env[key],'UNTRUSTED_RUNTIME_ENV');
function json(file,max){const s=fs.lstatSync(file);assert(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&s.size<=max);return JSON.parse(fs.readFileSync(file,'utf8'));}
const cfg=json('/private/review-bootstrap.json',65536),host=json('/private/host-bootstrap.json',4*1024*1024);
assert.equal(cfg.origin,host.origin);assert.equal(cfg.expiresAtMs,host.expiresAtMs);assert(cfg.expiresAtMs-started>90000&&cfg.expiresAtMs-started<=1200000);
const runtimeBytes=fs.readFileSync(CONTROL+'/runtime-manifest.json');assert(runtimeBytes.length<=32*1024*1024);assert.equal(sha(runtimeBytes),cfg.runtimeManifestSHA256);assert.equal(cfg.runtimeManifestSHA256,host.runtimeManifestSHA256);
const runtime=JSON.parse(runtimeBytes);assert.equal(runtime.schema,'A09_HOST_RUNTIME_MANIFEST_V1');assert.equal(runtime.nodeVersion,process.version);assert.equal(runtime.nodeSHA256,sha(fs.readFileSync(fs.realpathSync(process.execPath))));
assert.equal(runtime.applicationCommit,'6c1e63ba20619ee480742fd87dc810ca93152e22');
assert.equal(sha(fs.readFileSync(CONTROL+'/source-manifest.json')),cfg.sourceManifestSHA256);
assert(!fs.existsSync('/state/review'),'RESTORE_TARGET_ALREADY_EXISTS');
assert(!fs.existsSync('/state/review-export'),'EXPORT_TARGET_ALREADY_EXISTS');
const env={PATH:'/usr/local/bin:/usr/bin:/bin',HOME:'/tmp',LANG:'C.UTF-8',TZ:'UTC',NODE_ENV:'production'};
const children=[];let finalizing=false,soft=false,acknowledged=false,ciphertextLogComplete=false;
function child(label,binary,args,extra={},cwd='/'){
 const p=spawn(binary,args,{cwd,env:{...env,...extra},stdio:['ignore','pipe','pipe','ipc']});const row={label,p,closed:false,exitCode:null};children.push(row);
 let pending='',bytes=0;
 p.stdout.on('data',b=>{
  bytes+=b.length;if(bytes>32*1024*1024){p.kill('SIGKILL');return;}
  // Forward only bounded, explicitly recipient-encrypted custody lines. Native
  // logs and all raw errors remain suppressed; credentials never reach logs.
  pending+=b.toString('utf8');if(pending.length>16384&&!pending.includes('\n')){p.kill('SIGKILL');return;}
  let at;while((at=pending.indexOf('\n'))>=0){const line=pending.slice(0,at);pending=pending.slice(at+1);if(line.length>16384)continue;
   try{const value=JSON.parse(line);if(['A09_CUSTODY_CIPHERTEXT_V1','A09_CUSTODY_INDEX_V1'].includes(value.schema))process.stdout.write(line+'\n');}catch{}
  }
 });
 let errorBytes=0;p.stderr.on('data',b=>{errorBytes+=b.length;if(errorBytes>1024*1024)p.kill('SIGKILL');});
 p.on('error',()=>void finish('CHILD_START_FAILURE'));
 p.on('message',message=>{if(label==='backend'&&message?.type==='ciphertext-log-complete'&&/^[a-f0-9]{64}$/.test(message.exportSHA256))ciphertextLogComplete=true;});
 p.on('close',code=>{row.closed=true;row.exitCode=code;if(!finalizing&&label!=='restore')void finish('EARLY_CHILD_EXIT');});
 return row;
}
async function ready(port,timeout=15000){const deadline=Math.min(Date.now()+timeout,cfg.expiresAtMs-90000);while(Date.now()<deadline){
 if(await new Promise(resolve=>{const socket=net.createConnection({host:'127.0.0.1',port});socket.setTimeout(200);socket.on('connect',()=>{socket.destroy();resolve(true);});socket.on('error',()=>resolve(false));socket.on('timeout',()=>{socket.destroy();resolve(false);});}))return;
 await new Promise(resolve=>setTimeout(resolve,50));
}throw Error('NATIVE_READINESS_DEADLINE');}
function softSeal(){if(soft)return;soft=true;for(const row of children)if(row.label==='backend'&&!row.closed)row.p.kill('SIGUSR1');}
async function finish(reason){if(finalizing)return;finalizing=true;softSeal();
 const hard=['HARD_DRAIN','ABSOLUTE_EXPIRY','INTERRUPTED'].includes(reason);
 if(!acknowledged&&hard)await new Promise(resolve=>setTimeout(resolve,4000));
 if(!acknowledged&&!hard){
  const until=Math.min(Date.now()+80000,cfg.expiresAtMs);
  while(!acknowledged&&!ciphertextLogComplete&&Date.now()<until&&children.some(row=>row.label==='backend'&&!row.closed))await new Promise(resolve=>setTimeout(resolve,50));
 }
 for(const row of [...children].reverse())if(!row.closed)row.p.kill('SIGTERM');
 await new Promise(resolve=>setTimeout(resolve,250));
 for(const row of children)if(!row.closed)row.p.kill('SIGKILL');
 process.stdout.write(JSON.stringify({schema:'A09_NATIVE_SUPERVISOR_TERMINAL_V1',reason,controllerAcknowledged:acknowledged,acceptanceClaimed:false})+'\n');
 process.exit(acknowledged?0:1);
}
process.on('SIGUSR1',softSeal);process.on('SIGTERM',()=>void finish('HARD_DRAIN'));process.on('SIGINT',()=>void finish('INTERRUPTED'));
process.on('SIGUSR2',()=>{acknowledged=true;void finish('EXACT_EXPORT_ACKNOWLEDGED');});
setTimeout(softSeal,Math.max(1,cfg.expiresAtMs-90000-Date.now()));
setTimeout(()=>void finish('ABSOLUTE_EXPIRY'),Math.max(1,cfg.expiresAtMs-Date.now()));
try{
 const restored=child('restore','/usr/local/bin/python3',[CONTROL+'/restore_review.py','--source','/inputs/a08','--target','/state/review','--receipt','/evidence/restore-readonly.json','--manifest',CONTROL+'/retained-a08-baseline.json']);
 const restoreTimer=setTimeout(()=>restored.p.kill('SIGKILL'),5000);
 const exit=await new Promise(resolve=>restored.p.on('close',resolve));clearTimeout(restoreTimer);assert.equal(exit,0,'RESTORE_FAILED');
 child('redis','/usr/bin/redis-server',['--bind','127.0.0.1','--port','46379','--save','','--appendonly','no','--protected-mode','yes','--maxmemory','33554432','--maxmemory-policy','noeviction']);await ready(46379);
 child('backend','/usr/local/bin/node',['--max-old-space-size=512',CONTROL+'/review-backend.mjs']);await ready(4000);await ready(4001);
 child('frontend','/usr/local/bin/node',['--max-old-space-size=768','/frontend/app/server.js'],{HOSTNAME:'127.0.0.1',PORT:'43117',BRAIN_API_URL:'http://127.0.0.1:4000',NEXT_TELEMETRY_DISABLED:'1',EMPIRE_CONNECTOR_OWNER_REVIEW_MODE:'RESTORED_A08_V2',EMPIRE_OWNER_REVIEW_ORIGIN:cfg.origin},'/frontend/app');await ready(43117,30000);
 process.stdout.write(JSON.stringify({schema:'A09_NATIVE_REVIEW_READY_V1',reviewClosesAtMs:cfg.expiresAtMs-90000,hardExpiresAtMs:cfg.expiresAtMs,restoredVersion:2,ownerAuthenticated:false,ownerActionObserved:false,acceptanceClaimed:false})+'\n');
}catch{await finish('NATIVE_STARTUP_FAILED');}

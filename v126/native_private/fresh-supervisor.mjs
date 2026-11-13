// Finite supervisor for a new empty native runtime. No test fixture or owner actions.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
const cfg=JSON.parse(fs.readFileSync('/private/native-bootstrap.json','utf8'));
const children=[];let requestedStop=false,stopCause=null;const started=Date.now();
assert.ok(cfg.expiresAtMs>started&&cfg.expiresAtMs-started<=1200000);
for(const sig of ['SIGTERM','SIGINT'])process.on(sig,()=>{requestedStop=true;});
const base={PATH:'/usr/local/bin:/usr/bin:/bin',HOME:'/tmp',LANG:'C.UTF-8',TZ:'UTC'};
function start(name,args,env=base,cwd='/tmp'){
 const fd=fs.openSync('/private-output/'+name+'.log','wx',0o600);
 const c=spawn(args[0],args.slice(1),{env,cwd,stdio:['ignore','pipe','pipe'],detached:true});
 const row={name,pid:c.pid,closed:false,code:null,bytes:0};children.push({c,row});
 function log(b){row.bytes+=b.length;if(row.bytes>1048576){stopCause??='LOG_LIMIT_'+name;requestedStop=true;return;}fs.writeSync(fd,b);}
 c.stdout.on('data',log);c.stderr.on('data',log);
 c.on('error',()=>{stopCause??='CHILD_SPAWN_ERROR_'+name;requestedStop=true;});c.on('close',(code)=>{row.closed=true;row.code=code;fs.closeSync(fd);});
 return row;
}
async function ready(port,timeout){
 const until=Math.min(cfg.expiresAtMs,Date.now()+timeout);
 while(Date.now()<until&&!requestedStop){
  assert.ok(children.every(x=>!x.row.closed),'EARLY_CHILD_EXIT');
  if(await new Promise(resolve=>{const s=net.createConnection({host:'127.0.0.1',port});s.setTimeout(200);s.on('connect',()=>{s.destroy();resolve(true);});s.on('error',()=>resolve(false));s.on('timeout',()=>{s.destroy();resolve(false);});}))return;
  await delay(100);
 }
 throw Error('READINESS_DEADLINE');
}
const result={schema:'v126-new-native-runtime-supervision-v1',startedAtMs:started,wholeRowAccepted:false,
 automaticOwnerAuthenticationPerformed:false,automaticOwnerSessionCreatePerformed:false,
 laterClientActions:'NOT_ADJUDICATED_BY_SUPERVISOR',historyImported:false,productionAccess:false};
try{
 assert.equal(process.version,'v22.23.2');assert.equal(process.getuid(),0);
 const status=fs.readFileSync('/proc/self/status','utf8');
 assert.match(status,/CapEff:\s+0000000000000000/);assert.match(status,/NoNewPrivs:\s+1/);
 const interfaces=fs.readFileSync('/proc/net/dev','utf8').trim().split('\n').slice(2).map(x=>x.split(':')[0].trim());
 assert.deepEqual(interfaces,['lo']);assert.equal(fs.readFileSync('/proc/net/route','utf8').trim().split('\n').length,1);
 fs.mkdirSync('/tmp/redis',{mode:0o700});
 start('redis',['/redis/ld-linux-x86-64.so.2','--library-path','/redis/lib','/redis/redis-server',
  '--bind','127.0.0.1','--port','46379','--save','','--appendonly','no','--protected-mode','yes',
  '--maxmemory','64mb','--maxmemory-policy','noeviction','--dir','/tmp/redis']);await ready(46379,10000);
 start('backend',['/usr/local/bin/node','--max-old-space-size=512','/control/fresh-backend.mjs']);await ready(4000,45000);
 start('frontend',['/usr/local/bin/node','--max-old-space-size=512','/frontend/app/server.js'],
  {...base,NODE_ENV:'production',HOSTNAME:'127.0.0.1',PORT:'43117',BRAIN_API_URL:'http://127.0.0.1:4000',NEXT_TELEMETRY_DISABLED:'1'},'/frontend/app');
 await ready(43117,45000);
 const response=await fetch('http://127.0.0.1:4000/auth/me',{signal:AbortSignal.timeout(3000)});
 assert.equal(response.status,401,'UNAUTHENTICATED_NATIVE_SESSION_MUST_REFUSE');
 fs.writeFileSync('/evidence/runtime-ready.json',JSON.stringify({schema:'v126-new-native-runtime-ready-v1',
  atMs:Date.now(),nativeBackendPort:4000,frontendPort:43117,redisPort:46379,network:'NONE_PRIVATE_LOOPBACK',
  unauthenticatedMeStatus:401,ownerAuthenticated:false,ownerSessionCreated:false,historyImported:false,
  providerPublicIngress:false,wholeRowAccepted:false,expiresAtMs:cfg.expiresAtMs})+'\n',{flag:'wx',mode:0o600});
 while(Date.now()<cfg.expiresAtMs&&!requestedStop){assert.ok(children.every(x=>!x.row.closed),'EARLY_CHILD_EXIT');await delay(200);}
 if(stopCause)throw Error(stopCause);
 result.status='TERMINATED_AFTER_NATIVE_RUNTIME_READY';
 }catch(e){result.status='FAILED';result.firstFailure={name:e.name,message:String(e.message).slice(0,200)};process.exitCode=1;}
finally{
 for(const {c,row}of [...children].reverse()){
  if(!row.closed)try{process.kill(-c.pid,'SIGTERM');}catch(e){if(e.code!=='ESRCH')throw e;}
  const until=Date.now()+3000;while(!row.closed&&Date.now()<until)await delay(50);
  if(!row.closed)try{process.kill(-c.pid,'SIGKILL');}catch(e){if(e.code!=='ESRCH')throw e;}
  const killedUntil=Date.now()+3000;while(!row.closed&&Date.now()<killedUntil)await delay(50);
  if(!row.closed){row.drain='UNCONFIRMED';result.status='FAILED_CLEANUP';process.exitCode=1;}
  else row.drain='CHILD_CLOSED';
 }
 result.children=children.map(x=>x.row);result.finishedAtMs=Date.now();
 fs.writeFileSync('/evidence/runtime-termination.json',JSON.stringify(result)+'\n',{flag:'wx',mode:0o600});
}

// Finite isolated execution of unchanged native session/history semantics.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import dns from 'node:dns/promises';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {pathToFileURL} from 'node:url';
const OUT='/output',CONTROL='/control',started=Date.now(),deadline=started+260000;
const children=[];const sha=b=>createHash('sha256').update(b).digest('hex');
let stopped=null;for(const n of ['SIGTERM','SIGINT'])process.on(n,()=>{stopped=n;});
export function processRows(){const rows=[];for(const name of fs.readdirSync('/proc')){if(!/^\d+$/.test(name))continue;try{const s=fs.readFileSync('/proc/'+name+'/stat','utf8').split(')').slice(1).join(')').trim().split(/\s+/),status=fs.readFileSync('/proc/'+name+'/status','utf8');rows.push({pid:Number(name),state:s[0],pgid:Number(s[2]),sid:Number(s[3]),rssKiB:Number(status.match(/^VmRSS:\s+(\d+)/m)?.[1]??0)});}catch(e){if(e.code!=='ENOENT'&&e.code!=='ESRCH')throw e;}}return rows;}
export function start(name,args,env,cwd=OUT,output=OUT){
 assert.equal(stopped,null,'START_AFTER_STOP_REFUSED');assert.ok(Date.now()<deadline,'START_AFTER_DEADLINE_REFUSED');
 const fd=fs.openSync(output+'/'+name+'.private.log','wx',0o600),item={name,pid:null,outputOverflow:false,logBytes:0,exitCode:null,exitSignal:null,closed:false};
 const child=spawn(args[0],args.slice(1),{env,cwd,stdio:['ignore','pipe','pipe'],detached:true});item.child=child;item.pid=child.pid;children.push(item);
 const consume=b=>{item.logBytes+=b.length;if(item.logBytes>1048576){item.outputOverflow=true;try{process.kill(-child.pid,'SIGKILL');}catch(e){if(e.code!=='ESRCH')throw e;}return;}fs.writeSync(fd,b);};
 child.stdout.on('data',consume);child.stderr.on('data',consume);item.done=new Promise(resolve=>{child.on('error',e=>{item.spawnError=e.code??e.name;});child.on('close',(code,signal)=>{item.exitCode=code;item.exitSignal=signal;item.closed=true;fs.closeSync(fd);resolve();});});return item;
}
export async function terminate(item){
 const members=()=>processRows().filter(x=>x.state!=='Z'&&(x.pgid===item.pid||x.sid===item.pid));
 if(item.pid){try{process.kill(-item.pid,'SIGTERM');}catch(e){if(e.code!=='ESRCH')throw e;}}
 let until=Date.now()+3000;while((!item.closed||members().length)&&Date.now()<until)await delay(25);
 if(item.pid&&(!item.closed||members().length)){try{process.kill(-item.pid,'SIGKILL');}catch(e){if(e.code!=='ESRCH')throw e;}}
 until=Date.now()+3000;while((!item.closed||members().length)&&Date.now()<until)await delay(25);
 item.survivingProcessOrSessionMembers=members();assert.equal(item.closed,true,'CHILD_STREAMS_NOT_CLOSED');assert.equal(item.survivingProcessOrSessionMembers.length,0,'CHILD_GROUP_SURVIVES');await item.done;
}
function live(){assert.equal(stopped,null,'SUPERVISOR_SIGNAL_'+stopped);assert.ok(Date.now()<deadline,'SUPERVISOR_260S_DEADLINE');assert.ok(!children.some(x=>x.outputOverflow),'OUTPUT_OVERFLOW');const rows=processRows();assert.ok(rows.length<=96,'PROCESS_COUNT_96_BOUND');assert.ok(rows.reduce((n,x)=>n+x.rssKiB,0)<=2097152,'RSS_2GIB_BOUND');return rows;}
function save(name,value){const b=JSON.stringify(value,null,2)+'\n';assert.ok(Buffer.byteLength(b)<=1048576);fs.writeFileSync(OUT+'/'+name,b,{flag:'wx',mode:0o600});}
async function waitFile(name,seconds,allowedExit=new Set()){const end=Math.min(deadline,Date.now()+seconds*1000);while(!fs.existsSync(OUT+'/'+name)){live();assert.ok(Date.now()<end,'READY_DEADLINE_'+name);for(const x of children){if(allowedExit.has(x.name))assert.ok(!x.closed||x.exitCode===0,'EXPECTED_CHILD_FAILED_'+x.name);else assert.equal(x.closed,false,'EARLY_COMPONENT_EXIT_'+x.name);}await delay(50);}return JSON.parse(fs.readFileSync(OUT+'/'+name));}
async function waitPort(port,seconds){const end=Math.min(deadline,Date.now()+seconds*1000);while(true){live();assert.ok(Date.now()<end,'PORT_DEADLINE_'+port);if(await new Promise(resolve=>{const s=net.createConnection({host:'127.0.0.1',port});s.setTimeout(250);s.once('connect',()=>{s.destroy();resolve(true);});s.once('error',()=>resolve(false));s.once('timeout',()=>{s.destroy();resolve(false);});}))return;await delay(50);}}
export async function finite(item,seconds){const end=Math.min(deadline,Date.now()+seconds*1000);while(!item.closed){live();assert.ok(Date.now()<end,'COMPONENT_DEADLINE_'+item.name);await delay(50);}live();assert.equal(item.exitCode,0,'COMPONENT_FAILED_'+item.name);}
export async function main(){
 const result={schema:'v116-native-session-hosted-supervisor-v1',status:'FAIL',appSourceModified:false,generatedTechnicalFounderOnly:true,genuineOwnerAcceptance:false,wholeRowAccepted:false,startedAt:started};let phase='kernel-and-source-admission';const cleanupFailures=[];
 try{
  assert.equal(process.getuid(),0);assert.equal(process.version,'v22.23.2');assert.equal(sha(fs.readFileSync('/node')),'3517c2df0b2f8cd7f422b4b8450ef81c6889f08eb03e281d6de9079b15e6a327');
  const s=fs.readFileSync('/proc/self/status','utf8');assert.ok(s.includes('CapEff:\t0000000000000000')&&s.includes('NoNewPrivs:\t1'));
  const interfaces=fs.readFileSync('/proc/net/dev','utf8').trim().split('\n').slice(2).map(x=>x.split(':')[0].trim());assert.deepEqual(interfaces,['lo']);assert.equal(fs.readFileSync('/proc/net/route','utf8').trim().split('\n').length,1);
  for(const line of fs.readFileSync('/proc/net/ipv6_route','utf8').trim().split('\n').filter(Boolean)){const f=line.trim().split(/\s+/);assert.ok(f.at(-1)==='lo'&&['0'.repeat(32),'0'.repeat(31)+'1'].includes(f[0])&&f[4]==='0'.repeat(32),'EXTERNAL_IPV6_ROUTE');}
  const parent=JSON.parse(fs.readFileSync('/host-identity.json'));assert.notEqual(fs.readlinkSync('/proc/self/ns/net'),parent.networkNamespace);assert.notEqual(fs.readlinkSync('/proc/self/ns/pid'),parent.pidNamespace);
  const mounts=fs.readFileSync('/proc/self/mountinfo','utf8').split('\n');for(const name of ['/app','/frontend','/control','/node','/redis','/source-volume','/inputs','/node_modules','/host-identity.json','/etc/hosts']){const matching=mounts.filter(x=>x.split(' ')[4]===name);assert.equal(matching.length,1,'MOUNT_'+name);assert.ok(matching[0].split(' ')[5].split(',').includes('ro'),'READONLY_'+name);}
  assert.equal(fs.readFileSync('/etc/hosts','utf8'),'127.0.0.1 localhost\n');const localhost=await dns.lookup('localhost',{all:true});assert.ok(localhost.length>0&&localhost.every(x=>x.address==='127.0.0.1'&&x.family===4),'CANONICAL_LOCALHOST_IPV4_REQUIRED');
  const plan=JSON.parse(fs.readFileSync(CONTROL+'/native-backend-plan.json'));for(const pin of plan.nativeSourcePins){const b=fs.readFileSync('/app/'+pin.path);assert.equal(b.length,pin.bytes);assert.equal(sha(b),pin.sha256);}
  result.kernel={capEff:'0',noNewPrivileges:true,interfaces,noExternalIPv4OrIPv6Route:true,networkNamespace:fs.readlinkSync('/proc/self/ns/net'),pidNamespace:fs.readlinkSync('/proc/self/ns/pid'),parentNamespacesDistinct:true};
  const base={PATH:'/usr/bin:/bin',HOME:'/tmp/home',LANG:'C.UTF-8',TZ:'UTC'};fs.mkdirSync('/tmp/home');fs.mkdirSync('/tmp/redis');const browserEnv={...base,PLAYWRIGHT_BROWSERS_PATH:'/ms-playwright'};
  phase='mandatory-pre-native-browser-capability';const probe=start('browser-preflight',['/node','--max-old-space-size=256',CONTROL+'/browser-runtime-probe.mjs'],{...browserEnv,DEBUG:'pw:browser',DEBUG_COLORS:'0'});await finite(probe,35);const capability=JSON.parse(fs.readFileSync(OUT+'/browser-capability.json'));assert.equal(capability.status,'PASS_AF_UNIX_AND_IMMUTABLE_CHROMIUM');assert.equal(capability.applicationStarted,false);result.browserCapabilitySHA256=sha(fs.readFileSync(OUT+'/browser-capability.json'));
  phase='private-redis';start('redis',['/redis/ld-linux-x86-64.so.2','--library-path','/redis/lib','/redis/redis-server','--bind','127.0.0.1','--port','46379','--save','','--appendonly','no','--protected-mode','yes','--maxmemory','64mb','--maxmemory-policy','noeviction','--dir','/tmp/redis'],base);await waitPort(46379,10);
  phase='native-backend';start('backend',['/node','--max-old-space-size=512',CONTROL+'/native-backend.mjs'],base);const ready=await waitFile('backend-ready.json',45,new Set(['browser-preflight']));assert.equal(ready.historicalSessionId,'v116_native_post_snapshot');
  phase='accepted-frontend';start('frontend',['/node','--max-old-space-size=512','/frontend/app/server.js'],{...base,NODE_ENV:'production',HOSTNAME:'localhost',PORT:'43117',BRAIN_API_URL:'http://127.0.0.1:4000',NEXT_TELEMETRY_DISABLED:'1'},'/frontend/app');await waitPort(43117,45);
  phase='actual-browser';const browser=start('browser',['/node','--max-old-space-size=512',CONTROL+'/browser-exam.mjs'],browserEnv);await finite(browser,130);const browserResult=await waitFile('browser-result.json',2,new Set(['browser-preflight','browser']));assert.equal(browserResult.status,'PASS_AWAITING_INDEPENDENT_A1_19_A1_20_REVIEW');assert.ok(!browserResult.cleanupFailure);
  phase='native-preservation';const native=await waitFile('native-final.json',10,new Set(['browser-preflight','browser']));assert.equal(native.status,'PASS_OLD_NATIVE_SESSION_RECORDS_PRESERVED');result.status='PASS_AWAITING_INDEPENDENT_NATIVE_BROWSER_ADJUDICATION';
 }catch(e){result.firstFailure={phase,name:e.name,code:typeof e.code==='string'?e.code:null,messageSHA256:sha(String(e.message)),messageLength:String(e.message).length,sourceLocations:String(e.stack??'').split('\n').filter(x=>x.includes('hosted-supervisor.mjs:')).slice(0,3)};}
 finally{
  for(const item of [...children].reverse())try{await terminate(item);}catch(e){cleanupFailures.push({name:item.name,errorClass:e.name,messageSHA256:sha(String(e.message))});}
  for(const n of ['private-login.json','owner-policy.json'])if(fs.existsSync(OUT+'/'+n))fs.unlinkSync(OUT+'/'+n);
  result.children=children.map(({child,done,...x})=>x);result.remainingPrivateNamespaceProcesses=processRows().filter(x=>x.pid!==1&&x.pid!==process.pid&&x.state!=='Z');result.cleanupFailures=cleanupFailures;result.credentialsRemoved=!fs.existsSync(OUT+'/private-login.json');result.policyRemoved=!fs.existsSync(OUT+'/owner-policy.json');result.finishedAt=Date.now();if(cleanupFailures.length||result.remainingPrivateNamespaceProcesses.length)result.status='FAIL_CLEANUP';save('supervisor-result.json',result);
 }
 return result.status==='PASS_AWAITING_INDEPENDENT_NATIVE_BROWSER_ADJUDICATION'?0:1;
}
if(import.meta.url===pathToFileURL(process.argv[1]).href)process.exitCode=await main();

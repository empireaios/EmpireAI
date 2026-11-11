import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
assert.equal(process.versions.node,'22.23.2');
assert.equal(process.getuid(),0); assert.equal(process.getgid(),0);
assert.equal(process.cwd(),'/app');
assert.equal(process.env.WORK8_SOURCE_SHA,'6c1e63ba20619ee480742fd87dc810ca93152e22');
assert.equal(process.env.PILLOW_BIRTH_STATE,'NOT_BORN'); assert.equal(process.env.COMMERCE_STATE,'LOCKED');
const allowedEnv=new Set(['PATH','NODE_VERSION','YARN_VERSION','WORK8_SOURCE_SHA','PILLOW_BIRTH_STATE','COMMERCE_STATE','HOME','HOSTNAME']);
assert.ok(Object.keys(process.env).every(key=>allowedEnv.has(key)));
if(process.env.HOME!==undefined)assert.equal(process.env.HOME,'/root');
if(process.env.HOSTNAME!==undefined)assert.equal(process.env.HOSTNAME,fs.readFileSync('/etc/hostname','utf8').trim());
const status=fs.readFileSync('/proc/self/status','utf8');
assert.equal(status.match(/^CapEff:\s+(\w+)$/m)[1],'0000000000000001');
assert.equal(status.match(/^NoNewPrivs:\s+(\d+)$/m)[1],'1');
const routes=fs.readFileSync('/proc/net/route','utf8').trim().split('\n');
assert.equal(routes.length,1);
const ipv6=fs.readFileSync('/proc/net/ipv6_route','utf8').trim().split('\n').filter(Boolean);
assert.ok(ipv6.every(row=>row.trim().endsWith('lo')));
for (const p of ['/','/root','/data']) {const s=fs.lstatSync(p);assert.equal(s.uid,0);assert.equal(s.mode&0o022,0);assert.ok(s.isDirectory()&&!s.isSymbolicLink());}
const input=JSON.parse(fs.readFileSync('/control/application-inputs.json','utf8'));
assert.equal(input.applicationCommit,process.env.WORK8_SOURCE_SHA);
assert.deepEqual(input.files.map(x=>x.path),['backend/src/runtime/work8-isolated-redis-capability.test.mjs','backend/src/runtime/work8-isolated-redis-capability.ts']);
for(const entry of input.files){const p='/app/'+entry.path,s=fs.lstatSync(p),b=fs.readFileSync(p);assert.ok(s.isFile()&&!s.isSymbolicLink());assert.equal(b.length,entry.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),entry.sha256);}
const probe='/tmp/uid-probe';fs.writeFileSync(probe,'DECLARED_DISPOSABLE_IDENTITY_CONTROL',{flag:'wx',mode:0o600});
fs.chownSync(probe,65534,65534);assert.equal(fs.statSync(probe).uid,65534);assert.equal(fs.statSync(probe).gid,65534);fs.chownSync(probe,0,0);fs.unlinkSync(probe);
const metadata={schema:'v116-q4-redis-actual-preflight-v1',applicationCommit:input.applicationCommit,node:process.versions.node,uid:process.getuid(),gid:process.getgid(),capEff:'0000000000000001',noNewPrivs:1,actualMappedFileOwnerControl:65534,ipv4Routes:routes.slice(1),ipv6OnlyLoopback:true,originalFiles:input.files,normalApplicationStarted:false,redisServerStarted:false,productionMutation:false};
const preflight=Buffer.from(JSON.stringify(metadata,null,2)+'\n');
const args=['--test','--test-reporter=tap','--test-timeout=45000',input.files[0].path];
const result=spawnSync(process.execPath,args,{cwd:'/app',env:{...process.env},encoding:'utf8',timeout:55000,maxBuffer:524288,killSignal:'SIGKILL'});
const tap=(result.stdout??'')+(result.stderr??'');
const resultBytes=Buffer.from(JSON.stringify({schema:'v116-q4-redis-original-result-v1',source:input.applicationCommit,node:process.versions.node,command:[process.execPath,...args],exitCode:result.status,signal:result.signal,error:result.error?String(result.error):null,originalAssertionsChanged:false,wholeRowAccepted:false,normalApplicationStarted:false,productionMutation:false},null,2)+'\n');
const payloads=[['preflight.json',preflight,32768],['tests.tap',Buffer.from(tap),1048576],['result.json',resultBytes,16384]];
const files=payloads.map(([name,bytes,limit])=>{assert.ok(bytes.length>0&&bytes.length<=limit);return {name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),base64:bytes.toString('base64')};});
const envelope=Buffer.from('EMPIREAI_Q4_REDIS_EVIDENCE_V1 '+JSON.stringify({schema:'v116-q4-redis-stdout-evidence-v1',source:input.applicationCommit,files})+'\n');
assert.ok(envelope.length<=1600000);
// Synchronous bounded pipe writes complete before exit; tmpfs is never the evidence transport.
for(let offset=0;offset<envelope.length;){const written=fs.writeSync(1,envelope,offset,envelope.length-offset);assert.ok(written>0);offset+=written;}
assert.equal(result.error,undefined);assert.equal(result.signal,null);assert.equal(result.status,0);

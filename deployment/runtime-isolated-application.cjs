'use strict';
// Root-only, single-use isolated examination grant; never an operating grant.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {protectedPath,processIdentity}=require('./runtime-membership-controller.cjs');
const PROTOCOL='work8-isolated-application-v1';
function loadGrant(file,env){
 if(!file)return null;
 assert.equal(process.getuid(),0);protectedPath(file,0);
 const st=fs.lstatSync(file);assert.ok(st.isFile()&&st.nlink===1&&st.size<4194304);assert.equal(st.mode&0o777,0o444);
 assert.ok(fs.existsSync('/.dockerenv'),'ISOLATED_CONTAINER_REQUIRED');
 for(const key of ['RAILWAY_DEPLOYMENT_ID','RAILWAY_PROJECT_ID','RAILWAY_ENVIRONMENT_ID','RAILWAY_SERVICE_ID','VERCEL'])assert.ok(!env[key],'OPERATING_ENVIRONMENT_REFUSED');
 for(const [key,value] of Object.entries(env))if(value&&/(?:API_KEY|ACCESS_TOKEN|READ_TOKEN|PROJECT_TOKEN|SECRET_ACCESS_KEY|PROXY)$/i.test(key))throw Error('ISOLATED_EXTERNAL_CREDENTIAL_REFUSED');
 const g=JSON.parse(fs.readFileSync(file,'utf8'));
 assert.equal(g.schema,PROTOCOL);assert.match(g.nonce,/^[a-f0-9-]{36}$/);assert.equal(g.source,env.RAILWAY_GIT_COMMIT_SHA);assert.equal(g.generation,env.EMPIRE_GENERATION);
 assert.ok(['source','target','restart'].includes(g.mode));assert.ok(Number.isSafeInteger(g.expiresAt)&&g.expiresAt>Date.now()&&g.expiresAt-Date.now()<=180000);
 protectedPath(g.networkProofFile,0);const networkBytes=fs.readFileSync(g.networkProofFile);assert.equal(require('node:crypto').createHash('sha256').update(networkBytes).digest('hex'),g.networkProofSha256);const network=JSON.parse(networkBytes);assert.equal(network.internal,true);assert.match(network.containerId,/^[a-f0-9]{64}$/);assert.match(network.networkId,/^[a-f0-9]{64}$/);assert.deepEqual(network.attachedNetworkIds,[network.networkId]);assert.equal(network.networkNamespace,fs.readlinkSync('/proc/self/ns/net'));assert.ok(fs.readFileSync('/etc/hostname','utf8').trim()===network.containerId.slice(0,12),'CONTAINER_IDENTITY_MISMATCH');
 const routes=fs.readFileSync('/proc/net/route','utf8').trim().split('\n').slice(1).map(row=>row.trim().split(/\s+/));assert.ok(routes.every(row=>row[1]!=='00000000'),'DEFAULT_NETWORK_ROUTE_REFUSED');
 const routes6=fs.readFileSync('/proc/net/ipv6_route','utf8').trim().split('\n').filter(Boolean);assert.ok(routes6.every(row=>!/^0{32} 00 /.test(row)||row.trim().endsWith('lo')),'DEFAULT_IPV6_ROUTE_REFUSED');
 assert.equal(g.volume.root,env.RAILWAY_VOLUME_MOUNT_PATH);assert.match(g.volume.root,/^\/work8-exam\/[a-zA-Z0-9_-]+\/volume$/);
 const volume=fs.statSync(g.volume.root);assert.equal(volume.dev,g.volume.dev);assert.equal(volume.ino,g.volume.ino);assert.equal(fs.realpathSync(g.volume.root),g.volume.root);
 const redis=new URL(env.REDIS_URL);assert.equal(redis.hostname,g.redis.host);assert.equal(Number(redis.port||6379),g.redis.port);assert.equal(g.redis.db,0);assert.equal(g.redis.host,g.mode==='source'?'journal-redis':'target-redis');assert.match(g.redis.runId,/^[a-f0-9]{40}$/);
 assert.equal(path.dirname(g.captureDirectory),path.join(path.dirname(g.volume.root),'capture'));assert.equal(path.basename(g.captureDirectory),'point');
 protectedPath(g.resultDirectory,0);assert.ok(fs.statSync(g.resultDirectory).isDirectory());
 if(g.mode==='source')assert.equal(g.pending,undefined);else{assert.ok(g.pending);assert.equal(g.pending.capability,g.nonce);assert.equal(g.pending.source,g.source);assert.equal(g.pending.stage,g.mode==='restart'?'completed':'queued');}
 if(g.mode==='source'){const allowed=['authority','commissioning','finance','commerce','pillow-session-continuity','pillow-visual-memory'];for(const entry of fs.readdirSync(g.volume.root)){assert.ok(allowed.includes(entry),'UNKNOWN_SOURCE_STORE');const dir=path.join(g.volume.root,entry),st=fs.lstatSync(dir);assert.ok(st.isDirectory()&&!st.isSymbolicLink());if(entry!=='authority')assert.deepEqual(fs.readdirSync(dir),[],'SOURCE_REQUIRES_FRESH_CANONICAL_STORES');}assert.ok(fs.existsSync(path.join(g.volume.root,'commissioning')));}
 return {file,grant:g};
}
async function verifyGrantRedis(spec,env){if(!spec)return;const {command}=require('./fixtures/runtime-graph-redis.cjs');assert.equal(await command(env.REDIS_URL,['PING'],spec.grant.redis.host),'PONG');const runId=(await command(env.REDIS_URL,['INFO','server'],spec.grant.redis.host)).match(/^run_id:([a-f0-9]{40})\r?$/m)?.[1];assert.equal(runId,spec.grant.redis.runId);const receipt=JSON.parse(fs.readFileSync(path.join(env.EMPIRE_GENERATION_DIRECTORY,'cutover-'+env.EMPIRE_CUTOVER_DIGEST+'.json')));assert.deepEqual(receipt.redis,spec.grant.redis);}
function reserveGrant(spec){if(!spec)return;const g=spec.grant;assert.ok(Date.now()<g.expiresAt,'GRANT_EXPIRED');const fd=fs.openSync(spec.file+'.reserved','wx',0o600);try{fs.writeFileSync(fd,JSON.stringify({schema:PROTOCOL,nonce:g.nonce,source:g.source,generation:g.generation,mode:g.mode}));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}const dir=fs.openSync(path.dirname(spec.file),'r');try{fs.fsyncSync(dir);}finally{fs.closeSync(dir);}}
function issueGrant(spec,member){
 const g=spec.grant;assert.ok(Date.now()<g.expiresAt,'GRANT_EXPIRED');assert.equal(member.role,'brain-worker');assert.ok(member.record);
 assert.equal(g.source,member.record.source);assert.equal(g.generation,member.record.generation);
 const reservation=JSON.parse(fs.readFileSync(spec.file+'.reserved','utf8'));assert.deepEqual(reservation,{schema:PROTOCOL,nonce:g.nonce,source:g.source,generation:g.generation,mode:g.mode});
 const recipient={id:member.id,nonce:member.nonce,pid:member.record.pid,startTicks:member.record.startTicks,role:member.role};
 const fd=fs.openSync(spec.file+'.consumed','wx',0o600);
 try{fs.writeFileSync(fd,JSON.stringify({schema:PROTOCOL,nonce:g.nonce,mode:g.mode,source:g.source,generation:g.generation,recipient,at:new Date().toISOString()}));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 const dir=fs.openSync(path.dirname(spec.file),'r');try{fs.fsyncSync(dir);}finally{fs.closeSync(dir);}
 return {...g,recipient};
}
function installExaminationChannel(spec,member,fail){
 const commands=new Set(),seen=new Set();
 const poll=()=>{for(const action of ['capture','release']){
  const file=spec.file+'.'+action;if(commands.has(action)||!fs.existsSync(file))continue;
  protectedPath(file,0);const st=fs.lstatSync(file);assert.ok(st.isFile()&&st.nlink===1);assert.equal(st.mode&0o777,0o444);
  const data=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(data.nonce,spec.grant.nonce);assert.equal(spec.grant.mode,'source');
  if(action==='capture')assert.equal(seen.has('ready'),true);else{assert.equal(seen.has('held'),true);assert.match(data.digest,/^[a-f0-9]{64}$/);assert.equal(data.operatorCopySealed,true);}
  commands.add(action);member.child.send({protocol:PROTOCOL,action,nonce:spec.grant.nonce,id:member.id,...(action==='release'?{digest:data.digest,operatorCopySealed:true}:{})},e=>{if(e)fail(e);});
 }};
 const timer=setInterval(()=>{try{poll();}catch(e){fail(e);}},10);timer.unref();member.child.once('exit',()=>clearInterval(timer));
 member.child.on('message',m=>{if(m?.protocol!==PROTOCOL)return;try{
  assert.equal(m.id,member.id);assert.equal(m.nonce,spec.grant.nonce);assert.equal(processIdentity(member.child.pid)?.startTicks,member.record.startTicks);
  assert.ok(['initialized','ready','held','released','persisted','failure'].includes(m.event));assert.ok(!seen.has(m.event),'DUPLICATE_EXAMINATION_EVENT');seen.add(m.event);
  const data={...m,source:spec.grant.source,generation:spec.grant.generation,receivedAt:Date.now(),recipient:member.record};delete data.nonce;
  const bytes=JSON.stringify(data,null,2);assert.ok(Buffer.byteLength(bytes)<=4194304);fs.writeFileSync(path.join(spec.grant.resultDirectory,m.event+'.json'),bytes,{flag:'wx',mode:0o600});
  if(m.event==='failure')fail(Error('ISOLATED_APPLICATION_FAILED'));
 }catch(e){fail(e);}});
}
module.exports={PROTOCOL,loadGrant,verifyGrantRedis,reserveGrant,issueGrant,installExaminationChannel};

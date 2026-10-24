'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawn}=require('node:child_process'),{once}=require('node:events');
const {DatabaseSync}=require('node:sqlite');
const {MembershipController,MembershipJournal,processIdentity,digest}=require('./runtime-membership-controller.cjs');
const {command}=require('./fixtures/runtime-membership-redis.cjs');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,timeout=6000){const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await delay(20);}throw Error('EXAMINATION_DEADLINE_'+label);}
function fixture(source,redisUrl,redisRunId){
 const root=path.join('/work8-exam','case-'+crypto.randomUUID());fs.mkdirSync(root,{mode:0o755});
 const image=path.join(root,'image');fs.mkdirSync(path.join(image,'deployment/fixtures'),{recursive:true,mode:0o755});fs.mkdirSync(path.join(image,'backend/dist'),{recursive:true,mode:0o755});
 for(const file of ['runtime-generation.cjs','runtime-revision.cjs','runtime-membership-controller.cjs','runtime-membership-bootstrap.mjs','fixtures/runtime-membership-writer.mjs','fixtures/runtime-membership-redis.cjs','fixtures/runtime-membership-runner.cjs']){const target=path.join(image,'deployment',file);fs.copyFileSync(path.join(__dirname,file),target);fs.chmodSync(target,0o444);}
 fs.writeFileSync(path.join(image,'backend/dist/runtime-revision.json'),JSON.stringify({revision:source}),{mode:0o444});
 const volume=path.join(root,'volume'),authority=path.join(volume,'authority'),operator=path.join(root,'operator');
 fs.mkdirSync(authority,{recursive:true,mode:0o755});fs.mkdirSync(operator,{mode:0o700});fs.mkdirSync(path.join(authority,'members'),{mode:0o700});fs.chownSync(path.join(authority,'members'),65534,65534);
 const stat=fs.statSync(volume),u=new URL(redisUrl),generation=crypto.randomUUID();
 const receipt={schema:'runtime-cutover-v1',proofReferences:['SYNTHETIC_EXAMINATION_ONLY_NOT_OPERATING_CUTOVER'],reviewReceipt:'SYNTHETIC_FIXTURE',storage:{root:volume,dev:stat.dev,ino:stat.ino},redis:{host:u.hostname,port:Number(u.port||6379),db:0,runId:redisRunId},compatibleSources:[source],priorWriterDisposition:'EXCLUDED_BY_REVIEWED_OPERATING_TRANSITION',redisDisposition:'EXCLUSIVE_COHORT_CAPABILITY_REVIEWED'};
 const bytes=JSON.stringify(receipt),cutoverDigest=digest(bytes);fs.writeFileSync(path.join(authority,'cutover-'+cutoverDigest+'.json'),bytes,{mode:0o644});
 const file=path.join(authority,'generation.sqlite'),db=new DatabaseSync(file);db.exec('PRAGMA journal_mode=DELETE; CREATE TABLE authority(id INTEGER PRIMARY KEY,version INTEGER,generation TEXT,cutover_digest TEXT,sources TEXT,epoch INTEGER); CREATE TABLE transitions(previous_generation TEXT,next_generation TEXT,cutover_digest TEXT,at TEXT);');db.prepare('INSERT INTO authority VALUES(1,1,?,?,?,1)').run(generation,cutoverDigest,JSON.stringify([source]));db.close();fs.chmodSync(file,0o644);const inode=fs.statSync(file);
 const generationEnv={EMPIRE_GENERATION_DIRECTORY:authority,EMPIRE_GENERATION:generation,EMPIRE_CUTOVER_DIGEST:cutoverDigest,EMPIRE_GENERATION_DEVICE:String(inode.dev),EMPIRE_GENERATION_INODE:String(inode.ino)};
 const entry=path.join(image,'deployment/fixtures/runtime-membership-writer.mjs');
 const roles=['primary','brain-worker','assurance-worker','assurance-inspector'].map(role=>{const stateDirectory=path.join(volume,role);fs.mkdirSync(stateDirectory,{mode:0o700});fs.chownSync(stateDirectory,65534,65534);return {role,entry,entrySha256:digest(fs.readFileSync(entry)),stateDirectory,scope:role==='assurance-inspector'?['native-sqlite','ordinary-file']:['native-sqlite','ordinary-file','redis-producer']};});
 return {root,image,roles,config:{journalPath:path.join(operator,'journal.sqlite'),initialize:true,runtimeUid:65534,runtimeGid:65534,source,generation,generationEnv,roles,volumeRoot:volume,redisUrl,bootstrap:path.join(image,'deployment/runtime-membership-bootstrap.mjs')},transition:{root:authority,expectedGeneration:generation,nextGeneration:crypto.randomUUID(),cutoverDigest,expectedDevice:inode.dev,expectedInode:inode.ino}};
}
async function ready(c,role,options){const member=c.launch(role,options);let stderr='';member.child.stderr.on('data',b=>stderr+=b);await until(()=>{if(member.child.exitCode!==null||member.child.signalCode!==null)throw Error('CHILD_NOT_READY '+stderr);return member.ready;},role);return member;}
async function exit(member){if(member.child.exitCode!==null||member.child.signalCode!==null)return;const wait=once(member.child,'exit');member.child.kill('SIGKILL');await wait;}
function counts(f){return f.roles.map(r=>{const p=path.join(r.stateDirectory,'writes.jsonl');return fs.existsSync(p)?fs.readFileSync(p,'utf8').trim().split('\n').length:0;});}
test('authoritative distinct-principal journal and complete declared synthetic cohort', {timeout:45000},async t=>{
 assert.equal(process.versions.node,'22.23.2','required actual deployment Node line');assert.equal(process.getuid(),0,'operator identity required');
 const source=process.env.WORK8_SOURCE_SHA,redisUrl=process.env.WORK8_MEMBERSHIP_REDIS_URL,evidence=process.env.WORK8_EVIDENCE_DIR;
 assert.match(source??'',/^[a-f0-9]{40}$/);assert.ok(redisUrl&&evidence);assert.equal(await command(redisUrl,['PING']),'PONG');
 const server=await command(redisUrl,['INFO','server']),redisRunId=server.match(/^run_id:([a-f0-9]{40})\r?$/m)?.[1];assert.match(redisRunId??'',/^[a-f0-9]{40}$/);
 const assertions={},controllers=[],runners=[];t.after(async()=>{for(const p of runners)if(p.exitCode===null&&p.signalCode===null)p.kill('SIGKILL');for(const c of controllers)if(c.phase!=='STOPPED')await c.stop().catch(()=>{});});
 const f=fixture(source,redisUrl,redisRunId),c=new MembershipController(f.config);controllers.push(c);c.on('fault',()=>{});
 const first=[];
 for(const role of f.roles){first.push(await ready(c,role.role,{afterCommit(record){assert.equal(fs.existsSync(path.join(role.stateDirectory,'first-write.json')),false);const read=new MembershipJournal(f.config.journalPath);try{assert.ok(read.read().members.some(m=>m.id===record.id&&m.state==='ADMITTED'));}finally{read.close();}}}));}
 assertions.durableAdmission=true;
 const writes=f.roles.map(r=>JSON.parse(fs.readFileSync(path.join(r.stateDirectory,'first-write.json'),'utf8')));
 assert.ok(writes.every(w=>w.uid===65534&&w.gid===65534));assertions.identitySeparation=true;
 assert.ok(writes.every(w=>Object.values(w.journalAccess).every(result=>result==='EACCES'||result==='EPERM')));assertions.journalProtection=true;
 const view=c.read();assert.equal(view.members.length,4);for(const m of view.members){const spec=f.roles.find(r=>r.role===m.role);assert.equal(m.entrySha256,spec.entrySha256);assert.deepEqual(m.scope,spec.scope);assert.equal(m.storeRoot,spec.stateDirectory);assert.equal(m.storeInode,fs.statSync(spec.stateDirectory).ino);assert.equal(m.source,source);assert.equal(m.generation,f.config.generation);assert.equal(m.startTicks,processIdentity(m.pid).startTicks);}assertions.scopeBinding=true;
 assert.throws(()=>new MembershipController({...f.config,initialize:false}),/locked/);assert.throws(()=>c.launch('primary'),/ROLE_ALREADY_PRESENT/);assertions.competingAdmission=true;
 await until(()=>counts(f).every(n=>n>2),'active-writers');
 await c.captureHeld(async snapshot=>{
  assert.equal(snapshot.members.length,4);assert.ok(snapshot.members.every(m=>m.state==='HELD'));assert.throws(()=>c.launch('primary'),/ADMISSION_FROZEN/);
  const before=counts(f),redisBefore=await Promise.all(first.filter(m=>m.role!=='assurance-inspector').map(m=>command(redisUrl,['GET','work8:member:'+m.id])));
  await delay(80);assert.deepEqual(counts(f),before);assert.deepEqual(await Promise.all(first.filter(m=>m.role!=='assurance-inspector').map(m=>command(redisUrl,['GET','work8:member:'+m.id]))),redisBefore);
 });assertions.captureExclusion=true;
 const worker=first.find(m=>m.role==='brain-worker');await exit(worker);await assert.rejects(c.captureHeld(async()=>{}),/COMPLETE_DECLARED_CENSUS_REQUIRED/);assertions.incompleteMembershipRefusal=true;
 const replacement=await ready(c,'brain-worker');const history=c.read();assert.equal(history.members.find(m=>m.id===worker.id).state,'TERMINATED');assert.equal(history.members.find(m=>m.id===replacement.id).state,'READY');assertions.currentPriorCensus=true;
 assert.throws(()=>require('./runtime-generation.cjs').transition(f.transition),/locked/);
 const secretFree=JSON.stringify(history);assert.equal(secretFree.includes(redisUrl),false);assert.equal(/password|SESSION_SECRET|NODE_OPTIONS|REDIS_URL/.test(secretFree),false);assert.equal(history.completeLiveState,false);assert.equal(history.productionGraphIntegrated,false);assertions.secretFreeReadback=true;
 await c.stop();require('./runtime-generation.cjs').transition(f.transition);
 assert.throws(()=>new MembershipController({...f.config,initialize:false}),/AUTHORITY_BINDING_MISMATCH/);assertions.staleGenerationRefusal=true;
 // Kill the controller after durable admission but before its private ACK.
 const crash=fixture(source,redisUrl,redisRunId),configPath=path.join(crash.root,'controller-config.json');fs.writeFileSync(configPath,JSON.stringify(crash.config),{mode:0o600});
 const runner=spawn(process.execPath,[path.join(crash.image,'deployment/fixtures/runtime-membership-runner.cjs'),configPath,'crash-after-commit'],{stdio:['ignore','ignore','pipe']});runners.push(runner);let runnerError='';runner.stderr.on('data',b=>runnerError+=b);const [code]=await once(runner,'exit');assert.equal(code,71,runnerError);
 const journal=new MembershipJournal(crash.config.journalPath);const pending=journal.read();journal.close();assert.equal(pending.members.length,1);assert.equal(pending.members[0].state,'ADMITTED');assert.equal(fs.existsSync(path.join(crash.roles[0].stateDirectory,'first-write.json')),false);
 const old=pending.members[0];await until(()=>{const p=processIdentity(old.pid);return !p||p.startTicks!==old.startTicks||p.state==='Z';},'orphan-terminated');
 const resumed=new MembershipController({...crash.config,initialize:false});controllers.push(resumed);assert.equal(resumed.read().members[0].state,'TERMINATED');assert.ok(resumed.read().events.some(e=>e.event==='TERMINATED'&&e.payload.basis==='SAME_NAMESPACE_PID_START_ABSENT'));assertions.crashRestart=true;await resumed.stop();
 assert.equal((await command(redisUrl,['INFO','server'])).match(/^run_id:([a-f0-9]{40})\r?$/m)?.[1],redisRunId);
 const required=['identitySeparation','journalProtection','durableAdmission','currentPriorCensus','staleGenerationRefusal','competingAdmission','crashRestart','captureExclusion','incompleteMembershipRefusal','scopeBinding','secretFreeReadback'];for(const key of required)assert.equal(assertions[key],true);
 fs.mkdirSync(evidence,{recursive:true});fs.writeFileSync(path.join(evidence,'journal-examination.json'),JSON.stringify({schema:'work8-journal-examination-v1',source,node:process.versions.node,operatorUid:process.getuid(),runtimeUids:[...new Set(writes.map(w=>w.uid))],externalEffects:0,redisRunId,assertions,scope:'DECLARED_SYNTHETIC_COHORT_ONLY',productionGraphIntegrated:false,operatingRecoveryCertified:false,acceptedRows:[],observedMemberCount:history.members.length},null,2)+'\n');
});

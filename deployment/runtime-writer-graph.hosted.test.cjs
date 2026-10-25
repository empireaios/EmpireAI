'use strict';
// Actual launcher/guard/controller/broker modules with explicitly SYNTHETIC application entries.
// This is not full application restoration or production writer/cutover acceptance.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawn}=require('node:child_process'),{once}=require('node:events');
const {DatabaseSync}=require('node:sqlite');
const {MembershipJournal,processIdentity,digest}=require('./runtime-membership-controller.cjs');
const {command}=require('./fixtures/runtime-graph-redis.cjs');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,timeout=12000){const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await delay(30);}throw Error('GRAPH_DEADLINE_'+label);}
function fixture(source,redisUrl,redisRunId){
 const root=path.join('/work8-exam','case-'+crypto.randomUUID());fs.mkdirSync(root,{mode:0o755});
 const image=path.join(root,'image');fs.mkdirSync(path.join(image,'deployment/fixtures'),{recursive:true,mode:0o755});fs.mkdirSync(path.join(image,'backend/dist'),{recursive:true,mode:0o755});
 fs.cpSync(__dirname,path.join(image,'deployment'),{recursive:true});
 fs.writeFileSync(path.join(image,'backend/dist/runtime-revision.json'),JSON.stringify({revision:source}),{mode:0o444});
 const volume=path.join(root,'volume'),authority=path.join(volume,'authority'),operator=path.join(root,'operator');
 fs.mkdirSync(authority,{recursive:true,mode:0o755});fs.mkdirSync(operator,{mode:0o700});fs.mkdirSync(path.join(authority,'members'),{mode:0o700});fs.chownSync(path.join(authority,'members'),65534,65534);
 const stat=fs.statSync(volume),u=new URL(redisUrl),generation=crypto.randomUUID();
 const receipt={schema:'runtime-cutover-v1',proofReferences:['SYNTHETIC_EXAMINATION_ONLY_NOT_OPERATING_CUTOVER'],reviewReceipt:'SYNTHETIC_FIXTURE',storage:{root:volume,dev:stat.dev,ino:stat.ino},redis:{host:u.hostname,port:Number(u.port||6379),db:0,runId:redisRunId},compatibleSources:[source],priorWriterDisposition:'EXCLUDED_BY_REVIEWED_OPERATING_TRANSITION',redisDisposition:'EXCLUSIVE_COHORT_CAPABILITY_REVIEWED'};
 const bytes=JSON.stringify(receipt),cutoverDigest=digest(bytes);fs.writeFileSync(path.join(authority,'cutover-'+cutoverDigest+'.json'),bytes,{mode:0o644});
 const file=path.join(authority,'generation.sqlite'),db=new DatabaseSync(file);db.exec('PRAGMA journal_mode=DELETE; CREATE TABLE authority(id INTEGER PRIMARY KEY,version INTEGER,generation TEXT,cutover_digest TEXT,sources TEXT,epoch INTEGER); CREATE TABLE transitions(previous_generation TEXT,next_generation TEXT,cutover_digest TEXT,at TEXT);');db.prepare('INSERT INTO authority VALUES(1,1,?,?,?,1)').run(generation,cutoverDigest,JSON.stringify([source]));db.close();fs.chmodSync(file,0o644);const inode=fs.statSync(file);
 const generationEnv={EMPIRE_GENERATION_DIRECTORY:authority,EMPIRE_GENERATION:generation,EMPIRE_CUTOVER_DIGEST:cutoverDigest,EMPIRE_GENERATION_DEVICE:String(inode.dev),EMPIRE_GENERATION_INODE:String(inode.ino)};
 const state=path.join(volume,'commissioning');fs.mkdirSync(state,{mode:0o700});fs.chownSync(state,65534,65534);
 fs.mkdirSync(path.join(image,'backend/src/assurance'),{recursive:true});
 fs.writeFileSync(path.join(image,'backend/dist/index.js'),fs.readFileSync(path.join(__dirname,'fixtures/runtime-graph-application.cjs')),{mode:0o444});
 fs.writeFileSync(path.join(image,'backend/package.json'),'{}',{mode:0o444});
 for(const name of ['permanent-worker.mjs','permanent-inspector.mjs'])fs.writeFileSync(path.join(image,'backend/src/assurance',name),"import {createRequire} from 'node:module';const require=createRequire(import.meta.url);const {installObserverParticipant}=require('../../../deployment/observer-capture.cjs');installObserverParticipant().ready();setInterval(()=>{},1000);process.on('SIGTERM',()=>process.exit(0));",{mode:0o444});
 return {root,image,state,journal:path.join(operator,'journal.sqlite'),generation,env:{...generationEnv,EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',RAILWAY_VOLUME_MOUNT_PATH:volume,DATABASE_PATH:path.join(state,'empireai-brain.db'),RAILWAY_GIT_COMMIT_SHA:source,REDIS_URL:redisUrl,EMPIRE_LOCKED_REDIS_HOST:u.hostname,PORT:'43100',FOUNDER_EMAIL:'owner@example.invalid',ADMIN_EMAIL:'admin@example.invalid',FOUNDER_PASSWORD:'synthetic-owner-credential-000001',ADMIN_PASSWORD:'synthetic-admin-credential-000002',SESSION_SECRET:'synthetic-session-credential-000003333',WORK8_CONTROLLER_JOURNAL_PATH:path.join(operator,'journal.sqlite'),WORK8_RUNTIME_UID:'65534',WORK8_RUNTIME_GID:'65534',WORK8_WRITER_ISOLATION_LIBRARY:process.env.WORK8_WRITER_ISOLATION_LIBRARY,WORK8_WRITER_ISOLATION_SHA256:process.env.WORK8_WRITER_ISOLATION_SHA256},transition:{root:authority,expectedGeneration:generation,nextGeneration:crypto.randomUUID(),cutoverDigest,expectedDevice:inode.dev,expectedInode:inode.ino}};
}

test('actual production control modules: synthetic application admission, capture and independent containment',{timeout:60000},async t=>{
 assert.equal(process.getuid(),0);assert.equal(process.versions.node,'22.23.2');
 const source=process.env.WORK8_SOURCE_SHA,redisUrl=process.env.WORK8_MEMBERSHIP_REDIS_URL,evidence=process.env.WORK8_EVIDENCE_DIR;
 assert.match(source??'',/^[a-f0-9]{40}$/);assert.ok(evidence);assert.equal(await command(redisUrl,['PING']),'PONG');
 const redisRunId=(await command(redisUrl,['INFO','server'])).match(/^run_id:([a-f0-9]{40})\r?$/m)?.[1];assert.match(redisRunId??'',/^[a-f0-9]{40}$/);
 const receipts=[];
 for(const scenario of ['clean','primary-death']){
  const f=fixture(source,redisUrl,redisRunId);let output='';
  const child=spawn(process.execPath,[path.join(f.image,'deployment/locked-runtime.cjs')],{env:f.env,stdio:['ignore','pipe','pipe']});
  child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
  let guard;
  t.after(()=>{if(guard)try{process.kill(-guard.pid,'SIGKILL');}catch{}if(child.exitCode===null)child.kill('SIGKILL');fs.mkdirSync(evidence,{recursive:true});fs.writeFileSync(path.join(evidence,'graph-'+scenario+'.log'),output);});
  await until(()=>{
   if(child.exitCode!==null)throw Error('GRAPH_START_FAILED '+output);
   if(!fs.existsSync(f.journal)||!fs.existsSync(path.join(f.state,'graph-probe.json')))return false;let j;
   try{j=new MembershipJournal(f.journal);const active=j.read().members.filter(m=>m.state!=='TERMINATED');guard=active.find(m=>m.role==='containment-guard');return active.length===5&&['primary','brain-worker','assurance-worker','assurance-inspector','containment-guard'].every(role=>active.some(m=>m.role===role));}finally{j?.close();}
  },'authoritative-census');
  fs.writeFileSync(path.join(f.state,'capture-trigger'),'1');
  await until(()=>{if(child.exitCode!==null)throw Error('GRAPH_START_FAILED '+output);return fs.existsSync(path.join(f.state,'graph-held.json'));},'capture-held');
  const held=JSON.parse(fs.readFileSync(path.join(f.state,'graph-held.json'),'utf8'));
  assert.equal(held.members.length,5);assert.equal(held.source,source);assert.equal(held.generation,f.generation);assert.equal(held.completeLiveState,false);
  assert.deepEqual(held.members.map(m=>m.role).sort(),['assurance-inspector','assurance-worker','brain-worker','containment-guard','primary']);
  guard=held.members.find(m=>m.role==='containment-guard');
  assert.ok(held.members.filter(m=>m.role!=='containment-guard').every(m=>m.uid===65534&&m.gid===65534));
  assert.throws(()=>require('./runtime-generation.cjs').transition(f.transition),/locked/);
  const probe=JSON.parse(fs.readFileSync(path.join(f.state,'graph-probe.json'),'utf8'));assert.equal(probe.spawnError,'EPERM');assert.ok(['EACCES','EPERM'].includes(probe.journalWrite));
  if(scenario==='clean'){
   fs.writeFileSync(path.join(f.state,'release'),'1');await until(()=>fs.existsSync(path.join(f.state,'graph-released')),'capture-released');
   const exited=once(child,'exit');process.kill(guard.pid,'SIGTERM');const [code,signal]=await exited;assert.equal(code,0,output);assert.equal(signal,null);
   const j=new MembershipJournal(f.journal);const view=j.read();j.close();assert.ok(view.members.filter(m=>m.role!=='containment-guard').every(m=>m.state==='TERMINATED'));
   assert.ok(view.members.some(m=>m.role==='startup-readback'&&m.state==='TERMINATED'));
  }else{
   const exited=once(child,'exit');process.kill(held.members.find(m=>m.role==='primary').pid,'SIGKILL');await exited;
   await until(()=>held.members.every(m=>{const p=processIdentity(m.pid);return !p||p.startTicks!==m.startTicks||p.state==='Z';}),'group-contained');
   assert.ok(fs.existsSync(f.journal+'.emergency'),'guard must invalidate capture durably');
   assert.equal(fs.existsSync(path.join(f.state,'graph-released')),false);
  }
  receipts.push({scenario,source,generation:f.generation,members:held.members,assertions:{actualControlModules:true,syntheticApplicationOnly:true,demotedRuntime:true,descendantSpawnRefused:true,journalMutationRefused:true,guardGenerationLease:true,captureCensusBound:true,cleanDrainOrIndependentContainment:true}});
 }
 fs.mkdirSync(evidence,{recursive:true});fs.writeFileSync(path.join(evidence,'writer-graph-examination.json'),JSON.stringify({source,scope:'ACTUAL_CONTROL_MODULES_SYNTHETIC_APPLICATION_ENTRIES',productionGraphIntegrated:false,operatingRecoveryCertified:false,acceptedRows:[],receipts},null,2));
});

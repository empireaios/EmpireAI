'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');
const {spawn}=require('node:child_process');
const {EventEmitter}=require('node:events');
const PROTOCOL='work8-authoritative-membership-v1';
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const fail=message=>{throw Error(message);};
const namespace=(pid='self')=>({boot:fs.readFileSync('/proc/sys/kernel/random/boot_id','utf8').trim(),pidNamespace:fs.readlinkSync(`/proc/${pid}/ns/pid`)});
function processIdentity(pid){
 try{const stat=fs.readFileSync(`/proc/${pid}/stat`,'utf8');const fields=stat.slice(stat.lastIndexOf(')')+2).split(' ');
 const status=fs.readFileSync(`/proc/${pid}/status`,'utf8');
 return {pid,startTicks:fields[19],state:fields[0],uids:status.match(/^Uid:\s+(.+)$/m)[1].trim().split(/\s+/).map(Number),gids:status.match(/^Gid:\s+(.+)$/m)[1].trim().split(/\s+/).map(Number),capEff:status.match(/^CapEff:\s+(.+)$/m)[1].trim(),...namespace(pid)};
 }catch(e){if(e.code==='ENOENT'||e.code==='ESRCH')return null;throw e;}
}
function protectedPath(file,operatorUid){
 let current=fs.realpathSync(file);if(current!==file)fail('NONCANONICAL_OPERATOR_PATH');
 for(;;){const s=fs.lstatSync(current);if(s.uid!==operatorUid||(s.mode&0o022)!==0)fail('OPERATOR_PATH_NOT_PROTECTED');const parent=path.dirname(current);if(parent===current)break;current=parent;}
}
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const rolesAllowed=['primary','brain-worker','assurance-worker','assurance-inspector'];
function exact(value,keys){if(!value||typeof value!=='object'||Array.isArray(value)||JSON.stringify(Object.keys(value).sort())!==JSON.stringify([...keys].sort()))fail('JOURNAL_SCHEMA_REFUSED');}
function record(value){
 exact(value,['id','role','pid','startTicks','boot','pidNamespace','uid','gid','source','generation','epoch','cutoverDigest','entrySha256','scope','scopeDigest','storeRoot','storeDevice','storeInode']);
 if(!UUID.test(value.id)||!UUID.test(value.generation)||!UUID.test(value.boot)||!rolesAllowed.includes(value.role)||!Number.isSafeInteger(value.pid)||value.pid<1||!/^\d+$/.test(value.startTicks)||!/^pid:\[\d+\]$/.test(value.pidNamespace)||!Number.isSafeInteger(value.uid)||value.uid<1||!Number.isSafeInteger(value.gid)||value.gid<1||!Number.isSafeInteger(value.epoch)||value.epoch<1||!/^[a-f0-9]{40}$/.test(value.source)||!/^[a-f0-9]{64}$/.test(value.entrySha256)||!/^[a-f0-9]{64}$/.test(value.cutoverDigest)||typeof value.storeRoot!=='string'||!path.isAbsolute(value.storeRoot)||value.storeRoot.includes('\0')||!Number.isSafeInteger(value.storeDevice)||!Number.isSafeInteger(value.storeInode)||!Array.isArray(value.scope)||!value.scope.length||value.scope.some(x=>typeof x!=='string'||!/^[a-z0-9:_-]{1,80}$/.test(x))||value.scopeDigest!==digest(JSON.stringify(value.scope)))fail('JOURNAL_RECORD_REFUSED');
 return Object.fromEntries(Object.keys(value).map(k=>[k,value[k]]));
}
function proof(event,value){
 if(event==='ADMITTED')return record(value);
 if(event==='CAPTURE_FROZEN'){exact(value,['capture','members']);if(!UUID.test(value.capture)||!Array.isArray(value.members)||value.members.some(x=>!UUID.test(x)))fail('JOURNAL_PROOF_REFUSED');return {capture:value.capture,members:[...value.members]};}
 const forms={BOOTSTRAP_PARTICIPANT_REGISTERED:['basis'],DECLARED_PARTICIPANT_DRAIN_ACK:['basis','capture'],DECLARED_PARTICIPANT_RELEASE_ACK:['basis','capture'],SAME_NAMESPACE_PID_START_ABSENT:['basis','observedAt'],OWNED_CHILD_EXIT_EVENT:['basis','pid','startTicks','code','signal','at'],RECONCILIATION_REQUIRED:['basis']};
 const keys=forms[value?.basis];if(!keys)fail('JOURNAL_PROOF_REFUSED');exact(value,keys);
 const allowed={READY:['BOOTSTRAP_PARTICIPANT_REGISTERED','DECLARED_PARTICIPANT_RELEASE_ACK'],HELD:['DECLARED_PARTICIPANT_DRAIN_ACK'],TERMINATED:['SAME_NAMESPACE_PID_START_ABSENT','OWNED_CHILD_EXIT_EVENT'],UNKNOWN:['RECONCILIATION_REQUIRED']};
 if(!allowed[event]?.includes(value.basis))fail('JOURNAL_PROOF_REFUSED');
 if(value.capture&&!UUID.test(value.capture))fail('JOURNAL_PROOF_REFUSED');
 for(const k of ['at','observedAt'])if(value[k]!==undefined&&(!Number.isFinite(Date.parse(value[k]))||new Date(value[k]).toISOString()!==value[k]))fail('JOURNAL_PROOF_REFUSED');
 if(value.pid!==undefined&&(!Number.isSafeInteger(value.pid)||!/^\d+$/.test(value.startTicks)||!(value.code===null||Number.isSafeInteger(value.code))||!(value.signal===null||/^SIG[A-Z0-9]+$/.test(value.signal))))fail('JOURNAL_PROOF_REFUSED');
 return Object.fromEntries(keys.map(k=>[k,value[k]]));
}
class MembershipJournal{
 constructor(file,{initialize=false}={}){
  if(initialize){const fd=fs.openSync(file,'wx',0o600);fs.closeSync(fd);}else if(!fs.existsSync(file))fail('MEMBERSHIP_JOURNAL_MISSING');
  const st=fs.lstatSync(file);if(!st.isFile()||st.nlink!==1)fail('MEMBERSHIP_JOURNAL_ALIAS');
  this.file=file;this.db=new DatabaseSync(file,{timeout:0,allowExtension:false});
  this.db.exec('PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL');
  if(initialize)this.db.exec("BEGIN EXCLUSIVE; CREATE TABLE meta(version INTEGER NOT NULL, revision INTEGER NOT NULL); INSERT INTO meta VALUES(1,0); CREATE TABLE members(id TEXT PRIMARY KEY, record TEXT NOT NULL, state TEXT NOT NULL); CREATE TABLE events(sequence INTEGER PRIMARY KEY, member TEXT, event TEXT NOT NULL, payload TEXT NOT NULL); COMMIT;");
  for(const [table,columns] of [['meta',['version','revision']],['members',['id','record','state']],['events',['sequence','member','event','payload']]])if(JSON.stringify(this.db.prepare('PRAGMA table_info('+table+')').all().map(x=>x.name))!==JSON.stringify(columns))fail('JOURNAL_SCHEMA_REFUSED');
  if(initialize){const fd=fs.openSync(path.dirname(file),'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
  const meta=this.db.prepare('SELECT version,revision FROM meta').get();if(meta?.version!==1||!Number.isSafeInteger(meta.revision)||meta.revision<0)fail('MEMBERSHIP_JOURNAL_VERSION');
  if(this.db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')fail('MEMBERSHIP_JOURNAL_CORRUPT');
 }
 change(member,event,payload,write){
  payload=proof(event,payload);
  this.db.exec('BEGIN IMMEDIATE');try{
   const revision=this.db.prepare('SELECT revision FROM meta').get().revision+1;
   if(!Number.isSafeInteger(revision))fail('MEMBERSHIP_REVISION_EXHAUSTED');
   write?.();this.db.prepare('INSERT INTO events VALUES(?,?,?,?)').run(revision,member,event,JSON.stringify(payload));
   this.db.prepare('UPDATE meta SET revision=?').run(revision);this.db.exec('COMMIT');return revision;
  }catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 admit(value){const checked=record(value);return this.change(checked.id,'ADMITTED',checked,()=>this.db.prepare('INSERT INTO members VALUES(?,?,?)').run(checked.id,JSON.stringify(checked),'ADMITTED'));}
 state(id,state,proof){if(!['READY','HELD','TERMINATED','UNKNOWN'].includes(state))fail('INVALID_MEMBER_STATE');return this.change(id,state,proof,()=>{if(this.db.prepare('UPDATE members SET state=? WHERE id=?').run(state,id).changes!==1)fail('UNKNOWN_MEMBER');});}
 read(){
  const metas=this.db.prepare('SELECT version,revision FROM meta').all();if(metas.length!==1||metas[0].version!==1||!Number.isSafeInteger(metas[0].revision)||metas[0].revision<0)fail('JOURNAL_COHERENCE_REFUSED');
  const revision=metas[0].revision;
  const members=this.db.prepare('SELECT id,record,state FROM members ORDER BY id').all().map(r=>{if(!['ADMITTED','READY','HELD','TERMINATED','UNKNOWN'].includes(r.state))fail('JOURNAL_STATE_REFUSED');const value=record(JSON.parse(r.record));if(value.id!==r.id)fail('JOURNAL_COHERENCE_REFUSED');return {...value,state:r.state};});
  const events=this.db.prepare('SELECT sequence,member,event,payload FROM events ORDER BY sequence').all().map(r=>{if(!Number.isSafeInteger(r.sequence)||r.sequence<1||(r.member!==null&&!UUID.test(r.member)))fail('JOURNAL_EVENT_REFUSED');return {sequence:r.sequence,member:r.member,event:r.event,payload:proof(r.event,JSON.parse(r.payload))};});
  if(events.length!==revision||events.some((e,i)=>e.sequence!==i+1))fail('JOURNAL_COHERENCE_REFUSED');
  const replay=new Map();
  for(const event of events){
   if(event.event==='CAPTURE_FROZEN'){if(event.member!==null||event.payload.members.some(id=>!replay.has(id)))fail('JOURNAL_COHERENCE_REFUSED');continue;}
   if(event.event==='ADMITTED'){if(event.member!==event.payload.id||replay.has(event.member))fail('JOURNAL_COHERENCE_REFUSED');replay.set(event.member,{...event.payload,state:'ADMITTED'});}
   else{const prior=replay.get(event.member);if(!prior||prior.state==='TERMINATED')fail('JOURNAL_COHERENCE_REFUSED');prior.state=event.event;}
  }
  if(replay.size!==members.length)fail('JOURNAL_COHERENCE_REFUSED');
  for(const member of members)if(JSON.stringify(replay.get(member.id))!==JSON.stringify(member))fail('JOURNAL_COHERENCE_REFUSED');
  return {revision,members,events};
 }

 close(){this.db.close();}
}
class MembershipController extends EventEmitter{
 constructor({journalPath,initialize=false,runtimeUid,runtimeGid,source,generation,generationEnv,roles,volumeRoot,redisUrl,bootstrap=path.join(__dirname,'runtime-membership-bootstrap.mjs')}){
  super();this.operatorUid=process.getuid();
  if(!Number.isInteger(runtimeUid)||runtimeUid===0||runtimeUid===this.operatorUid||!Number.isInteger(runtimeGid)||!/^[a-f0-9]{40}$/.test(source))fail('DISTINCT_RUNTIME_PRINCIPAL_REQUIRED');
  if(!/^[a-f0-9-]{36}$/.test(generation))fail('INVALID_GENERATION');
  protectedPath(path.dirname(journalPath),this.operatorUid);protectedPath(bootstrap,this.operatorUid);
  exact(generationEnv,['EMPIRE_GENERATION_DIRECTORY','EMPIRE_GENERATION','EMPIRE_CUTOVER_DIGEST','EMPIRE_GENERATION_DEVICE','EMPIRE_GENERATION_INODE']);
  if(generationEnv?.EMPIRE_GENERATION!==generation)fail('GENERATION_BINDING_MISMATCH');
  this.uid=runtimeUid;this.gid=runtimeGid;this.source=source;this.generation=generation;this.generationEnv=generationEnv;this.volumeRoot=volumeRoot;this.redisUrl=redisUrl;this.bootstrap=bootstrap;this.roles=new Map();this.live=new Map();this.phase='OPEN';this.capture=null;
  for(const spec of roles){if(!['primary','brain-worker','assurance-worker','assurance-inspector'].includes(spec.role)||this.roles.has(spec.role)||!Array.isArray(spec.scope)||!spec.scope.length||spec.scope.some(x=>typeof x!=='string'||!/^[a-z0-9:_-]{1,80}$/.test(x)))fail('INVALID_ROLE_MANIFEST');protectedPath(spec.entry,this.operatorUid);if(digest(fs.readFileSync(spec.entry))!==spec.entrySha256)fail('ENTRY_ARTIFACT_MISMATCH');this.roles.set(spec.role,Object.freeze({...spec,scope:Object.freeze([...spec.scope])}));}
  const guardPath=journalPath+'.controller.sqlite';if(initialize){const fd=fs.openSync(guardPath,'wx',0o600);fs.closeSync(fd);}else if(!fs.existsSync(guardPath))fail('CONTROLLER_LOCK_MISSING');
  protectedPath(guardPath,this.operatorUid);this.guard=new DatabaseSync(guardPath,{timeout:0});
  try{this.guard.exec('PRAGMA journal_mode=DELETE; BEGIN EXCLUSIVE');}catch(e){this.guard.close();throw e;}
  try{this.authority=this.readAuthority();
  this.journal=new MembershipJournal(journalPath,{initialize});protectedPath(journalPath,this.operatorUid);this.journal.read();
  // Retained ADMITTED records are not presumed dead after controller restart.
  for(const record of this.journal.read().members){if(record.state==='TERMINATED')continue;
   const here=namespace();if(record.boot!==here.boot||record.pidNamespace!==here.pidNamespace){this.phase='BLOCKED';fail('PRIOR_NAMESPACE_REQUIRES_OPERATING_FENCE');}
   const observed=processIdentity(record.pid);
   if(observed&&observed.startTicks===record.startTicks&&observed.state!=='Z'){this.phase='BLOCKED';fail('PRIOR_MEMBER_STILL_PRESENT');}
   this.journal.state(record.id,'TERMINATED',{basis:'SAME_NAMESPACE_PID_START_ABSENT',observedAt:new Date().toISOString()});
  }
  }catch(e){this.journal?.close();this.guard.close();throw e;}
 }
 readAuthority(){
  const filename=path.join(this.generationEnv.EMPIRE_GENERATION_DIRECTORY,'generation.sqlite');protectedPath(filename,this.operatorUid);const stat=fs.statSync(filename);if(String(stat.dev)!==this.generationEnv.EMPIRE_GENERATION_DEVICE||String(stat.ino)!==this.generationEnv.EMPIRE_GENERATION_INODE)fail('AUTHORITY_IDENTITY_MISMATCH');
  const db=new DatabaseSync(filename,{readOnly:true,timeout:0});try{const row=db.prepare('SELECT * FROM authority WHERE id=1').get();if(!row||row.version!==1||row.generation!==this.generation||row.cutover_digest!==this.generationEnv.EMPIRE_CUTOVER_DIGEST||!Number.isSafeInteger(row.epoch)||row.epoch<1||!JSON.parse(row.sources).includes(this.source))fail('AUTHORITY_BINDING_MISMATCH');return {epoch:row.epoch,cutoverDigest:row.cutover_digest};}finally{db.close();}
 }
 launch(role,{afterCommit}={}){
  if(this.phase!=='OPEN')fail('ADMISSION_FROZEN');const spec=this.roles.get(role);if(!spec)fail('UNDECLARED_ROLE');
  if([...this.live.values()].some(m=>m.role===role))fail('ROLE_ALREADY_PRESENT');
  protectedPath(spec.entry,this.operatorUid);if(digest(fs.readFileSync(spec.entry))!==spec.entrySha256)fail('ENTRY_ARTIFACT_MISMATCH');
  const id=crypto.randomUUID(),nonce=crypto.randomUUID();
  const env={PATH:process.env.PATH,LANG:'C.UTF-8',...this.generationEnv,RAILWAY_VOLUME_MOUNT_PATH:this.volumeRoot,RAILWAY_GIT_COMMIT_SHA:this.source,REDIS_URL:role==='assurance-inspector'?undefined:this.redisUrl,WORK8_MEMBERSHIP_ID:id,WORK8_MEMBERSHIP_NONCE:nonce,WORK8_MEMBERSHIP_ROLE:role,WORK8_RUNTIME_STATE:spec.stateDirectory,WORK8_CONTROLLER_JOURNAL_PATH:this.journal.file};
  if(env.REDIS_URL===undefined)delete env.REDIS_URL;
  const child=spawn(process.execPath,['--import',this.bootstrap,spec.entry],{env,uid:this.uid,gid:this.gid,stdio:['ignore','pipe','pipe','ipc']});
  const member={id,nonce,role,child,record:null,ready:false,afterCommit};this.live.set(id,member);
  child.on('message',m=>{try{this.message(member,m);}catch(e){this.invalidate(e);}});
  child.on('error',e=>this.invalidate(e));
  child.on('exit',(code,signal)=>{
   this.live.delete(id);
   try{if(member.record)this.journal.state(id,'TERMINATED',{basis:'OWNED_CHILD_EXIT_EVENT',pid:child.pid,startTicks:member.record.startTicks,code,signal,at:new Date().toISOString()});}catch(e){this.phase='BLOCKED';this.emit('fault',e);}
   if(this.capture)this.invalidate(Error('CAPTURE_MEMBER_EXITED'));
   this.emit('memberExit',{id,role,code,signal});
  });
  return member;
 }
 message(member,m){
  if(!m||m.protocol!==PROTOCOL)return;
  if(m.id!==member.id||m.nonce!==member.nonce)fail('PRIVATE_IPC_IDENTITY_MISMATCH');
  if(m.action==='enroll'){
   if(this.phase!=='OPEN'||member.record)fail('ENROLLMENT_REFUSED');
   const p=processIdentity(member.child.pid);if(!p||p.state==='Z'||p.uids.some(x=>x!==this.uid)||p.gids.some(x=>x!==this.gid)||!/^0+$/.test(p.capEff))fail('CHILD_IDENTITY_MISMATCH');
   const spec=this.roles.get(member.role);
   const cmd=fs.readFileSync(`/proc/${p.pid}/cmdline`,'utf8').split('\0').filter(Boolean);if(JSON.stringify(cmd.slice(1))!==JSON.stringify(['--import',this.bootstrap,spec.entry]))fail('CHILD_ENTRYPOINT_MISMATCH');
   const authority=this.readAuthority();if(JSON.stringify(authority)!==JSON.stringify(this.authority))fail('AUTHORITY_CHANGED');
   const store=fs.statSync(spec.stateDirectory);if(fs.realpathSync(spec.stateDirectory)!==spec.stateDirectory||!spec.stateDirectory.startsWith(this.volumeRoot+path.sep)||!store.isDirectory()||store.uid!==this.uid||store.gid!==this.gid)fail('STORE_SCOPE_MISMATCH');
   const record={storeRoot:spec.stateDirectory,storeDevice:store.dev,storeInode:store.ino,epoch:authority.epoch,cutoverDigest:authority.cutoverDigest,id:member.id,role:member.role,pid:p.pid,startTicks:p.startTicks,boot:p.boot,pidNamespace:p.pidNamespace,uid:this.uid,gid:this.gid,source:this.source,generation:this.generation,entrySha256:spec.entrySha256,scope:[...spec.scope],scopeDigest:digest(JSON.stringify(spec.scope))};
   this.journal.admit(record);member.record=record;
   member.afterCommit?.(record); // Examination crash point; no ACK precedes commit.
   member.child.send({protocol:PROTOCOL,id:member.id,nonce:member.nonce,action:'admitted'},e=>{if(e)this.invalidate(e);});return;
  }
  if(!member.record)fail('UNADMITTED_MEMBER_FRAME');
  if(m.action==='ready'){
   if(this.phase!=='OPEN'||member.ready)fail('READY_REFUSED');member.ready=true;this.journal.state(member.id,'READY',{basis:'BOOTSTRAP_PARTICIPANT_REGISTERED'});this.emit('ready',member);return;
  }
  const c=this.capture;
  if(!c||m.capture!==c.id||!c.ids.has(member.id))fail('UNEXPECTED_CAPTURE_FRAME');
  if(m.action==='held'&&c.stage==='HOLDING'&&!c.held.has(member.id)){
   c.held.add(member.id);this.journal.state(member.id,'HELD',{capture:c.id,basis:'DECLARED_PARTICIPANT_DRAIN_ACK'});
   if(c.held.size===c.ids.size)c.resolve();return;
  }
  if(m.action==='released'&&c.stage==='RELEASING'&&!c.released.has(member.id)){
   c.released.add(member.id);this.journal.state(member.id,'READY',{capture:c.id,basis:'DECLARED_PARTICIPANT_RELEASE_ACK'});
   if(c.released.size===c.ids.size)c.resolve();return;
  }
  fail('CAPTURE_FRAME_REFUSED');
 }
 invalidate(error){
  this.phase='BLOCKED';if(this.capture){clearTimeout(this.capture.timer);this.capture.reject(error);}
  for(const member of this.live.values())member.child.kill('SIGKILL');this.emit('fault',error);
 }
 async captureHeld(examine,{timeoutMs=5000}={}){
  if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000)fail('CAPTURE_TIMEOUT_INVALID');
  if(this.phase!=='OPEN'||this.live.size!==this.roles.size||[...this.live.values()].some(m=>!m.record||!m.ready))fail('COMPLETE_DECLARED_CENSUS_REQUIRED');
  const census=this.journal.read().members.filter(m=>m.state!=='TERMINATED');if(census.length!==this.live.size||census.some(m=>!this.live.has(m.id)||m.state!=='READY'||processIdentity(m.pid)?.startTicks!==m.startTicks||processIdentity(m.pid)?.state==='Z'))fail('COMPLETE_DECLARED_CENSUS_REQUIRED');
  this.phase='CAPTURING';const c={id:crypto.randomUUID(),ids:new Set(this.live.keys()),held:new Set(),released:new Set(),stage:'HOLDING',deadline:Date.now()+timeoutMs};this.capture=c;
  const wait=()=>new Promise((resolve,reject)=>{c.resolve=resolve;c.reject=reject;c.timer=setTimeout(()=>this.invalidate(Error('CAPTURE_DEADLINE')),Math.max(1,c.deadline-Date.now()));});
  try{
   const held=wait();this.journal.change(null,'CAPTURE_FROZEN',{capture:c.id,members:[...c.ids]},null);
   for(const m of this.live.values())m.child.send({protocol:PROTOCOL,id:m.id,nonce:m.nonce,action:'hold',capture:c.id},e=>{if(e)this.invalidate(e);});
   await held;clearTimeout(c.timer);if(this.phase!=='CAPTURING'||this.live.size!==c.ids.size)fail('CENSUS_CHANGED');
   const frozen=this.journal.read();const value=await Promise.race([Promise.resolve().then(()=>examine({capture:c.id,journalRevision:frozen.revision,members:frozen.members.filter(m=>c.ids.has(m.id)),scope:'DECLARED_SYNTHETIC_COHORT_ONLY'})),new Promise((_,reject)=>{c.timer=setTimeout(()=>{const e=Error('CAPTURE_DEADLINE');this.invalidate(e);reject(e);},Math.max(1,c.deadline-Date.now()));})]);clearTimeout(c.timer);
   if(this.phase!=='CAPTURING'||this.journal.read().revision!==frozen.revision)fail('CAPTURE_REVISION_CHANGED');
   c.stage='RELEASING';const released=wait();for(const m of this.live.values())m.child.send({protocol:PROTOCOL,id:m.id,nonce:m.nonce,action:'release',capture:c.id},e=>{if(e)this.invalidate(e);});
   await released;clearTimeout(c.timer);this.capture=null;this.phase='OPEN';return value;
  }catch(e){this.invalidate(e);throw e;}
 }
 read(){return {...this.journal.read(),scope:'DECLARED_SYNTHETIC_COHORT_ONLY',phase:this.phase,completeLiveState:false,bootAllowed:false,productionGraphIntegrated:false,externalRedisExclusion:'NOT_CERTIFIED_BY_LOCAL_JOURNAL'};}
 async stop(){this.phase='STOPPING';const pending=[...this.live.values()].map(m=>new Promise(resolve=>{m.child.once('exit',resolve);m.child.kill('SIGKILL');}));await Promise.all(pending);this.journal.close();this.guard.close();this.phase='STOPPED';}
}
module.exports={MembershipController,MembershipJournal,processIdentity,protectedPath,PROTOCOL,digest};

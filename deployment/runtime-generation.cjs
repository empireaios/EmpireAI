'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');
const VERSION=1;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const reject=()=>{throw Error('RUNTIME_GENERATION_AUTHORITY_REFUSED');};
function immutableToRuntime(file){const s=fs.statSync(file);if(process.getuid?.()===0||s.uid===process.getuid?.())reject();try{fs.accessSync(file,fs.constants.W_OK);}catch(e){if(e.code==='EACCES')return;throw e;}reject();}
function canonical(root){if(!path.isAbsolute(root)||fs.realpathSync(root)!==root||!fs.statSync(root).isDirectory())reject();return root;}
function regular(file){const s=fs.lstatSync(file);if(!s.isFile()||s.nlink!==1)reject();return s;}
function source(value){if(!/^[a-f0-9]{40}$/.test(value))reject();return value;}
function generation(value){if(!/^[a-f0-9-]{36}$/.test(value))reject();return value;}
function receipt(root,digest){
 if(!/^[a-f0-9]{64}$/.test(digest))reject();
 const file=path.join(root,'cutover-'+digest+'.json');regular(file);
 const bytes=fs.readFileSync(file);if(hash(bytes)!==digest)reject();
 const r=JSON.parse(bytes);
 // A pinned, independently reviewed operating receipt is required. This check
 // verifies its shape/identity, NOT the truth of external fencing assertions.
 if(r.schema!=='runtime-cutover-v1'||!Array.isArray(r.proofReferences)||!r.proofReferences.length||r.proofReferences.some(x=>typeof x!=='string'||!x.trim())||
 !r.redis||typeof r.redis.host!=='string'||!Number.isSafeInteger(r.redis.db)||r.redis.db<0||
 !/^[a-f0-9]{40}$/.test(r.redis.runId)||typeof r.reviewReceipt!=='string'||!r.reviewReceipt.trim()||
 !Array.isArray(r.compatibleSources)||!r.compatibleSources.length)reject();
 r.compatibleSources.forEach(source);
 if(r.priorWriterDisposition!=='EXCLUDED_BY_REVIEWED_OPERATING_TRANSITION'||r.redisDisposition!=='EXCLUSIVE_COHORT_CAPABILITY_REVIEWED')reject();
 return r;
}
function open(root,readOnly,expectedDevice,expectedInode){
 const file=path.join(canonical(root),'generation.sqlite');const before=regular(file);
 if(String(before.dev)!==String(expectedDevice)||String(before.ino)!==String(expectedInode))reject();
 const db=new DatabaseSync(file,{readOnly,timeout:0,allowExtension:false});
 try{for(const [table,names] of [['authority',['id','version','generation','cutover_digest','sources','epoch']],['transitions',['previous_generation','next_generation','cutover_digest','at']]]){if(JSON.stringify(db.prepare('PRAGMA table_info('+table+')').all().map(x=>x.name))!==JSON.stringify(names))reject();}const after=regular(file);if(before.dev!==after.dev||before.ino!==after.ino||db.prepare('PRAGMA journal_mode').get().journal_mode!=='delete')reject();return {db,file,identity:after};}
 catch(e){db.close();throw e;}
}
function event(root,value){
 const dir=path.join(root,'members');if(fs.realpathSync(dir)!==dir||!fs.statSync(dir).isDirectory())reject();
 const file=path.join(dir,value.member+'.'+value.event+'.json');
 const fd=fs.openSync(file,'wx',0o600);try{fs.writeFileSync(fd,JSON.stringify(value)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 const d=fs.openSync(dir,'r');try{fs.fsyncSync(d);}finally{fs.closeSync(d);}
}
function acquireGenerationLock({root,expectedGeneration,expectedSource,cutoverDigest,role,expectedDevice,expectedInode,volumeRoot,redisUrl}){
 generation(expectedGeneration);source(expectedSource);
 if(!['launcher','primary','brain-worker','assurance-worker','assurance-inspector'].includes(role))reject();
 const {db,file,identity}=open(root,true,expectedDevice,expectedInode);let held=false;
 try{
  db.exec('BEGIN');
  const row=db.prepare('SELECT * FROM authority WHERE id=1').get();
  // SELECT establishes a native SHARED lock, retained until process exit.
  if(!row||row.version!==VERSION||row.generation!==expectedGeneration||row.cutover_digest!==cutoverDigest||!Number.isSafeInteger(row.epoch)||row.epoch<1)reject();
  const r=receipt(root,cutoverDigest);
  canonical(volumeRoot);const volume=fs.statSync(volumeRoot);
  if(!r.storage||r.storage.root!==volumeRoot||String(r.storage.dev)!==String(volume.dev)||String(r.storage.ino)!==String(volume.ino)||!root.startsWith(volumeRoot+path.sep))reject();
  if(redisUrl){const url=new URL(redisUrl);if(!['redis:','rediss:'].includes(url.protocol)||url.hostname!==r.redis.host||Number(url.port||6379)!==r.redis.port||Number(url.pathname.slice(1)||0)!==r.redis.db)reject();}
  else if(role!=='assurance-inspector')reject();
  if(!r.compatibleSources.includes(expectedSource)||row.sources!==JSON.stringify(r.compatibleSources))reject();
  const now=regular(file);if(now.dev!==identity.dev||now.ino!==identity.ino)reject();
  const stat=fs.readFileSync('/proc/self/stat','utf8');const startTicks=stat.slice(stat.lastIndexOf(')')+2).split(' ')[19];
  if(!/^\d+$/.test(startTicks))reject();
  const member=crypto.randomUUID();
  const base={member,epoch:row.epoch,generation:expectedGeneration,source:expectedSource,role,pid:process.pid,startTicks,cutoverDigest};
  event(root,{...base,event:'admitted',at:new Date().toISOString()});
  // Deliberately no public release: callers cannot drop the lock and continue
  // writing. A native connection failure is fatal; there is no helper process.
  process.once('exit',()=>{try{db.prepare('SELECT 1').get();event(root,{...base,event:'exiting',at:new Date().toISOString()});}catch{}});
  const verifyIdentity=()=>{try{const current=regular(file);if(current.dev!==identity.dev||current.ino!==identity.ino)throw Error('changed');}catch{process.kill(process.pid,'SIGKILL');}};
  const watcher=fs.watch(root,verifyIdentity);watcher.unref();
  const timer=setInterval(verifyIdentity,100);timer.unref();
  held=true;
  return Object.freeze({...base});
 }finally{if(!held)db.close();}
}
function admit({root,expectedGeneration,expectedSource,cutoverDigest,role,expectedDevice,expectedInode,volumeRoot,redisUrl}){
 generation(expectedGeneration);source(expectedSource);
 // Parent directories must also resist rename/replacement by this principal.
 let ancestor=canonical(root);for(;;){immutableToRuntime(ancestor);const parent=path.dirname(ancestor);if(parent===ancestor)break;ancestor=parent;}
 immutableToRuntime(path.join(root,'generation.sqlite'));
 immutableToRuntime(path.join(root,'cutover-'+cutoverDigest+'.json'));
 return acquireGenerationLock(arguments[0]);
}
function transition({root,expectedGeneration,nextGeneration,cutoverDigest,expectedDevice,expectedInode}){
 generation(expectedGeneration);generation(nextGeneration);if(expectedGeneration===nextGeneration)reject();
 const r=receipt(root,cutoverDigest);const {db,file,identity}=open(root,false,expectedDevice,expectedInode);
 try{
  // No timeout, no lease expiry, no force path. Any surviving cohort process
  // retains a shared lock and makes this transaction fail before mutation.
  db.exec('BEGIN EXCLUSIVE');
  const row=db.prepare('SELECT * FROM authority WHERE id=1').get();
  if(!row||row.version!==VERSION||row.generation!==expectedGeneration||!Number.isSafeInteger(row.epoch)||row.epoch<1||row.epoch>=Number.MAX_SAFE_INTEGER)reject();
  if(db.prepare('SELECT 1 FROM transitions WHERE previous_generation=? OR next_generation=?').get(nextGeneration,nextGeneration))reject();
  const s=regular(file);if(s.dev!==identity.dev||s.ino!==identity.ino)reject();
  db.prepare('INSERT INTO transitions(previous_generation,next_generation,cutover_digest,at) VALUES(?,?,?,?)').run(expectedGeneration,nextGeneration,cutoverDigest,new Date().toISOString());
  db.prepare('UPDATE authority SET generation=?,cutover_digest=?,sources=?,epoch=epoch+1 WHERE id=1').run(nextGeneration,cutoverDigest,JSON.stringify(r.compatibleSources));
  db.exec('COMMIT');return {generation:nextGeneration,epoch:row.epoch+1,cutoverDigest};
 }finally{db.close();}
}
// Initial provisioning is deliberately not exposed as a runtime convenience.
// An exact reviewed authority DB + pinned cutover receipt must be installed by
// the separately authorised operating transition, before any application boot.
function exportMembership({root,expectedDevice,expectedInode}){
 const {db}=open(root,true,expectedDevice,expectedInode);
 try{db.exec('BEGIN');const authority=db.prepare('SELECT version,generation,cutover_digest,sources,epoch FROM authority WHERE id=1').get();
 if(!authority||authority.version!==VERSION||!Number.isSafeInteger(authority.epoch)||authority.epoch<1||!/^[a-f0-9]{64}$/.test(authority.cutover_digest))reject();generation(authority.generation);
 const sources=JSON.parse(authority.sources);if(!Array.isArray(sources)||!sources.length)reject();sources.forEach(source);authority.sources=sources;
 const transitions=db.prepare('SELECT previous_generation,next_generation,cutover_digest,at FROM transitions').all().map(r=>{generation(r.previous_generation);generation(r.next_generation);if(!/^[a-f0-9]{64}$/.test(r.cutover_digest)||!Number.isFinite(Date.parse(r.at)))reject();return {...r,at:new Date(r.at).toISOString()};});
 const members=fs.readdirSync(path.join(root,'members')).filter(x=>/^[a-f0-9-]{36}\.(admitted|exiting)\.json$/.test(x)).sort().map(x=>{const m=JSON.parse(fs.readFileSync(path.join(root,'members',x),'utf8'));generation(m.member);generation(m.generation);source(m.source);if(!Number.isSafeInteger(m.pid)||!Number.isSafeInteger(m.epoch)||!/^\d+$/.test(m.startTicks)||!['launcher','primary','brain-worker','assurance-worker','assurance-inspector'].includes(m.role)||!['admitted','exiting'].includes(m.event)||x!==m.member+'.'+m.event+'.json'||!/^[a-f0-9]{64}$/.test(m.cutoverDigest)||!Number.isFinite(Date.parse(m.at)))reject();return {member:m.member,generation:m.generation,source:m.source,epoch:m.epoch,role:m.role,pid:m.pid,startTicks:m.startTicks,cutoverDigest:m.cutoverDigest,event:m.event,at:new Date(m.at).toISOString()};});
 return {authority,members,transitions,completeLiveState:false,bootAllowed:false,scope:'DECLARED_SHARED_VOLUME_COHORT_ONLY',receiptCompleteness:'UNPROVEN_RUNTIME_WRITABLE_MEMBER_DIRECTORY',currentLiveness:'UNKNOWN_FROM_RECEIPTS',captureHeld:'NOT_ESTABLISHED',externalRedisExclusion:'OPERATING_RECEIPT_REQUIRES_INDEPENDENT_VERIFICATION'};
 }finally{db.close();}
}
// Internal primitive is exported for protocol examination. Production MUST use
// admit through the mandatory preload; this primitive alone is not admission.
module.exports={admit,acquireGenerationLock,transition,exportMembership,VERSION};

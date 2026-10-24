'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const {spawn,spawnSync}=require('node:child_process');const {once}=require('node:events');
const crypto=require('node:crypto');const {DatabaseSync}=require('node:sqlite');
const {transition}=require('./runtime-generation.cjs');
const SOURCE='a'.repeat(40),OLD='b'.repeat(40),A='11111111-1111-1111-1111-111111111111',B='22222222-2222-2222-2222-222222222222';
const preload=path.join(__dirname,'runtime-generation-preload.cjs');
function fixture(t){
 const volume=fs.mkdtempSync(path.join(os.tmpdir(),'work8-generation-'));t.after(()=>fs.rmSync(volume,{recursive:true,force:true}));
 const root=path.join(volume,'authority');fs.mkdirSync(root);fs.chmodSync(volume,0o755);
 fs.mkdirSync(path.join(volume,'deployment'));fs.mkdirSync(path.join(volume,'backend/dist'),{recursive:true});
 for(const name of ['runtime-generation.cjs','runtime-generation-preload.cjs','runtime-revision.cjs'])fs.copyFileSync(path.join(__dirname,name),path.join(volume,'deployment',name));
 fs.writeFileSync(path.join(volume,'backend/dist/runtime-revision.json'),JSON.stringify({revision:SOURCE}));
 const stat=fs.statSync(volume);
 fs.mkdirSync(path.join(root,'members'),{mode:0o777});fs.chmodSync(path.join(root,'members'),0o777);
 fs.mkdirSync(path.join(volume,'writes'),{mode:0o777});fs.chmodSync(path.join(volume,'writes'),0o777);
 const evidence={schema:'runtime-cutover-v1',proofReferences:['FIXTURE_ONLY_NOT_OPERATING_EVIDENCE'],reviewReceipt:'FIXTURE',storage:{root:volume,dev:stat.dev,ino:stat.ino},redis:{host:'isolated.invalid',port:6379,db:0,runId:'c'.repeat(40)},compatibleSources:[SOURCE],priorWriterDisposition:'EXCLUDED_BY_REVIEWED_OPERATING_TRANSITION',redisDisposition:'EXCLUSIVE_COHORT_CAPABILITY_REVIEWED'};
 const bytes=JSON.stringify(evidence),digest=crypto.createHash('sha256').update(bytes).digest('hex');fs.writeFileSync(path.join(root,'cutover-'+digest+'.json'),bytes);
 const file=path.join(root,'generation.sqlite');const db=new DatabaseSync(file);
 db.exec('PRAGMA journal_mode=DELETE; CREATE TABLE authority(id INTEGER PRIMARY KEY,version INTEGER,generation TEXT,cutover_digest TEXT,sources TEXT,epoch INTEGER); CREATE TABLE transitions(previous_generation TEXT,next_generation TEXT,cutover_digest TEXT,at TEXT);');
 db.prepare('INSERT INTO authority VALUES(1,1,?,?,?,1)').run(A,digest,JSON.stringify([SOURCE]));db.close();
 const st=fs.statSync(file);
 const options={root,expectedGeneration:A,nextGeneration:B,cutoverDigest:digest,expectedDevice:st.dev,expectedInode:st.ino};
 const env={...process.env,NODE_OPTIONS:'',EMPIRE_TEST_WRITE_DIRECTORY:path.join(volume,'writes'),RAILWAY_VOLUME_MOUNT_PATH:volume,REDIS_URL:'redis://isolated.invalid:6379/0',RAILWAY_GIT_COMMIT_SHA:SOURCE,EMPIRE_GENERATION_DIRECTORY:root,EMPIRE_GENERATION:A,EMPIRE_CUTOVER_DIGEST:digest,EMPIRE_GENERATION_DEVICE:String(st.dev),EMPIRE_GENERATION_INODE:String(st.ino)};
 const entry=path.join(root,'index.js');fs.writeFileSync(entry,"require('node:fs').writeFileSync(process.env.EMPIRE_TEST_WRITE_DIRECTORY+'/application-write','yes');console.log('READY');setInterval(()=>require('node:fs').appendFileSync(process.env.EMPIRE_TEST_WRITE_DIRECTORY+'/application-write','x'),10);");
 // Protocol tests exercise the native lock separately from production DAC admission.
 const productionPreload=path.join(volume,'deployment/runtime-generation-preload.cjs');
 const protocolPreload=path.join(volume,'deployment/protocol-only-preload.cjs');
 fs.writeFileSync(protocolPreload,fs.readFileSync(productionPreload,'utf8').replace('const {admit}=','const {acquireGenerationLock:admit}='));
 return {root,file,options,env,entry,productionPreload,preload:protocolPreload};
}
async function child(t,f){
 const p=spawn(process.execPath,['--require',f.preload,f.entry],{env:f.env,stdio:['ignore','pipe','pipe']});let stderr='';p.stderr.on('data',b=>stderr+=b);
 t.after(()=>{if(p.exitCode===null&&p.signalCode===null)p.kill('SIGKILL');});
 await new Promise((resolve,reject)=>{p.stdout.on('data',b=>{if(b.toString().includes('READY'))resolve();});p.once('exit',()=>reject(Error(stderr)));});return p;
}
async function stop(p,signal='SIGKILL'){const done=once(p,'exit');p.kill(signal);await done;}
function refused(f){const r=spawnSync(process.execPath,['--require',f.preload,f.entry],{env:f.env,encoding:'utf8',timeout:3000});assert.notEqual(r.status,0);assert.equal(fs.existsSync(path.join(f.env.EMPIRE_TEST_WRITE_DIRECTORY,'application-write')),false);}
test('two real protocol child processes block transition across async writes; last crash releases native exclusion',async t=>{
 const f=fixture(t);const p=await child(t,f),q=await child(t,f);
 await new Promise(r=>setTimeout(r,40));assert.ok(fs.readFileSync(path.join(f.env.EMPIRE_TEST_WRITE_DIRECTORY,'application-write'),'utf8').length>3);
 assert.equal(require('./runtime-generation.cjs').exportMembership(f.options).captureHeld,'NOT_ESTABLISHED');
 assert.throws(()=>transition(f.options),/locked/);await stop(p);assert.throws(()=>transition(f.options),/locked/);
 await stop(q);assert.equal(transition(f.options).generation,B);
 const records=fs.readdirSync(path.join(f.root,'members'));assert.equal(records.filter(x=>x.endsWith('.admitted.json')).length,2);assert.equal(records.filter(x=>x.endsWith('.exiting.json')).length,0);
 // Crash does not fabricate graceful termination receipts. A separate
 // operating cutover receipt remains necessary for independent Redis access.
 fs.unlinkSync(path.join(f.env.EMPIRE_TEST_WRITE_DIRECTORY,'application-write'));refused(f);
});
test('exclusive transition commits once and rejects stale expected epoch',t=>{
 const f=fixture(t);transition(f.options);assert.throws(()=>transition(f.options),/REFUSED/);
 const db=new DatabaseSync(f.file,{readOnly:true});assert.equal(db.prepare('SELECT COUNT(*) n FROM transitions').get().n,1);db.close();
});
test('two concurrent transition controllers produce exactly one committed epoch',async t=>{
 const f=fixture(t);const script="process.send('ready');process.once('message',()=>{try{require(process.argv[1]).transition(JSON.parse(process.argv[2]));process.exit(0);}catch{process.exit(1);}})";
 const processes=[0,1].map(()=>spawn(process.execPath,['-e',script,path.join(__dirname,'runtime-generation.cjs'),JSON.stringify(f.options)],{stdio:['ignore','ignore','ignore','ipc']}));
 t.after(()=>processes.forEach(p=>{if(p.exitCode===null)p.kill('SIGKILL');}));
 await Promise.all(processes.map(p=>once(p,'message')));
 const results=processes.map(p=>once(p,'exit'));processes.forEach(p=>p.send('go'));
 assert.deepEqual((await Promise.all(results)).map(x=>x[0]).sort(),[0,1]);
 const db=new DatabaseSync(f.file,{readOnly:true});assert.equal(db.prepare('SELECT epoch FROM authority').get().epoch,2);db.close();
});
test('generation history rejects reuse of an earlier generation',t=>{
 const f=fixture(t);transition(f.options);
 assert.throws(()=>transition({...f.options,expectedGeneration:B,nextGeneration:A}),/REFUSED/);
});
test('different Redis capability or storage identity refuses before writes',t=>{
 const f=fixture(t);f.env.REDIS_URL='redis://other.invalid:6379/0';refused(f);
 f.env.REDIS_URL='redis://isolated.invalid:6379/1';refused(f);
 f.env.REDIS_URL='redis://isolated.invalid:6379/0';f.env.RAILWAY_VOLUME_MOUNT_PATH=f.root;refused(f);
});
test('loaded image revision mismatch refuses even with a compatible environment label',t=>{
 const f=fixture(t);fs.writeFileSync(path.join(path.dirname(f.root),'backend/dist/runtime-revision.json'),JSON.stringify({revision:OLD}));refused(f);
});
test('read-only export retains unknown external and capture boundaries',t=>{
 const f=fixture(t);const value=require('./runtime-generation.cjs').exportMembership(f.options);
 assert.equal(value.completeLiveState,false);assert.equal(value.captureHeld,'NOT_ESTABLISHED');assert.equal(value.currentLiveness,'UNKNOWN_FROM_RECEIPTS');
});
test('future authority schema and invalid export fields refuse instead of leaking extra data',t=>{
 const f=fixture(t);const db=new DatabaseSync(f.file);db.exec('ALTER TABLE transitions ADD COLUMN private_value TEXT');db.close();
 assert.throws(()=>require('./runtime-generation.cjs').exportMembership(f.options),/REFUSED/);
});
test('epoch overflow is refused before authority mutation',t=>{
 const f=fixture(t);const db=new DatabaseSync(f.file);db.prepare('UPDATE authority SET epoch=?').run(Number.MAX_SAFE_INTEGER);db.close();
 assert.throws(()=>transition(f.options),/REFUSED/);
});
test('incompatible source rollback fails before application writes',t=>{const f=fixture(t);f.env.RAILWAY_GIT_COMMIT_SHA=OLD;refused(f);});
test('missing or corrupted pinned external cutover receipt refuses boot and transition',t=>{
 const f=fixture(t);fs.writeFileSync(path.join(f.root,'cutover-'+f.options.cutoverDigest+'.json'),'{}');refused(f);assert.throws(()=>transition(f.options),/REFUSED/);
});
test('corrupt authority refuses before application mutation',t=>{const f=fixture(t);fs.writeFileSync(f.file,'broken');refused(f);});
test('WAL mode rejected: read snapshots are not generation exclusion',t=>{
 const f=fixture(t);const db=new DatabaseSync(f.file);db.exec('PRAGMA journal_mode=WAL');db.close();refused(f);assert.throws(()=>transition(f.options),/REFUSED/);
});
test('replaced authority inode cannot bypass a surviving admitted generation',async t=>{
 const f=fixture(t),p=await child(t,f);fs.renameSync(f.file,f.file+'.original');fs.copyFileSync(f.file+'.original',f.file);
 assert.throws(()=>transition(f.options),/REFUSED/);if(p.exitCode===null&&p.signalCode===null)await stop(p);assert.throws(()=>transition(f.options),/REFUSED/);
});
test('ordinary process exit records exiting while kernel retains lock until final process teardown',async t=>{
 const f=fixture(t);fs.writeFileSync(f.entry,"console.log('DONE');");
 const result=spawnSync(process.execPath,['--require',f.preload,f.entry],{env:f.env,encoding:'utf8'});assert.equal(result.status,0,result.stderr);
 const names=fs.readdirSync(path.join(f.root,'members'));assert.equal(names.filter(x=>x.endsWith('.admitted.json')).length,1);assert.equal(names.filter(x=>x.endsWith('.exiting.json')).length,1);
 assert.equal(transition(f.options).generation,B);
});

test('production preload refuses privileged or runtime-owned authority before application writes',t=>{const f=fixture(t);f.preload=f.productionPreload;refused(f);});
test('Assurance replacements retain mandatory preload and exact generation configuration',()=>{
 const {EventEmitter}=require('node:events');const seen=[];
 const env={PATH:process.env.PATH,NODE_OPTIONS:'--require=/fixed/runtime-generation-preload.cjs',EMPIRE_GENERATION_DIRECTORY:'/data/operator/authority',EMPIRE_GENERATION:A,EMPIRE_CUTOVER_DIGEST:'d'.repeat(64),EMPIRE_GENERATION_DEVICE:'1',EMPIRE_GENERATION_INODE:'2',RAILWAY_GIT_COMMIT_SHA:SOURCE,RAILWAY_VOLUME_MOUNT_PATH:'/data',REDIS_URL:'redis://isolated.invalid:6379/0'};
 const stop=require('./assurance-supervisor.cjs').superviseAssurance({cwd:process.cwd(),env,spawnImpl:(_cmd,args,options)=>{const c=new EventEmitter();c.kill=()=>{};seen.push({args,env:options.env});return c;}});
 try{assert.equal(seen.length,2);for(const c of seen)for(const key of ['NODE_OPTIONS','EMPIRE_GENERATION_DIRECTORY','EMPIRE_GENERATION','EMPIRE_CUTOVER_DIGEST','EMPIRE_GENERATION_DEVICE','EMPIRE_GENERATION_INODE','RAILWAY_GIT_COMMIT_SHA'])assert.equal(c.env[key],env[key]);assert.equal(seen[1].env.REDIS_URL,undefined);}finally{stop();}
});

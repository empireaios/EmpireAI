'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {MembershipController,processIdentity,digest}=require('./runtime-membership-controller.cjs');
const {prepareWriterIsolation}=require('./runtime-writer-isolation.cjs');
const {installBrainBroker}=require('./runtime-brain-broker.cjs');
const {superviseAssurance}=require('./assurance-supervisor.cjs');
const {initializeAuditFence,openAuditFence}=require('./runtime-operator-audit.cjs');
const {configuration}=require('./locked-runtime.cjs');
const {loadGrant,verifyGrantRedis,reserveGrant,issueGrant,installExaminationChannel}=require('./runtime-isolated-application.cjs');
const {resolveRuntimeRevision}=require('./runtime-revision.cjs');
const scopes={primary:['sessions','native-stores','runtime-journal','queue-runner'],'brain-worker':['sql-stores','redis-producer','visual-memory','queued-work'],'assurance-worker':['assurance-records','redis-producer'],'assurance-inspector':['assurance-records'],'startup-readback':['inference-readback']};
const group=pid=>Number(fs.readFileSync('/proc/'+pid+'/stat','utf8').split(') ')[1].split(' ')[2]);
function realRoles(cwd,env,source){
 const clean={...env,WORK8_REAL_GRAPH:'1',WORK8_SUPERVISED_OBSERVERS:'1',RAILWAY_GIT_COMMIT_SHA:source};
 for(const key of ['NODE_OPTIONS','NODE_PATH','LD_AUDIT','LD_PRELOAD','WORK8_MEMBERSHIP_ID','WORK8_MEMBERSHIP_NONCE','WORK8_MEMBERSHIP_ROLE'])delete clean[key];
 return Object.entries(scopes).map(([role,scope])=>{
  const entry=role==='startup-readback'?path.join(__dirname,'runtime-startup-readback.mjs'):role.startsWith('assurance-')?path.join(cwd,'backend/src/assurance',role==='assurance-worker'?'permanent-worker.mjs':'permanent-inspector.mjs'):path.join(cwd,'backend/dist/index.js');
  let environment={...clean};
  if(role==='brain-worker')Object.assign(environment,{EMPIRE_ROLE:'brain-worker',EMPIRE_TIER0_ISOLATION:'false',PORT:String(Number(env.EMPIRE_BRAIN_WORKER_PORT??Number(env.PORT)+1)),HOST:'127.0.0.1'});
  if(role.startsWith('assurance-'))environment={ASSURANCE_RUNTIME_ORIGIN:env.ASSURANCE_RUNTIME_ORIGIN,WORK8_REAL_GRAPH:'1'};
  return {role,entry,inheritOutput:true,nodeArgs:['--max-old-space-size=1536'],entrySha256:digest(fs.readFileSync(entry)),stateDirectory:path.dirname(env.DATABASE_PATH),scope,environment};
 });
}
async function main(){
 if(process.getuid()!==0||!process.connected||!process.send)throw Error('GUARDED_OPERATOR_REQUIRED');
 const env=configuration(process.env),cwd=path.resolve(__dirname,'..'),source=resolveRuntimeRevision(cwd,env.RAILWAY_GIT_COMMIT_SHA);
 env.RAILWAY_GIT_COMMIT_SHA=source;
 const journal=process.env.WORK8_CONTROLLER_JOURNAL_PATH,uid=Number(process.env.WORK8_RUNTIME_UID),gid=Number(process.env.WORK8_RUNTIME_GID);
 if(!journal||!path.isAbsolute(journal)||!Number.isInteger(uid)||uid<1||!Number.isInteger(gid)||gid<1)throw Error('OPERATOR_CONFIGURATION_REQUIRED');
 if(fs.existsSync(journal+'.emergency'))throw Error('PRIOR_EMERGENCY_REQUIRES_RECONCILIATION');
 const guard=processIdentity(process.ppid),guardEntry=path.join(__dirname,'launcher-loss-guard.cjs');
 if(!guard||guard.uids.some(x=>x!==0)||group('self')!==guard.pid||group(guard.pid)!==guard.pid)throw Error('GUARD_GROUP_IDENTITY_REFUSED');
 if(fs.readFileSync('/proc/'+guard.pid+'/cmdline','utf8').split('\0')[1]!==guardEntry)throw Error('GUARD_ENTRYPOINT_REFUSED');
 const isolation=prepareWriterIsolation({library:process.env.WORK8_WRITER_ISOLATION_LIBRARY,sha256:process.env.WORK8_WRITER_ISOLATION_SHA256,operatorUid:0});
 const stateDirectory=path.dirname(env.DATABASE_PATH),st=fs.statSync(stateDirectory);
 if(fs.realpathSync(stateDirectory)!==stateDirectory||st.uid!==uid||st.gid!==gid)throw Error('PREPARED_RUNTIME_STORE_REQUIRED');
 const generationEnv=Object.fromEntries(['EMPIRE_GENERATION_DIRECTORY','EMPIRE_GENERATION','EMPIRE_CUTOVER_DIGEST','EMPIRE_GENERATION_DEVICE','EMPIRE_GENERATION_INODE'].map(k=>[k,env[k]]));
 const examination=loadGrant(env.WORK8_ISOLATED_APPLICATION_GRANT,env);
 await verifyGrantRedis(examination,env);
 reserveGrant(examination);
 delete env.WORK8_ISOLATED_APPLICATION_GRANT;
 const initialize=!fs.existsSync(journal);
 const c=new MembershipController({journalPath:journal,initialize,runtimeUid:uid,runtimeGid:gid,source,generation:env.EMPIRE_GENERATION,generationEnv,roles:realRoles(cwd,env,source),volumeRoot:env.RAILWAY_VOLUME_MOUNT_PATH,redisUrl:env.REDIS_URL,writerIsolation:isolation,admissionExtension:examination?member=>member.role==='brain-worker'?issueGrant(examination,member):undefined:undefined});
 initializeAuditFence(journal,{initialize});
 const guardRecord={id:crypto.randomUUID(),role:'containment-guard',pid:guard.pid,startTicks:guard.startTicks,boot:guard.boot,pidNamespace:guard.pidNamespace,uid:0,gid:0,source,generation:env.EMPIRE_GENERATION,epoch:c.authority.epoch,cutoverDigest:c.authority.cutoverDigest,entrySha256:digest(fs.readFileSync(guardEntry)),scope:['containment-audit'],scopeDigest:digest(JSON.stringify(['containment-audit'])),storeRoot:stateDirectory,storeDevice:st.dev,storeInode:st.ino};
 c.journal.admit(guardRecord);
 let stopping=false,capture=null,stopObservers=()=>{};const quarantined=new Set();
 const fail=error=>{if(stopping)return;stopping=true;c.invalidate(error);process.exitCode=1;void c.stop().finally(()=>process.exit(1));};
 if(examination)c.on('admitted',member=>{if(member.role==='brain-worker')installExaminationChannel(examination,member,fail);});
 c.on('fault',error=>{if(!stopping)fail(error);});
 process.once('disconnect',()=>fail(Error('GUARD_DISCONNECTED')));
 const complete=()=>{
  const current=c.journal.read().members.filter(m=>m.state!=='TERMINATED');
  const expected=['containment-guard','primary','brain-worker','assurance-worker','assurance-inspector'];
  if(current.length!==expected.length||expected.some(role=>current.filter(m=>m.role===role).length!==1)||current.some(m=>{const p=processIdentity(m.pid);return !p||p.startTicks!==m.startTicks||p.state==='Z'||group(m.pid)!==guard.pid||m.generation!==env.EMPIRE_GENERATION;})||fs.existsSync(journal+'.emergency'))throw Error('COMPLETE_REAL_CENSUS_REQUIRED');
  return current;
 };
 const beginCapture=(member,m)=>{
  if(capture||c.phase!=='OPEN')throw Error('CAPTURE_ALREADY_ACTIVE');const members=complete(),releaseAudit=openAuditFence(journal);
  if(fs.existsSync(journal+'.emergency')){releaseAudit();throw Error('EMERGENCY_CAPTURE_REFUSED');}
  c.phase='CAPTURING';capture={id:m.id,member:member.id,releaseAudit};
  const journalRevision=c.journal.change(null,'CAPTURE_FROZEN',{capture:m.id,members:members.map(x=>x.id)},null);
  capture.receipt={schema:'work8-controller-capture-v1',source,generation:env.EMPIRE_GENERATION,journalRevision,captureId:m.id,members,guardMarkerAbsent:true,scope:'ACTUAL_DECLARED_GRAPH_ONLY',completeLiveState:false,bootAllowed:false};
  capture.timer=setTimeout(()=>fail(Error('REAL_CAPTURE_DEADLINE')),29000);
 };
 const captureReceipt=(member,m)=>{if(stopping||!capture||capture.id!==m.id||capture.member!==member.id||c.journal.read().revision!==capture.receipt.journalRevision)throw Error('CAPTURE_IDENTITY_REFUSED');complete();return capture.receipt;};
 const endCapture=(member,m)=>{
  captureReceipt(member,m);clearTimeout(capture.timer);capture.releaseAudit();capture=null;c.phase='OPEN';
 };
 c.on('memberExit',()=>{if(capture)fail(Error('CAPTURE_MEMBERSHIP_LOST'));});
 const startup=c.launch('startup-readback');await new Promise((resolve,reject)=>{startup.child.once('error',reject);startup.child.once('exit',(code,signal)=>code===0&&!signal?resolve():reject(Error('STARTUP_READBACK_FAILED')));});
 const primary=c.launch('primary');installBrainBroker(c,primary,{beginCapture,endCapture,captureReceipt,fail});
 stopObservers=superviseAssurance({cwd,env,spawnImpl(_command,args){const role=args[0].endsWith('/permanent-worker.mjs')?'assurance-worker':args[0].endsWith('/permanent-inspector.mjs')?'assurance-inspector':null;if(!role)throw Error('OBSERVER_ROLE_REFUSED');return c.launch(role).child;},onCaptureFailure:()=>fail(Error('OBSERVER_CAPTURE_LOST')),onEvent:event=>{
  console.log(JSON.stringify(event));if(event.event==='assurance_restart_quarantined'){
   quarantined.add(event.component);if(!quarantined.has('permanent-worker.mjs')||!quarantined.has('permanent-inspector.mjs'))return;
   const receipt={event:'assurance_coverage_containment',at:new Date().toISOString(),source,reason:'OBSERVER_QUARANTINED',action:'STOP_RUNTIME',recoveryVerified:false,commerce:'LOCKED',birth:'NOT_BORN'};
   console.log(JSON.stringify(receipt));fail(Error('OBSERVER_QUARANTINED'));
  }
 }});stopObservers.attachRuntime(primary.child);
 const shutdown=()=>{
  if(stopping)return;stopping=true;c.phase='STOPPING';
  const deadline=setTimeout(()=>{c.invalidate(Error('CONTROLLER_SHUTDOWN_DEADLINE'));process.exit(1);},20000);
  primary.child.once('exit',async(code,signal)=>{const observers=[...c.live.values()];const exited=Promise.all(observers.map(m=>new Promise(resolve=>m.child.once('exit',resolve))));stopObservers();await exited;await c.stop();clearTimeout(deadline);if(code!==0||signal){process.exit(1);return;}process.send({type:'runtime_drained',generation:env.EMPIRE_GENERATION,activeRuntimeWriters:0},()=>process.exit(0));});
  if(!primary.child.kill('SIGTERM')){clearTimeout(deadline);process.exit(1);}
 };
 process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
 primary.child.once('exit',()=>{if(!stopping)fail(Error('PRIMARY_EXITED'));});
 process.send({type:'controller_admitted',generation:env.EMPIRE_GENERATION,guard:guardRecord.id});
}
if(require.main===module)main().catch(error=>{console.error('Runtime writer controller refused:',error.message);process.exit(1);});
module.exports={main,realRoles};

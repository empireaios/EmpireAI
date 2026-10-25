'use strict';
const {spawn}=require('node:child_process');
const {valid}=require('./observer-capture.cjs');
const {recordContainment,settleAudit}=require('./containment-audit.cjs');
const {recordOperatorContainment}=require('./runtime-operator-audit.cjs');

// Separate process in the runtime process group. It does not depend on either
// observer or the launcher event loop to bound a disconnected/stalled launcher.
function drainedJournal(){
 const {MembershipJournal,processIdentity}=require('./runtime-membership-controller.cjs');
 let journal;try{journal=new MembershipJournal(process.env.WORK8_CONTROLLER_JOURNAL_PATH);const current=journal.read().members.filter(m=>m.state!=='TERMINATED');const identity=processIdentity(process.pid);return current.length===1&&current[0].role==='containment-guard'&&current[0].pid===process.pid&&current[0].startTicks===identity?.startTicks&&current[0].generation===process.env.EMPIRE_GENERATION&&current[0].source===process.env.RAILWAY_GIT_COMMIT_SHA;}catch{return false;}finally{journal?.close();}
}
function main(){
 const [leaseArg,graceArg,command,...args]=process.argv.slice(2);
 const leaseMs=Number(leaseArg),graceMs=Number(graceArg);
 if(!process.connected||!Number.isInteger(leaseMs)||leaseMs<50||leaseMs>60000||!Number.isInteger(graceMs)||graceMs<0||graceMs>20000||!command)throw Error('Invalid parent-loss guard configuration');
 const actual=process.env.WORK8_ACTUAL_WRITER_GRAPH==='1';
 if(actual&&(process.getuid()!==0||args[0]!==require('node:path').join(__dirname,'runtime-writer-controller.cjs')))throw Error('ACTUAL_CONTROLLER_REQUIRED');
 if(actual)require('./runtime-generation.cjs').acquireOperatorGuardLease({root:process.env.EMPIRE_GENERATION_DIRECTORY,expectedGeneration:process.env.EMPIRE_GENERATION,expectedSource:process.env.RAILWAY_GIT_COMMIT_SHA,cutoverDigest:process.env.EMPIRE_CUTOVER_DIGEST,expectedDevice:process.env.EMPIRE_GENERATION_DEVICE,expectedInode:process.env.EMPIRE_GENERATION_INODE,volumeRoot:process.env.RAILWAY_VOLUME_MOUNT_PATH,redisUrl:process.env.REDIS_URL});
 let leaseTimer,killTimer,stopping=false,parentLost=false,observerCapture=false,audit=Promise.resolve(),admitted=false,drained=false;
 const killGroup=()=>{try{process.kill(-process.pid,'SIGKILL');}catch{process.exit(1);}};
 const child=spawn(command,args,{env:process.env,stdio:['ignore','inherit','inherit','ipc']});
 const stop=(reason)=>{
  if(stopping&&reason==='signal')return;
  // Independent deadline is armed before any asynchronous audit operation.
  if(!stopping){stopping=true;clearTimeout(leaseTimer);child.kill('SIGTERM');killTimer=setTimeout(killGroup,graceMs);}
  if(reason!=='signal'&&!parentLost){
   parentLost=true;
   const receipt={event:'launcher_loss_containment',at:new Date().toISOString(),source:process.env.RAILWAY_GIT_COMMIT_SHA||null,reason,action:'STOP_RUNTIME_GROUP',recoveryVerified:false,commerce:'LOCKED',birth:'NOT_BORN'};
   audit=(actual?(admitted?recordOperatorContainment(process.env,receipt):Promise.resolve(false)):recordContainment(process.env,receipt)).then(auditPersisted=>console.log(JSON.stringify({...receipt,auditPersisted})));
  }

 };
 const renew=()=>{if(stopping)return;clearTimeout(leaseTimer);leaseTimer=setTimeout(()=>stop('LAUNCHER_LEASE_EXPIRED'),leaseMs);};
 process.on('message',message=>{if(message?.type==='launcher_progress')renew();else if(valid(message)&&child.connected){if(message.action==='released')observerCapture=false;child.send(message,()=>{});}});
 child.on('message',message=>{if(actual&&message?.type==='controller_admitted'&&message.generation===process.env.EMPIRE_GENERATION)admitted=true;
 if(actual&&message?.type==='runtime_drained'&&message.generation===process.env.EMPIRE_GENERATION&&message.activeRuntimeWriters===0&&admitted)drained=true;
 if(valid(message)&&process.connected){if(message.action==='acquire')observerCapture=true;process.send(message,()=>{});}});
 child.on('disconnect',()=>{if(observerCapture)stop('RUNTIME_DISCONNECTED');});
 process.on('disconnect',()=>stop('LAUNCHER_DISCONNECTED'));
 process.on('SIGTERM',()=>stop('signal'));process.on('SIGINT',()=>stop('signal'));
 child.once('error',()=>{clearTimeout(leaseTimer);clearTimeout(killTimer);process.exit(1);});
 child.once('exit',async(code,signal)=>{
  clearTimeout(leaseTimer);
  if(actual&&(!drained||code!==0||signal||!drainedJournal()))stop('CONTROLLER_EXITED');
  if(parentLost||actual&&(!drained||code!==0||signal||!drainedJournal())){await settleAudit(audit);killGroup();}
  clearTimeout(killTimer);
  process.exit(signal?1:(code??1));
 });
 renew();
}
if(require.main===module){try{main();}catch{console.error('Parent-loss guard refused startup');process.exitCode=1;}}


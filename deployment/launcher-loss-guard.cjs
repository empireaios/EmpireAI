'use strict';
const {spawn}=require('node:child_process');
const {recordContainment,settleAudit}=require('./containment-audit.cjs');

// Separate process in the runtime process group. It does not depend on either
// observer or the launcher event loop to bound a disconnected/stalled launcher.
function main(){
 const [leaseArg,graceArg,command,...args]=process.argv.slice(2);
 const leaseMs=Number(leaseArg),graceMs=Number(graceArg);
 if(!process.connected||!Number.isInteger(leaseMs)||leaseMs<50||leaseMs>60000||!Number.isInteger(graceMs)||graceMs<0||graceMs>20000||!command)throw Error('Invalid parent-loss guard configuration');
 let leaseTimer,killTimer,stopping=false,parentLost=false,audit=Promise.resolve();
 const killGroup=()=>{try{process.kill(-process.pid,'SIGKILL');}catch{process.exit(1);}};
 const child=spawn(command,args,{env:process.env,stdio:['ignore','inherit','inherit']});
 const stop=(reason)=>{
  if(stopping&&reason==='signal')return;
  if(reason!=='signal'&&!parentLost){
   parentLost=true;
   const receipt={event:'launcher_loss_containment',at:new Date().toISOString(),source:process.env.RAILWAY_GIT_COMMIT_SHA||null,reason,action:'STOP_RUNTIME_GROUP',recoveryVerified:false,commerce:'LOCKED',birth:'NOT_BORN'};
   audit=recordContainment(process.env,receipt).then(auditPersisted=>console.log(JSON.stringify({...receipt,auditPersisted})));
  }
  if(stopping)return;
  stopping=true;clearTimeout(leaseTimer);
  child.kill('SIGTERM');killTimer=setTimeout(killGroup,graceMs);
 };
 const renew=()=>{if(stopping)return;clearTimeout(leaseTimer);leaseTimer=setTimeout(()=>stop('LAUNCHER_LEASE_EXPIRED'),leaseMs);};
 process.on('message',message=>{if(message?.type==='launcher_progress')renew();});
 process.on('disconnect',()=>stop('LAUNCHER_DISCONNECTED'));
 process.on('SIGTERM',()=>stop('signal'));process.on('SIGINT',()=>stop('signal'));
 child.once('error',()=>{clearTimeout(leaseTimer);clearTimeout(killTimer);process.exit(1);});
 child.once('exit',async(code,signal)=>{
  clearTimeout(leaseTimer);
  if(parentLost){await settleAudit(audit);killGroup();}
  clearTimeout(killTimer);
  process.exit(signal?1:(code??1));
 });
 renew();
}
if(require.main===module){try{main();}catch{console.error('Parent-loss guard refused startup');process.exitCode=1;}}

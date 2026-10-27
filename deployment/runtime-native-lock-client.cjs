'use strict';
const {randomUUID}=require('node:crypto');
const protocol='work8-native-lock-client-v1';
async function command(action,scope,context){
 if(!process.connected||!process.send||!context||!context.captureId)throw Error('CONTROLLER_NATIVE_LOCK_REQUIRED');
 const request=randomUUID(),id=process.env.WORK8_MEMBERSHIP_ID,nonce=process.env.WORK8_MEMBERSHIP_NONCE,source=process.env.RAILWAY_GIT_COMMIT_SHA,generation=process.env.EMPIRE_GENERATION;
 // An uncertain lock state must never unwind application drains and reopen writes.
 const fatal=()=>process.kill(process.pid,'SIGKILL');
 return new Promise(resolve=>{
  const timer=setTimeout(fatal,5000);
  const receive=m=>{if(m?.protocol!==protocol)return;try{
   if(m.request!==request||m.id!==id||m.nonce!==nonce||m.source!==source||m.generation!==generation||m.capture!==context.captureId||m.scope!==scope||m.action!==(action==='acquire'?'held':'released'))throw Error('LOCK_ACK_REFUSED');
   clearTimeout(timer);process.off('message',receive);process.off('disconnect',fatal);resolve(m.membershipReceipt);
  }catch{fatal();}};
  process.on('message',receive);process.once('disconnect',fatal);
  process.send({protocol,id,nonce,source,generation,request,capture:context.captureId,scope,action},e=>{if(e)fatal();});
 });
}
module.exports={command};

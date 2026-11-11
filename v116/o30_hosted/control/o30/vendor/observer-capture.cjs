'use strict';
const {randomUUID}=require('node:crypto');
const protocol='work8-observer-capture-v1';
const valid=m=>m&&m.protocol===protocol&&typeof m.id==='string'&&/^[a-f0-9-]{36}$/.test(m.id);
// Acknowledgements never renew observer progress. A held participant skips work.
function installObserverParticipant(channel=process){
 const generation=randomUUID();let owner=null,active=0,ready=false;
 const send=action=>{if(channel.connected&&owner)channel.send({protocol,id:owner,action,generation},()=>{});};
 const drained=()=>{if(owner&&ready&&active===0)send('held');};
 channel.on('message',m=>{
  if(!valid(m))return;
  if(m.action==='acquire') {if(owner){send('refused');return;}owner=m.id;drained();}
  else if(m.action==='release'&&m.id===owner&&m.generation===generation){send('released');owner=null;}
 });
 const track=async work=>{active++;try{return await work();}finally{active--;drained();}};
 return {track,async run(work){if(owner)return false;await track(work);return true;},ready(){ready=true;drained();}};
}
async function withObserverCapture(capture){
 if(process.env.WORK8_SUPERVISED_OBSERVERS!=='1')return capture();
 if(!process.connected||!process.send)throw Error('OBSERVER_SUPERVISOR_IPC_REQUIRED');
 const id=randomUUID();let generation,failed,stage='acquire',resolveHeld,resolveReleased,rejectLost;
 const held=new Promise(r=>resolveHeld=r),released=new Promise(r=>resolveReleased=r),lost=new Promise((_,r)=>rejectLost=r);lost.catch(()=>{});
 const fail=()=>{failed=Error('OBSERVER_CAPTURE_LOST');rejectLost(failed);};
 const receive=m=>{if(!valid(m)||m.id!==id)return;if(m.action==='held'&&stage==='acquire'&&typeof m.generation==='string'){generation=m.generation;stage='held';resolveHeld();}else if(m.action==='released'&&stage==='release'&&m.generation===generation)resolveReleased();else fail();};
 process.on('message',receive);process.on('disconnect',fail);const timer=setTimeout(fail,22000);
 const send=action=>process.send({protocol,id,action,generation},e=>{if(e)fail();});
 try{send('acquire');await Promise.race([held,lost]);let result,error,caught=false;try{result=await capture();}catch(e){caught=true;error=e;}if(failed)throw failed;stage='release';send('release');await Promise.race([released,lost]);if(caught)throw error;return result;}
 finally{clearTimeout(timer);process.off('message',receive);process.off('disconnect',fail);}
}
module.exports={protocol,valid,installObserverParticipant,withObserverCapture};

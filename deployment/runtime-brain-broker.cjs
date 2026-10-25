'use strict';
const {randomUUID}=require('node:crypto');
const {processIdentity}=require('./runtime-membership-controller.cjs');
const PROTOCOL='work8-runtime-broker-v1';
const CAPTURE='work8-primary-capture-v1';
const uuid=x=>typeof x==='string'&&/^[a-f0-9-]{36}$/.test(x);
function installBrainBroker(controller,primary,{beginCapture,endCapture,captureReceipt,fail,inspect=processIdentity}){
 let active=null;
 const send=m=>{if(primary.child.connected)primary.child.send({protocol:PROTOCOL,...m},e=>{if(e)fail(e);});else fail(Error('PRIMARY_BROKER_DISCONNECTED'));};
 const ack=(m,ok,error)=>send({action:'ack',handle:m.handle,request:m.request,ok,error});
 const receive=m=>{
  if(!m||m.protocol!==PROTOCOL)return;
  try{
   if(!uuid(m.handle)||!uuid(m.request)||!primary.record)throw Error('BROKER_IDENTITY_REFUSED');
   if(m.action==='spawn'){
    if(active||controller.phase!=='OPEN')throw Error('BROKER_SPAWN_REFUSED');
    const admitted=record=>{send({action:'spawn',handle:m.handle,pid:record.pid});ack(m,true);};
    const member=controller.launch('brain-worker',{afterCommit:admitted});active={member,handle:m.handle};
    const exact=()=>active?.member===member;
    member.child.on('message',message=>{
     if(!exact()||!message||message.protocol!==CAPTURE)return;
     try{if(message.action==='acquire')beginCapture(member,message);
      send({action:'message',handle:m.handle,message});}catch(error){fail(error);}
    });
    member.child.once('disconnect',()=>{if(exact())send({action:'disconnect',handle:m.handle});});
    member.child.once('error',e=>fail(e));
    member.child.once('exit',(code,signal)=>{if(!exact())return;active=null;send({action:'exit',handle:m.handle,code,signal});});
    return;
   }
   if(!active||active.handle!==m.handle||!active.member.record)throw Error('BROKER_MEMBER_REFUSED');
   const child=active.member.child,p=inspect(child.pid);
   if(!p||p.startTicks!==active.member.record.startTicks)throw Error('BROKER_STALE_MEMBER');
   if(m.action==='signal'){
    if(!['SIGTERM','SIGKILL'].includes(m.signal))throw Error('BROKER_SIGNAL_REFUSED');
    ack(m,child.kill(m.signal));return;
   }
   if(m.action==='send'){
    const v=m.message;if(!v||v.protocol!==CAPTURE||!uuid(v.id)||!['held','released','refused'].includes(v.action))throw Error('BROKER_PAYLOAD_REFUSED');
    if(v.action==='held')v.membershipReceipt=captureReceipt(active.member,v);
    if(v.action==='released')endCapture(active.member,v);
    child.send(v,e=>ack(m,!e,e?'BROKER_SEND_FAILED':undefined));return;
   }
   throw Error('BROKER_ACTION_REFUSED');
  }catch(e){ack(m,false,e.message);fail(e);}
 };
 primary.child.on('message',receive);
 return ()=>primary.child.off('message',receive);
}
module.exports={installBrainBroker,PROTOCOL};

'use strict';
const {randomUUID}=require('node:crypto');
const {processIdentity}=require('./runtime-membership-controller.cjs');
const protocol='work8-native-lock-client-v1',holderProtocol='work8-native-lock-holder-v1';
const roles={missions:'native-mission-lock-holder',domains:'work8-domain-lock-holder'};
const uuid=x=>typeof x==='string'&&/^[a-f0-9-]{36}$/.test(x);
// Controller-only fixed scope broker. No client supplied paths, entries or endpoints.
function installNativeLockBroker(c,{getCapture,finalizeReceipt,fail,inspect=processIdentity}){
 const pending=new Map();
 const live=m=>{const p=inspect(m.child.pid);if(!m.record||!p||p.startTicks!==m.record.startTicks||p.state==='Z')throw Error('LOCK_MEMBER_STALE');};
 const send=(m,v)=>{if(!m.child.connected)throw Error('LOCK_IPC_LOST');m.child.send(v,e=>{if(e)fail(e);});};
 function receive(member,m){
  if(!m||![protocol,holderProtocol].includes(m.protocol))return;
  try{
   live(member);
   if(m.id!==member.id||m.nonce!==member.nonce||m.source!==c.source||m.generation!==c.generation||!uuid(m.capture)||!uuid(m.request))throw Error('LOCK_IDENTITY_REFUSED');
   const capture=getCapture();
   if(!capture||capture.id!==m.capture||capture.deadline<=Date.now()||c.phase!=='CAPTURING'||!capture.primaryDrained)throw Error('LOCK_CAPTURE_REFUSED');
   if(m.protocol===protocol){
    if(member.role!=='brain-worker'||capture.member!==member.id||pending.size||!Object.hasOwn(roles,m.scope)||!['acquire','release'].includes(m.action))throw Error('LOCK_REQUEST_REFUSED');
    capture.lockStack??=[];capture.lockPhase??='acquiring';capture.usedClientRequests??=new Set();
    if(capture.usedClientRequests.has(m.request))throw Error('LOCK_REQUEST_REUSED');capture.usedClientRequests.add(m.request);
    const stack=capture.lockStack;
    if(m.action==='acquire'&&(capture.lockPhase!=='acquiring'||(m.scope==='missions'?stack.length!==0:stack.length!==1||stack[0]!=='missions')))throw Error('LOCK_ORDER_REFUSED');
    if(m.action==='release'&&(stack.at(-1)!==m.scope||capture.lockPhase!=='held'&&capture.lockPhase!=='releasing'))throw Error('LOCK_RELEASE_ORDER_REFUSED');
    const holder=[...c.live.values()].find(x=>x.role===roles[m.scope]);if(!holder||!holder.ready)throw Error('LOCK_HOLDER_UNAVAILABLE');live(holder);
    const request=randomUUID();pending.set(request,{member,holder,clientRequest:m.request,scope:m.scope,action:m.action,capture:m.capture});
    send(holder,{protocol:holderProtocol,id:holder.id,nonce:holder.nonce,source:c.source,generation:c.generation,scope:m.scope,capture:m.capture,request,action:m.action,deadline:capture.deadline});
    return;
   }
   const p=pending.get(m.request);
   if(!p||p.holder!==member||m.scope!==p.scope||m.capture!==p.capture||m.deadline!==capture.deadline||m.action!==(p.action==='acquire'?'held':'released'))throw Error('LOCK_HOLDER_ACK_REFUSED');
   pending.delete(m.request);
   c.journal.state(member.id,p.action==='acquire'?'HELD':'READY',{basis:p.action==='acquire'?'DECLARED_PARTICIPANT_DRAIN_ACK':'DECLARED_PARTICIPANT_RELEASE_ACK',capture:capture.id});
   if(p.action==='acquire')capture.lockStack.push(p.scope);else{capture.lockPhase='releasing';capture.lockStack.pop();}
   let membershipReceipt;
   if(p.action==='acquire'&&p.scope==='domains'){capture.lockPhase='held';membershipReceipt=finalizeReceipt();}
   if(p.action==='release'&&capture.lockStack.length===0)capture.lockPhase='released';
   send(p.member,{protocol,id:p.member.id,nonce:p.member.nonce,source:c.source,generation:c.generation,capture:p.capture,request:p.clientRequest,scope:p.scope,action:m.action,...(membershipReceipt?{membershipReceipt}:{})});
  }catch(error){fail(error);}
 }
 c.on('admitted',member=>{member.child.on('message',m=>receive(member,m));member.child.once('disconnect',()=>{if(getCapture())fail(Error('LOCK_BROKER_DISCONNECTED'));});});
 return {pending};
}
module.exports={installNativeLockBroker};

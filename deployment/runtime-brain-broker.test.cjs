'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const {randomUUID}=require('node:crypto');
const {installBrainBroker,PROTOCOL}=require('./runtime-brain-broker.cjs');
// Unit transport model only; hosted process identity remains a mandatory separate assertion.
function setup(){
 const frames=[],faults=[];let commit,member,signalResult=true;
 const primary={record:{id:randomUUID()},child:new EventEmitter()};primary.child.connected=true;primary.child.send=(m,cb)=>{frames.push(m);cb?.();};
 const c={phase:'OPEN',launch(role,options){assert.equal(role,'brain-worker');commit=options.afterCommit;const child=new EventEmitter();child.pid=process.pid;child.connected=true;child.send=(message,cb)=>{child.sent=message;cb?.();};child.kill=()=>signalResult;member={id:randomUUID(),child,record:null};return member;}};
 let captures=0,releases=0;const receipt={captureId:'bound'};
 installBrainBroker(c,primary,{inspect:()=>({startTicks:'42'}),beginCapture(){captures++;},endCapture(){releases++;},captureReceipt(){return receipt;},fail:e=>faults.push(e.message)});
 const handle=randomUUID(),emit=(action,extra={})=>{const request=randomUUID();primary.child.emit('message',{protocol:PROTOCOL,handle,request,action,...extra});return request;};
 return {frames,faults,emit,handle,get member(){return member;},admit(){member.record={pid:process.pid,startTicks:'42'};commit(member.record);},setSignalResult(v){signalResult=v;},counts:()=>({captures,releases}),receipt};
}
test('broker returns no spawn or success before durable controller admission',()=>{
 const s=setup();s.emit('spawn');assert.equal(s.frames.length,0);s.admit();assert.deepEqual(s.frames.map(x=>x.action),['spawn','ack']);assert.equal(s.frames[1].ok,true);
});
test('broker acknowledges actual signal refusal and rejects caller-selected signals',()=>{
 const s=setup();s.emit('spawn');s.admit();s.setSignalResult(false);s.emit('signal',{signal:'SIGTERM'});assert.equal(s.frames.at(-1).ok,false);s.emit('signal',{signal:'SIGUSR2'});assert.equal(s.faults.at(-1),'BROKER_SIGNAL_REFUSED');
});
test('capture receipt is controller-supplied and tied to current child bridge',()=>{
 const s=setup();s.emit('spawn');s.admit();const id=randomUUID();s.member.child.emit('message',{protocol:'work8-primary-capture-v1',id,action:'acquire'});assert.equal(s.counts().captures,1);
 s.emit('send',{message:{protocol:'work8-primary-capture-v1',id,action:'held',membershipReceipt:{forged:true}}});assert.equal(s.member.child.sent.membershipReceipt,s.receipt);
 s.emit('send',{message:{protocol:'work8-primary-capture-v1',id,action:'released'}});assert.equal(s.counts().releases,1);
});
test('exit invalidates old handle and refuses replay into a replacement',()=>{
 const s=setup();s.emit('spawn');s.admit();s.member.child.emit('exit',0,null);assert.equal(s.frames.at(-1).action,'exit');s.emit('signal',{signal:'SIGKILL'});assert.equal(s.faults.at(-1),'BROKER_MEMBER_REFUSED');
});

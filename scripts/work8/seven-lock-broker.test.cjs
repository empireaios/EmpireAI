'use strict';
// Protocol-state examination with private-child doubles; real POSIX ownership
// is examined separately in seven-lock-boundary.test.cjs. No admission claim.
const test=require('node:test'),assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const {randomUUID}=require('node:crypto');
const {installNativeLockBroker}=require('../../deployment/runtime-native-lock-broker.cjs');
const CLIENT='work8-native-lock-client-v1',HOLDER='work8-native-lock-holder-v1';
function fixture(){
 const c=new EventEmitter();Object.assign(c,{source:'a'.repeat(40),generation:randomUUID(),phase:'CAPTURING',live:new Map()});
 const journal=[],failures=[],receipts=[];c.journal={state(...args){journal.push(args);}};
 let pid=100;
 function member(role){const m={id:randomUUID(),nonce:randomUUID(),role,ready:true,record:{startTicks:String(++pid)},child:new EventEmitter()};Object.assign(m.child,{pid,connected:true,sent:[],send(frame,callback){this.sent.push(frame);callback?.(null);}});c.live.set(m.id,m);return m;}
 const brain=member('brain-worker'),missions=member('native-mission-lock-holder'),domains=member('work8-domain-lock-holder');
 const capture={id:randomUUID(),member:brain.id,deadline:Date.now()+29000,primaryDrained:true};
 const broker=installNativeLockBroker(c,{getCapture:()=>capture,inspect:p=>({startTicks:String(p),state:'S'}),fail:e=>failures.push(e.message),finalizeReceipt(){const value={capture:capture.id,states:journal.map(x=>x[1])};receipts.push(value);return value;}});
 for(const m of c.live.values())c.emit('admitted',m);
 function request(scope,action='acquire',override={}){const m={protocol:CLIENT,id:brain.id,nonce:brain.nonce,source:c.source,generation:c.generation,capture:capture.id,request:randomUUID(),scope,action,...override};brain.child.emit('message',m);return m;}
 function ack(m,override={}){const sent=m.child.sent.at(-1);assert.ok(sent,'holder command missing');m.child.emit('message',{...sent,action:sent.action==='acquire'?'held':'released',...override});}
 return {c,capture,brain,missions,domains,request,ack,journal,failures,receipts,broker};
}
function hold(f){f.request('missions');f.ack(f.missions);f.request('domains');f.ack(f.domains);assert.deepEqual(f.failures,[]);}
test('both process acknowledgements required before final receipt; reverse release only',()=>{
 const f=fixture();f.request('missions');assert.equal(f.receipts.length,0);f.ack(f.missions);assert.equal(f.receipts.length,0);
 f.request('domains');assert.equal(f.receipts.length,0);f.ack(f.domains);
 assert.equal(f.receipts.length,1);assert.deepEqual(f.receipts[0].states,['HELD','HELD']);assert.equal(f.capture.lockPhase,'held');
 assert.equal(f.brain.child.sent.at(-1).membershipReceipt,f.receipts[0]);
 f.request('domains','release');f.ack(f.domains);assert.deepEqual(f.capture.lockStack,['missions']);assert.equal(f.capture.lockPhase,'releasing');
 f.request('missions','release');f.ack(f.missions);assert.equal(f.capture.lockPhase,'released');assert.deepEqual(f.capture.lockStack,[]);
 assert.deepEqual(f.journal.map(x=>x[1]),['HELD','HELD','READY','READY']);assert.equal(f.broker.pending.size,0);assert.deepEqual(f.failures,[]);
});
for(const [name,change]of [
 ['stale nonce',f=>({nonce:randomUUID()})],['stale generation',f=>({generation:randomUUID()})],
 ['stale capture',f=>({capture:randomUUID()})],['wrong source',f=>({source:'b'.repeat(40)})],
 ['unknown scope',f=>({scope:'arbitrary-file'})],['unknown command',f=>({action:'spawn'})],
])test(name+' refuses before holder command',()=>{const f=fixture();f.request('missions','acquire',change(f));assert.equal(f.failures.length,1);assert.equal(f.missions.child.sent.length,0);assert.equal(f.receipts.length,0);});
test('drain, phase and original deadline are mandatory',()=>{
 for(const mutate of [f=>{f.capture.primaryDrained=false;},f=>{f.c.phase='OPEN';},f=>{f.capture.deadline=Date.now()-1;}]){const f=fixture();mutate(f);f.request('missions');assert.deepEqual(f.failures,['LOCK_CAPTURE_REFUSED']);assert.equal(f.receipts.length,0);}
});
test('domain-before-mission, concurrent request and duplicate holder ACK fail closed',()=>{
 let f=fixture();f.request('domains');assert.deepEqual(f.failures,['LOCK_ORDER_REFUSED']);
 f=fixture();f.request('missions');f.request('domains');assert.deepEqual(f.failures,['LOCK_REQUEST_REFUSED']);assert.equal(f.receipts.length,0);
 f=fixture();f.request('missions');f.ack(f.missions);f.ack(f.missions);assert.deepEqual(f.failures,['LOCK_HOLDER_ACK_REFUSED']);assert.equal(f.receipts.length,0);
});
test('out-of-order release and reacquisition after hold are refused',()=>{
 let f=fixture();hold(f);f.request('missions','release');assert.deepEqual(f.failures,['LOCK_RELEASE_ORDER_REFUSED']);
 f=fixture();hold(f);f.request('missions');assert.deepEqual(f.failures,['LOCK_ORDER_REFUSED']);
});
test('forged ACK identity, deadline and responder cannot finalize receipt',()=>{
 for(const override of [{nonce:randomUUID()},{deadline:0},{scope:'domains'},{request:randomUUID()}]){const f=fixture();f.request('missions');f.ack(f.missions,override);assert.equal(f.failures.length,1);assert.equal(f.receipts.length,0);}
 const f=fixture();f.request('missions');const command=f.missions.child.sent[0];f.domains.child.emit('message',{...command,id:f.domains.id,nonce:f.domains.nonce,action:'held'});assert.deepEqual(f.failures,['LOCK_HOLDER_ACK_REFUSED']);
});
test('IPC disconnect during partial hold and send failure notify containment',()=>{
 let f=fixture();f.request('missions');f.ack(f.missions);f.domains.child.emit('disconnect');assert.deepEqual(f.failures,['LOCK_BROKER_DISCONNECTED']);assert.equal(f.receipts.length,0);
 f=fixture();f.missions.child.send=(_m,cb)=>cb(Error('synthetic send failure'));f.request('missions');assert.deepEqual(f.failures,['synthetic send failure']);assert.equal(f.receipts.length,0);
});
test('client request identity cannot be reused across valid phases',()=>{
 const f=fixture(),first=f.request('missions');f.ack(f.missions);f.request('domains','acquire',{request:first.request});
 assert.deepEqual(f.failures,['LOCK_REQUEST_REUSED']);assert.equal(f.receipts.length,0);
});

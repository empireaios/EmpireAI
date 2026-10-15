'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {EventEmitter}=require('node:events'),{spawn}=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{randomUUID}=require('node:crypto');
const {superviseAssurance}=require('./assurance-supervisor.cjs');
const {protocol}=require('./observer-capture.cjs');
const wait=(child,predicate)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{child.off('message',receive);reject(Error('message deadline'));},3000);const receive=m=>{if(predicate(m)){clearTimeout(timer);child.off('message',receive);resolve(m);}};child.on('message',receive);});
async function setup(t,options={}){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'observer-fence-')),file=path.join(root,'assurance.sqlite');
 const {AssuranceStore}=await import('../backend/src/assurance/independent-assurance.mjs');new AssuranceStore(file).close();
 const children=[],ready=[],events=[];let failures=0;
 const stop=superviseAssurance({cwd:path.resolve(__dirname,'..'),env:{PATH:process.env.PATH,ASSURANCE_RUNTIME_ORIGIN:'https://fixture.invalid'},onEvent:e=>events.push(e),onCaptureFailure:()=>failures++,captureTimeoutMs:2000,...options,
 spawnImpl:(command,args,opts)=>{const kind=args[0].includes('worker')?'worker':'inspector';const c=spawn(command,[path.join(__dirname,'fixtures/observer-capture-child.mjs')],{...opts,env:{PATH:process.env.PATH,OBSERVER_TEST_DATABASE:file,OBSERVER_TEST_KIND:kind}});children.push(c);ready.push(wait(c,m=>m.type==='ready'));return c;}});
 const runtime=new EventEmitter();runtime.connected=true;runtime.send=(m,cb)=>{runtime.emit('reply',m);cb?.();};stop.attachRuntime(runtime);
 t.after(()=>{stop();for(const c of children)c.kill('SIGKILL');fs.rmSync(root,{recursive:true,force:true});});await Promise.all(ready);
 const reply=()=>new Promise(resolve=>runtime.once('reply',resolve));
 return {children,runtime,file,events,failures:()=>failures,reply};
}
test('actual sibling cycles drain late SQLite/watchdog writes; held cycles skip without progress; release preserves generation',async t=>{
 const f=await setup(t),id=randomUUID();let replies=0;f.runtime.on('reply',()=>replies++);
 const active=wait(f.children[0],m=>m.type==='active');f.children[0].send({type:'cycle',id:'before',hold:true});await active;
 const inspectorActive=wait(f.children[1],m=>m.type==='active');f.children[1].send({type:'cycle',hold:true});await inspectorActive;
 const held=f.reply();f.runtime.emit('message',{protocol,id,action:'acquire'});await new Promise(r=>setTimeout(r,60));assert.equal(replies,0);
 const completed=wait(f.children[0],m=>m.type==='cycle-result');f.children[0].send({type:'continue'});await completed;assert.equal(replies,0);
 const inspected=wait(f.children[1],m=>m.type==='cycle-result');f.children[1].send({type:'continue'});await inspected;const ack=await held;assert.equal(ack.action,'held');
 const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync(f.file,{readOnly:true});try{assert.equal(db.prepare("SELECT count(*) n FROM assurance_cycles WHERE id='before'").get().n,1);}finally{db.close();}
 const sidecar=fs.readFileSync(f.file+'.watchdog');
 for(const c of f.children){const result=wait(c,m=>m.type==='cycle-result');c.send({type:'cycle',id:'forbidden'});assert.equal((await result).ran,false);}
 assert.deepEqual(fs.readFileSync(f.file+'.watchdog'),sidecar);
 const released=f.reply();f.runtime.emit('message',{protocol,id,action:'release',generation:ack.generation});assert.equal((await released).action,'released');
 const result=wait(f.children[1],m=>m.type==='cycle-result');f.children[1].send({type:'cycle',id:'after'});assert.equal((await result).ran,true);assert.ok(JSON.parse(fs.readFileSync(f.file+'.watchdog')).observedAt>0);assert.equal(f.failures(),0);
});
test('wrong release generation contains both actual observers without reopening',async t=>{
 const f=await setup(t),id=randomUUID(),held=f.reply();f.runtime.emit('message',{protocol,id,action:'acquire'});await held;
 f.runtime.emit('message',{protocol,id,action:'release',generation:randomUUID()});assert.equal(f.failures(),1);assert.ok(f.children.every(c=>c.killed));
});
test('active-cycle drain timeout is fail closed and capture acknowledgements do not renew stall watchdog',async t=>{
 const f=await setup(t,{captureTimeoutMs:100,stallMs:{'permanent-worker.mjs':5000,'permanent-inspector.mjs':5000}});
 const active=wait(f.children[0],m=>m.type==='active');f.children[0].send({type:'cycle',hold:true});await active;
 f.runtime.emit('message',{protocol,id:randomUUID(),action:'acquire'});await new Promise(r=>setTimeout(r,160));assert.equal(f.failures(),1);assert.ok(f.children.every(c=>c.killed));
});
test('requester disconnect while held contains actual observers',async t=>{
 const f=await setup(t),id=randomUUID(),held=f.reply();f.runtime.emit('message',{protocol,id,action:'acquire'});await held;f.runtime.emit('disconnect');assert.equal(f.failures(),1);assert.ok(f.children.every(c=>c.killed));
});
test('observer process loss while held refuses rather than substituting a new generation',async t=>{
 const f=await setup(t),id=randomUUID(),held=f.reply();f.runtime.emit('message',{protocol,id,action:'acquire'});await held;
 f.children[0].kill('SIGKILL');await new Promise(r=>setTimeout(r,100));assert.equal(f.failures(),1);assert.ok(f.children[1].killed);
});
test('held acknowledgement does not postpone existing no-progress containment',async t=>{
 const f=await setup(t,{captureTimeoutMs:2500,stallMs:{'permanent-worker.mjs':500,'permanent-inspector.mjs':500}}),id=randomUUID(),held=f.reply();
 f.runtime.emit('message',{protocol,id,action:'acquire'});await held;await new Promise(r=>setTimeout(r,550));assert.equal(f.failures(),1);assert.ok(f.events.some(e=>e.reason==='NO_PROGRESS'));
});
test('actual launcher and loss guard relay capture to both actual cycle fixtures',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'observer-chain-')),file=path.join(root,'assurance.sqlite');t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const {AssuranceStore}=await import('../backend/src/assurance/independent-assurance.mjs');new AssuranceStore(file).close();
 const {runSupervisedRuntime}=require('./locked-supervision.cjs');
 const script=`require(${JSON.stringify(path.join(__dirname,'observer-capture.cjs'))}).withObserverCapture(async()=>{console.log('CAPTURE_HELD');}).then(()=>{console.log('CAPTURE_RELEASED');process.disconnect();},e=>{console.error(e);process.exit(1);});`;
 const result=await runSupervisedRuntime({cwd:path.resolve(__dirname,'..'),env:{PATH:process.env.PATH,ASSURANCE_RUNTIME_ORIGIN:'https://fixture.invalid'},command:process.execPath,args:['-e',script],graceMs:500,stdio:'ignore',onEvent:()=>{},supervisorOptions:{spawnImpl:(command,args,opts)=>spawn(command,[path.join(__dirname,'fixtures/observer-capture-child.mjs')],{...opts,stdio:['ignore','ignore','ignore','ipc'],env:{PATH:process.env.PATH,OBSERVER_TEST_DATABASE:file,OBSERVER_TEST_KIND:args[0].includes('worker')?'worker':'inspector'}})}});
 assert.equal(result.code,0);assert.equal(result.coverageLost,false);assert.equal(result.forcedTermination,false);
});

test('timed-out actual cycle collector retains admission through its late durable write',async t=>{
 const f=await setup(t),id=randomUUID();let replies=0;f.runtime.on('reply',()=>replies++);
 const active=wait(f.children[0],m=>m.type==='collector-active'),completed=wait(f.children[0],m=>m.type==='cycle-result');f.children[0].send({type:'cycle',id:'late',late:true});await active;await completed;
 const held=f.reply();f.runtime.emit('message',{protocol,id,action:'acquire'});await new Promise(r=>setTimeout(r,50));assert.equal(replies,0);
 f.children[0].send({type:'settle-collector'});const ack=await held;assert.equal(ack.action,'held');
 const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync(f.file,{readOnly:true});try{assert.equal(db.prepare('SELECT value FROM late_collector').get().value,1);}finally{db.close();}
 const released=f.reply();f.runtime.emit('message',{protocol,id,action:'release',generation:ack.generation});await released;
});
test('actual supervised capture timeout surfaces containment and coverage loss',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'observer-loss-chain-')),file=path.join(root,'assurance.sqlite');t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const {AssuranceStore}=await import('../backend/src/assurance/independent-assurance.mjs');new AssuranceStore(file).close();
 const {runSupervisedRuntime}=require('./locked-supervision.cjs');const events=[];
 const script=`require(${JSON.stringify(path.join(__dirname,'observer-capture.cjs'))}).withObserverCapture(()=>new Promise(()=>{})).catch(()=>process.exit(1));`;
 const result=await runSupervisedRuntime({cwd:path.resolve(__dirname,'..'),env:{PATH:process.env.PATH,ASSURANCE_RUNTIME_ORIGIN:'https://fixture.invalid'},command:process.execPath,args:['-e',script],graceMs:300,stdio:'ignore',onEvent:e=>events.push(e),supervisorOptions:{captureTimeoutMs:500,spawnImpl:(command,args,opts)=>spawn(command,[path.join(__dirname,'fixtures/observer-capture-child.mjs')],{...opts,stdio:['ignore','ignore','ignore','ipc'],env:{PATH:process.env.PATH,OBSERVER_TEST_DATABASE:file,OBSERVER_TEST_KIND:args[0].includes('worker')?'worker':'inspector'}})}});
 assert.equal(result.coverageLost,true);assert.ok(events.some(e=>e.event==='assurance_capture_containment'&&e.reason==='OBSERVER_CAPTURE_FENCE_LOST'&&e.recoveryVerified===false&&e.action==='STOP_RUNTIME'));
});

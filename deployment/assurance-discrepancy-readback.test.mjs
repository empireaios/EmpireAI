import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawn,spawnSync} from 'node:child_process';
import {EventEmitter} from 'node:events';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {AssuranceStore,runAssuranceCycle,REQUIRED_DOMAINS} from '../backend/src/assurance/independent-assurance.mjs';
import {runSafeDiscrepancyProbe} from '../backend/src/assurance/safe-discrepancy-probe.mjs';
import {runInspectorPass} from '../backend/src/assurance/inspector-cycle.mjs';
const require=createRequire(import.meta.url);
const {protocol,digest,requestDiscrepancyReadback,readCommittedDiscrepancy,installDiscrepancyReader,createDiscrepancyRelay}=require('./assurance-discrepancy-readback.cjs');
const {installObserverParticipant}=require('./observer-capture.cjs');
const {superviseAssurance}=require('./assurance-supervisor.cjs');
const here=path.dirname(fileURLToPath(import.meta.url)),role=process.env.ASSURANCE_FIXTURE_ROLE;

if(role){
 const root=process.env.ASSURANCE_FIXTURE_ROOT,capture=installObserverParticipant();capture.ready();
 const denied=spawnSync(process.execPath,['-e','process.exit(0)']);
 process.send({fixture:'native-policy',role,pid:process.pid,denied:denied.error?.code==='EPERM'});
 process.once('disconnect',()=>process.exit());process.on('SIGTERM',()=>process.exit());
 if(role==='inspector'){
  installDiscrepancyReader({root,capture});
  process.on('message',async m=>{
   if(m.fixture!=='inspect-cycle')return;
   let verdict,error;
   try{await capture.run(()=>{verdict=runInspectorPass(path.join(root,m.database),m.now);});}catch(e){error=e.code||e.message;}
   process.send({fixture:'cycle-result',id:m.id,verdict,error,pid:process.pid});
  });
 }else{
  await capture.run(async()=>{
   const proof=await runSafeDiscrepancyProbe(root);
   const slot=Math.floor((Date.now()-120000)/300000)*300000,now=slot+120000;
   const collectors=Object.fromEntries(REQUIRED_DOMAINS.map(domain=>[domain,async()=>({origin:'independent-adapter',source:'controlled-fixture-file:'+domain,evidenceId:'fixture-'+domain,observedAt:now,authoritative:JSON.parse(fs.readFileSync(path.join(root,'authority',domain+'.json'))),internal:JSON.parse(fs.readFileSync(path.join(root,'internal',domain+'.json')))})]));
   for(const [database,omit] of [['healthy.sqlite',false],['missing.sqlite',true]]){
    const store=new AssuranceStore(path.join(root,database));
    try{const selected={...collectors};if(omit)delete selected.workers;
     await runAssuranceCycle(store,{id:'fixture',scheduledAt:slot,collectors:selected,maxAgeMs:1000,clock:()=>now,timeoutMs:1000});
    }finally{store.close();}
   }
   process.send({fixture:'producer-complete',proof,now,pid:process.pid});
  });
 }
}else{
 const {test}=await import('node:test');
 class Channel extends EventEmitter{constructor(pid){super();this.pid=pid;this.connected=true;this.sent=[];}send(m,cb){this.sent.push(m);cb?.();}}
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const wait=async(fn,ms=15000)=>{const end=Date.now()+ms;while(Date.now()<end){const v=fn();if(v)return v;await sleep(10);}throw Error('Fixture deadline');};
 test('isolated correction: actual independent readback and complete observer pass under unchanged no-descendant filter',{timeout:25000},async t=>{
  const library=process.env.ASSURANCE_ISOLATION_LIBRARY;
  assert.ok(library&&fs.statSync(library).isFile(),'explicit locally compiled unchanged native library required');
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'assurance-correction-'));
  for(const dir of ['commissioning','authority','internal'])fs.mkdirSync(path.join(root,dir));
  const forgedCache='{"schema":"isolated-assurance-discrepancy-v2","revision":"wrong-source","checks":{"reopenedInIndependentProcess":true}}';
  fs.writeFileSync(path.join(root,'commissioning','assurance-discrepancy-proof-v2.json'),forgedCache);
  // Different files represent independent authority and internal source surfaces.
  // They are controlled fixtures, never live provider or production evidence.
  for(const domain of REQUIRED_DOMAINS){for(const dir of ['authority','internal'])fs.writeFileSync(path.join(root,dir,domain+'.json'),JSON.stringify([{id:domain,value:'fixture-'+domain}]));}
  const messages=[],children=new Map();
  const stop=superviseAssurance({cwd:path.dirname(here),env:{PATH:process.env.PATH,RAILWAY_VOLUME_MOUNT_PATH:root,ASSURANCE_RUNTIME_ORIGIN:'https://isolated-fixture.invalid'},onEvent:()=>{},maxRestarts:0,spawnImpl:(exe,args,options)=>{
   const r=args[0].includes('permanent-worker')?'worker':'inspector';
   const child=spawn(exe,[fileURLToPath(import.meta.url)],{...options,env:{PATH:process.env.PATH,LD_PRELOAD:library,ASSURANCE_FIXTURE_ROLE:r,ASSURANCE_FIXTURE_ROOT:root},stdio:['ignore','ignore','pipe','ipc']});
   child.on('message',m=>messages.push(m));let stderr='';child.stderr.on('data',d=>stderr+=d);child.on('exit',(code)=>{if(code)messages.push({fixture:'failed',role:r,code,stderr});});children.set(r,child);return child;
  }});
  const inspect=async(database,now)=>{const id=randomUUID();children.get('inspector').send({fixture:'inspect-cycle',id,database,now});return wait(()=>messages.find(m=>m.id===id&&m.fixture==='cycle-result'));};
  try{
   const done=await wait(()=>{const fail=messages.find(m=>m.fixture==='failed');if(fail)throw Error(JSON.stringify(fail));return messages.find(m=>m.fixture==='producer-complete');});
   await t.test('both independent admitted fixture processes cannot spawn descendants',()=>{assert.equal(messages.filter(m=>m.fixture==='native-policy'&&m.denied).length,2);});
   await t.test('receipt bound to different actual process identities and new truthfully scoped v2 proof',()=>{
    assert.notEqual(children.get('worker').pid,children.get('inspector').pid);
    assert.equal(done.proof.readback.writerPid,children.get('worker').pid);assert.equal(done.proof.readback.readerPid,children.get('inspector').pid);
    assert.equal(done.proof.readback.freshProcessRestart,false);assert.equal(done.proof.schema,'isolated-assurance-discrepancy-v2');
    assert.equal(done.proof.checks.reopenedInIndependentProcess,true);assert.equal('reopenedInNewProcess' in done.proof.checks,false);
    assert.equal(fs.existsSync(path.join(root,'commissioning','assurance-discrepancy-proof-v1.json')),false);
   });
   await t.test('forged cached success cannot skip the fresh independent readback',()=>{
    assert.equal(fs.readFileSync(path.join(root,'commissioning','assurance-discrepancy-proof-v2.json'),'utf8'),forgedCache);
    const fresh=JSON.parse(fs.readFileSync(path.join(root,'commissioning','assurance-discrepancy-proof-v2-'+done.proof.readback.challenge+'.json')));
    assert.equal(fresh.readback.readerPid,children.get('inspector').pid);assert.equal(fresh.readback.writerPid,children.get('worker').pid);assert.notEqual(fresh.revision,'wrong-source');
   });
   await t.test('all thirteen controlled source reconciliations and actual inspector pass are healthy',async()=>{
    const result=await inspect('healthy.sqlite',done.now);assert.equal(result.error,undefined);assert.equal(result.verdict.status,'PASS');assert.equal(result.verdict.receipt.coverage.passed,13);assert.equal(result.verdict.receipt.liveProof,false);
    assert.equal(JSON.parse(fs.readFileSync(path.join(root,'healthy.sqlite.watchdog'))).status,'PASS');
   });
   await t.test('missing source stays NOT_CHECKED and full cycle degraded',async()=>{const result=await inspect('missing.sqlite',done.now);assert.equal(result.verdict.status,'DEGRADED');assert.equal(result.verdict.healthy,false);assert.equal(result.verdict.receipt.checks.workers.status,'NOT_CHECKED');});
   await t.test('failed actual observer pass does not renew heartbeat',async()=>{const result=await inspect('absent.sqlite',done.now);assert.ok(result.error);assert.equal(fs.existsSync(path.join(root,'absent.sqlite.watchdog')),false);});
   const id=done.proof.readback.challenge,expected=done.proof.readback.receiptDigest,filename=path.join(root,'commissioning','assurance-probe-'+id+'.sqlite');
   await t.test('closed committed source reads; wrong digest and traversal reject',()=>{assert.equal(readCommittedDiscrepancy(root,id,expected),expected);assert.throws(()=>readCommittedDiscrepancy(root,id,'0'.repeat(64)));assert.throws(()=>readCommittedDiscrepancy(root,'../outside',expected));});
   await t.test('symlink, hardlink and live journal sources reject',()=>{
    const target=filename+'.saved';fs.renameSync(filename,target);fs.symlinkSync(target,filename);assert.throws(()=>readCommittedDiscrepancy(root,id,expected));fs.unlinkSync(filename);fs.linkSync(target,filename);assert.throws(()=>readCommittedDiscrepancy(root,id,expected));fs.unlinkSync(filename);fs.renameSync(target,filename);
    fs.writeFileSync(filename+'-wal','unclosed');assert.throws(()=>readCommittedDiscrepancy(root,id,expected));fs.unlinkSync(filename+'-wal');
   });
   if(process.env.ASSURANCE_CORRECTION_RESULT)fs.writeFileSync(process.env.ASSURANCE_CORRECTION_RESULT,JSON.stringify({schema:'isolated-assurance-correction-proof-v1',node:process.version,scope:'controlled-fixture-module-proof',originalCandidateCI:false,productionHealth:false,liveProviderCoverage:false,freshProcessRestart:false,wholeRowsAccepted:[],nativeNoDescendantsBoth:true,inspectorPid:children.get('inspector').pid,writerPid:children.get('worker').pid,probe:done.proof,isolatedHealthyDomains:13},null,2)+'\n');
  }finally{stop();await Promise.all([...children.values()].map(child=>new Promise(resolve=>{if(child.exitCode!==null||child.signalCode!==null)return resolve();child.once('exit',resolve);setTimeout(()=>{child.kill('SIGKILL');resolve();},2000).unref();})));fs.rmSync(root,{recursive:true,force:true});}
 });
 test('controller identity, challenge, deadline, disconnect and capture refusals',{timeout:4000},async t=>{
  await t.test('worker spoof cannot certify; stale challenge cannot certify; exact inspector channel can',()=>{
   const relay=createDiscrepancyRelay(),w=new Channel(10),r=new Channel(20),id=randomUUID(),h='a'.repeat(64);relay.register('worker',w);relay.register('inspector',r);w.emit('message',{protocol,id,digest:h,action:'request'});assert.equal(r.sent.length,0);r.emit('message',{protocol,action:'ready'});assert.equal(r.sent[0].writerPid,10);
   w.emit('message',{protocol,id,digest:h,action:'observed',ok:true});r.emit('message',{protocol,id:randomUUID(),digest:h,action:'observed',ok:true});assert.equal(w.sent.length,0);r.emit('message',{protocol,id,digest:h,action:'observed',ok:true});assert.equal(w.sent[0].readerPid,20);assert.equal(w.sent[0].ok,true);relay.close();
  });
  await t.test('wrong digest, timeout, disconnected reader and same PID cannot certify',async()=>{
   for(const scenario of ['digest','timeout','disconnect','same-pid']){
    const relay=createDiscrepancyRelay({timeoutMs:20}),w=new Channel(10),r=new Channel(scenario==='same-pid'?10:20),id=randomUUID(),h='b'.repeat(64);relay.register('worker',w);relay.register('inspector',r);r.emit('message',{protocol,action:'ready'});w.emit('message',{protocol,id,digest:h,action:'request'});
    if(scenario==='digest')r.emit('message',{protocol,id,digest:'c'.repeat(64),action:'observed',ok:true});if(scenario==='disconnect')r.emit('disconnect');if(scenario==='timeout')await sleep(35);assert.equal(w.sent[0].ok,false,scenario);relay.close();
   }
  });
  await t.test('a completed challenge cannot be replayed',()=>{
   const relay=createDiscrepancyRelay(),w=new Channel(10),r=new Channel(20),id=randomUUID(),h='f'.repeat(64);relay.register('worker',w);relay.register('inspector',r);r.emit('message',{protocol,action:'ready'});
   w.emit('message',{protocol,id,digest:h,action:'request'});r.emit('message',{protocol,id,digest:h,action:'observed',ok:true});assert.equal(w.sent[0].ok,true);
   w.emit('message',{protocol,id,digest:h,action:'request'});r.emit('message',{protocol,id,digest:h,action:'observed',ok:true});assert.equal(w.sent.length,2);assert.equal(w.sent[1].ok,false);assert.equal(r.sent.length,1);relay.close();
  });
  await t.test('caller rejects forged same-process success and channel loss',async()=>{
   const c=new Channel(10),id=randomUUID(),h='d'.repeat(64);const p=requestDiscrepancyReadback({id,digest:h,channel:c,timeoutMs:50});c.emit('message',{protocol,id,digest:h,action:'result',ok:true,readerPid:process.pid});await assert.rejects(p);
   const d=new Channel(11),q=requestDiscrepancyReadback({id:randomUUID(),digest:h,channel:d,timeoutMs:50});d.emit('disconnect');await assert.rejects(q);
  });
  await t.test('capture hold refuses readback without opening source',async()=>{const c=new Channel(22),close=installDiscrepancyReader({root:'/no-source-is-opened',capture:{run:async()=>false},channel:c});c.emit('message',{protocol,id:randomUUID(),digest:'e'.repeat(64),action:'inspect',writerPid:process.pid+1});await sleep(0);assert.equal(c.sent.at(-1).ok,false);close();});
 });
}

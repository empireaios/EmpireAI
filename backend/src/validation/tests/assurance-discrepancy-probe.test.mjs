import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawn,spawnSync} from 'node:child_process';
import {runSafeDiscrepancyProbe} from '../../assurance/safe-discrepancy-probe.mjs';
const require=createRequire(import.meta.url);
const {installObserverParticipant}=require('../../../../deployment/observer-capture.cjs');
const {installDiscrepancyReader}=require('../../../../deployment/assurance-discrepancy-readback.cjs');
const {superviseAssurance}=require('../../../../deployment/assurance-supervisor.cjs');
const role=process.env.ASSURANCE_PROBE_TEST_ROLE;
if(role){
 const root=process.env.ASSURANCE_PROBE_TEST_ROOT,capture=installObserverParticipant();
 const denied=spawnSync(process.execPath,['--version']);
 assert.equal(denied.error?.code,'EPERM');
 process.send({fixture:'native-policy',role,pid:process.pid});
 let close=()=>{};
 process.on('SIGTERM',()=>{close();if(process.connected)process.disconnect();});
 process.once('disconnect',()=>process.exit(0));
 if(role==='inspector')close=installDiscrepancyReader({root,capture});
 capture.ready();
 if(role==='worker')await capture.run(async()=>{
  const first=await runSafeDiscrepancyProbe(root);
  const firstPath=path.join(root,'commissioning','assurance-discrepancy-proof-v2-'+first.readback.challenge+'.json');
  const firstBytes=fs.readFileSync(firstPath,'utf8');
  const second=await runSafeDiscrepancyProbe(root);
  assert.equal(fs.readFileSync(firstPath,'utf8'),firstBytes);
  process.send({fixture:'complete',first,second,firstBytes});
 });
}else{
 const {test}=await import('node:test');
 const filename=fileURLToPath(import.meta.url),cwd=path.resolve(path.dirname(filename),'../../../..');
 test('isolated probe requires fresh independent IPC readback on every invocation and preserves prior receipts',{timeout:15000},async()=>{
  const library=process.env.ASSURANCE_ISOLATION_LIBRARY;
  assert.ok(library&&fs.statSync(library).isFile(),'explicit unchanged native isolation library required');
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'assurance-probe-v2-'));
  const dir=path.join(root,'commissioning');fs.mkdirSync(dir);
  const legacy=JSON.stringify({schema:'isolated-assurance-discrepancy-v1',checks:{reopenedInNewProcess:true}});
  const forged=JSON.stringify({schema:'isolated-assurance-discrepancy-v2',checks:{reopenedInIndependentProcess:true},revision:'wrong'});
  fs.writeFileSync(path.join(dir,'assurance-discrepancy-proof-v1.json'),legacy);
  fs.writeFileSync(path.join(dir,'assurance-discrepancy-proof-v2.json'),forged);
  const children=new Map(),messages=[];
  let settle;
  const completed=new Promise((resolve,reject)=>{settle={resolve,reject};});
  const stop=superviseAssurance({cwd,env:{PATH:process.env.PATH,RAILWAY_VOLUME_MOUNT_PATH:root,ASSURANCE_RUNTIME_ORIGIN:'https://isolated-fixture.invalid'},maxRestarts:0,onEvent:()=>{},spawnImpl:(exe,args,options)=>{
   const r=args[0].includes('permanent-worker')?'worker':'inspector';
   const child=spawn(exe,[filename],{...options,env:{PATH:process.env.PATH,LD_PRELOAD:library,ASSURANCE_PROBE_TEST_ROLE:r,ASSURANCE_PROBE_TEST_ROOT:root},stdio:['ignore','ignore','pipe','ipc']});
   let stderr='';child.stderr.on('data',d=>{stderr+=d;if(stderr.length>32768)settle.reject(Error('Bounded diagnostic limit exceeded'));});
   child.on('message',m=>{messages.push(m);if(m.fixture==='complete')settle.resolve(m);});
   child.once('error',settle.reject);child.once('exit',code=>{if(code)settle.reject(Error('Probe fixture '+r+' exited '+code+': '+stderr));});
   children.set(r,child);return child;
  }});
  const deadline=setTimeout(()=>settle.reject(Error('Independent probe IPC deadline')),10000);
  try{
   const done=await completed;
   assert.equal(messages.filter(m=>m.fixture==='native-policy').length,2);
   const first=done.first,second=done.second;
   assert.notEqual(first.readback.challenge,second.readback.challenge);
   assert.notEqual(children.get('worker').pid,children.get('inspector').pid);
   for(const proof of [first,second]){
    assert.equal(proof.schema,'isolated-assurance-discrepancy-v2');
    assert.equal(proof.checks.reopenedInIndependentProcess,true);
    assert.equal(proof.checks.freshProcessRestart,false);
    assert.equal(proof.checks.runtimeDiscrepancy,'FAIL');assert.equal(proof.checks.unavailableCollector,'SOURCE_UNAVAILABLE');
    assert.equal(proof.checks.staleEvidence,'STALE');assert.equal(proof.checks.authorityDiscrepancy,'FAIL');
    assert.equal(proof.checks.interruptedCycle,'ASSURANCE_OVERDUE');assert.equal(proof.checks.missedCycle,'ASSURANCE_OVERDUE');
    assert.equal('reopenedInNewProcess' in proof.checks,false);
    assert.equal(proof.readback.writerPid,children.get('worker').pid);
    assert.equal(proof.readback.readerPid,children.get('inspector').pid);
    assert.equal(proof.productionRecordsMutated,0);assert.equal(proof.inferenceCalls,0);assert.equal(proof.commerceWrites,0);
    const saved=JSON.parse(fs.readFileSync(path.join(dir,'assurance-discrepancy-proof-v2-'+proof.readback.challenge+'.json'),'utf8'));
    assert.deepEqual(saved,proof);
   }
   assert.equal(fs.readFileSync(path.join(dir,'assurance-discrepancy-proof-v2-'+first.readback.challenge+'.json'),'utf8'),done.firstBytes);
   assert.equal(fs.readFileSync(path.join(dir,'assurance-discrepancy-proof-v1.json'),'utf8'),legacy);
   assert.equal(fs.readFileSync(path.join(dir,'assurance-discrepancy-proof-v2.json'),'utf8'),forged);
  }finally{
   clearTimeout(deadline);stop();
   await Promise.all([...children.values()].map(child=>new Promise(resolve=>{if(child.exitCode!==null||child.signalCode!==null)return resolve();const timer=setTimeout(()=>{child.kill('SIGKILL');},2000);child.once('exit',()=>{clearTimeout(timer);resolve();});})));
   fs.rmSync(root,{recursive:true,force:true});
  }
 });
 test('historical proof cannot supply success when independent IPC readback is unavailable',{timeout:5000},async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'assurance-probe-no-ipc-'));const dir=path.join(root,'commissioning');fs.mkdirSync(dir);
  const saved=JSON.stringify({schema:'isolated-assurance-discrepancy-v1',checks:{reopenedInNewProcess:true}});
  fs.writeFileSync(path.join(dir,'assurance-discrepancy-proof-v1.json'),saved);
  try{
   await assert.rejects(runSafeDiscrepancyProbe(root),/Readback channel unavailable/);
   assert.equal(fs.readFileSync(path.join(dir,'assurance-discrepancy-proof-v1.json'),'utf8'),saved);
   assert.equal(fs.readdirSync(dir).filter(n=>/^assurance-discrepancy-proof-v2-/.test(n)).length,0);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
 });
}

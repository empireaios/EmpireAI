import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {AssuranceStore,REQUIRED_DOMAINS} from '../../assurance/independent-assurance.mjs';
import {readOwnerAssurance,recordOwnerAssurance} from '../../assurance/owner-evidence.mjs';
test('durable incidents survive observer restart, resolve only on subsequent PASS, and stale monitors fail closed',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'assurance-owner-')),file=path.join(dir,'assurance.sqlite');
 try{
  const store=new AssuranceStore(file);const checks=Object.fromEntries(REQUIRED_DOMAINS.map(d=>[d,{status:'PASS',observedAt:300000}]));
  store.begin('one',300000,300000);store.complete('one',301000,{...checks,runtime:{status:'FAIL',missing:1}});
  fs.writeFileSync(file+'.watchdog',JSON.stringify({observedAt:430000}));
  const a=recordOwnerAssurance(file,430000);assert.equal(a.status,'DEGRADED');assert.equal(a.findings.find(f=>f.source==='runtime').status,'OPEN');
  store.begin('two',600000,600000);store.complete('two',601000,checks);store.close();
  fs.writeFileSync(file+'.watchdog',JSON.stringify({observedAt:730000}));
  const b=recordOwnerAssurance(file,730000);assert.equal(b.status,'PASS');assert.equal(b.findings.find(f=>f.source==='runtime').status,'RESOLVED');
  const c=recordOwnerAssurance(file,1030000);assert.equal(c.status,'ASSURANCE_OVERDUE');assert.equal(c.findings.filter(f=>f.status==='OPEN').length,2);
  const d=recordOwnerAssurance(file,1030001);assert.equal(d.findings.find(f=>f.source==='cycle-monitor').first_at,1030000);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
import {changeDemo,observeDemo,readDemo} from '../../assurance/owner-demo.mjs';
import {DatabaseSync} from 'node:sqlite';
import {execFileSync} from 'node:child_process';
test('isolated demonstration needs independent observation and preserves healthy failure recovery history',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'assurance-demo-')),file=path.join(dir,'demo.sqlite');
 try{observeDemo(file,1000);changeDemo(file,'inject',2000);assert.equal(readDemo(file).history[0].status,'HEALTHY');observeDemo(file,3000);assert.equal(readDemo(file).history[0].status,'DEGRADED');changeDemo(file,'correct',4000);observeDemo(file,5000);assert.deepEqual(readDemo(file).history.map(x=>x.status),['HEALTHY','DEGRADED','HEALTHY']);assert.throws(()=>changeDemo(file,'buy'));}finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('independent process persists discrepancy finding before owner reads and retains resolution across restart',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'assurance-finding-')),file=path.join(dir,'assurance.sqlite');
 const module=new URL('../../assurance/owner-demo.mjs',import.meta.url).href;
 const observe=now=>execFileSync(process.execPath,['--input-type=module','-e',`import {observeDemo} from ${JSON.stringify(module)};observeDemo(${JSON.stringify(file)},${now});`]);
 const findings=()=>{const db=new DatabaseSync(file,{readOnly:true});try{return db.prepare("SELECT * FROM assurance_findings WHERE source='isolated-demonstration'").all();}finally{db.close();}};
 try{
   observe(1000);changeDemo(file,'inject',2000);observe(3000);
   const open=findings();assert.equal(open.length,1);assert.equal(open[0].status,'OPEN');assert.equal(open[0].severity,'HIGH');
   assert.equal(open[0].first_at,3000);assert.equal(JSON.parse(open[0].detail).sourceChangedAt,2000);
   observe(3500);assert.deepEqual(findings(),open);
   changeDemo(file,'correct',4000);assert.equal(findings()[0].status,'OPEN');
   observe(5000);const resolved=findings()[0];assert.equal(resolved.id,open[0].id);assert.equal(resolved.status,'RESOLVED');assert.equal(resolved.resolved_at,5000);
   observe(6000);assert.deepEqual(findings()[0],resolved);
   changeDemo(file,'inject',7000);observe(8000);assert.equal(findings().length,2);assert.equal(findings().filter(f=>f.status==='OPEN').length,1);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

import {runInspectorPass} from '../../assurance/inspector-cycle.mjs';
test('failed observer cannot renew heartbeat and dead watchdog makes fresh cycle non-healthy',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'assurance-heartbeat-')),file=path.join(dir,'assurance.sqlite');
 try{
   const store=new AssuranceStore(file),checks=Object.fromEntries(REQUIRED_DOMAINS.map(d=>[d,{status:'PASS',observedAt:300000}]));
   store.begin('good',300000,300000);store.complete('good',301000,checks);store.close();
   runInspectorPass(file,430000);assert.equal(readOwnerAssurance(file,430001).healthy,true);
   const heartbeat=fs.readFileSync(file+'.watchdog','utf8');
   const db=new DatabaseSync(file);db.exec('DROP TABLE assurance_demo_source; CREATE TABLE assurance_demo_source(broken INTEGER)');db.close();
   assert.throws(()=>runInspectorPass(file,450000));assert.equal(fs.readFileSync(file+'.watchdog','utf8'),heartbeat);
   const overdue=readOwnerAssurance(file,520001);assert.equal(overdue.status,'ASSURANCE_OVERDUE');assert.equal(overdue.healthy,false);assert.equal(overdue.watchdog.fresh,false);
   assert.equal(overdue.healthy,false); // A read exposes staleness but cannot write an incident on behalf of a dead observer.
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

 test('owner readbacks cannot mutate durable evidence even when freshness expires',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'assurance-readonly-')),file=path.join(dir,'assurance.sqlite');
 try{
 const store=new AssuranceStore(file),checks=Object.fromEntries(REQUIRED_DOMAINS.map(d=>[d,{status:'PASS',observedAt:300000}]));
 store.begin('good',300000,300000);store.complete('good',301000,checks);store.close();runInspectorPass(file,430000);
 const before=fs.readFileSync(file); const first=readOwnerAssurance(file,430001);
 assert.equal(first.healthy,true); const stale=readOwnerAssurance(file,1030000);
 assert.equal(stale.healthy,false);assert.equal(stale.status,'ASSURANCE_OVERDUE');
 assert.deepEqual(stale.findings,first.findings);assert.deepEqual(fs.readFileSync(file),before);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
 });

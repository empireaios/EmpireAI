import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {AssuranceStore,REQUIRED_DOMAINS} from '../../assurance/independent-assurance.mjs';
import {readOwnerAssurance} from '../../assurance/owner-evidence.mjs';
test('durable incidents survive observer restart, resolve only on subsequent PASS, and stale monitors fail closed',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'assurance-owner-')),file=path.join(dir,'assurance.sqlite');
 try{
  const store=new AssuranceStore(file);const checks=Object.fromEntries(REQUIRED_DOMAINS.map(d=>[d,{status:'PASS',observedAt:300000}]));
  store.begin('one',300000,300000);store.complete('one',301000,{...checks,runtime:{status:'FAIL',missing:1}});
  fs.writeFileSync(file+'.watchdog',JSON.stringify({observedAt:430000}));
  const a=readOwnerAssurance(file,430000);assert.equal(a.status,'DEGRADED');assert.equal(a.findings.find(f=>f.source==='runtime').status,'OPEN');
  store.begin('two',600000,600000);store.complete('two',601000,checks);store.close();
  fs.writeFileSync(file+'.watchdog',JSON.stringify({observedAt:730000}));
  const b=readOwnerAssurance(file,730000);assert.equal(b.status,'PASS');assert.equal(b.findings.find(f=>f.source==='runtime').status,'RESOLVED');
  const c=readOwnerAssurance(file,1030000);assert.equal(c.status,'ASSURANCE_OVERDUE');assert.equal(c.findings.filter(f=>f.status==='OPEN').length,2);
  const d=readOwnerAssurance(file,1030001);assert.equal(d.findings.find(f=>f.source==='cycle-monitor').first_at,1030000);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

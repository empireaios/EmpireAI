import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {AssuranceStore,REQUIRED_DOMAINS} from '../../assurance/independent-assurance.mjs';
import {readCurrentAssuranceTruth} from '../../assurance/current-state-provenance.mjs';
import {recordOwnerAssurance,readOwnerAssurance} from '../../assurance/owner-evidence.mjs';
function fixture(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'stage2-provenance-')),file=path.join(dir,'assurance.sqlite');
 const store=new AssuranceStore(file);
 const checks=Object.fromEntries(REQUIRED_DOMAINS.map((d,i)=>[d,{status:i<4?'PASS':'NOT_CHECKED',observedAt:300000}]));
 store.begin('cycle-one',300000,300000);store.complete('cycle-one',301000,checks);
 fs.writeFileSync(file+'.watchdog',JSON.stringify({observedAt:430000}));
 return {file,store,checks,close(){store.close();fs.rmSync(dir,{recursive:true,force:true});}};
}
test('current count names its independent metric and source; a read does not refresh source time',()=>{
 const f=fixture();try{
  const before=fs.readFileSync(f.file),a=readCurrentAssuranceTruth(f.file,430000),b=readCurrentAssuranceTruth(f.file,440000);
  assert.equal(a.status,'CURRENT');assert.equal(a.passed,4);assert.equal(a.total,13);
  assert.equal(a.metric,'independent_assurance_domains');assert.equal(a.evidenceReference,'cycle-one');
  assert.equal(a.observedAt,301000);assert.equal(b.observedAt,a.observedAt);assert.notEqual(b.readAt,a.readAt);
  assert.equal(a.grantsAuthority,false);assert.deepEqual(fs.readFileSync(f.file),before);
 }finally{f.close();}
});
test('stale watchdog, missing due cycle and lost store cannot inherit a historical count',()=>{
 const f=fixture();try{
  const stale=readCurrentAssuranceTruth(f.file,520001);assert.equal(stale.status,'STALE');assert.equal(stale.passed,null);
  const missed=readCurrentAssuranceTruth(f.file,730000);assert.equal(missed.status,'ASSURANCE_OVERDUE');assert.equal(missed.passed,null);
  assert.equal(readCurrentAssuranceTruth(f.file+'.missing',430000).status,'SOURCE_UNAVAILABLE');
 }finally{f.close();}
});
test('conflicting coverage is withheld, independently recorded, and cannot resolve on unknown',()=>{
 const f=fixture();try{
  const row=f.store.db.prepare('SELECT receipt FROM assurance_cycles WHERE id=?').get('cycle-one');
  const receipt=JSON.parse(row.receipt);receipt.coverage.passed=2;
  f.store.db.prepare('UPDATE assurance_cycles SET receipt=? WHERE id=?').run(JSON.stringify(receipt),'cycle-one');
  assert.equal(readCurrentAssuranceTruth(f.file,430000).status,'CONFLICT');
  const a=recordOwnerAssurance(f.file,430000);assert.equal(a.currentTruth.passed,null);
  assert.equal(a.findings.find(x=>x.source==='current-state-provenance').status,'OPEN');
  recordOwnerAssurance(f.file,730000);
  assert.equal(readOwnerAssurance(f.file,730000).findings.find(x=>x.source==='current-state-provenance').status,'OPEN');
  f.store.begin('cycle-two',600000,600000);f.store.complete('cycle-two',601000,f.checks);
  fs.writeFileSync(f.file+'.watchdog',JSON.stringify({observedAt:730000}));
  const b=recordOwnerAssurance(f.file,730000);
  assert.equal(b.currentTruth.evidenceReference,'cycle-two');assert.equal(b.currentTruth.passed,4);
  assert.equal(b.findings.find(x=>x.source==='current-state-provenance').status,'RESOLVED');
 }finally{f.close();}
});
test('a new process recovers current source identity from disk without memory or cache',()=>{
 const f=fixture();try{
  const url=new URL('../../assurance/current-state-provenance.mjs',import.meta.url).href;
  const result=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',`import {readCurrentAssuranceTruth} from ${JSON.stringify(url)};console.log(JSON.stringify(readCurrentAssuranceTruth(${JSON.stringify(f.file)},430000)));`],{encoding:'utf8'}));
  assert.deepEqual(result,readCurrentAssuranceTruth(f.file,430000));
 }finally{f.close();}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {AssuranceStore,REQUIRED_DOMAINS} from '../../assurance/independent-assurance.mjs';
import {closureHealthBlockers,currentMissionDomains} from '../../assurance/closure-health.mjs';
test('closure requires current independent coverage, no unresolved severe incident, and no active release',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'closure-')),filename=path.join(dir,'assurance.sqlite');
 const s={monitor:{fresh:true},paused:{paused:false},incidents:[],lease:null};
 try{
  assert.deepEqual(closureHealthBlockers(s,filename,420000),['INDEPENDENT_COVERAGE_NOT_VERIFIED']);
  const db=new AssuranceStore(filename);db.begin('cycle',300000,300000);db.complete('cycle',300001,Object.fromEntries(REQUIRED_DOMAINS.map(d=>[d,{status:'PASS'}])));db.close();
  assert.deepEqual(closureHealthBlockers(s,filename,420000),[]);
  assert.ok(closureHealthBlockers({...s,incidents:[{severity:'HIGH',status:'UNRESOLVED'}]},filename,420000).includes('UNRESOLVED_HIGH_SEVERITY_INCIDENTS'));
  assert.ok(closureHealthBlockers({...s,lease:{status:'ACTIVE'}},filename,420000).includes('DEPLOYMENT_IN_PROGRESS'));
  assert.ok(closureHealthBlockers({...s,monitor:{fresh:false}},filename,420000).includes('CURRENT_MONITOR_UNVERIFIED'));
  assert.ok(closureHealthBlockers(s,filename,720000).includes('INDEPENDENT_COVERAGE_NOT_VERIFIED'));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('future Work scope is not a healthy claim or an exemption for actual discrepancies',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'closure-scope-')),filename=path.join(dir,'assurance.sqlite');
 const state={monitor:{fresh:true},paused:{paused:false},incidents:[],lease:null};
 const db=new AssuranceStore(filename);
 try{
  const checks=Object.fromEntries(REQUIRED_DOMAINS.map(d=>[d,{status:currentMissionDomains.includes(d)?'PASS':'NOT_CHECKED'}]));
  db.begin('first',300000,300000);assert.equal(db.complete('first',300001,checks).healthy,false);
  assert.deepEqual(closureHealthBlockers(state,filename,420000),[]);
  db.begin('second',600000,600000);db.complete('second',600001,{...checks,'money-transactions':{status:'FAIL'}});
  assert.ok(closureHealthBlockers(state,filename,720000).includes('INDEPENDENT_DISCREPANCY_UNRESOLVED'));
 }finally{db.close();fs.rmSync(dir,{recursive:true,force:true});}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {inCohort,assertExternal} from './hh4-outer-cohort.mjs';
import {createHh4OuterCohort} from './hh4-outer-cohort.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
test('nested cgroup remains in scope; textual sibling does not',()=>{
  assert.equal(inCohort('0::/docker/test/child\n','0::/docker/test\n'),true);
  assert.equal(inCohort('0::/docker/test-other\n','0::/docker/test\n'),false);
});
test('root cgroup cannot establish independent containment',()=>{
  assert.throws(()=>inCohort('0::/anything\n','0::/\n'),/NONISOLATED_CGROUP/);
});
test('external controller in nested tested cgroup is refused',()=>{
  assert.throws(()=>assertExternal({pid:10,cgroup:'0::/docker/test/controller\n'},{pid:11,cgroup:'0::/docker/test\n'}),/CONTROLLER_INSIDE_TESTED_COHORT/);
});
test('all v1 hierarchy memberships must agree',()=>{
  assert.equal(inCohort('1:cpu:/a\n2:memory:/different\n','1:cpu:/a\n2:memory:/a\n'),false);
  assert.equal(inCohort('1:cpu:/a/child\n2:memory:/a/child\n','1:cpu:/a\n2:memory:/a\n'),true);
});
test('uncertain create is resolved by known name and label; failed containment remains retryable',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hh4-docker-transport-test-'));
  const bin=path.join(dir,'bin'),evidenceRoot=path.join(dir,'evidence'),state=path.join(dir,'state.json');
  fs.mkdirSync(bin);fs.mkdirSync(evidenceRoot);
  const imageId='sha256:'+'a'.repeat(64),source='b'.repeat(40),oldPath=process.env.PATH;
  fs.writeFileSync(path.join(bin,'docker'),'#!'+process.execPath+'\n'+`
const fs=require('fs'),args=process.argv.slice(2),file=${JSON.stringify(state)};
if(args[0]==='create'){
 const name=args[args.indexOf('--name')+1];
 fs.writeFileSync(file,JSON.stringify({Id:'c'.repeat(64),Name:'/'+name,Image:${JSON.stringify(imageId)},Config:{Labels:{'work8.hh4':name}},State:{Running:false,Pid:0}}));
 console.error('simulated lost create acknowledgement');process.exit(1);
}
if(args[0]==='inspect'){
 if(!fs.existsSync(file+'.attempt')){fs.writeFileSync(file+'.attempt','1');console.error('simulated temporary inspect transport failure');process.exit(1);}
 console.log(JSON.stringify([JSON.parse(fs.readFileSync(file))]));
}else if(args[0]==='logs')console.log('retained diagnostics');
`,{mode:0o700});
  process.env.PATH=bin+path.delimiter+oldPath;
  try{
    const cohort=createHh4OuterCohort({imageId,source,evidenceRoot});
    await assert.rejects(cohort.start(),/simulated lost create acknowledgement/);
    await assert.rejects(cohort.contain('START_FAILED'),/simulated temporary inspect transport failure/);
    assert.equal(JSON.parse(fs.readFileSync(path.join(evidenceRoot,'cohort-containment-failure-1.json'))).retryPermitted,true);
    const receipt=await cohort.contain('RETRY_TRANSPORT_FAILURE');
    assert.equal(receipt.id,'c'.repeat(64));assert.deepEqual(receipt.survivors,[]);
    await assert.rejects(cohort.start(),/COHORT_CANNOT_RESTART/);
  }finally{process.env.PATH=oldPath;fs.rmSync(dir,{recursive:true,force:true});}
});

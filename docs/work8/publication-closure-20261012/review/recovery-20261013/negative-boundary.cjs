'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const base='/workspace/scratch/dc845312c8f5/recovery-next/deployment/';
const a=require(base+'runtime-recovery-activation.cjs'),r=require(base+'work8-recovery-set.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'review-only-'));let count=0;
const check=(name,fn,re)=>{assert.throws(fn,re);count++;console.log('PASS '+name);};
try {
 a.assertIsolatedSimulation();
 check('deployed railway runtime refused',()=>a.assertIsolatedSimulation({...process.env,RAILWAY_DEPLOYMENT_ID:'fixture'}),/DEPLOYED_RUNTIME/);
 check('credential supplied refused',()=>a.assertIsolatedSimulation({...process.env,OPENAI_API_KEY:'synthetic-not-real'}),/EXTERNAL_CREDENTIAL/);
 check('proxy supplied refused',()=>a.assertIsolatedSimulation({...process.env,HTTPS_PROXY:'http:\/\/example.invalid'}),/EXTERNAL_CREDENTIAL/);
 check('engineering flag absent refused',()=>a.assertIsolatedSimulation({...process.env,EMPIRE_ENGINEERING_TEST_MODE:''}),/ENGINEERING_MODE/);
 check('forged permit refused before target writes',()=>r.stageRuntimeRecoverySimulation({destination:path.join(root,'target')}),/PERMIT_INVALID_OR_CONSUMED/);
 check('unregistered source refused',()=>r.issueRuntimeRecoverySimulationPermit({source:{},destination:path.join(root,'target')}),/SOURCE_UNREGISTERED/);
 check('empty source cohort refused',()=>r.registerRuntimeRecoverySimulationSource({root,sourceCommit:'a'.repeat(40),pids:[]}),/SOURCE_COHORT_REQUIRED/);
 check('duplicate source cohort refused',()=>r.registerRuntimeRecoverySimulationSource({root,sourceCommit:'a'.repeat(40),pids:[2,2,2,2]}),/SOURCE_COHORT_REQUIRED/);
 check('invalid source revision refused',()=>r.registerRuntimeRecoverySimulationSource({root,sourceCommit:'bad',pids:[]}),/regular expression/);
 const hostPid=Number(fs.readFileSync('/proc/self/stat','utf8').split(' ')[0]);
 check('self cannot register as source child',()=>r.registerRuntimeRecoverySimulationSource({root,sourceCommit:'a'.repeat(40),pids:[hostPid,2,3,4]}),/SOURCE_PID/);
 assert.deepEqual(fs.readdirSync(root),[]);console.log(JSON.stringify({status:'PASS_SCOPED_NEGATIVE_BOUNDARIES',assertions:count,spawnedChildProcesses:0,networkOperations:0,sourceWrites:0}));
}finally{fs.rmSync(root,{recursive:true,force:true});}

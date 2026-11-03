import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
import {createChildDiagnosticCollector} from './child-diagnostic-collector.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url)),membershipPath=path.resolve(process.argv[2]??''),output=path.resolve(process.argv[3]??'');
assert.equal(process.version,'v22.23.2','EXACT_NODE_VERSION_REQUIRED');assert.ok(output.endsWith('.json'));
const sha=x=>createHash('sha256').update(x).digest('hex'),rows=[];
for(const mode of ['protected-entrypoint','system-errno','untrusted-message']){
 let record=null,stdout='',stderr='';const collector=createChildDiagnosticCollector(value=>{record=value;});
 const child=spawn(process.execPath,[path.join(dir,'child-startup-fixture.cjs'),mode,membershipPath],{env:{PATH:process.env.PATH,HOME:'/tmp'},stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',bytes=>{stdout+=bytes;collector.push('stdout',bytes.toString('utf8'));});child.stderr.on('data',bytes=>{stderr+=bytes;collector.push('stderr',bytes.toString('utf8'));});
 const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});collector.finish();
 assert.equal(code,1);assert.ok(record,'ACTUAL_CHILD_CAUSAL_RECORD_REQUIRED');assert.equal(record.origin.pid,child.pid);assert.equal(record.identity.pid,child.pid);assert.notEqual(record.identity.pid,process.pid);assert.equal(record.origin.parentPid,process.pid);assert.match(record.origin.startTicks,/^[0-9]+$/);assert.equal(record.origin.role,'startup-readback');
 if(mode==='protected-entrypoint'){assert.equal(record.assertion,'OPERATOR_PATH_NOT_PROTECTED');assert.equal(record.errno,null);assert.ok(record.sourceFrames.some(x=>x.startsWith('runtime-membership-controller.cjs:')));}
 if(mode==='system-errno'){assert.equal(record.errno,'ENOENT');assert.equal(record.assertion,'ENOENT');}
 if(mode==='untrusted-message'){assert.equal(record.assertion,'UNCLASSIFIED_NATIVE_STARTUP_ERROR');assert.ok(!JSON.stringify(record).includes('AK'+'IA'+'A'.repeat(16)));assert.equal(record.errno,null);assert.ok(collector.summary().unclassifiedLinesOmitted>=1);}
 assert.equal(stderr.split('WORK8_NATIVE_FIRST_FAILURE ').length-1,1,'LATER_FAILURE_REPLACED_FIRST');
 rows.push({mode,status:'PASS',record,childExitCode:code,rawStdoutSha256:sha(stdout),rawStderrSha256:sha(stderr),rawOutputRetained:false,collector:collector.summary()});
}
// The real collector must keep stdout and stderr fragments separate.
const line='WORK8_NATIVE_FIRST_FAILURE '+JSON.stringify(rows[0].record)+'\n';let framed=null;const mixed=createChildDiagnosticCollector(value=>{framed=value;});mixed.push('stderr',line.slice(0,71));mixed.push('stdout','private arbitrary output\n');mixed.push('stderr',line.slice(71));mixed.finish();assert.equal(framed.assertion,'OPERATOR_PATH_NOT_PROTECTED');
const receipt={schema:'work8-v32-child-startup-selftest-v1',status:'PASS_CHILD_STARTUP_CAUSE_PROPAGATION',scope:'CONTROLLED_REAL_CHILD_PROCESS_FAILURES_NOT_NATIVE_APPLICATION_ACCEPTANCE',node:process.version,fixtures:rows,separateStreamFragmentation:'PASS',firstFailureImmutable:'PASS',originalProtectedPathInvoked:true,nativeApplicationStarted:false,applicationAuthorityExpanded:false,rawPrivateOutputRetained:false,sourceHashes:Object.fromEntries(['child-startup-diagnostic.cjs','child-startup-fixture.cjs','child-startup-selftest.mjs','child-diagnostic-collector.mjs','native-diagnostic.mjs','native-diagnostic-codes.json','startup-overlays.json'].map(name=>[name,sha(fs.readFileSync(path.join(dir,name)))]))};
fs.writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{mode:0o600});console.log(JSON.stringify({status:receipt.status,fixtures:rows.length,rawOutputRetained:false}));

// Deterministic source/startup ordering controls, never native A5 acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {createAssuranceStartupPrerequisite,captureAssuranceArtifacts,compareAssuranceArtifacts,safeAssuranceStartupFailure} from './assurance-artifact-inventory.mjs';

const sha=x=>createHash('sha256').update(x).digest('hex');
const source='6c1e63ba20619ee480742fd87dc810ca93152e22';
const ids=['12345678-1234-4123-8123-123456789abc','12345678-1234-4123-8123-123456789abd'];
function fixture(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'v99-assurance-source-'));fs.mkdirSync(path.join(root,'commissioning'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;}
function names(root,id=ids[0]){return {database:path.join(root,'commissioning','assurance-probe-'+id+'.sqlite'),proof:path.join(root,'commissioning','assurance-discrepancy-proof-v2-'+id+'.json')};}
function createProbe(root,id=ids[0]){
 const files=names(root,id),receipt=JSON.stringify({schema:'independent-assurance-cycle-v1',healthy:false,liveProof:false,checks:{runtime:{status:'FAIL'},workers:{status:'SOURCE_UNAVAILABLE'},scheduler:{status:'STALE'},'authority-spending':{status:'FAIL'}}});
 const db=new DatabaseSync(files.database);db.exec('CREATE TABLE assurance_cycles(id TEXT PRIMARY KEY,completed_at INTEGER,receipt TEXT)');db.prepare('INSERT INTO assurance_cycles VALUES(?,?,?)').run('discrepancy',1,receipt);db.close();
 const body={schema:'isolated-assurance-discrepancy-v2',revision:source,isolatedSyntheticSource:true,productionRecordsMutated:0,inferenceCalls:0,commerceWrites:0,pillowSelfReportUsed:false,checks:{runtimeDiscrepancy:'FAIL',unavailableCollector:'SOURCE_UNAVAILABLE',staleEvidence:'STALE',authorityDiscrepancy:'FAIL',interruptedCycle:'ASSURANCE_OVERDUE',missedCycle:'ASSURANCE_OVERDUE',reopenedInIndependentProcess:true,freshProcessRestart:false},readback:{challenge:id,receiptDigest:sha(receipt),writerPid:100,readerPid:101,scope:'existing-independent-process-committed-readback',freshProcessRestart:false}};
 return {files,body,publish:()=>fs.writeFileSync(files.proof,JSON.stringify(body),{mode:0o600,flag:'wx'})};
}
function actualUntil({at=0,deadline=1000,poll}={}){
 const sourceText=fs.readFileSync(new URL('./coordinator.mjs',import.meta.url),'utf8');
 const functionText=sourceText.split('\n').find(line=>line.startsWith('async function until('));
 assert.ok(functionText);
 const clock={now:()=>at};
 const context={assert,Date:clock,Math,deadline,runtime:undefined,runtimeClosed:Promise.resolve(),childDiagnostics:{finish(){}},pause:async ms=>{at+=ms;poll?.(at);}};
 vm.createContext(context);vm.runInContext(functionText,context);
 return {until:context.until,now:()=>at};
}

test('Brain-ready before Assurance pair stays pending and signals readiness once after complete pair',async t=>{
 const root=fixture(t),observe=createAssuranceStartupPrerequisite(root);let ready=0,pair,observed;
 const clock=actualUntil({deadline:1000,poll:at=>{if(at===50)pair=createProbe(root);if(at===100)fs.writeFileSync(pair.files.proof,'{"schema":');if(at===150)fs.writeFileSync(pair.files.proof,JSON.stringify(pair.body));}});
 await clock.until(()=>{observed=observe();assert.equal(ready,0);return observed!==null;},'ACTUAL_NATIVE_STARTUP_DEADLINE',500);ready++;
 assert.equal(clock.now(),150);assert.equal(ready,1);assert.equal(observed.pairCount,1);assert.equal(observed.source,source);assert.equal(observed.wholeApplicationSnapshot,false);assert.equal(observed.healthAcceptance,false);assert.deepEqual(observed.wholeRowsAccepted,[]);
});

test('missing pair and permanently partial proof expire at the existing deadline',async t=>{
 for(const partial of [false,true]){
  const root=fixture(t);if(partial){const p=createProbe(root);fs.writeFileSync(p.files.proof,'{"schema":');}
  const observe=createAssuranceStartupPrerequisite(root),clock=actualUntil({deadline:1000});
  await assert.rejects(clock.until(()=>observe()!==null,'ACTUAL_NATIVE_STARTUP_DEADLINE',150),/ACTUAL_NATIVE_STARTUP_DEADLINE/);assert.equal(clock.now(),150);
 }
});

test('published wrong source, malformed claims and independent reader mismatch fail immediately',t=>{
 for(const mutation of [b=>b.revision='f'.repeat(40),b=>b.schema='wrong',b=>b.readback.readerPid=b.readback.writerPid,b=>b.commerceWrites=1,b=>b.checks.reopenedInIndependentProcess=false,b=>b.readback.receiptDigest='b'.repeat(64)]){
  const root=fixture(t),p=createProbe(root);mutation(p.body);p.publish();assert.throws(()=>createAssuranceStartupPrerequisite(root)());
 }
});

test('orphan proof, undeclared names, symlink and hardlink never qualify',t=>{
 for(const mutation of ['orphan','name','symlink','hardlink']){
  const root=fixture(t),p=createProbe(root);p.publish();
  if(mutation==='orphan')fs.unlinkSync(p.files.database);
  if(mutation==='name')fs.renameSync(p.files.proof,p.files.proof+'.pending');
  if(mutation==='symlink'){fs.renameSync(p.files.proof,path.join(root,'saved-proof'));fs.symlinkSync(path.join(root,'saved-proof'),p.files.proof);}
  if(mutation==='hardlink')fs.linkSync(p.files.proof,path.join(root,'extra-link'));
  assert.throws(()=>createAssuranceStartupPrerequisite(root)());
 }
});

test('nonregular unfinished probe is a defect rather than pending readiness',t=>{
 const root=fixture(t),file=names(root).database;fs.mkdirSync(file);assert.throws(()=>createAssuranceStartupPrerequisite(root)(),/ASSURANCE_ARTIFACT_FILE_REFUSED/);
});

test('committed database corruption and nonempty journals fail closed',t=>{
 for(const mutation of ['database','journal']){
  const root=fixture(t),p=createProbe(root);p.publish();
  if(mutation==='database')fs.writeFileSync(p.files.database,'not a sqlite database');
  else fs.writeFileSync(p.files.database+'-journal','uncommitted');
  assert.throws(()=>createAssuranceStartupPrerequisite(root)());
 }
});

test('completed pair remains immutable while another legitimate pair is pending',t=>{
 for(const mutation of ['proof','database','deletion']){
  const root=fixture(t),p=createProbe(root);p.publish();createProbe(root,ids[1]);const observe=createAssuranceStartupPrerequisite(root);assert.equal(observe(),null);
  if(mutation==='proof'){p.body.extra='changed';fs.writeFileSync(p.files.proof,JSON.stringify(p.body));}
  if(mutation==='database'){const db=new DatabaseSync(p.files.database);db.exec('CREATE TABLE changed(x INTEGER)');db.close();}
  if(mutation==='deletion')fs.unlinkSync(p.files.proof);
  assert.throws(observe,/COMMITTED_ASSURANCE_PROBE_OR_PROOF_CHANGED/);
 }
});

test('unchanged full inventory still independently validates and preserves all pairs',t=>{
 const root=fixture(t);for(const id of ids){const p=createProbe(root,id);p.publish();}
 const before=captureAssuranceArtifacts(root),startup=createAssuranceStartupPrerequisite(root)(),after=captureAssuranceArtifacts(root);
 assert.equal(startup.pairCount,2);assert.equal(startup.logicalSha256,sha(JSON.stringify(before)));assert.deepEqual(after,before);assert.equal(compareAssuranceArtifacts(before,after).preserved,2);
});

test('coordinator gate uses the original startup deadline before capture permission',()=>{
 const text=fs.readFileSync(new URL('./coordinator.mjs',import.meta.url),'utf8');
 const brain=text.indexOf("write('live-brain-ready.json',brainReady)");
 const prerequisite=text.indexOf('const assurancePrerequisite=createAssuranceStartupPrerequisite(p.volume)');
 const ready=text.indexOf("signal('runtime-ready.json')");
 const capture=text.indexOf("path.join(control,'capture-live-brain.json')");
 assert.ok(brain<prerequisite&&prerequisite<ready&&ready<capture);
 const gate=text.slice(prerequisite,ready);assert.ok(gate.includes("'ACTUAL_NATIVE_STARTUP_DEADLINE',startupDeadline"));assert.ok(!gate.includes('Date.now()+'));assert.ok(gate.includes('assuranceStartup!==null'));
});

test('causal diagnostic retains safe source frames while stripping arbitrary protected values',t=>{
 const error=new Error('secret-canary assertion value Bearer protected-value');error.code='EACCES';
 error.stack='Error: secret-canary\n at read (/protected/secret-canary/assurance-artifact-inventory.mjs:51:7)\n at private (/secret-canary.js:99:3)';
 const receipt=safeAssuranceStartupFailure(error),encoded=JSON.stringify(receipt);
 assert.equal(receipt.code,'ASSURANCE_PROOF_CONTRACT_REFUSED');assert.equal(receipt.errno,'EACCES');assert.deepEqual(receipt.sourceFrames,['assurance-artifact-inventory.mjs:51:7']);
 assert.equal(receipt.sourceSHA256,sha(fs.readFileSync(new URL('./assurance-artifact-inventory.mjs',import.meta.url))));assert.ok(!encoded.includes('secret-canary'));assert.ok(!encoded.includes('Bearer'));assert.ok(!encoded.includes('/protected/'));
 let actual;try{assert.equal('secret-canary-left','secret-canary-right','ASSURANCE_PROOF_DATABASE_DIGEST_MISMATCH');}catch(error){actual=error;}
 assert.ok(actual.message.includes('\n'));const literal=safeAssuranceStartupFailure(actual);assert.equal(literal.code,'ASSURANCE_PROOF_DATABASE_DIGEST_MISMATCH');assert.equal(literal.rawRecordsRetained,false);assert.ok(!JSON.stringify(literal).includes('secret-canary'));
 const root=fixture(t),pair=createProbe(root);pair.body.readback.receiptDigest='b'.repeat(64);pair.publish();
 let databaseError;try{createAssuranceStartupPrerequisite(root)();}catch(error){databaseError=error;}
 const databaseFailure=safeAssuranceStartupFailure(databaseError);assert.equal(databaseFailure.code,'ASSURANCE_PROOF_DATABASE_DIGEST_MISMATCH');assert.ok(databaseFailure.sourceFrames.length>0);assert.ok(!JSON.stringify(databaseFailure).includes('b'.repeat(64)));
});

test('actual coordinator observation records phase before error and preserves first cause immutably',()=>{
 const text=fs.readFileSync(new URL('./coordinator.mjs',import.meta.url),'utf8'),start=text.indexOf(' const observeAssuranceStartup=()=>{'),end=text.indexOf('\n await until(observeAssuranceStartup',start);
 assert.ok(start>0&&end>start);const updates=[],receipt={actualNativeApplication:true};let invocations=0;
 const context={receipt,assuranceStartup:null,startupDeadline:1000,startupMetadata:()=>({source}),Date,Error,safeAssuranceStartupFailure,write:(name,value)=>updates.push({name,value:structuredClone(value)}),assurancePrerequisite:()=>{invocations++;assert.equal(updates.at(-1).value.phase,'REQUIRED_ASSURANCE_ARTIFACTS');throw Error('ASSURANCE_PROOF_DATABASE_DIGEST_MISMATCH');}};
 vm.createContext(context);vm.runInContext(text.slice(start,end)+'\n globalThis.observe=observeAssuranceStartup;',context);
 assert.throws(context.observe,/INVALID_ASSURANCE_COMPLETION/);const first=JSON.stringify(receipt.assuranceStartupFailure),writes=updates.length;
 assert.equal(receipt.actualNativeApplication,true);assert.equal(updates.at(-1).value.assuranceStartupFailure.code,'ASSURANCE_PROOF_DATABASE_DIGEST_MISMATCH');
 assert.throws(context.observe,/INVALID_ASSURANCE_COMPLETION/);assert.equal(invocations,1);assert.equal(updates.length,writes);assert.equal(JSON.stringify(receipt.assuranceStartupFailure),first);
 const codes=JSON.parse(fs.readFileSync(new URL('./native-diagnostic-codes.json',import.meta.url))).codes;
 for(const code of ['NATIVE_APPLICATION_READINESS','ACTUAL_NATIVE_STARTUP_DEADLINE','INVALID_ASSURANCE_COMPLETION'])assert.ok(codes.includes(code));
});

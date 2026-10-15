import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {DatabaseSync} from 'node:sqlite';
import system from '../../../../deployment/work8-system-vault.cjs';import legacy from '../../../../deployment/legacy-checkpoint-capture.cjs';import shadow from '../../../../deployment/legacy-shadow-state-capture.cjs';import sets from '../../../../deployment/work8-recovery-set.cjs';
import {spawnSync} from 'node:child_process';
test('composed recovery set binds nine stores, primary, native mission ledger/execution and inert authority evidence',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'recovery-set-')),root=path.join(dir,'source'),sourceCommit='a'.repeat(40);fs.mkdirSync(root);
 const sql=(file,statements)=>{fs.mkdirSync(path.dirname(file),{recursive:true});const db=new DatabaseSync(file);db.exec(statements);db.close();};
 try{
  for(const relative of Object.values(system.STORES))sql(path.join(root,relative),'PRAGMA journal_mode=WAL; CREATE TABLE evidence(id TEXT)');
  const modern=system.captureSystem({root,destination:path.join(dir,'modern'),sourceCommit});
  const parts={system:{directory:modern.directory,digest:modern.digest}};
  for(const [name,ddl] of Object.entries({brain:'CREATE TABLE business(id TEXT); INSERT INTO business VALUES(\'retained-order\')',missions:'PRAGMA application_id=1162695506; PRAGMA user_version=3; CREATE TABLE mission_snapshot(id TEXT)',execution:'PRAGMA application_id=1162691928; PRAGMA user_version=1; CREATE TABLE execution_events(id TEXT); CREATE TABLE execution_jobs(id TEXT); CREATE TABLE execution_meta(id TEXT)'})){
   const file=path.join(root,name+'.sqlite');sql(file,ddl);const p=legacy.captureCheckpoint({source:file,destination:path.join(dir,name),sourceCommit});parts[name]={directory:p.directory,digest:p.manifestSha256};
  }
  // Values are copied from the existing native capture identity contract, not guessed source schemas.
  assert.equal(0x454d5352,1162695506);assert.equal(0x454d4558,1162691928);
  const dataDir=path.join(root,'shadow');fs.mkdirSync(dataDir);sql(path.join(dataDir,'shadow-ceo.db'),'PRAGMA journal_mode=WAL; CREATE TABLE evidence(id TEXT)');
  fs.writeFileSync(path.join(dataDir,'shadow-ceo-request-owners.json'),JSON.stringify({request:'owner'}));const authorityFile=path.join(root,'authority.json');fs.writeFileSync(authorityFile,JSON.stringify({historicalGrant:'must-not-activate'}));
  const old=shadow.captureLegacyShadowDisk({dataDir,authorityFile,destination:path.join(dir,'shadow-copy'),sourceCommit,volumeRoot:dir});parts.shadow={directory:old.directory,digest:old.manifestSha256};
  const a=sets.createRecoverySet({parts,destination:path.join(dir,'set-a'),sourceCommit,frontendRevision:'b'.repeat(40)});assert.equal(sets.verifyRecoverySet(a).bootAllowed,false);assert.equal(sets.verifyRecoverySet(a).completeLiveState,false);
  const independent=spawnSync(process.execPath,['-e',"const m=require(process.argv[1]).verifyRecoverySet({directory:process.argv[2],digest:process.argv[3]});if(m.bootAllowed!==false)process.exit(2)",new URL('../../../../deployment/work8-recovery-set.cjs',import.meta.url).pathname,a.directory,a.digest],{encoding:'utf8',timeout:5000});assert.equal(independent.status,0,independent.stderr);
  assert.equal(Object.keys(a.manifest.parts).length,5);assert.ok(a.manifest.captureWindowMs>=0);
  const b=sets.createRecoverySet({parts,destination:path.join(dir,'set-b'),sourceCommit,frontendRevision:'c'.repeat(40),parentDigest:a.digest});
  assert.equal(sets.selectRecoveryPoint({checkpoints:[a,b],trustedHead:b.digest,at:'2099-01-01T00:00:00Z'}).digest,b.digest);
  assert.throws(()=>sets.selectRecoveryPoint({checkpoints:[b],trustedHead:b.digest,at:'2099-01-01T00:00:00Z'}),/MISSING_ANCESTOR/);
  assert.throws(()=>sets.createRecoverySet({parts,destination:path.join(dir,'bad'),sourceCommit:'d'.repeat(40),frontendRevision:'b'.repeat(40)}));assert.equal(fs.existsSync(path.join(dir,'bad')),false);
  fs.appendFileSync(path.join(dir,'set-b','shadow','authority-store.json'),'tamper');assert.throws(()=>sets.verifyRecoverySet(b));assert.equal(sets.verifyRecoverySet(a).bootAllowed,false);
  assert.deepEqual(JSON.parse(fs.readFileSync(authorityFile,'utf8')),{historicalGrant:'must-not-activate'});
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

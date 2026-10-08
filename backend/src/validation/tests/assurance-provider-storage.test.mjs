import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {readProviderHealth} from '../../assurance/provider-health.mjs';
import {createStorageCollector,createEvidenceFreshnessCollector} from '../../assurance/storage-collector.mjs';
import {reconcileSnapshot} from '../../assurance/independent-assurance.mjs';
import {coverageScope} from '../../assurance/coverage-scope.mjs';
test('passive provider receipts do not turn missing, old or failed calls healthy',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'provider-health-')),f=path.join(root,'ledger.sqlite'),now=100000;
 const db=new DatabaseSync(f);db.exec('PRAGMA application_id=1162430793; PRAGMA user_version=1; CREATE TABLE calls(id TEXT,timestamp TEXT,status TEXT,usage_json TEXT,provider_response_id TEXT); CREATE TABLE call_providers(call_id TEXT,provider TEXT)');fs.writeFileSync(f+'.initialized','1');
 try{
  assert.equal(readProviderHealth(f,['provider'],now,1000).status,'NOT_CHECKED');
  db.prepare('INSERT INTO calls VALUES(?,?,?,?,?)').run('call',new Date(now-500).toISOString(),'usage_recorded',JSON.stringify({inputTokens:1,outputTokens:2,totalTokens:3}),'response');db.prepare('INSERT INTO call_providers VALUES(?,?)').run('call','provider');
  assert.equal(readProviderHealth(f,['provider'],now,1000).status,'HEALTHY');
  assert.equal(readProviderHealth(f,['provider','missing'],now,1000).status,'NOT_CHECKED');
  assert.equal(readProviderHealth(f,['provider'],now+1000,1000).status,'DEGRADED');
  db.exec("UPDATE calls SET status='failed_uncertain'");assert.equal(readProviderHealth(f,['provider'],now,1000).status,'DEGRADED');
 }finally{db.close();fs.rmSync(root,{recursive:true,force:true});}
});
test('storage and freshness collectors read real sources without claiming backup or fresh provider access',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'storage-health-')),now=100000;
 try{
  for(const file of ['assurance.sqlite','intelligence.sqlite','pillow-request-receipts.sqlite','pillow-reasoning.sqlite','pillow-institutional.sqlite','communications.sqlite','openai-october-2026.sqlite']){const db=new DatabaseSync(path.join(root,file));db.exec('CREATE TABLE objects(workspace TEXT,kind TEXT,id TEXT,body TEXT)');db.close();}
  const before=fs.readFileSync(path.join(root,'intelligence.sqlite'));
  assert.equal(reconcileSnapshot(await createStorageCollector(root,()=>now)(),now,1000).status,'PASS');
  assert.deepEqual(fs.readFileSync(path.join(root,'intelligence.sqlite')),before);
  const db=new DatabaseSync(path.join(root,'intelligence.sqlite'));const add=db.prepare('INSERT INTO objects VALUES(?,?,?,?)');
  const observedAt=new Date(now-5000).toISOString();add.run('ws_empire_1','health','cap',JSON.stringify({id:'cap',evidenceId:'e',lastGoodAt:observedAt}));add.run('ws_empire_1','evidence','e',JSON.stringify({id:'e',capabilityId:'cap',observedAt,staleAfter:new Date(now-4000).toISOString()}));
  assert.equal(reconcileSnapshot(await createEvidenceFreshnessCollector(root,()=>now)(),now,1000).status,'PASS');
  db.exec("DELETE FROM objects WHERE kind='evidence'");assert.equal(reconcileSnapshot(await createEvidenceFreshnessCollector(root,()=>now)(),now,1000).status,'FAIL');db.close();
  assert.equal(coverageScope('marketplace-orders',{status:'NOT_CHECKED'}).externalEvidence,'UNVERIFIED');
  assert.equal(coverageScope('persistence-backups-recovery',{status:'PASS'}).externalEvidence,'UNVERIFIED');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

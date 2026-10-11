import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createEvidenceFreshnessCollector} from '../../assurance/storage-collector.mjs';
import {reconcileSnapshot} from '../../assurance/independent-assurance.mjs';

test('mixed saved claims cannot hide an unbound last-good timestamp behind a valid source',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'work8-freshness-binding-'));
 const db=new DatabaseSync(path.join(root,'intelligence.sqlite'));
 const now=100000,observedAt=new Date(now-500).toISOString();
 db.exec('CREATE TABLE objects(workspace TEXT,kind TEXT,id TEXT,body TEXT)');
 const put=db.prepare('INSERT INTO objects VALUES(?,?,?,?)');
 const update=db.prepare("UPDATE objects SET body=? WHERE kind='health' AND id='unbound'");
 const source=capabilityId=>JSON.stringify({capabilityId,observedAt,staleAfter:new Date(now+500).toISOString()});
 put.run('ws_empire_1','health','valid',JSON.stringify({evidenceId:'good',lastGoodAt:observedAt}));
 put.run('ws_empire_1','evidence','good',source('valid'));
 put.run('ws_empire_1','health','unbound',JSON.stringify({lastGoodAt:observedAt}));
 const collect=createEvidenceFreshnessCollector(root,()=>now);
 try{
  for(const evidenceId of [undefined,null,'']){
   update.run(JSON.stringify({lastGoodAt:observedAt,evidenceId}));
   const before=fs.readFileSync(path.join(root,'intelligence.sqlite'));
   const snapshot=await collect();
   assert.equal(reconcileSnapshot(snapshot,now,1000).status,'FAIL');
   assert.equal(snapshot.internal.find(r=>r.id==='unbound')?.value,false);
   assert.deepEqual(fs.readFileSync(path.join(root,'intelligence.sqlite')),before);
  }
  // Repairing only one of two simultaneous binding defects must retain failure.
  db.exec("DELETE FROM objects WHERE kind='evidence' AND id='good'");
  update.run(JSON.stringify({evidenceId:'second',lastGoodAt:observedAt}));
  put.run('ws_empire_1','evidence','second',source('unbound'));
  assert.equal(reconcileSnapshot(await collect(),now,1000).status,'FAIL');
  put.run('ws_empire_1','evidence','good',source('valid'));
  assert.equal(reconcileSnapshot(await collect(),now,1000).status,'PASS');
  // A health row without any historical success claim is not fabricated evidence.
  update.run(JSON.stringify({failure:'HTTP_503'}));
  assert.equal((await collect()).internal.some(r=>r.id==='unbound'),false);
 }finally{db.close();fs.rmSync(root,{recursive:true,force:true});}
});

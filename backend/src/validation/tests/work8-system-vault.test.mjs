import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import vault from '../../../../deployment/work8-system-vault.cjs';
test('nine persisted domains: pinned chain, missing ancestor, tamper refusal and inert isolated inspection', () => {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'work8-vault-')),root=path.join(dir,'source');fs.mkdirSync(root);
 try {
  for(const relative of Object.values(vault.STORES)){const f=path.join(root,relative);fs.mkdirSync(path.dirname(f),{recursive:true});const db=new DatabaseSync(f);db.exec('CREATE TABLE evidence(id TEXT PRIMARY KEY, body TEXT); INSERT INTO evidence VALUES(\'original\',\'immutable history\')');db.close();}
  const args={root,sourceCommit:'a'.repeat(40)};
  const a=vault.captureSystem({...args,destination:path.join(dir,'a'),capturedAt:'2026-10-11T00:00:00.000Z'});
  const db=new DatabaseSync(path.join(root,vault.STORES.commerce));db.exec("INSERT INTO evidence VALUES('new-order','retain on code rollback')");db.close();
  const b=vault.captureSystem({...args,destination:path.join(dir,'b'),parentDigest:a.digest,capturedAt:'2026-10-11T00:01:00.000Z'});
  assert.equal(vault.verifySystem(b).completeLiveState,false);
  const selected=vault.selectSystemPoint({checkpoints:[a,b],trustedHead:b.digest,at:'2026-10-11T00:00:30.000Z'});assert.equal(selected.digest,a.digest);assert.equal(selected.recoveryPointGapMs,30000);
  assert.throws(()=>vault.selectSystemPoint({checkpoints:[b],trustedHead:b.digest,at:'2026-10-11T00:02:00Z'}),/MISSING_ANCESTOR/);
  const result=vault.stageSystemInspection({...b,destination:path.join(dir,'future')});assert.equal(result.bootAllowed,false);assert.ok(result.elapsedMs>=0);
  const original=new DatabaseSync(path.join(root,vault.STORES.commerce),{readOnly:true});assert.equal(original.prepare('SELECT count(*) n FROM evidence').get().n,2);original.close();
  assert.throws(()=>vault.stageSystemInspection({...a,destination:path.join(dir,'future')}));
  fs.appendFileSync(path.join(dir,'b','commerce','checkpoint.db'),'tamper');assert.throws(()=>vault.verifySystem(b));
  fs.writeFileSync(path.join(root,vault.STORES.commerce)+'-wal','active');assert.throws(()=>vault.captureSystem({...args,destination:path.join(dir,'c')}),/ACTIVE_SIDECAR/);assert.equal(fs.existsSync(path.join(dir,'c')),false);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

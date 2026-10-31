import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {setTimeout as delay} from 'node:timers/promises';
import {waitForAssuranceSchema} from '../../assurance/schema-readiness.mjs';
import {AssuranceStore} from '../../assurance/independent-assurance.mjs';
import {runInspectorPass} from '../../assurance/inspector-cycle.mjs';

const fixture=()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'assurance-readiness-'));return {dir,file:path.join(dir,'assurance.sqlite'),close:()=>fs.rmSync(dir,{recursive:true,force:true})};};

test('read-only startup waits for real worker schema without creating source or cycle',async()=>{
  const f=fixture();try{
    const ready=waitForAssuranceSchema(f.file,{timeoutMs:1000});
    await delay(30);assert.equal(fs.existsSync(f.file),false);
    const store=new AssuranceStore(f.file);store.close();
    await ready;
    const db=new DatabaseSync(f.file,{readOnly:true});
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM assurance_cycles').get().count,0);db.close();
    assert.equal(fs.existsSync(f.file+'.watchdog'),false);
    const verdict=runInspectorPass(f.file);
    assert.equal(verdict.status,'ASSURANCE_OVERDUE');assert.equal(verdict.healthy,false);
    assert.equal(JSON.parse(fs.readFileSync(f.file+'.watchdog')).status,'ASSURANCE_OVERDUE');
  }finally{f.close();}
});

test('missing worker schema times out without creating a file or heartbeat',async()=>{
  const f=fixture();try{
    await assert.rejects(waitForAssuranceSchema(f.file,{timeoutMs:50}),{code:'ASSURANCE_SCHEMA_UNAVAILABLE'});
    assert.deepEqual(fs.readdirSync(f.dir),[]);
  }finally{f.close();}
});

test('existing unrelated source remains byte-identical and does not gain worker schema',async()=>{
  const f=fixture();try{
    const db=new DatabaseSync(f.file);db.exec('CREATE TABLE preserved(id TEXT PRIMARY KEY); INSERT INTO preserved VALUES (\'original\')');db.close();
    const before=fs.readFileSync(f.file);
    await assert.rejects(waitForAssuranceSchema(f.file,{timeoutMs:50}),{code:'ASSURANCE_SCHEMA_UNAVAILABLE'});
    assert.deepEqual(fs.readFileSync(f.file),before);assert.equal(fs.existsSync(f.file+'.watchdog'),false);
  }finally{f.close();}
});

test('malformed or substitute schema cannot satisfy readiness',async()=>{
  for(const sql of ['CREATE TABLE assurance_cycles(wrong TEXT)','CREATE VIEW assurance_cycles AS SELECT 1 AS id,2 AS scheduled_at,3 AS started_at,4 AS completed_at,5 AS receipt']){
    const f=fixture();try{
      const db=new DatabaseSync(f.file);db.exec(sql);db.close();const before=fs.readFileSync(f.file);
      await assert.rejects(waitForAssuranceSchema(f.file,{timeoutMs:30}),{code:'ASSURANCE_SCHEMA_UNAVAILABLE'});
      assert.deepEqual(fs.readFileSync(f.file),before);assert.equal(fs.existsSync(f.file+'.watchdog'),false);
    }finally{f.close();}
  }
});

test('schema readiness preserves incomplete cycles and never supplies a receipt',async()=>{
  const f=fixture();try{
    const store=new AssuranceStore(f.file);const slot=Math.floor((Date.now()-120000)/300000)*300000;
    store.begin('incomplete',slot,slot);store.close();const before=fs.readFileSync(f.file);
    await waitForAssuranceSchema(f.file);assert.deepEqual(fs.readFileSync(f.file),before);
    const verdict=runInspectorPass(f.file);assert.equal(verdict.status,'ASSURANCE_OVERDUE');assert.equal(verdict.healthy,false);
    const db=new DatabaseSync(f.file,{readOnly:true});const row=db.prepare('SELECT * FROM assurance_cycles').get();db.close();
    assert.equal(row.id,'incomplete');assert.equal(row.completed_at,null);assert.equal(row.receipt,null);
  }finally{f.close();}
});

test('shutdown cancels startup wait without extending lifecycle',async()=>{
  const f=fixture();try{
    const controller=new AbortController();const ready=waitForAssuranceSchema(f.file,{signal:controller.signal});controller.abort();
    await assert.rejects(ready,{name:'AbortError'});assert.deepEqual(fs.readdirSync(f.dir),[]);
  }finally{f.close();}
});

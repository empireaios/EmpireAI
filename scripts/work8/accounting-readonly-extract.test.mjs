import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {extractAccounting} from './accounting-readonly-extract.mjs';
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'work8-accounting-INJECTED-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const file=path.join(root,'ledger.sqlite'),db=new DatabaseSync(file);t.after(()=>db.close());
 db.exec('PRAGMA application_id=1162430793; PRAGMA user_version=1; CREATE TABLE calls(id TEXT PRIMARY KEY,timestamp TEXT,model TEXT,reserved_micro_usd INTEGER,status TEXT,usage_json TEXT,estimated_micro_usd INTEGER,provider_response_id TEXT,invoice_actual_micro_usd INTEGER); CREATE TABLE call_providers(call_id TEXT PRIMARY KEY,provider TEXT,request_key TEXT)');
 fs.writeFileSync(file+'.initialized','INJECTED TEST ONLY');
 const add=id=>{db.prepare('INSERT INTO calls VALUES(?,?,?,?,?,?,?,?,?)').run(id,'2026-10-10T21:00:00.000Z','injected-model',100,'usage_recorded','{}',10,'injected-response',null);db.prepare('INSERT INTO call_providers VALUES(?,?,?)').run(id,'injected-provider','a'.repeat(64));};
 return {file,db,add};
}
test('one read-only snapshot preserves bytes, canonical digest and unknown request attribution',t=>{
 const {file,add}=fixture(t);add('b');add('a');
 const before=fs.readFileSync(file),r=extractAccounting(file);
 assert.deepEqual(fs.readFileSync(file),before);assert.equal(r.recordCount,2);
 const expected=[{id:'a',timestamp:'2026-10-10T21:00:00.000Z',reserved_micro_usd:100,estimated_micro_usd:10,invoice_actual_micro_usd:null,status:'usage_recorded'},{id:'b',timestamp:'2026-10-10T21:00:00.000Z',reserved_micro_usd:100,estimated_micro_usd:10,invoice_actual_micro_usd:null,status:'usage_recorded'}];
 assert.equal(r.recordDigestSha256,createHash('sha256').update(JSON.stringify(expected)).digest('hex'));
 assert.equal(r.comparison.originalSubsetPreserved,null);assert.equal(r.requestAttributionVerified,false);assert.equal(r.invoiceActualUnknownCount,2);assert.equal(r.lineage[0].provider,'injected-provider');
});
test('distinguishes additions from changes and removals without assuming subset preservation',t=>{
 const {file,add,db}=fixture(t);add('old');add('removed');const baseline=extractAccounting(file);
 add('new1');add('new2');add('new3');db.prepare("UPDATE calls SET estimated_micro_usd=11 WHERE id='old'").run();db.prepare("DELETE FROM calls WHERE id='removed'").run();
 const r=extractAccounting(file,baseline);assert.deepEqual(r.comparison.added.map(r=>r.id),['new1','new2','new3']);assert.equal(r.comparison.changed.length,1);assert.equal(r.comparison.removed.length,1);assert.equal(r.comparison.originalSubsetPreserved,false);assert.equal(r.orphanProviderRows,1);
});
test('valid addition-only comparison remains separate from authenticity and attribution',t=>{
 const {file,add}=fixture(t);add('original');const baseline=extractAccounting(file);add('added');
 const r=extractAccounting(file,baseline);assert.equal(r.comparison.originalSubsetPreserved,true);assert.equal(r.requestAttributionVerified,false);assert.match(r.comparison.status,/NOT_INDEPENDENTLY_AUTHENTICATED/);
 const altered=structuredClone(baseline);altered.rows[0].estimated_micro_usd=0;assert.throws(()=>extractAccounting(file,altered),/BASELINE_INVALID/);
});
test('refuses unsupported schema and oversized usage before reading payloads',t=>{
 const {file,add,db}=fixture(t);add('a');db.prepare('UPDATE calls SET usage_json=?').run('x'.repeat(65537));assert.throws(()=>extractAccounting(file),/USAGE_SIZE_BOUND/);
 db.exec('PRAGMA user_version=99');assert.throws(()=>extractAccounting(file),/LEDGER_INTEGRITY_REFUSED/);
});

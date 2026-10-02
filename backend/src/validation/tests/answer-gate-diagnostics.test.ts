import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {recordAnswerGateDiagnostic,readAnswerGateDiagnostic} from '../../runtime/answer-gate-diagnostics.js';

test('rejected drafts persist independently, redact credentials and retain the first evidence',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gate-diagnostic-')); const filename=path.join(dir,'evidence.sqlite');
 try {
  assert.equal(readAnswerGateDiagnostic('pcr_one',filename),null);
  const input={requestId:'pcr_one',draft:'Rejected prose and credential fake-secret-12345 plus Bearer fake.bearer.token',findings:[{principleId:'S8',severity:'violation',message:'credential fake-secret-12345'}]};
  recordAnswerGateDiagnostic(input,filename,{OPENAI_API_KEY:'fake-secret-12345'});
  const stored=readAnswerGateDiagnostic('pcr_one',filename)!;
  assert.ok(stored);assert.doesNotMatch(JSON.stringify(stored),/fake-secret-12345|fake.bearer.token/);assert.match(String(stored.redacted_draft),/REDACTED/);
  recordAnswerGateDiagnostic({...input,draft:'replacement'},filename,{});
  assert.deepEqual(readAnswerGateDiagnostic('pcr_one',filename),stored);
  assert.equal(fs.statSync(filename).mode & 0o777,0o600);
  assert.equal(readAnswerGateDiagnostic('pcr_missing',filename),null);
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});

test('diagnostic bounds and symlink rejection do not allow arbitrary reads',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gate-diagnostic-')); const filename=path.join(dir,'evidence.sqlite');
 try {
  recordAnswerGateDiagnostic({requestId:'pcr_two',draft:'x'.repeat(30000),findings:[]},filename,{});
  const stored=readAnswerGateDiagnostic('pcr_two',filename)!; assert.equal(String(stored.redacted_draft).length,24000);assert.equal(stored.truncated,1);
  assert.throws(()=>readAnswerGateDiagnostic('../other',filename));
  const link=path.join(dir,'link');fs.symlinkSync(filename,link);
  assert.throws(()=>readAnswerGateDiagnostic('pcr_two',link));
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});

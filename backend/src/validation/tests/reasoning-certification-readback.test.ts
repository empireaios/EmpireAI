import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {readReasoningCertification} from '../../runtime/reasoning-certification-readback.js';
test('historical certification and failed owner acceptance are independent',()=>{
  const root=path.resolve('..');
  const actual=readReasoningCertification(root);
  assert.equal(actual.historical.status,'SATISFIED');
  assert.equal(actual.currentOperability.status,'FAILED_OWNER_ACCEPTANCE');
});
test('missing or malformed evidence never becomes certified',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'cert-readback-'));
  try { assert.equal(readReasoningCertification(root).historical.status,'UNKNOWN'); }
  finally {fs.rmSync(root,{recursive:true});}
});

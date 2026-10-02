import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {readProviderReceipts} from '../../runtime/provider-receipt-readback.js';
test('provider receipt readback preserves exact failure and held cost without secrets or mutation',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'provider-readback-')),filename=path.join(dir,'ledger.sqlite');
 const requestKey=createHash('sha256').update('ws_empire_1\0pcr_example').digest('hex'),file=filename+'.route-'+requestKey+'.json';
 const value={schema:'locked-inference-operator-readback-v1',requestKey,attempts:[{provider:'gemini',model:'gemini-3.8-flash',outcome:'temporary_refusal',httpStatus:503,code:'UNAVAILABLE',message:'private secret'}],records:[{request_key:requestKey,provider:'gemini',model:'gemini-3.8-flash',reserved_micro_usd:300000,estimated_micro_usd:null,invoice_actual_micro_usd:null,usage:null,secret:'private secret'}]};
 try {
  assert.deepEqual(readProviderReceipts(filename,'ws_empire_1','pcr_example'),[]);
  fs.writeFileSync(file,JSON.stringify(value));const before=fs.readFileSync(file);
  const result=readProviderReceipts(filename,'ws_empire_1','pcr_example');
  assert.equal(result[0]!.attempts[0].code,'UNAVAILABLE');assert.equal(result[0]!.attempts[0].httpStatus,503);assert.equal(result[0]!.records[0].reservedMicroUsd,300000);assert.equal(result[0]!.records[0].estimatedMicroUsd,null);assert.equal(result[0]!.fallbackUsed,false);assert.equal(result[0]!.inferenceCalls,0);assert.ok(!JSON.stringify(result).includes('private secret'));assert.deepEqual(fs.readFileSync(file),before);
  assert.throws(()=>readProviderReceipts(filename,'ws_empire_1','../private'));
  fs.writeFileSync(file,JSON.stringify({...value,requestKey:'wrong'}));assert.throws(()=>readProviderReceipts(filename,'ws_empire_1','pcr_example'));
  fs.unlinkSync(file);fs.writeFileSync(file+'.target',JSON.stringify(value));fs.symlinkSync(file+'.target',file);assert.throws(()=>readProviderReceipts(filename,'ws_empire_1','pcr_example'));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

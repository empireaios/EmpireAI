import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createRequire} from 'node:module';
import {FinancialCentre,hash} from '../../finance/financial-centre.js';
import {prepareFinancialBirth,financialRehearsal,financialExamWorkspace} from '../../finance/work8-financial-view.js';
const {captureCheckpoint,verifyCheckpoint}=createRequire(import.meta.url)('../../../../deployment/legacy-checkpoint-capture.cjs');
test('owner financial projection, backup and old/new writer preserve cutover and original live journal',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'financial-view-')),file=path.join(dir,'finance.sqlite');let centre:FinancialCentre|undefined=new FinancialCentre(file);
 try{
  centre.append('ws_empire_1','owner',{id:'original',type:'provider',data:{id:'fixture',name:'fixture',category:'fixture',commissioned:'NO',mandatory:false,billingAccess:'UNAVAILABLE',note:'Retained original record'}});
  const original=hash(centre.entries('ws_empire_1'));
  const receipt=prepareFinancialBirth(centre,'ws_empire_1','owner',{type:'work8_birth_rehearsal',periodId:'exam-1',cutoff:'2026-01-01T00:00:00Z',confirmation:'ISOLATED_ONLY'});
  const view=financialRehearsal(centre,'ws_empire_1','owner','2026-01-01T00:00:00Z');assert.equal(view.birth?.configDigest,receipt.digest);assert.equal(view.birth?.archive.entries.length,0);
  assert.equal(financialRehearsal(centre,'ws_empire_1','other').birth,null);assert.notEqual(financialExamWorkspace('ws_empire_1','owner'),financialExamWorkspace('other','owner'));
  assert.equal(hash(centre.entries('ws_empire_1')),original);centre.close();centre=undefined;
  const capture=captureCheckpoint({source:file,destination:path.join(dir,'vault'),sourceCommit:'a'.repeat(40)});assert.equal(verifyCheckpoint({directory:capture.directory,manifestSha256:capture.manifestSha256}).verified,true);
  fs.copyFileSync(path.join(dir,'vault','checkpoint.db'),path.join(dir,'restored.sqlite'),fs.constants.COPYFILE_EXCL);
  centre=new FinancialCentre(path.join(dir,'restored.sqlite'));assert.equal(hash(centre.entries('ws_empire_1')),original);assert.equal(financialRehearsal(centre,'ws_empire_1','owner').birth?.configDigest,receipt.digest);
  assert.equal(verifyCheckpoint({directory:capture.directory,manifestSha256:capture.manifestSha256}).verified,true);
  assert.throws(()=>prepareFinancialBirth(centre!,'ws_empire_1','owner',{type:'work8_birth_rehearsal',periodId:'live',cutoff:'2026-01-01T00:00:00Z',confirmation:'LIVE'}));
 }finally{centre?.close();fs.rmSync(dir,{recursive:true,force:true});}
});

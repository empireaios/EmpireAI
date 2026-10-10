import assert from 'node:assert/strict';
import {test} from 'node:test';
import {rmSync} from 'node:fs';
import {runWork8JointExams} from '../../runtime/commerce-runtime/governed/work8-joint-exams.js';
test('Commerce task, Assurance recovery and finance share real canonical identities and state',async()=>{const r=await runWork8JointExams(83);try{assert.equal(r.result,'PASS');assert.equal(r.checks.length,9);assert.equal(r.checks.every(c=>c.passed),true);assert.equal(r.repairs,1);assert.equal(r.forbiddenRepairs,0);assert.equal(r.incidents.length,3);assert.equal(r.recoveries.length,1);assert.equal(r.recoveries[0].verification.missionId,r.missionId);assert.equal(r.task.cursor,7);assert.equal(r.receipts.length,7);assert.equal(r.externalEffects,0);}finally{rmSync(r.root,{recursive:true,force:true});}});

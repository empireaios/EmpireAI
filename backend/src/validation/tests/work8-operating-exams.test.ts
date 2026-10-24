import assert from 'node:assert/strict';
import {test} from 'node:test';
import {rmSync} from 'node:fs';
import {dirname} from 'node:path';
import {runWork8OperatingExams} from '../../runtime/commerce-runtime/governed/work8-operating-exams.js';
test('seeded canonical commerce, cold crash replay and finance produce reproducible multi-order traces',()=>{
 const a=runWork8OperatingExams(83,4);const b=runWork8OperatingExams(83,4);
 try{assert.equal(a.traceDigest,b.traceDigest);assert.equal(a.orderCount,8);assert.equal(a.externalEffects,0);assert.equal(a.paidInference,0);assert.deepEqual(a.scenarios.map(s=>s.mode),['POSITIVE','LOSS','REFUND','PAYOUT_DELAY']);assert.equal(a.scenarios.every(s=>s.result==='PASS'&&s.receipts.length>10&&s.events.length>10),true);assert.notEqual(a.databasePath,b.databasePath);}finally{rmSync(dirname(a.databasePath),{recursive:true,force:true});rmSync(dirname(b.databasePath),{recursive:true,force:true});}
});
test('examination bounds prevent unbounded scenario or malformed seed requests',()=>{assert.throws(()=>runWork8OperatingExams(1,25),/BOUNDS/);assert.throws(()=>runWork8OperatingExams(-1,4),/BOUNDS/);});

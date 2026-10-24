import assert from 'node:assert/strict';
import {test} from 'node:test';
import {runWork8FinanceBoundaryExams} from '../../runtime/commerce-runtime/governed/work8-finance-boundary-exams.js';
test('canonical chargeback, unknown fees, cutoff and cash traces pass; unsupported currency remains a gap',()=>{const r=runWork8FinanceBoundaryExams();assert.equal(r.result,'PARTIAL_WITH_CAPABILITY_GAP');assert.deepEqual(r.cases.map(c=>c.id),['chargeback','missing-fee','period-cutoff','negative-cash','separate-currency-ledgers']);assert.equal(r.receipts.length,5);assert.equal(r.actualCashMovement,0);assert.equal(r.canonicalHistoryPreserved,true);assert.equal(r.traceDigest.length,64);});

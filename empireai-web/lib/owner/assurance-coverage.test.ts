import test from 'node:test';
import assert from 'node:assert/strict';
import { assuranceDomains, summarizeAssuranceCoverage, displayAssuranceCheck } from './assurance-coverage';

const receipt = assuranceDomains.map((source, i) => ({source, status: i < 4 ? 'PASS' : i === 4 ? 'FAIL' : 'NOT_CHECKED'}));
test('partial independent coverage never becomes full coverage or Birth readiness', () => {
  assert.deepEqual(summarizeAssuranceCoverage(receipt, true), {current:true, passed:4, failed:1, unverified:8, required:13});
});
test('stale, duplicate, missing, unknown domains and unknown verdicts cannot publish counts', () => {
  for (const data of [null, receipt.slice(1), [...receipt.slice(1), receipt[1]],
    receipt.map((r,i)=>i===0?{...r,source:'legacy-birth'}:r),
    receipt.map((r,i)=>i===0?{...r,status:'HEALTHY'}:r)]) {
    assert.equal(summarizeAssuranceCoverage(data,true).passed,null);
  }
  assert.equal(summarizeAssuranceCoverage(receipt,false).passed,null);
});

test('retained domain results cannot appear current after refresh failure or stale watchdog', () => {
  for (const status of ['PASS', 'FAIL', 'NOT_CHECKED']) {
    assert.equal(displayAssuranceCheck(status, false), `UNKNOWN — retained result: ${status}`);
    assert.equal(displayAssuranceCheck(status, true), status);
  }
});

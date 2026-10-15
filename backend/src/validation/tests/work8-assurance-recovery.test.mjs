import test from 'node:test';
import assert from 'node:assert/strict';
import {WORK8_RECOVERY_CASES, runWork8RecoveryExam} from '../../assurance/work8-recovery-exams.mjs';
for (const scenarioId of WORK8_RECOVERY_CASES) test(`Work8 real control-plane exam: ${scenarioId}`, async () => {
  const receipt = await runWork8RecoveryExam({scenarioId, seed: 812});
  assert.equal(receipt.result, 'PASS', JSON.stringify(receipt.checks));
  assert.equal(receipt.baselineDigest, receipt.finalDigest);
  assert.ok(receipt.events.length > 0);
});
test('unregistered scenarios and non-reproducible seeds rejected', async () => {
  await assert.rejects(runWork8RecoveryExam({scenarioId: 'invented'}), /INVALID_EXAM/);
  await assert.rejects(runWork8RecoveryExam({scenarioId: 'cache-expiry', seed: NaN}), /INVALID_EXAM/);
});

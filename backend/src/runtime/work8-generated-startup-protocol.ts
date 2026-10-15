import assert from 'node:assert/strict';
/** Infrastructure preparation grants no business admission. The original 15s
 * deadline covers both phases and is never reset by a protocol transition. */
export class GeneratedStartupProtocol {
  private stage: 'ROOTS' | 'PREPARING' | 'INFRASTRUCTURE_READY' | 'ADMITTED' = 'ROOTS';
  private readonly deadline: number;
  constructor(readonly runId: string, readonly source: string, private readonly clock = () => performance.now()) {
    assert.match(runId, /^[a-f0-9-]{36}$/); assert.match(source, /^[a-f0-9]{40}$/);
    this.deadline = clock() + 15000;
  }
  remaining() { const ms = this.deadline - this.clock(); assert.ok(ms > 0, 'HH4_ADOPTION_TIMEOUT'); return ms; }
  prepare(message: unknown) {
    this.remaining(); assert.equal(this.stage, 'ROOTS', 'HH4_PREPARE_OUT_OF_ORDER');
    assert.deepEqual(message, {action: 'hh4-prepare-infrastructure', runId: this.runId, source: this.source});
    this.stage = 'PREPARING';
  }
  infrastructureReady() {
    this.remaining(); assert.equal(this.stage, 'PREPARING', 'HH4_INFRASTRUCTURE_OUT_OF_ORDER');
    this.stage = 'INFRASTRUCTURE_READY';
  }
  admit(message: unknown) {
    this.remaining(); assert.equal(this.stage, 'INFRASTRUCTURE_READY', 'HH4_ADMIT_BEFORE_INFRASTRUCTURE');
    assert.deepEqual(message, {action: 'hh4-admit', runId: this.runId, source: this.source});
    this.stage = 'ADMITTED';
  }
}

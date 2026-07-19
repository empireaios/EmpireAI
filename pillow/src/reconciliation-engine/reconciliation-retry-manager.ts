/** R3-08 — Reconciliation retry manager. */

export class ReconciliationRetryManager {
  private attempts = 0;

  recordAttempt(): void {
    this.attempts += 1;
  }

  getAttempts(): number {
    return this.attempts;
  }

  reset(): void {
    this.attempts = 0;
  }
}

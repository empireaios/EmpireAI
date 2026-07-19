/** R3-14 — Budget retry manager. */

export class BudgetRetryManager {
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

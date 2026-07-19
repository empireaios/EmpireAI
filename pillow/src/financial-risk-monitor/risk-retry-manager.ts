/** R3-15 — Risk retry manager. */

export class RiskRetryManager {
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

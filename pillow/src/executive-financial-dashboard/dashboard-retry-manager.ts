/** R3-16 — Dashboard retry manager. */

export class DashboardRetryManager {
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

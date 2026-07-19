/** R3-09 — Invoice retry manager. */

export class InvoiceRetryManager {
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

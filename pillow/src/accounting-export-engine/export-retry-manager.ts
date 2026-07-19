/** R3-17 — Export retry manager. */

export class ExportRetryManager {
  private attempts = 0;

  shouldRetry(maxAttempts: number): boolean {
    return this.attempts < maxAttempts;
  }

  recordAttempt(): void {
    this.attempts += 1;
  }

  reset(): void {
    this.attempts = 0;
  }

  getAttempts(): number {
    return this.attempts;
  }
}

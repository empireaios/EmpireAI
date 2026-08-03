export class RecoveryManager {
  private attempts = 0;
  recordAttempt(): number { return ++this.attempts; }
  getRecoveryAttempts(): number { return this.attempts; }
  reset(): void { this.attempts = 0; }
}

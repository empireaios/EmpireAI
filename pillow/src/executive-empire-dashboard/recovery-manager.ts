export class RecoveryManager { private attempts = 0; recover() { this.attempts += 1; return this.attempts; } getRecoveryAttempts() { return this.attempts; } }

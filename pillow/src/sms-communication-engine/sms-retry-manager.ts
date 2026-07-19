/** R4-05 — SMS retry manager. */

import type { SmsCommunicationEngineConfiguration } from "./configuration.js";
import { appendSceLog } from "./sce-logging.js";

export class SmsRetryManager {
  private retryAttempts = 0;

  getRetryAttempts(): number {
    return this.retryAttempts;
  }

  canRetry(currentCount: number, maxRetries: number): boolean {
    return currentCount < maxRetries;
  }

  recordRetry(label: string): void {
    this.retryAttempts += 1;
    appendSceLog({
      event: "recovery_attempt",
      level: "info",
      details: `${label} retry attempt ${this.retryAttempts}`,
    });
  }

  reset(): void {
    this.retryAttempts = 0;
  }
}

/** R4-04 — Email retry manager. */

import type { EmailCommunicationEngineConfiguration } from "./configuration.js";
import { appendEceLog } from "./ece-logging.js";

export class EmailRetryManager {
  private retryAttempts = 0;

  getRetryAttempts(): number {
    return this.retryAttempts;
  }

  recordRetry(label: string, config: EmailCommunicationEngineConfiguration): boolean {
    this.retryAttempts += 1;
    appendEceLog({
      event: "recovery_attempt",
      level: "info",
      details: `${label} retry attempt ${this.retryAttempts}`,
    });
    return this.retryAttempts <= config.maxRetryAttempts;
  }

  reset(): void {
    this.retryAttempts = 0;
  }
}

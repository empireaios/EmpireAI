/** R4-04 — Email queue manager. */

import { ECE_METADATA_VERSION } from "./paths.js";
import type { EmailCommunicationEngineConfiguration } from "./configuration.js";
import type { EmailRecord } from "./types.js";
import type { EmailRegistry } from "./email-registry.js";

export class EmailQueueManager {
  enqueue(registry: EmailRegistry, record: EmailRecord): void {
    registry.storeEmail(record);
  }

  dequeueBatch(
    registry: EmailRegistry,
    config: EmailCommunicationEngineConfiguration,
    limit?: number,
  ): EmailRecord[] {
    const rule = config.queueRules.find((r) => r.ruleId === "default_queue");
    const batchSize = limit ?? rule?.batchSize ?? 50;
    return registry.queued().slice(0, batchSize);
  }

  markDelivered(record: EmailRecord): EmailRecord {
    return {
      ...record,
      timestamp: new Date().toISOString(),
      deliveryStatus: "delivered",
      validationStatus: "passed",
      metadataVersion: ECE_METADATA_VERSION,
    };
  }

  markFailed(record: EmailRecord): EmailRecord {
    return {
      ...record,
      timestamp: new Date().toISOString(),
      deliveryStatus: "failed",
      validationStatus: "failed",
      metadataVersion: ECE_METADATA_VERSION,
    };
  }
}

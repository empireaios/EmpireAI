/** R4-05 — SMS queue manager. */

import { SCE_METADATA_VERSION } from "./paths.js";
import type { SmsCommunicationEngineConfiguration } from "./configuration.js";
import type { SmsRecord } from "./types.js";
import type { SmsRegistry } from "./sms-registry.js";

export class SmsQueueManager {
  enqueue(registry: SmsRegistry, record: SmsRecord): void {
    registry.storeSms(record);
  }

  dequeueBatch(
    registry: SmsRegistry,
    config: SmsCommunicationEngineConfiguration,
    limit?: number,
  ): SmsRecord[] {
    const rule = config.queueRules.find((r) => r.ruleId === "default_queue");
    const batchSize = limit ?? rule?.batchSize ?? 50;
    return registry.queued().slice(0, batchSize);
  }

  markDelivered(record: SmsRecord): SmsRecord {
    const now = new Date().toISOString();
    return {
      ...record,
      timestamp: now,
      deliveryStatus: "delivered",
      deliveryTimestamp: now,
      validationStatus: "passed",
      metadataVersion: SCE_METADATA_VERSION,
    };
  }

  markFailed(record: SmsRecord): SmsRecord {
    return {
      ...record,
      timestamp: new Date().toISOString(),
      deliveryStatus: "failed",
      validationStatus: "failed",
      metadataVersion: SCE_METADATA_VERSION,
    };
  }

  requeueForRetry(record: SmsRecord): SmsRecord {
    return {
      ...record,
      timestamp: new Date().toISOString(),
      deliveryStatus: "queued",
      retryCount: record.retryCount + 1,
      metadataVersion: SCE_METADATA_VERSION,
    };
  }
}

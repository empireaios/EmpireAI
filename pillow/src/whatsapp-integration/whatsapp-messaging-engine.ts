/** R4-06 — WhatsApp messaging engine. */

import { WAI_METADATA_VERSION } from "./paths.js";
import type { WhatsAppIntegrationConfiguration } from "./configuration.js";
import type { WhatsAppRecord } from "./types.js";
import type { WhatsAppRegistry } from "./whatsapp-registry.js";

export class WhatsAppMessagingEngine {
  enqueue(registry: WhatsAppRegistry, record: WhatsAppRecord): void {
    registry.storeMessage(record);
  }

  dequeueBatch(
    registry: WhatsAppRegistry,
    config: WhatsAppIntegrationConfiguration,
    limit?: number,
  ): WhatsAppRecord[] {
    const batchSize = limit ?? 50;
    return registry.queued().slice(0, batchSize);
  }

  markDelivered(record: WhatsAppRecord): WhatsAppRecord {
    const now = new Date().toISOString();
    return {
      ...record,
      timestamp: now,
      deliveryStatus: "delivered",
      readStatus: "delivered",
      validationStatus: "passed",
      metadataVersion: WAI_METADATA_VERSION,
    };
  }

  markFailed(record: WhatsAppRecord): WhatsAppRecord {
    return {
      ...record,
      timestamp: new Date().toISOString(),
      deliveryStatus: "failed",
      validationStatus: "failed",
      metadataVersion: WAI_METADATA_VERSION,
    };
  }
}

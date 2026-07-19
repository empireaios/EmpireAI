/** R4-06 — WhatsApp tracking engine. */

import { WAI_METADATA_VERSION } from "./paths.js";
import type { WhatsAppRecord } from "./types.js";

export class WhatsAppTrackingEngine {
  trackDelivery(record: WhatsAppRecord): WhatsAppRecord {
    const now = new Date().toISOString();
    return {
      ...record,
      timestamp: now,
      deliveryStatus: "delivered",
      readStatus: "delivered",
      metadataVersion: WAI_METADATA_VERSION,
    };
  }

  trackReadReceipt(record: WhatsAppRecord): WhatsAppRecord {
    const now = new Date().toISOString();
    return {
      ...record,
      timestamp: now,
      deliveryStatus: record.deliveryStatus === "queued" ? "delivered" : record.deliveryStatus,
      readStatus: "read",
      metadataVersion: WAI_METADATA_VERSION,
    };
  }
}

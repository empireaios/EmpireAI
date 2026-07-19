/** R4-06 — WhatsApp analytics engine. */

import type { WhatsAppRecord } from "./types.js";

export class WhatsAppAnalyticsEngine {
  summarize(records: WhatsAppRecord[]): {
    total: number;
    delivered: number;
    queued: number;
    failed: number;
    read: number;
    byCategory: Record<string, number>;
  } {
    const byCategory: Record<string, number> = {};
    let delivered = 0;
    let queued = 0;
    let failed = 0;
    let read = 0;

    for (const r of records) {
      byCategory[r.messageCategory] = (byCategory[r.messageCategory] ?? 0) + 1;
      if (r.deliveryStatus === "delivered") delivered += 1;
      if (r.deliveryStatus === "queued" || r.deliveryStatus === "sending") queued += 1;
      if (r.deliveryStatus === "failed" || r.deliveryStatus === "bounced") failed += 1;
      if (r.readStatus === "read") read += 1;
    }

    return { total: records.length, delivered, queued, failed, read, byCategory };
  }

  toMachineReadable(record: WhatsAppRecord): Record<string, unknown> {
    return {
      whatsAppRecordId: record.whatsAppRecordId,
      timestamp: record.timestamp,
      customerId: record.customerId,
      conversationId: record.conversationId,
      messageTemplateReference: record.messageTemplateReference,
      messageCategory: record.messageCategory,
      recipientPhoneNumber: record.recipientPhoneNumber,
      deliveryStatus: record.deliveryStatus,
      readStatus: record.readStatus,
      validationStatus: record.validationStatus,
      metadataVersion: record.metadataVersion,
    };
  }
}

/** R4-05 — SMS analytics engine. */

import type { SmsRecord } from "./types.js";

export class SmsAnalyticsEngine {
  summarize(records: SmsRecord[]): {
    total: number;
    delivered: number;
    queued: number;
    failed: number;
    confirmed: number;
    byCategory: Record<string, number>;
  } {
    const byCategory: Record<string, number> = {};
    let delivered = 0;
    let queued = 0;
    let failed = 0;
    let confirmed = 0;

    for (const r of records) {
      byCategory[r.smsCategory] = (byCategory[r.smsCategory] ?? 0) + 1;
      if (r.deliveryStatus === "delivered" || r.deliveryStatus === "confirmed") delivered += 1;
      if (r.deliveryStatus === "queued" || r.deliveryStatus === "sending") queued += 1;
      if (r.deliveryStatus === "failed" || r.deliveryStatus === "bounced") failed += 1;
      if (r.deliveryStatus === "confirmed") confirmed += 1;
    }

    return { total: records.length, delivered, queued, failed, confirmed, byCategory };
  }

  toMachineReadable(record: SmsRecord): Record<string, unknown> {
    return {
      smsRecordId: record.smsRecordId,
      timestamp: record.timestamp,
      customerId: record.customerId,
      smsTemplateReference: record.smsTemplateReference,
      smsCategory: record.smsCategory,
      recipientPhoneNumber: record.recipientPhoneNumber,
      deliveryStatus: record.deliveryStatus,
      deliveryTimestamp: record.deliveryTimestamp,
      retryCount: record.retryCount,
      validationStatus: record.validationStatus,
      metadataVersion: record.metadataVersion,
    };
  }
}

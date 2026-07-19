/** R4-04 — Email analytics engine. */

import type { EmailRecord } from "./types.js";

export class EmailAnalyticsEngine {
  summarize(records: EmailRecord[]): {
    total: number;
    delivered: number;
    queued: number;
    failed: number;
    opened: number;
    clicked: number;
    byCategory: Record<string, number>;
  } {
    const byCategory: Record<string, number> = {};
    let delivered = 0;
    let queued = 0;
    let failed = 0;
    let opened = 0;
    let clicked = 0;

    for (const r of records) {
      byCategory[r.emailCategory] = (byCategory[r.emailCategory] ?? 0) + 1;
      if (r.deliveryStatus === "delivered") delivered += 1;
      if (r.deliveryStatus === "queued" || r.deliveryStatus === "sending") queued += 1;
      if (r.deliveryStatus === "failed" || r.deliveryStatus === "bounced") failed += 1;
      if (r.openStatus === "opened") opened += 1;
      if (r.clickStatus === "clicked") clicked += 1;
    }

    return { total: records.length, delivered, queued, failed, opened, clicked, byCategory };
  }

  toMachineReadable(record: EmailRecord): Record<string, unknown> {
    return {
      emailRecordId: record.emailRecordId,
      timestamp: record.timestamp,
      customerId: record.customerId,
      emailTemplateReference: record.emailTemplateReference,
      emailCategory: record.emailCategory,
      recipientAddress: record.recipientAddress,
      deliveryStatus: record.deliveryStatus,
      openStatus: record.openStatus,
      clickStatus: record.clickStatus,
      validationStatus: record.validationStatus,
      metadataVersion: record.metadataVersion,
    };
  }
}

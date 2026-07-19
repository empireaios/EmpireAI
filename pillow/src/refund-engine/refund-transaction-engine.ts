/** R3-10 — Refund transaction engine. */

import { appendRfLog } from "./rf-logging.js";
import type { RefundRegistry } from "./refund-registry.js";
import type { RefundMetadataGenerator } from "./refund-metadata-generator.js";
import type { RefundRecord } from "./types.js";

export class RefundTransactionEngine {
  constructor(
    private readonly registry: RefundRegistry,
    private readonly metadataGenerator: RefundMetadataGenerator,
  ) {}

  recordTransaction(record: RefundRecord): RefundRecord {
    this.registry.update(record);
    appendRfLog({
      event: "refund_transaction",
      level: "info",
      details: `Refund ${record.refundId} status=${record.refundStatus} amount=${record.refundAmount}`,
    });
    return record;
  }

  transitionStatus(record: RefundRecord, status: RefundRecord["refundStatus"]): RefundRecord {
    const updated = { ...record, refundStatus: status, timestamp: new Date().toISOString() };
    return this.recordTransaction(updated);
  }
}

/** R3-10 — Refund lifecycle manager. */

import type { RefundRegistry } from "./refund-registry.js";
import type { RefundTransactionEngine } from "./refund-transaction-engine.js";
import type { RefundRecord } from "./types.js";

export class RefundLifecycleManager {
  constructor(private readonly transactionEngine: RefundTransactionEngine) {}

  advance(
    record: RefundRecord,
    targetStatus: RefundRecord["refundStatus"],
    registry: RefundRegistry,
  ): RefundRecord {
    const updated = this.transactionEngine.transitionStatus(record, targetStatus);
    registry.update(updated);
    return updated;
  }

  markFailed(record: RefundRecord, registry: RefundRegistry): RefundRecord {
    return this.advance(record, "failed", registry);
  }

  markCompleted(record: RefundRecord, registry: RefundRegistry): RefundRecord {
    return this.advance(record, "completed", registry);
  }
}

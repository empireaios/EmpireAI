/** R3-08 — Payment reconciliation engine. */

import { appendRcLog } from "./rc-logging.js";
import type { ReconciliationEngineConfiguration } from "./configuration.js";
import type { ReconciliationDataSource } from "./reconciliation-data-source.js";
import type { TransactionMatchingEngine } from "./transaction-matching-engine.js";
import type { ReconciliationMetadataGenerator } from "./reconciliation-metadata-generator.js";
import type { ReconciliationValidationEngine } from "./reconciliation-validator.js";
import type { ReconciliationRegistry } from "./reconciliation-registry.js";
import type { ReconcilePaymentsInput } from "./types.js";
import type { ReconciliationRecord } from "./types.js";

export class PaymentReconciliationEngine {
  constructor(
    private readonly registry: ReconciliationRegistry,
    private readonly metadataGenerator: ReconciliationMetadataGenerator,
    private readonly validationEngine: ReconciliationValidationEngine,
    private readonly matchingEngine: TransactionMatchingEngine,
    private readonly dataSource: ReconciliationDataSource,
  ) {}

  reconcile(
    input: ReconcilePaymentsInput,
    config: ReconciliationEngineConfiguration,
    dedupeKey: string,
  ): { record: ReconciliationRecord | null; error: string | null; warnings: string[] } {
    if (this.registry.hasDedupeKey(dedupeKey)) {
      return { record: null, error: "Duplicate reconciliation event", warnings: [] };
    }

    const snapshot = this.dataSource.snapshot();
    const match = this.matchingEngine.matchPaymentsToRevenue(
      snapshot.payments,
      snapshot.revenues,
      config,
      input.paymentReference,
    );

    const status =
      match.unmatched === 0 && match.differenceAmount <= config.differenceThreshold
        ? "matched"
        : match.matched > 0
          ? "partial"
          : "mismatched";

    let record = this.metadataGenerator.buildReconciliationRecord(match, status);
    const validation = this.validationEngine.validateForReconciliation(record, config);
    if (validation.decision === "fail") {
      return { record: null, error: validation.errors.join("; "), warnings: snapshot.warnings };
    }

    record = { ...record, validationStatus: "passed" };
    this.registry.store(record, dedupeKey);

    appendRcLog({
      event: "payment_reconciliation",
      level: "info",
      details: `Reconciled payments ${record.reconciliationRecordId} · matched ${match.matched}`,
    });

    return { record, error: null, warnings: snapshot.warnings };
  }
}

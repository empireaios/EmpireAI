/** R3-08 — Revenue, expense, cash flow and full reconciliation execution. */

import { appendRcLog } from "./rc-logging.js";
import type { ReconciliationEngineConfiguration } from "./configuration.js";
import type { ReconciliationDataSource } from "./reconciliation-data-source.js";
import type { TransactionMatchingEngine } from "./transaction-matching-engine.js";
import type { ReconciliationMetadataGenerator } from "./reconciliation-metadata-generator.js";
import type { ReconciliationValidationEngine } from "./reconciliation-validator.js";
import type { ReconciliationRegistry } from "./reconciliation-registry.js";
import type {
  ReconcileAllInput,
  ReconcileCashFlowInput,
  ReconcileExpensesInput,
  ReconcileRevenueInput,
  ReconciliationRecord,
} from "./types.js";

export class ReconciliationExecutionEngine {
  constructor(
    private readonly registry: ReconciliationRegistry,
    private readonly metadataGenerator: ReconciliationMetadataGenerator,
    private readonly validationEngine: ReconciliationValidationEngine,
    private readonly matchingEngine: TransactionMatchingEngine,
    private readonly dataSource: ReconciliationDataSource,
  ) {}

  reconcileRevenue(
    input: ReconcileRevenueInput,
    config: ReconciliationEngineConfiguration,
    dedupeKey: string,
  ): { record: ReconciliationRecord | null; error: string | null; warnings: string[] } {
    return this.runReconciliation(
      "revenue_reconciliation",
      dedupeKey,
      config,
      (snapshot) =>
        this.matchingEngine.matchRevenueRecords(
          snapshot.revenues,
          snapshot.payments,
          config,
          input.revenueReference,
        ),
    );
  }

  reconcileExpenses(
    input: ReconcileExpensesInput,
    config: ReconciliationEngineConfiguration,
    dedupeKey: string,
  ): { record: ReconciliationRecord | null; error: string | null; warnings: string[] } {
    return this.runReconciliation(
      "expense_reconciliation",
      dedupeKey,
      config,
      (snapshot) =>
        this.matchingEngine.matchExpenseRecords(
          snapshot.expenses,
          snapshot.payments,
          config,
          input.expenseReference,
        ),
    );
  }

  reconcileCashFlow(
    input: ReconcileCashFlowInput,
    config: ReconciliationEngineConfiguration,
    dedupeKey: string,
  ): { record: ReconciliationRecord | null; error: string | null; warnings: string[] } {
    return this.runReconciliation(
      "cash_flow_reconciliation",
      dedupeKey,
      config,
      (snapshot) =>
        this.matchingEngine.matchCashFlowRecords(
          snapshot.cashFlowRecords,
          snapshot.revenues,
          snapshot.expenses,
          config,
          input.cashFlowReference,
        ),
    );
  }

  reconcileAll(
    _input: ReconcileAllInput,
    config: ReconciliationEngineConfiguration,
    dedupeKey: string,
  ): {
    records: ReconciliationRecord[];
    error: string | null;
    warnings: string[];
  } {
    if (this.registry.hasDedupeKey(dedupeKey)) {
      return { records: [], error: "Duplicate reconciliation event", warnings: [] };
    }

    const snapshot = this.dataSource.snapshot();
    const matches = [
      this.matchingEngine.matchPaymentsToRevenue(snapshot.payments, snapshot.revenues, config),
      this.matchingEngine.matchBankingTransactions(
        snapshot.transactions,
        snapshot.payments,
        snapshot.revenues,
        config,
      ),
      this.matchingEngine.matchRevenueRecords(snapshot.revenues, snapshot.payments, config),
      this.matchingEngine.matchExpenseRecords(snapshot.expenses, snapshot.payments, config),
      this.matchingEngine.matchCashFlowRecords(
        snapshot.cashFlowRecords,
        snapshot.revenues,
        snapshot.expenses,
        config,
      ),
    ];

    const records: ReconciliationRecord[] = [];
    for (const match of matches) {
      const status =
        match.unmatched === 0 && match.differenceAmount <= config.differenceThreshold
          ? "matched"
          : match.matched > 0
            ? "partial"
            : "mismatched";
      let record = this.metadataGenerator.buildReconciliationRecord(match, status);
      const validation = this.validationEngine.validateForReconciliation(record, config);
      if (validation.decision === "fail") continue;
      record = { ...record, validationStatus: "passed" };
      this.registry.store(record);
      records.push(record);
    }

    this.registry.store(
      records[records.length - 1] ?? this.metadataGenerator.buildReconciliationRecord(
        { matched: 0, unmatched: 0, differenceAmount: 0, paymentReference: null, bankingReference: null, revenueReference: null, expenseReference: null, cashFlowReference: null },
        "pending",
      ),
      dedupeKey,
    );

    appendRcLog({
      event: "full_reconciliation",
      level: "info",
      details: `Full reconciliation produced ${records.length} record(s)`,
    });

    return { records, error: null, warnings: snapshot.warnings };
  }

  private runReconciliation(
    event: string,
    dedupeKey: string,
    config: ReconciliationEngineConfiguration,
    matchFn: (snapshot: ReturnType<ReconciliationDataSource["snapshot"]>) => import("./transaction-matching-engine.js").MatchResult,
  ): { record: ReconciliationRecord | null; error: string | null; warnings: string[] } {
    if (this.registry.hasDedupeKey(dedupeKey)) {
      return { record: null, error: "Duplicate reconciliation event", warnings: [] };
    }

    const snapshot = this.dataSource.snapshot();
    const match = matchFn(snapshot);
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
      event,
      level: "info",
      details: `Reconciliation ${record.reconciliationRecordId} · matched ${match.matched}`,
    });

    return { record, error: null, warnings: snapshot.warnings };
  }
}

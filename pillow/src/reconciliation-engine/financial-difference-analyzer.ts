/** R3-08 — Financial difference analyzer. */

import { appendRcLog } from "./rc-logging.js";
import type { ReconciliationEngineConfiguration } from "./configuration.js";
import type { ReconciliationRegistry } from "./reconciliation-registry.js";
import type { ReconciliationMismatch } from "./types.js";
import type { MatchResult } from "./transaction-matching-engine.js";
import type { ReconciliationFinancialSnapshot } from "./reconciliation-data-source.js";

export class FinancialDifferenceAnalyzer {
  analyze(
    match: MatchResult,
    snapshot: ReconciliationFinancialSnapshot,
    config: ReconciliationEngineConfiguration,
    sourceType: ReconciliationMismatch["sourceType"],
    reconciliationRecordId: string | null,
  ): ReconciliationMismatch[] {
    const mismatches: ReconciliationMismatch[] = [];

    if (match.unmatched > 0) {
      mismatches.push({
        mismatchId: `rc-mis-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        severity: "high",
        description: `${match.unmatched} unmatched transaction(s) detected`,
        reconciliationRecordId,
        sourceType,
      });
    }

    if (match.differenceAmount > config.differenceThreshold) {
      mismatches.push({
        mismatchId: `rc-mis-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        severity: "high",
        description: `Reconciliation difference ${match.differenceAmount} exceeds threshold ${config.differenceThreshold}`,
        reconciliationRecordId,
        sourceType,
      });
    }

    if (config.duplicateDetectionEnabled) {
      const dupes = this.detectDuplicates(snapshot, sourceType);
      mismatches.push(...dupes.map((d) => ({
        mismatchId: `rc-mis-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        severity: "medium" as const,
        description: d,
        reconciliationRecordId,
        sourceType,
      })));
    }

    if (mismatches.length > 0) {
      appendRcLog({
        event: "reconciliation_difference",
        level: "warn",
        details: `Detected ${mismatches.length} reconciliation difference(s) for ${sourceType}`,
      });
    }

    return mismatches;
  }

  private detectDuplicates(
    snapshot: ReconciliationFinancialSnapshot,
    sourceType: ReconciliationMismatch["sourceType"],
  ): string[] {
    const findings: string[] = [];

    if (sourceType === "payment") {
      const ids = snapshot.payments.map((p) => p.paymentId);
      if (ids.length !== new Set(ids).size) findings.push("Duplicate payment IDs detected");
    }
    if (sourceType === "revenue") {
      const keys = snapshot.revenues.map(
        (r) => `${r.paymentReference ?? ""}:${r.netRevenue}`,
      );
      if (keys.length !== new Set(keys).size) {
        findings.push("Duplicate revenue records detected");
      }
    }
    if (sourceType === "expense") {
      const keys = snapshot.expenses.map(
        (e) => `${e.expenseSource}:${e.expenseAmount}:${e.supplierReference ?? ""}`,
      );
      if (keys.length !== new Set(keys).size) {
        findings.push("Duplicate expense records detected");
      }
    }

    return findings;
  }

  detectMissingRecords(
    snapshot: ReconciliationFinancialSnapshot,
    sourceType: ReconciliationMismatch["sourceType"],
    reconciliationRecordId: string | null,
  ): ReconciliationMismatch[] {
    const mismatches: ReconciliationMismatch[] = [];

    if (sourceType === "banking" && snapshot.bankingRecords.length === 0) {
      mismatches.push({
        mismatchId: `rc-mis-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        severity: "high",
        description: "Missing banking records",
        reconciliationRecordId,
        sourceType,
      });
    }
    if (sourceType === "payment" && snapshot.payments.length === 0) {
      mismatches.push({
        mismatchId: `rc-mis-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        severity: "high",
        description: "Missing payment records",
        reconciliationRecordId,
        sourceType,
      });
    }
    if (sourceType === "revenue" && snapshot.revenues.length === 0) {
      mismatches.push({
        mismatchId: `rc-mis-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        severity: "medium",
        description: "Missing revenue records",
        reconciliationRecordId,
        sourceType,
      });
    }

    return mismatches;
  }
}

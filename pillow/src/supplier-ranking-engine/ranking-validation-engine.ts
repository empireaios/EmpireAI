/** R2-08 — Ranking Validation Engine. */

import type { InvalidRankingFinding, SupplierMetricsSnapshot, SupplierRankingRecord } from "./types.js";
import type { SupplierRankingEngineConfiguration } from "./configuration.js";
import { SUPPORTED_SUPPLIER_IDENTIFIERS } from "./paths.js";

export class RankingValidationEngine {
  detectInvalidMetrics(metrics: SupplierMetricsSnapshot[]): InvalidRankingFinding[] {
    const findings: InvalidRankingFinding[] = [];

    for (const m of metrics) {
      const errors: string[] = [];
      if (!m.supplierId) errors.push("Missing supplierId");
      if (!(SUPPORTED_SUPPLIER_IDENTIFIERS as readonly string[]).includes(m.supplierId)) {
        errors.push(`Unsupported supplier: ${m.supplierId}`);
      }
      if (m.productCount < 0 || m.inStockCount < 0) {
        errors.push("Invalid metric counts");
      }
      if (errors.length) {
        findings.push({ supplierId: m.supplierId ?? "unknown", errors });
      }
    }

    return findings;
  }

  validateRankings(
    rankings: SupplierRankingRecord[],
    config: SupplierRankingEngineConfiguration,
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return { errors, warnings };
    }

    const seen = new Set<string>();
    const positions = new Set<number>();

    for (const record of rankings) {
      if (seen.has(record.supplierId)) {
        errors.push(`Duplicate ranking record: ${record.supplierId}`);
      }
      seen.add(record.supplierId);

      if (!record.rankingRecordId.startsWith("sre-")) {
        errors.push(`Invalid ranking record ID prefix: ${record.rankingRecordId}`);
      }
      if (record.overallSupplierScore < 0 || record.overallSupplierScore > 100) {
        errors.push(`Invalid overall score for ${record.supplierId}`);
      }
      if (positions.has(record.rankingPosition)) {
        warnings.push(`Duplicate ranking position: ${record.rankingPosition}`);
      }
      positions.add(record.rankingPosition);
    }

    return { errors, warnings };
  }
}

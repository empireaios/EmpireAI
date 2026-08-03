/** X2-13 — Supplier Performance Engine. */

import { appendSsiLog } from "./ssi-logging.js";
import type { EnterpriseSupplierRegistry } from "./enterprise-supplier-registry.js";
import type { SupplierIntelligenceRecord } from "./types.js";

export class SupplierPerformanceEngine {
  constructor(private readonly registry: EnterpriseSupplierRegistry) {}

  track(input: {
    supplierReference: string;
    performanceScore?: number;
    reliabilityScore?: number;
    costCompetitivenessScore?: number;
  }): SupplierIntelligenceRecord {
    const existing = this.registry.get(input.supplierReference);
    const performance =
      input.performanceScore ?? existing?.supplierPerformanceScore ?? 55;
    const reliability = input.reliabilityScore ?? existing?.reliabilityScore ?? 55;
    const cost =
      input.costCompetitivenessScore ?? existing?.costCompetitivenessScore ?? 55;
    const record = this.registry.upsert({
      supplierReference: input.supplierReference,
      associatedCompanies: existing?.associatedCompanies ?? [],
      supplierPerformanceScore: performance,
      reliabilityScore: reliability,
      costCompetitivenessScore: cost,
      recommendationSummary:
        existing?.recommendationSummary ?? "Performance tracked — pending recommendation",
      riskLevel: existing?.riskLevel ?? "low",
      duplicateDetected: existing?.duplicateDetected ?? false,
      sharedAcrossCompanies: existing?.sharedAcrossCompanies ?? false,
    });
    appendSsiLog({
      event: "supplier_performance_analysis",
      level: "info",
      details: `Performance tracked for ${input.supplierReference} perf=${performance} reliability=${reliability} cost=${cost}`,
    });
    return record;
  }
}

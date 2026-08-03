/** X2-13 — Supplier Intelligence Engine (sharing + optimization posture). */

import { appendSsiLog } from "./ssi-logging.js";
import type { SharedSupplierIntelligenceConfiguration } from "./configuration.js";
import type { EnterpriseSupplierRegistry } from "./enterprise-supplier-registry.js";
import type { SupplierIntelligenceRecord } from "./types.js";

export class SupplierIntelligenceEngine {
  constructor(private readonly registry: EnterpriseSupplierRegistry) {}

  share(input: {
    supplierReference: string;
    targetCompanies: string[];
    config: SharedSupplierIntelligenceConfiguration;
  }): SupplierIntelligenceRecord | null {
    if (!input.config.supplierSharingRulesEnabled) return null;
    const existing = this.registry.get(input.supplierReference);
    if (!existing) return null;
    const record = this.registry.upsert({
      supplierReference: input.supplierReference,
      associatedCompanies: [
        ...existing.associatedCompanies,
        ...input.targetCompanies.map((c) => c.trim()).filter(Boolean),
      ],
      supplierPerformanceScore: existing.supplierPerformanceScore,
      reliabilityScore: existing.reliabilityScore,
      costCompetitivenessScore: existing.costCompetitivenessScore,
      recommendationSummary: `Shared across portfolio companies: ${[
        ...new Set([...existing.associatedCompanies, ...input.targetCompanies]),
      ].join(", ")}`,
      riskLevel: existing.riskLevel,
      duplicateDetected: existing.duplicateDetected,
      sharedAcrossCompanies: true,
    });
    appendSsiLog({
      event: "supplier_intelligence_share",
      level: "info",
      details: `Shared ${input.supplierReference} to ${input.targetCompanies.length} companies`,
    });
    return record;
  }

  summarizeOptimal(
    records: SupplierIntelligenceRecord[],
    config: SharedSupplierIntelligenceConfiguration,
  ): SupplierIntelligenceRecord[] {
    return records
      .filter(
        (r) =>
          r.supplierPerformanceScore >= config.optimalPerformanceThreshold &&
          r.reliabilityScore >= config.reliabilityThreshold,
      )
      .map((r) =>
        this.registry.upsert({
          supplierReference: r.supplierReference,
          associatedCompanies: r.associatedCompanies,
          supplierPerformanceScore: r.supplierPerformanceScore,
          reliabilityScore: r.reliabilityScore,
          costCompetitivenessScore: r.costCompetitivenessScore,
          recommendationSummary: `Optimal supplier candidate — perf=${r.supplierPerformanceScore} reliability=${r.reliabilityScore}`,
          riskLevel: r.riskLevel,
          duplicateDetected: r.duplicateDetected,
          sharedAcrossCompanies: r.sharedAcrossCompanies,
        }),
      );
  }
}

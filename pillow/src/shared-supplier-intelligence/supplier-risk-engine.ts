/** X2-13 — Supplier Risk Engine. */

import type { SharedSupplierIntelligenceConfiguration } from "./configuration.js";
import type { EnterpriseSupplierRegistry } from "./enterprise-supplier-registry.js";
import type { RiskLevel, SupplierIntelligenceRecord, SupplierRiskSignal } from "./types.js";

export class SupplierRiskEngine {
  constructor(private readonly registry: EnterpriseSupplierRegistry) {}

  detect(
    records: SupplierIntelligenceRecord[],
    config: SharedSupplierIntelligenceConfiguration,
  ): SupplierRiskSignal[] {
    const signals: SupplierRiskSignal[] = [];
    for (const record of records) {
      if (record.reliabilityScore < 100 - config.riskScoreThreshold) {
        const severity: RiskLevel = record.reliabilityScore < 30 ? "high" : "medium";
        signals.push({
          riskId: `ssi-risk-${Date.now()}-rel-${record.supplierIntelligenceId}`,
          timestamp: new Date().toISOString(),
          supplierReference: record.supplierReference,
          riskType: "reliability",
          severity,
          rationale: `Low reliability score (${record.reliabilityScore})`,
          structuralSignalOnly: true,
        });
        this.registry.upsert({
          supplierReference: record.supplierReference,
          associatedCompanies: record.associatedCompanies,
          supplierPerformanceScore: record.supplierPerformanceScore,
          reliabilityScore: record.reliabilityScore,
          costCompetitivenessScore: record.costCompetitivenessScore,
          recommendationSummary: record.recommendationSummary,
          riskLevel: severity,
          duplicateDetected: record.duplicateDetected,
          sharedAcrossCompanies: record.sharedAcrossCompanies,
        });
      }
      if (record.costCompetitivenessScore < config.costCompetitivenessThreshold - 20) {
        signals.push({
          riskId: `ssi-risk-${Date.now()}-cost-${record.supplierIntelligenceId}`,
          timestamp: new Date().toISOString(),
          supplierReference: record.supplierReference,
          riskType: "cost",
          severity: "medium",
          rationale: `Weak cost competitiveness (${record.costCompetitivenessScore})`,
          structuralSignalOnly: true,
        });
      }
      if (record.associatedCompanies.length >= 3) {
        signals.push({
          riskId: `ssi-risk-${Date.now()}-conc-${record.supplierIntelligenceId}`,
          timestamp: new Date().toISOString(),
          supplierReference: record.supplierReference,
          riskType: "concentration",
          severity: "low",
          rationale: "Supplier concentrated across many portfolio companies",
          structuralSignalOnly: true,
        });
      }
    }
    return signals;
  }

  detectDuplicates(records: SupplierIntelligenceRecord[]): {
    signals: SupplierRiskSignal[];
    updated: SupplierIntelligenceRecord[];
  } {
    const byNormalized = new Map<string, SupplierIntelligenceRecord[]>();
    for (const record of records) {
      const key = record.supplierReference.toLowerCase().replace(/[^a-z0-9]/g, "");
      const list = byNormalized.get(key) ?? [];
      list.push(record);
      byNormalized.set(key, list);
    }

    const signals: SupplierRiskSignal[] = [];
    const updated: SupplierIntelligenceRecord[] = [];
    for (const [, group] of byNormalized) {
      if (group.length < 2) continue;
      for (const record of group) {
        signals.push({
          riskId: `ssi-risk-${Date.now()}-dup-${record.supplierIntelligenceId}`,
          timestamp: new Date().toISOString(),
          supplierReference: record.supplierReference,
          riskType: "duplication",
          severity: "medium",
          rationale: `Duplicate supplier identity cluster size=${group.length}`,
          structuralSignalOnly: true,
        });
        updated.push(
          this.registry.upsert({
            supplierReference: record.supplierReference,
            associatedCompanies: record.associatedCompanies,
            supplierPerformanceScore: record.supplierPerformanceScore,
            reliabilityScore: record.reliabilityScore,
            costCompetitivenessScore: record.costCompetitivenessScore,
            recommendationSummary: record.recommendationSummary,
            riskLevel: record.riskLevel,
            duplicateDetected: true,
            sharedAcrossCompanies: record.sharedAcrossCompanies,
          }),
        );
      }
    }
    return { signals, updated };
  }
}

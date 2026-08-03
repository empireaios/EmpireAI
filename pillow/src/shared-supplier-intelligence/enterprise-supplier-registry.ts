/** X2-13 — Enterprise Supplier Registry. */

import { appendSsiLog } from "./ssi-logging.js";
import { SSI_METADATA_VERSION } from "./paths.js";
import type { RiskLevel, SupplierIntelligenceRecord } from "./types.js";

export class EnterpriseSupplierRegistry {
  private records = new Map<string, SupplierIntelligenceRecord>();

  list(): SupplierIntelligenceRecord[] {
    return [...this.records.values()];
  }

  get(supplierReference: string): SupplierIntelligenceRecord | null {
    return this.records.get(supplierReference) ?? null;
  }

  upsert(input: {
    supplierReference: string;
    associatedCompanies: string[];
    supplierPerformanceScore: number;
    reliabilityScore: number;
    costCompetitivenessScore: number;
    recommendationSummary: string;
    riskLevel: RiskLevel;
    duplicateDetected: boolean;
    sharedAcrossCompanies: boolean;
  }): SupplierIntelligenceRecord {
    const existing = this.records.get(input.supplierReference);
    const companies = [
      ...new Set([
        ...(existing?.associatedCompanies ?? []),
        ...input.associatedCompanies.map((c) => c.trim()).filter(Boolean),
      ]),
    ];
    const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
    const record: SupplierIntelligenceRecord = {
      supplierIntelligenceId: existing?.supplierIntelligenceId ?? `ssi-si-${Date.now()}`,
      timestamp: new Date().toISOString(),
      supplierReference: input.supplierReference.trim(),
      associatedCompanies: companies,
      supplierPerformanceScore: clamp(input.supplierPerformanceScore),
      reliabilityScore: clamp(input.reliabilityScore),
      costCompetitivenessScore: clamp(input.costCompetitivenessScore),
      recommendationSummary: input.recommendationSummary,
      validationStatus: "passed",
      metadataVersion: SSI_METADATA_VERSION,
      riskLevel: input.riskLevel,
      duplicateDetected: input.duplicateDetected,
      sharedAcrossCompanies: companies.length > 1 || input.sharedAcrossCompanies,
      structuralSignalOnly: true,
      agreementSafe: true,
      sensitiveSupplierData: false,
    };
    this.records.set(record.supplierReference, record);
    appendSsiLog({
      event: "supplier_synchronization",
      level: "info",
      details: `Consolidated supplier ${record.supplierReference} companies=${record.associatedCompanies.length}`,
    });
    return { ...record };
  }

  resetForTesting(): void {
    this.records.clear();
  }
}

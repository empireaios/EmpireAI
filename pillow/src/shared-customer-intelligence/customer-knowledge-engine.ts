/** X2-12 — Customer Knowledge Engine (consolidation registry). */

import { appendSciLog } from "./sci-logging.js";
import { SCI_METADATA_VERSION } from "./paths.js";
import type { CustomerIntelligenceRecord, RiskLevel } from "./types.js";

export class CustomerKnowledgeEngine {
  private records = new Map<string, CustomerIntelligenceRecord>();

  list(): CustomerIntelligenceRecord[] {
    return [...this.records.values()];
  }

  get(customerReference: string): CustomerIntelligenceRecord | null {
    return this.records.get(customerReference) ?? null;
  }

  upsert(input: {
    customerReference: string;
    associatedCompanies: string[];
    customerProfileSummary: string;
    behaviourSummary: string;
    lifetimeValueEstimate: number;
    recommendedOpportunities: string[];
    preferenceSignals: string[];
    riskLevel: RiskLevel;
    crossCompanyRelationship: boolean;
  }): CustomerIntelligenceRecord {
    const existing = this.records.get(input.customerReference);
    const companies = [
      ...new Set([
        ...(existing?.associatedCompanies ?? []),
        ...input.associatedCompanies.map((c) => c.trim()).filter(Boolean),
      ]),
    ];
    const record: CustomerIntelligenceRecord = {
      customerIntelligenceId: existing?.customerIntelligenceId ?? `sci-ci-${Date.now()}`,
      timestamp: new Date().toISOString(),
      customerReference: input.customerReference.trim(),
      associatedCompanies: companies,
      customerProfileSummary: input.customerProfileSummary,
      behaviourSummary: input.behaviourSummary,
      lifetimeValueEstimate: Math.max(
        0,
        Math.min(100, Math.round(input.lifetimeValueEstimate)),
      ),
      recommendedOpportunities: [...new Set(input.recommendedOpportunities)],
      validationStatus: "passed",
      metadataVersion: SCI_METADATA_VERSION,
      preferenceSignals: [...new Set(input.preferenceSignals)],
      riskLevel: input.riskLevel,
      crossCompanyRelationship: companies.length > 1 || input.crossCompanyRelationship,
      structuralSignalOnly: true,
      privacySafe: true,
      sensitiveCustomerData: false,
    };
    this.records.set(record.customerReference, record);
    appendSciLog({
      event: "customer_synchronization",
      level: "info",
      details: `Consolidated customer knowledge for ${record.customerReference} companies=${record.associatedCompanies.length}`,
    });
    return { ...record };
  }

  resetForTesting(): void {
    this.records.clear();
  }
}

/** X2-12 — Customer Identity Resolution Engine. */

import { appendSciLog } from "./sci-logging.js";
import type { CustomerKnowledgeEngine } from "./customer-knowledge-engine.js";
import type { CustomerIntelligenceRecord } from "./types.js";

export class CustomerIdentityResolutionEngine {
  constructor(private readonly knowledge: CustomerKnowledgeEngine) {}

  resolve(input: {
    customerReference: string;
    companyReferences: string[];
  }): CustomerIntelligenceRecord {
    const existing = this.knowledge.get(input.customerReference);
    const companies = [
      ...new Set([
        ...(existing?.associatedCompanies ?? []),
        ...input.companyReferences.map((c) => c.trim()).filter(Boolean),
      ]),
    ];
    const record = this.knowledge.upsert({
      customerReference: input.customerReference,
      associatedCompanies: companies,
      customerProfileSummary:
        existing?.customerProfileSummary ??
        `Structural profile for ${input.customerReference}`,
      behaviourSummary: existing?.behaviourSummary ?? "Behaviour pending analysis",
      lifetimeValueEstimate: existing?.lifetimeValueEstimate ?? 50,
      recommendedOpportunities: existing?.recommendedOpportunities ?? [],
      preferenceSignals: existing?.preferenceSignals ?? [],
      riskLevel: existing?.riskLevel ?? "low",
      crossCompanyRelationship: companies.length > 1,
    });
    appendSciLog({
      event: "identity_resolution",
      level: "info",
      details: `Resolved ${input.customerReference} across ${companies.length} companies`,
    });
    return record;
  }
}

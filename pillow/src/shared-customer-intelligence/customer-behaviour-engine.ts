/** X2-12 — Customer Behaviour Engine. */

import { appendSciLog } from "./sci-logging.js";
import type { CustomerKnowledgeEngine } from "./customer-knowledge-engine.js";
import type { CustomerIntelligenceRecord } from "./types.js";

export class CustomerBehaviourEngine {
  constructor(private readonly knowledge: CustomerKnowledgeEngine) {}

  analyze(input: {
    customerReference: string;
    behaviourSignals?: string[];
  }): CustomerIntelligenceRecord {
    const existing = this.knowledge.get(input.customerReference);
    const signals = input.behaviourSignals?.length
      ? input.behaviourSignals
      : ["repeat_engagement", "multi_touch_journey"];
    const summary = `Patterns: ${signals.join(", ")}`;
    const record = this.knowledge.upsert({
      customerReference: input.customerReference,
      associatedCompanies: existing?.associatedCompanies ?? [],
      customerProfileSummary:
        existing?.customerProfileSummary ??
        `Structural profile for ${input.customerReference}`,
      behaviourSummary: summary,
      lifetimeValueEstimate: existing?.lifetimeValueEstimate ?? 50,
      recommendedOpportunities: existing?.recommendedOpportunities ?? [],
      preferenceSignals: [
        ...new Set([...(existing?.preferenceSignals ?? []), ...signals.slice(0, 3)]),
      ],
      riskLevel: existing?.riskLevel ?? "low",
      crossCompanyRelationship: existing?.crossCompanyRelationship ?? false,
    });
    appendSciLog({
      event: "insight_generation",
      level: "info",
      details: `Behaviour analyzed for ${input.customerReference} signals=${signals.length}`,
    });
    return record;
  }
}

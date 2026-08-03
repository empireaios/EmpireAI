/** X2-02 — Registry recommendation engine. */

import { appendMcrLog } from "./mcr-logging.js";
import type { CompanyRegistrationEngine } from "./company-registration-engine.js";
import type { RegistryRecommendation } from "./types.js";

export class RegistryRecommendationEngine {
  constructor(private readonly registration: CompanyRegistrationEngine) {}

  recommend(companyId?: string): RegistryRecommendation[] {
    const companies = companyId
      ? [this.registration.get(companyId)].filter(Boolean)
      : this.registration.list();

    const recommendations: RegistryRecommendation[] = [];

    for (const company of companies) {
      if (!company) continue;

      if (company.operationalStatus === "pending") {
        recommendations.push({
          recommendationId: `mcr-rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          companyId: company.companyId,
          recommendationType: "activate",
          rationale: "Company is pending — advance lifecycle toward operating",
          priority: "medium",
          structuralSignalOnly: true,
        });
      }

      if (company.companyCategory === "general") {
        recommendations.push({
          recommendationId: `mcr-rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          companyId: company.companyId,
          recommendationType: "reclassify",
          rationale: "General category — refine classification for portfolio visibility",
          priority: "low",
          structuralSignalOnly: true,
        });
      }

      if (company.companyLifecycleStage === "forming") {
        recommendations.push({
          recommendationId: `mcr-rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          companyId: company.companyId,
          recommendationType: "advance_lifecycle",
          rationale: "Forming stage — prepare launch transition when ready",
          priority: "medium",
          structuralSignalOnly: true,
        });
      }
    }

    const duplicates = this.registration.findDuplicates(companyId);
    if (duplicates.length > 0) {
      recommendations.push({
        recommendationId: `mcr-rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        companyId: companyId ?? duplicates[0]?.companyId ?? null,
        recommendationType: "resolve_duplicate",
        rationale: `Detected ${duplicates.length} duplicate identity signal(s)`,
        priority: "high",
        structuralSignalOnly: true,
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        recommendationId: `mcr-rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        companyId: companyId ?? null,
        recommendationType: "update_profile",
        rationale: "Registry healthy — continue profile maintenance",
        priority: "low",
        structuralSignalOnly: true,
      });
    }

    appendMcrLog({
      event: "registry_recommendations",
      level: "info",
      details: `Generated ${recommendations.length} recommendation(s)`,
    });

    return recommendations;
  }
}

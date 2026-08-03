/** X1-10 — Store Readiness Engine (structural signals only). */

import type { DomainScore } from "./business-validation-engine.js";

export class StoreReadinessEngine {
  validateStorefrontReadiness(input: {
    hasStorefront: boolean;
    deploymentReadiness?: string;
    automaticDeployment?: boolean;
  }): DomainScore {
    if (!input.hasStorefront) {
      return { present: false, score: 10, note: "storefront-missing" };
    }
    let score = 80;
    if (input.deploymentReadiness === "ready_for_validation") score += 10;
    if (input.automaticDeployment === true) score -= 40;
    return {
      present: true,
      score: Math.max(0, Math.min(100, score)),
      note: "storefront-structured",
    };
  }
}

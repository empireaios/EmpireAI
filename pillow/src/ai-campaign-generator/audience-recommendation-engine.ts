/** R5-12 — Audience Recommendation Engine. */

import type { CampaignObjective } from "./types.js";

export class AudienceRecommendationEngine {
  recommend(input: {
    objective: CampaignObjective;
    audienceHints: string[];
    productFocus?: string;
  }): string {
    if (input.audienceHints.length > 0) {
      return `Primary: ${input.audienceHints.slice(0, 3).join(" · ")} · objective=${input.objective}`;
    }
    const focus = input.productFocus?.trim() || "core product";
    const defaults: Record<CampaignObjective, string> = {
      awareness: `Broad lookalike prospects interested in ${focus}`,
      traffic: `In-market researchers exploring ${focus}`,
      engagement: `Warm visitors and social engagers for ${focus}`,
      leads: `High-intent demo seekers for ${focus}`,
      conversions: `Cart/view retargeting + high LTV lookalikes for ${focus}`,
      retention: `Existing customers and churn-risk segments for ${focus}`,
    };
    return defaults[input.objective];
  }
}

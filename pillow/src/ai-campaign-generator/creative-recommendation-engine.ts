/** R5-12 — Creative Recommendation Engine. */

import type { CampaignObjective } from "./types.js";

export class CreativeRecommendationEngine {
  recommendKeywords(input: {
    objective: CampaignObjective;
    productFocus?: string;
    seoHints: string[];
  }): string[] {
    const focus = (input.productFocus?.trim() || "empireai").toLowerCase();
    const seeds = [
      focus,
      `${focus} software`,
      `${focus} platform`,
      `best ${focus}`,
      `${focus} pricing`,
    ];
    const objectiveSeeds: Record<CampaignObjective, string[]> = {
      awareness: [`what is ${focus}`, `${focus} overview`],
      traffic: [`${focus} demo`, `${focus} features`],
      engagement: [`${focus} community`, `${focus} tips`],
      leads: [`${focus} free trial`, `${focus} consultation`],
      conversions: [`buy ${focus}`, `${focus} discount`],
      retention: [`${focus} upgrade`, `${focus} support`],
    };
    return [...new Set([...seeds, ...objectiveSeeds[input.objective], ...input.seoHints])].slice(
      0,
      12,
    );
  }

  recommendCreatives(input: {
    objective: CampaignObjective;
    creativeAssetIds: string[];
  }): string[] {
    if (input.creativeAssetIds.length > 0) {
      return input.creativeAssetIds.slice(0, 5);
    }
    return [
      `placeholder://${input.objective}/hero-image`,
      `placeholder://${input.objective}/video-spot`,
      `placeholder://${input.objective}/offer-document`,
    ];
  }
}

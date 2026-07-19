/** R4-17 — Journey Optimization Engine. */

import type { CustomerJourneyIntelligenceConfiguration } from "./configuration.js";
import type { RecommendedJourneyAction } from "./types.js";

export class JourneyOptimizationEngine {
  recommend(
    frictionIndicators: string[],
    dropOffIndicators: string[],
    config: CustomerJourneyIntelligenceConfiguration,
  ): RecommendedJourneyAction[] {
    if (!config.optimizationRulesEnabled) return ["no_action"];

    const actions = new Set<RecommendedJourneyAction>();

    for (const rule of config.optimizationRules) {
      if (!rule.enabled) continue;
      if (dropOffIndicators.length >= rule.frictionThreshold && rule.action === "re_engage") {
        actions.add("re_engage");
      }
      if (frictionIndicators.length >= rule.frictionThreshold && rule.action === "escalate_support") {
        actions.add("escalate_support");
      }
    }

    if (frictionIndicators.includes("repeat_support_friction")) actions.add("resolve_friction");
    if (dropOffIndicators.includes("consideration_abandonment")) actions.add("offer_incentive");
    if (frictionIndicators.length === 0 && dropOffIndicators.length === 0) actions.add("nurture");
    if (actions.size === 0) actions.add("engage");

    return [...actions];
  }
}

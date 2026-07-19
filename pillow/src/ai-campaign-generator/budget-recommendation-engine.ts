/** R5-12 — Budget Recommendation Engine. */

import type { CampaignObjective, MarketingChannel } from "./types.js";

export class BudgetRecommendationEngine {
  recommend(input: {
    objective: CampaignObjective;
    requestedBudget?: number;
    defaultBudgetUsd: number;
    channels: MarketingChannel[];
    durationDays: number;
  }): number {
    const base = input.requestedBudget && input.requestedBudget > 0
      ? input.requestedBudget
      : input.defaultBudgetUsd;
    const objectiveMultiplier: Record<CampaignObjective, number> = {
      awareness: 1.1,
      traffic: 1.0,
      engagement: 0.9,
      leads: 1.15,
      conversions: 1.25,
      retention: 0.85,
    };
    const channelBoost = 1 + Math.max(0, input.channels.length - 1) * 0.08;
    const durationBoost = Math.min(1.4, Math.max(0.7, input.durationDays / 14));
    return Math.round(base * objectiveMultiplier[input.objective] * channelBoost * durationBoost);
  }

  recommendSchedule(durationDays: number): {
    startDate: string;
    endDate: string;
    durationDays: number;
    pacing: "even" | "front_loaded" | "back_loaded";
  } {
    const days = Math.max(3, Math.min(90, durationDays));
    const start = new Date();
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      durationDays: days,
      pacing: days <= 7 ? "front_loaded" : days >= 30 ? "back_loaded" : "even",
    };
  }
}

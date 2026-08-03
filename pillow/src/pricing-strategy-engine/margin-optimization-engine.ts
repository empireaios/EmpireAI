/** X1-09 — Margin Optimization Engine (structural signals only). */

import type { PricingModel } from "./types.js";

function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

export class MarginOptimizationEngine {
  targetMargin(industry: string, model: PricingModel): number {
    const base =
      model === "premium"
        ? 42
        : model === "value_based"
          ? 36
          : model === "penetration"
            ? 18
            : model === "competitive"
              ? 24
              : 28;
    const lift = industry.toLowerCase().includes("digital") ? 4 : 0;
    return clamp(base + lift);
  }

  detectUnprofitable(margin: number, sellingPrice: number): string {
    const flags: string[] = [];
    if (margin < 15) flags.push("low-margin");
    if (sellingPrice < 10) flags.push("price-floor-risk");
    if (flags.length === 0) return "none";
    return flags.join(" | ");
  }
}

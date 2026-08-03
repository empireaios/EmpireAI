/** X1-09 — Price Calculation Engine (structural signals only). */

import type { PricingModel } from "./types.js";

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n * 100) / 100));
}

function industryBase(industry: string): number {
  const token = industry.toLowerCase();
  if (token.includes("digital") || token.includes("software")) return 49;
  if (token.includes("health") || token.includes("wellness")) return 59;
  if (token.includes("consumer")) return 39;
  return 44;
}

export class PriceCalculationEngine {
  selectModel(industry: string, preferred?: PricingModel): PricingModel {
    if (preferred) return preferred;
    const token = industry.toLowerCase();
    if (token.includes("premium") || token.includes("luxury")) return "premium";
    if (token.includes("digital") || token.includes("software")) return "value_based";
    if (token.includes("consumer")) return "competitive";
    return "cost_plus";
  }

  calculateSellingPrice(industry: string, model: PricingModel, marginTarget: number): number {
    const base = industryBase(industry);
    const modelLift =
      model === "premium"
        ? 1.35
        : model === "value_based"
          ? 1.2
          : model === "penetration"
            ? 0.85
            : model === "competitive"
              ? 1.0
              : 1.1;
    const marginFactor = 1 + marginTarget / 100;
    return clamp(base * modelLift * marginFactor, 5, 9999);
  }
}

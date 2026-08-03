/** X1-04 — Revenue Model Engine (structural signals). */

import type { BusinessModelRecord, RevenueModelType } from "./types.js";

export class RevenueModelEngine {
  selectRevenueModel(industry: string, structuralHealth: number): RevenueModelType {
    const normalized = industry.toLowerCase();
    if (normalized.includes("saas") || normalized.includes("digital")) return "subscription";
    if (normalized.includes("marketplace")) return "marketplace_commission";
    if (normalized.includes("commerce") || normalized.includes("goods")) return "product_sales";
    if (structuralHealth >= 75) return "hybrid_structural";
    return "freemium";
  }

  applyRevenueModel(
    record: BusinessModelRecord,
    revenueModel: RevenueModelType,
  ): BusinessModelRecord {
    return {
      ...record,
      revenueModel,
      structuralSignalOnly: true,
      fabricatedValidationResults: false,
      timestamp: new Date().toISOString(),
    };
  }
}

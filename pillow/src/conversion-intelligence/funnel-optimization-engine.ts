/** R5-14 — Funnel Optimization Engine. */

import { FUNNEL_STAGES } from "./paths.js";
import type { ConversionRecord, FunnelStage } from "./types.js";

export class FunnelOptimizationEngine {
  nextStage(stage: FunnelStage): FunnelStage {
    const index = FUNNEL_STAGES.indexOf(stage);
    if (index < 0 || index >= FUNNEL_STAGES.length - 1) return stage;
    return FUNNEL_STAGES[index + 1]!;
  }

  optimize(record: ConversionRecord): ConversionRecord {
    const improvedConversion = Math.min(100, record.conversionRate + 2.5);
    const reducedDropOff = Math.max(0, record.dropOffRate - 5);
    const improvedLanding = Math.min(100, record.landingPageScore + 3);
    const targetStage =
      record.bottleneckDetected || record.abandonmentDetected
        ? record.funnelStage
        : this.nextStage(record.funnelStage);

    return {
      ...record,
      funnelStage: targetStage,
      conversionRate: Math.round(improvedConversion * 100) / 100,
      dropOffRate: Math.round(reducedDropOff * 100) / 100,
      landingPageScore: Math.round(improvedLanding * 100) / 100,
      bottleneckDetected: false,
      abandonmentDetected: false,
      appliedToProductionCampaign: false,
      recommendedOptimization: `Structural funnel optimization at ${targetStage} — not applied to production.`,
      timestamp: new Date().toISOString(),
    };
  }

  optimizeSet(records: ConversionRecord[]): ConversionRecord[] {
    return records.map((record) => this.optimize(record));
  }
}

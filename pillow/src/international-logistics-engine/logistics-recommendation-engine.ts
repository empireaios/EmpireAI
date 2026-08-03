/** X4-08 — Logistics Recommendation Engine. */

import type { InternationalLogisticsEngineConfiguration } from "./configuration.js";
import type { LogisticsRecommendation, LogisticsRecord } from "./types.js";

export class LogisticsRecommendationEngine {
  generate(
    records: LogisticsRecord[],
    config: InternationalLogisticsEngineConfiguration,
  ): LogisticsRecommendation[] {
    return records
      .filter(
        (r) =>
          (r.validationStatus === "passed" || r.validationStatus === "partial") &&
          r.neverRecommendWithUnvalidatedLogisticsData === true &&
          r.unvalidatedRecommendationClaim === "none" &&
          (r.bottleneckDetected ||
            r.fulfillmentRiskDetected ||
            r.fulfillmentStatus === "constrained" ||
            r.fulfillmentStatus === "partial" ||
            r.fulfillmentStatus === "under_review" ||
            r.deliveryPerformance > config.deliveryThreshold),
      )
      .map((r) => ({
        recommendationId: `ile-rec-${Date.now()}-${r.originRegion}-${r.destinationRegion}`,
        timestamp: new Date().toISOString(),
        companyReference: r.companyReference,
        originRegion: r.originRegion,
        destinationRegion: r.destinationRegion,
        logisticsProvider: r.logisticsProvider,
        riskLevel: r.riskLevel,
        recommendationSummary: `Address ${r.logisticsCategory} ${r.originRegion}->${r.destinationRegion} (status=${r.fulfillmentStatus}, risk=${r.riskLevel}) — validated logistics only`,
        structuralSignalOnly: true as const,
        neverRecommendWithUnvalidatedLogisticsData: true as const,
        unvalidatedRecommendationClaim: "none" as const,
      }));
  }
}

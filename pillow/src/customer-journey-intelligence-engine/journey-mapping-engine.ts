/** R4-17 — Journey Mapping Engine. */

import type { CustomerJourneyIntelligenceConfiguration } from "./configuration.js";
import type { CustomerJourneySignals, JourneyStage } from "./types.js";

export class JourneyMappingEngine {
  mapStage(
    signals: CustomerJourneySignals,
    config: CustomerJourneyIntelligenceConfiguration,
  ): JourneyStage {
    if (!config.journeyMappingRulesEnabled) {
      return signals.purchaseCount > 0 ? "purchase" : "awareness";
    }

    if (signals.daysSinceLastEvent >= config.dropOffInactivityDays) return "churned";
    if (signals.negativeSentimentCount >= 2 || signals.assignedSegments.includes("at_risk")) {
      return "at_risk";
    }
    if (signals.lifetimeValue >= config.conversionPurchaseThreshold * 200 && signals.purchaseCount >= 3) {
      return "advocacy";
    }
    if (signals.purchaseCount >= config.conversionPurchaseThreshold && signals.timelineEventCount >= 3) {
      return "retention";
    }
    if (signals.purchaseCount >= config.conversionPurchaseThreshold) return "purchase";
    if (signals.timelineEventCount >= 2 || signals.supportCount >= 1) return "consideration";
    return "awareness";
  }

  mapTouchpoints(signals: CustomerJourneySignals): string[] {
    return [...signals.touchpointReferences];
  }
}

/** T2-03 — Rejection event analyzer. */

import type { ExecutiveStyleLearningConfiguration } from "./configuration.js";
import type { PreferenceLearningEvent } from "./types.js";

export class RejectionAnalyzer {
  analyze(
    event: PreferenceLearningEvent,
    config: ExecutiveStyleLearningConfiguration,
  ): { confidenceDelta: number; valid: boolean; reason: string | null } {
    if (event.eventType !== "rejection") {
      return { confidenceDelta: 0, valid: false, reason: "Not a rejection event" };
    }
    if (!config.preferenceCategories.includes(event.category)) {
      return { confidenceDelta: 0, valid: false, reason: `Category ${event.category} not enabled` };
    }
    if (!event.value?.trim()) {
      return { confidenceDelta: 0, valid: false, reason: "Missing preference value" };
    }
    return {
      confidenceDelta: -config.rejectionWeight,
      valid: true,
      reason: null,
    };
  }
}

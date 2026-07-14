/** T2-03 — Approval event analyzer. */

import type { ExecutiveStyleLearningConfiguration } from "./configuration.js";
import type { PreferenceLearningEvent } from "./types.js";

export class ApprovalAnalyzer {
  analyze(
    event: PreferenceLearningEvent,
    config: ExecutiveStyleLearningConfiguration,
  ): { confidenceDelta: number; valid: boolean; reason: string | null } {
    if (event.eventType !== "approval") {
      return { confidenceDelta: 0, valid: false, reason: "Not an approval event" };
    }
    if (!config.preferenceCategories.includes(event.category)) {
      return { confidenceDelta: 0, valid: false, reason: `Category ${event.category} not enabled` };
    }
    if (!event.value?.trim()) {
      return { confidenceDelta: 0, valid: false, reason: "Missing preference value" };
    }
    return {
      confidenceDelta: config.approvalWeight,
      valid: true,
      reason: null,
    };
  }
}

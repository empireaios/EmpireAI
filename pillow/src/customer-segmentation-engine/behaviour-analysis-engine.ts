/** R4-16 — Behaviour Analysis Engine. */

import type { CustomerSegmentSignals } from "./types.js";

export class BehaviourAnalysisEngine {
  analyze(signals: CustomerSegmentSignals): {
    purchaseIntensity: "none" | "low" | "medium" | "high";
    engagementLevel: "dormant" | "passive" | "active";
  } {
    let purchaseIntensity: "none" | "low" | "medium" | "high" = "none";
    if (signals.purchaseCount >= 5) purchaseIntensity = "high";
    else if (signals.purchaseCount >= 3) purchaseIntensity = "medium";
    else if (signals.purchaseCount >= 1) purchaseIntensity = "low";

    let engagementLevel: "dormant" | "passive" | "active" = "passive";
    if (signals.timelineEventCount === 0) engagementLevel = "dormant";
    else if (signals.timelineEventCount >= 3 || signals.purchaseCount >= 2) {
      engagementLevel = "active";
    }

    return { purchaseIntensity, engagementLevel };
  }
}

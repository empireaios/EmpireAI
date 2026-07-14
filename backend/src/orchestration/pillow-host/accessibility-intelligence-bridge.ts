import { buildAccessibilityIntelligenceConfiguration } from "@empireai/pillow";
import type {
  AccessibilityReviewReport,
  AccessibilityIntelligenceState,
} from "@empireai/pillow";

function buildOfflineAccessibilityState(): AccessibilityIntelligenceState {
  const configuration = buildAccessibilityIntelligenceConfiguration();
  return {
    engineVersion: "PILLOW-AII-001",
    missionId: "T2-06",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestRecord: null,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      reviewEnabled: configuration.enabled,
      reviewsCompleted: 0,
      lastReviewAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalReviews: 0,
      successfulReviews: 0,
      failedReviews: 0,
      totalFindingsDetected: 0,
      totalStrengthsIdentified: 0,
      averageReviewDurationMs: 0,
      peakReviewDurationMs: 0,
    },
  };
}

/** Fallback Accessibility Intelligence snapshot when Pillow session is unavailable. */
export function collectAccessibilityIntelligenceSnapshot() {
  const engine = buildOfflineAccessibilityState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T2-06",
    live: false,
    engine,
    cockpit: {
      reviewStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      findingsCount: 0,
      strengthsCount: 0,
      severity: null,
      confidenceScore: 0,
      totalReviews: 0,
      recentLogs: [],
    },
    latestReport: null as AccessibilityReviewReport | null,
  };
}

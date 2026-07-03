/**
 * G7-08 — Cockpit self-healing backend contracts.
 */

import type {
  HealingActionRecord,
  HealingQueueEntry,
  HealingRecommendation,
  RecoveryConfidenceSummary,
  SelfHealingOverview,
} from "./self-healing-types.js";
import type { HealthState } from "../../../registry/types/self-healing-registry-types.js";

export const COCKPIT_SELF_HEALING_VIEW_ID = "cockpit-grand-king-self-healing-operations" as const;

export type CockpitSelfHealingView = {
  viewId: typeof COCKPIT_SELF_HEALING_VIEW_ID;
  computedAt: string;
  dataMode: "self-healing";
  systemHealth: { overallHealth: HealthState; domainCount: number };
  healingQueue: { count: number; queue: HealingQueueEntry[] };
  activeRecoveries: Array<Pick<HealingActionRecord, "healingId" | "targetSubsystem" | "healingAction" | "executionStatus">>;
  recoveryConfidence: RecoveryConfidenceSummary;
  healingHistory: Array<{ healingId: string; executionStatus: string; result: string; timestamp: string }>;
  healingRecommendations: { count: number; recommendations: HealingRecommendation[] };
  executiveSummary: string;
  selfHealingOverview: SelfHealingOverview;
  discoverySource: "grand-king-self-healing-operations:cockpit";
  designLanguage: "g4-cockpit";
};

export function buildCockpitSelfHealingView(input: {
  overview: SelfHealingOverview;
  queue: HealingQueueEntry[];
  confidence: RecoveryConfidenceSummary;
  recommendations: HealingRecommendation[];
  activeRecoveries: HealingActionRecord[];
  history: CockpitSelfHealingView["healingHistory"];
  executiveSummary: string;
}): CockpitSelfHealingView {
  return {
    viewId: COCKPIT_SELF_HEALING_VIEW_ID,
    computedAt: new Date().toISOString(),
    dataMode: "self-healing",
    systemHealth: { overallHealth: input.overview.overallHealth, domainCount: input.overview.domainCount },
    healingQueue: { count: input.queue.length, queue: input.queue },
    activeRecoveries: input.activeRecoveries.map((h) => ({
      healingId: h.healingId,
      targetSubsystem: h.targetSubsystem,
      healingAction: h.healingAction,
      executionStatus: h.executionStatus,
    })),
    recoveryConfidence: input.confidence,
    healingHistory: input.history,
    healingRecommendations: { count: input.recommendations.length, recommendations: input.recommendations },
    executiveSummary: input.executiveSummary,
    selfHealingOverview: input.overview,
    discoverySource: "grand-king-self-healing-operations:cockpit",
    designLanguage: "g4-cockpit",
  };
}

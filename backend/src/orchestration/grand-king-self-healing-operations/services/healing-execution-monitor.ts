/**
 * G7-08 — Healing execution monitor.
 */

import type { HealingQueueEntry, SelfHealingStatistics } from "../contracts/self-healing-types.js";
import { listHealingActions } from "./healing-action-store.js";
import { computeRecoveryConfidenceSummary } from "./recovery-confidence-scorer.js";

export function buildHealingQueue(): HealingQueueEntry[] {
  return listHealingActions()
    .filter((h) => ["waiting", "recommended", "approval_pending", "executing"].includes(h.executionStatus))
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .map((h, i) => ({
      queuePosition: i + 1,
      healingId: h.healingId,
      domainId: h.domainId,
      healingAction: h.healingAction,
      confidenceScore: h.confidenceScore,
      executionStatus: h.executionStatus,
    }));
}

export function computeSelfHealingStatistics(): SelfHealingStatistics {
  const records = listHealingActions();
  const completed = records.filter((r) => r.executionStatus === "completed").length;
  const failed = records.filter((r) => r.executionStatus === "failed").length;
  const active = records.filter((r) => r.executionStatus === "executing").length;
  const total = records.length || 1;

  return {
    totalHealings: records.length,
    successRate: Math.round((completed / total) * 10000) / 100,
    restoredHealthCount: completed,
    activeRecoveries: active,
    computedAt: new Date().toISOString(),
  };
}

export function getActiveRecoveries() {
  return listHealingActions().filter((h) =>
    ["executing", "recommended", "approval_pending"].includes(h.executionStatus),
  );
}

export { computeRecoveryConfidenceSummary };

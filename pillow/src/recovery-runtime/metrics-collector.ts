import type { RecoveryStore } from "./recovery-store.js";
import type { RecoveryMetrics } from "./types.js";

export class MetricsCollector {
  collect(store: RecoveryStore): RecoveryMetrics {
    const cases = store.listCases();
    const activeStatuses = new Set([
      "detected",
      "classified",
      "restoring",
      "restarting",
      "rolling_back",
      "resumed",
      "awaiting_approval",
    ]);
    return {
      totalFailures: store.listFailures().length,
      totalRecoveries: cases.length,
      totalRestarts: store.listRestarts().length,
      totalRollbacks: store.listRollbacks().length,
      totalEscalations: store.listEscalations().length,
      totalCheckpoints: store.listCheckpoints().length,
      totalReports: store.listReports().length,
      activeRecoveries: cases.filter((c) => activeStatuses.has(c.recoveryStatus)).length,
      completedRecoveries: cases.filter((c) => c.recoveryStatus === "completed").length,
      failedRecoveries: cases.filter(
        (c) => c.recoveryStatus === "failed" || c.recoveryStatus === "escalated",
      ).length,
    };
  }
}

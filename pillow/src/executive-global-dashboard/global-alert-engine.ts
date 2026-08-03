/** X4-10 — Global Alert Engine. */

import type { ExecutiveGlobalDashboardConfiguration } from "./configuration.js";
import {
  buildDashboardSnapshot,
  computeStructuralDashboardSignals,
} from "./structural-signals.js";
import type { DashboardAnalysisInput, DashboardSnapshot } from "./types.js";

export class GlobalAlertEngine {
  displayExecutiveAlerts(
    input: DashboardAnalysisInput,
    config: ExecutiveGlobalDashboardConfiguration,
    dependencyReadyCount: number,
  ): DashboardSnapshot {
    if (!config.executiveAlertRulesEnabled) {
      throw new Error("Executive alert rules disabled");
    }
    const signals = computeStructuralDashboardSignals(
      {
        ...input,
        widgetFocus: "executive_alerts",
        alertHint: input.alertHint ?? true,
      },
      config,
      dependencyReadyCount,
    );
    return buildDashboardSnapshot(
      {
        ...signals,
        recommendationSummary:
          signals.executiveAlerts.length > 0
            ? `Surface ${signals.executiveAlerts.length} executive alert(s)`
            : "No executive alerts at this time",
      },
      signals.executiveAlerts.length > 0 ? "partial" : "passed",
    );
  }

  alertCount(snapshots: DashboardSnapshot[]): number {
    return snapshots.reduce((sum, s) => sum + s.executiveAlerts.length, 0);
  }
}

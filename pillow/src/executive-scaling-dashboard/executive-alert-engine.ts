/** X3-09 — Executive Alert Engine. */

import type { ExecutiveScalingDashboardConfiguration } from "./configuration.js";
import type { ExecutiveDashboardSnapshot } from "./types.js";

export class ExecutiveAlertEngine {
  generate(
    snapshots: ExecutiveDashboardSnapshot[],
    config: ExecutiveScalingDashboardConfiguration,
  ): string[] {
    if (!config.alertRulesEnabled) return [];
    const latest = snapshots[snapshots.length - 1];
    if (!latest) return ["No dashboard snapshot available for executive alerts"];

    const alerts: string[] = [];
    const domains = [
      latest.scalingSummary,
      latest.opportunitySummary,
      latest.capacitySummary,
      latest.marketingSummary,
      latest.supplierSummary,
      latest.financialSummary,
      latest.workforceSummary,
    ];

    for (const domain of domains) {
      if (!domain.sourceAvailable) {
        alerts.push(
          `Partial visibility · ${domain.domain} upstream unavailable — structural fallback in use`,
        );
      }
      if (domain.readinessScore < config.alertThreshold) {
        alerts.push(
          `Alert · ${domain.domain} readiness ${domain.readinessScore} below threshold ${config.alertThreshold}`,
        );
      } else if (domain.statusLabel === "below_threshold") {
        alerts.push(
          `Watch · ${domain.domain} below validated minimum readiness`,
        );
      }
    }

    if (alerts.length === 0) {
      alerts.push(
        "No critical executive scaling alerts — cockpit within validated structural bounds",
      );
    }

    return alerts.slice(0, 12);
  }

  attachAlerts(
    snapshot: ExecutiveDashboardSnapshot,
    alerts: string[],
  ): ExecutiveDashboardSnapshot {
    return {
      ...snapshot,
      executiveAlerts: [...alerts],
      timestamp: new Date().toISOString(),
    };
  }
}

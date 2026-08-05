import type {
  EnterpriseHealthSummary,
  HealthSnapshot,
  HealthStatus,
  MonitoredComponent,
} from "./types.js";

/**
 * Aggregates category health snapshots into an enterprise health summary.
 * Derived only from observed component evidence — never fabricated.
 */
export class EnterpriseHealthAggregator {
  buildSnapshot(
    category: HealthSnapshot["category"],
    components: MonitoredComponent[],
  ): HealthSnapshot {
    if (components.length === 0) {
      return {
        category,
        components: [],
        averageHealthScore: 50,
        averageAvailability: 50,
        criticalAlertCount: 0,
        status: "standby",
        supportingEvidence: [`category:${category}:no_components`],
        fabricated: false,
        structuralSignalOnly: true,
      };
    }

    const averageHealthScore = Math.floor(
      components.reduce((sum, c) => sum + c.healthScore, 0) / components.length,
    );
    const averageAvailability = Math.floor(
      components.reduce((sum, c) => sum + c.availability, 0) / components.length,
    );
    const criticalAlertCount = components.reduce((sum, c) => sum + c.criticalAlertCount, 0);
    const status = aggregateStatus(components.map((c) => c.currentStatus), averageHealthScore);

    return {
      category,
      components: components.map((c) => ({
        ...c,
        supportingEvidence: [...c.supportingEvidence],
        fabricated: false as const,
        structuralSignalOnly: true as const,
      })),
      averageHealthScore,
      averageAvailability,
      criticalAlertCount,
      status,
      supportingEvidence: components.flatMap((c) => c.supportingEvidence).slice(0, 50),
      fabricated: false,
      structuralSignalOnly: true,
    };
  }

  aggregate(snapshots: HealthSnapshot[]): EnterpriseHealthSummary {
    const all = snapshots.flatMap((s) => s.components);
    const categoryScores: Record<string, number> = {};
    for (const snap of snapshots) {
      categoryScores[String(snap.category)] = snap.averageHealthScore;
    }

    const overallHealthScore =
      all.length === 0
        ? 50
        : Math.floor(all.reduce((sum, c) => sum + c.healthScore, 0) / all.length);

    const counts = {
      healthyCount: 0,
      degradedCount: 0,
      warningCount: 0,
      criticalCount: 0,
      unavailableCount: 0,
      standbyCount: 0,
      unknownCount: 0,
    };
    for (const c of all) {
      switch (c.currentStatus) {
        case "healthy":
          counts.healthyCount += 1;
          break;
        case "degraded":
          counts.degradedCount += 1;
          break;
        case "warning":
          counts.warningCount += 1;
          break;
        case "critical":
          counts.criticalCount += 1;
          break;
        case "unavailable":
          counts.unavailableCount += 1;
          break;
        case "standby":
          counts.standbyCount += 1;
          break;
        case "unknown":
          counts.unknownCount += 1;
          break;
      }
    }

    const criticalAlertCount = all.reduce((sum, c) => sum + c.criticalAlertCount, 0);
    const overallStatus = aggregateStatus(
      all.map((c) => c.currentStatus),
      overallHealthScore,
    );

    return {
      overallHealthScore,
      overallStatus,
      categoryScores,
      totalComponents: all.length,
      ...counts,
      criticalAlertCount,
      supportingEvidence: snapshots.flatMap((s) => s.supportingEvidence).slice(0, 80),
      fabricated: false,
      structuralSignalOnly: true,
    };
  }
}

function aggregateStatus(statuses: HealthStatus[], averageScore: number): HealthStatus {
  if (statuses.length === 0) return "standby";
  if (statuses.some((s) => s === "critical" || s === "unavailable")) {
    return statuses.some((s) => s === "unavailable") && !statuses.some((s) => s === "critical")
      ? "unavailable"
      : "critical";
  }
  if (statuses.some((s) => s === "warning")) return "warning";
  if (statuses.some((s) => s === "degraded")) return "degraded";
  if (statuses.every((s) => s === "standby" || s === "unknown")) {
    return averageScore >= 50 ? "standby" : "unknown";
  }
  if (averageScore >= 80) return "healthy";
  if (averageScore >= 60) return "degraded";
  if (averageScore >= 40) return "warning";
  return "critical";
}

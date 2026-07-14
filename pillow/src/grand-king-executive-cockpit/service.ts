/** E5-15 — Grand King Executive Cockpit service orchestrator. */

import { getCockpitAuditHistory } from "./audit-logging.js";
import { buildCockpitConfiguration, type CockpitEngineConfiguration } from "./configuration.js";
import { buildCockpitMonitoringStatus } from "./monitoring.js";
import { buildCockpitExecutiveReport, buildCockpitMetrics } from "./reporting.js";
import { resetCockpitAuditForTesting } from "./audit-logging.js";
import type { ExecutiveDashboardWidget, CockpitHealthStatus } from "./types.js";

let configuration = buildCockpitConfiguration();

export function getCockpitConfiguration(): CockpitEngineConfiguration {
  return { ...configuration };
}

export function updateCockpitConfiguration(
  overrides: Partial<CockpitEngineConfiguration>,
): CockpitEngineConfiguration {
  configuration = buildCockpitConfiguration({ ...configuration, ...overrides });
  return { ...configuration };
}

export function getCockpitHealthStatus(input: {
  healthScore: number;
  widgets: ExecutiveDashboardWidget[];
  governanceChainComplete: boolean;
}): CockpitHealthStatus {
  const history = getCockpitAuditHistory(1);
  return {
    status: input.healthScore >= 85 ? "healthy" : input.healthScore >= 70 ? "stable" : "attention",
    healthScore: input.healthScore,
    widgetCount: input.widgets.length,
    governanceChainComplete: input.governanceChainComplete,
    auditEventCount: getCockpitAuditHistory(1000).length,
    lastEventAt: history[0]?.timestamp ?? null,
  };
}

export function buildCockpitSubsystems(input: {
  widgets: ExecutiveDashboardWidget[];
  cockpitHealth: string;
  sovereignHealthScore: number;
  governanceChainScore: number;
  unifiedVisibilityScore: number;
  governanceEnginesActive: number;
  governanceEnginesTotal: number;
  computedAt: string;
}) {
  const healthyWidgets = input.widgets.filter(
    (w) => w.healthStatus === "healthy" || w.healthStatus === "active" || w.healthStatus === "strong",
  ).length;
  const staleWidgets = 0;
  const auditHistory = getCockpitAuditHistory(100);

  return {
    monitoringStatus: buildCockpitMonitoringStatus({
      config: configuration,
      totalWidgets: input.widgets.length,
      healthyWidgets,
      staleWidgets,
      cockpitHealthScore: input.sovereignHealthScore,
      lastRefreshAt: input.computedAt,
    }),
    executiveReport: buildCockpitExecutiveReport({
      cockpitHealth: input.cockpitHealth,
      sovereignHealthScore: input.sovereignHealthScore,
      governanceChainScore: input.governanceChainScore,
      unifiedVisibilityScore: input.unifiedVisibilityScore,
    }),
    metrics: buildCockpitMetrics({
      widgets: input.widgets,
      governanceEnginesActive: input.governanceEnginesActive,
      governanceEnginesTotal: input.governanceEnginesTotal,
      enterpriseHealthScore: input.sovereignHealthScore,
      unifiedVisibilityScore: input.unifiedVisibilityScore,
    }),
    healthStatus: getCockpitHealthStatus({
      healthScore: input.sovereignHealthScore,
      widgets: input.widgets,
      governanceChainComplete: input.governanceEnginesActive >= input.governanceEnginesTotal,
    }),
    cockpitAuditHistory: auditHistory,
  };
}

export function resetCockpitServiceForTesting(): void {
  configuration = buildCockpitConfiguration();
  resetCockpitAuditForTesting();
}

export { getCockpitAuditHistory };

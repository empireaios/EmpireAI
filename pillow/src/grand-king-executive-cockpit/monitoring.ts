/** E5-15 — Cockpit monitoring and dashboard freshness. */

import type { CockpitEngineConfiguration } from "./configuration.js";
import type { CockpitMonitoringStatus } from "./types.js";

export function buildCockpitMonitoringStatus(input: {
  config: CockpitEngineConfiguration;
  totalWidgets: number;
  healthyWidgets: number;
  staleWidgets: number;
  cockpitHealthScore: number;
  lastRefreshAt: string;
}): CockpitMonitoringStatus {
  const next = new Date(input.lastRefreshAt);
  next.setSeconds(next.getSeconds() + input.config.refreshIntervalSeconds);
  return {
    backgroundMonitoring: input.staleWidgets > 0 ? "refreshing" : "active",
    totalWidgets: input.totalWidgets,
    healthyWidgets: input.healthyWidgets,
    staleWidgets: input.staleWidgets,
    cockpitHealthScore: input.cockpitHealthScore,
    lastRefreshAt: input.lastRefreshAt,
    nextRefreshAt: next.toISOString(),
  };
}

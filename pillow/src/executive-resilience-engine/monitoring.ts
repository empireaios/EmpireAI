/** E5-14 — Resilience monitoring and background scans. */

import type { ResilienceEngineConfiguration } from "./configuration.js";
import type { ResilienceMonitoringStatus } from "./types.js";

export function buildResilienceMonitoringStatus(input: {
  config: ResilienceEngineConfiguration;
  totalIncidents: number;
  activeIncidents: number;
  recoveredIncidents: number;
  resilienceHealthScore: number;
  lastScanAt: string;
}): ResilienceMonitoringStatus {
  const next = new Date(input.lastScanAt);
  next.setMinutes(next.getMinutes() + input.config.scanFrequencyMinutes);
  return {
    backgroundMonitoring: input.activeIncidents > 0 ? "elevated" : "active",
    totalIncidents: input.totalIncidents,
    activeIncidents: input.activeIncidents,
    recoveredIncidents: input.recoveredIncidents,
    resilienceHealthScore: input.resilienceHealthScore,
    lastScanAt: input.lastScanAt,
    nextScanAt: next.toISOString(),
  };
}

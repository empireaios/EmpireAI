/** E5-12 — Trust monitoring and background scans. */

import type { TrustEngineConfiguration } from "./configuration.js";
import type { TrustMonitoringStatus } from "./types.js";

export function buildTrustMonitoringStatus(input: {
  config: TrustEngineConfiguration;
  totalAssessments: number;
  lowTrustCount: number;
  criticalTrustCount: number;
  trustHealthScore: number;
  lastScanAt: string;
}): TrustMonitoringStatus {
  const next = new Date(input.lastScanAt);
  next.setMinutes(next.getMinutes() + input.config.scanFrequencyMinutes);
  return {
    backgroundMonitoring: input.criticalTrustCount > 0 ? "elevated" : "active",
    totalAssessments: input.totalAssessments,
    lowTrustCount: input.lowTrustCount,
    criticalTrustCount: input.criticalTrustCount,
    trustHealthScore: input.trustHealthScore,
    lastScanAt: input.lastScanAt,
    nextScanAt: next.toISOString(),
  };
}

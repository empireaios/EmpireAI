/** E5-09 — Risk monitoring and background scans. */

import type { RiskGovernanceConfiguration } from "./configuration.js";
import type { RiskMonitoringStatus } from "./types.js";

export function buildRiskMonitoringStatus(input: {
  config: RiskGovernanceConfiguration;
  criticalCount: number;
  highCount: number;
  unmanagedCriticalCount: number;
  mitigationInProgressCount: number;
  lastScanAt: string;
}): RiskMonitoringStatus {
  const next = new Date(input.lastScanAt);
  next.setMinutes(next.getMinutes() + input.config.scanFrequencyMinutes);
  return {
    backgroundMonitoring: input.unmanagedCriticalCount === 0 ? "active" : "elevated",
    criticalCount: input.criticalCount,
    highCount: input.highCount,
    unmanagedCriticalCount: input.unmanagedCriticalCount,
    mitigationInProgressCount: input.mitigationInProgressCount,
    lastScanAt: input.lastScanAt,
    nextScanAt: next.toISOString(),
  };
}

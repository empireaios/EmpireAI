/** E5-13 — Guardian monitoring and background scans. */

import type { ConstitutionalGuardianConfiguration } from "./configuration.js";
import type { GuardianMonitoringStatus } from "./types.js";

export function buildGuardianMonitoringStatus(input: {
  config: ConstitutionalGuardianConfiguration;
  totalEvents: number;
  activeViolations: number;
  resolvedEvents: number;
  constitutionHealthScore: number;
  lastScanAt: string;
}): GuardianMonitoringStatus {
  const next = new Date(input.lastScanAt);
  next.setMinutes(next.getMinutes() + input.config.scanFrequencyMinutes);
  return {
    backgroundMonitoring: input.activeViolations > 0 ? "elevated" : "active",
    totalProtectionEvents: input.totalEvents,
    activeViolations: input.activeViolations,
    resolvedEvents: input.resolvedEvents,
    constitutionHealthScore: input.constitutionHealthScore,
    lastScanAt: input.lastScanAt,
    nextScanAt: next.toISOString(),
  };
}

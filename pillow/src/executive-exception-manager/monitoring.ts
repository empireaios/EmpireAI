/** E5-08 — Background exception monitoring. */

import type { ExceptionMonitoringStatus } from "./types.js";
import type { ExceptionManagerConfiguration } from "./configuration.js";

export function buildExceptionMonitoringStatus(input: {
  config: ExceptionManagerConfiguration;
  activeCount: number;
  pendingCount: number;
  expiringSoonCount: number;
  escalationPendingCount: number;
  lastScanAt: string;
}): ExceptionMonitoringStatus {
  return {
    backgroundMonitoring: "active",
    unresolvedCount: input.activeCount + input.pendingCount,
    expiringSoonCount: input.expiringSoonCount,
    escalationPendingCount: input.escalationPendingCount,
    lastScanAt: input.lastScanAt,
    nextScanAt: new Date(
      new Date(input.lastScanAt).getTime() + input.config.scanFrequencyMinutes * 60_000,
    ).toISOString(),
    alertThresholdDays: input.config.alertThresholdDays,
  };
}

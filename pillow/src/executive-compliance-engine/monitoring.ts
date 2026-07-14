/** E5-04 — Continuous compliance monitoring. */

import type { ComplianceMonitoringStatus } from "./types.js";
import type { ComplianceEngineConfiguration } from "./configuration.js";

export function buildMonitoringStatus(input: {
  config: ComplianceEngineConfiguration;
  complianceScore: number;
  activeViolationCount: number;
  criticalViolationCount: number;
  lastScanAt: string;
}): ComplianceMonitoringStatus {
  const driftDetected = input.complianceScore < input.config.alertThresholdPercent;
  return {
    realTimeValidation: input.config.realTimeValidationEnabled ? "active" : "disabled",
    scheduledScans: `every ${input.config.scanFrequencyMinutes} minutes`,
    periodicReviews: "daily enterprise review",
    backgroundMonitoring: "active",
    driftDetection: input.config.driftDetectionEnabled
      ? driftDetected
        ? "drift_detected"
        : "stable"
      : "disabled",
    lastScanAt: input.lastScanAt,
    nextScanAt: new Date(
      new Date(input.lastScanAt).getTime() + input.config.scanFrequencyMinutes * 60_000,
    ).toISOString(),
    alertThresholdPercent: input.config.alertThresholdPercent,
    complianceScore: input.complianceScore,
    activeViolationCount: input.activeViolationCount,
    criticalViolationCount: input.criticalViolationCount,
  };
}

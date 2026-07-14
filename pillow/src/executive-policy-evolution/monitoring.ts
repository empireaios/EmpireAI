/** E5-11 — Policy evolution monitoring and background scans. */

import type { PolicyEvolutionConfiguration } from "./configuration.js";
import type { PolicyEvolutionMonitoringStatus } from "./types.js";

export function buildPolicyEvolutionMonitoringStatus(input: {
  config: PolicyEvolutionConfiguration;
  pendingCount: number;
  approvedCount: number;
  publishedCount: number;
  policyStabilityScore: number;
  lastScanAt: string;
}): PolicyEvolutionMonitoringStatus {
  const next = new Date(input.lastScanAt);
  next.setMinutes(next.getMinutes() + input.config.scanFrequencyMinutes);
  return {
    backgroundMonitoring: input.policyStabilityScore >= 85 ? "active" : "elevated",
    pendingEvolutionCount: input.pendingCount,
    approvedEvolutionCount: input.approvedCount,
    publishedEvolutionCount: input.publishedCount,
    policyStabilityScore: input.policyStabilityScore,
    lastScanAt: input.lastScanAt,
    nextScanAt: next.toISOString(),
  };
}

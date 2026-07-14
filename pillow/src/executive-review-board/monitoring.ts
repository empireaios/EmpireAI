/** E5-10 — Review monitoring and background scans. */

import type { ReviewBoardConfiguration } from "./configuration.js";
import type { ReviewMonitoringStatus } from "./types.js";

export function buildReviewMonitoringStatus(input: {
  config: ReviewBoardConfiguration;
  activeCount: number;
  pendingActionCount: number;
  overdueActionCount: number;
  reviewQualityScore: number;
  lastScanAt: string;
}): ReviewMonitoringStatus {
  const next = new Date(input.lastScanAt);
  next.setMinutes(next.getMinutes() + input.config.scanFrequencyMinutes);
  return {
    backgroundMonitoring: input.overdueActionCount === 0 ? "active" : "elevated",
    activeReviewCount: input.activeCount,
    pendingActionCount: input.pendingActionCount,
    overdueActionCount: input.overdueActionCount,
    reviewQualityScore: input.reviewQualityScore,
    lastScanAt: input.lastScanAt,
    nextScanAt: next.toISOString(),
  };
}

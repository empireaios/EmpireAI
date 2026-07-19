/** R5-18 — Cross-Channel Analytics Engine. */

import type { CrossChannelOrchestratorConfiguration } from "./configuration.js";
import type { OrchestrationRecord } from "./types.js";

export class CrossChannelAnalyticsEngine {
  detectConflicts(
    record: OrchestrationRecord,
    config: CrossChannelOrchestratorConfiguration,
  ): OrchestrationRecord {
    const channelCount = record.marketingChannels.length;
    const hasOverlap =
      record.marketingChannels.includes("meta_ads") &&
      record.marketingChannels.includes("google_ads") &&
      channelCount >= config.conflictSeverityThreshold + 2;
    const conflictStatus = hasOverlap ? "detected" : "none";
    return {
      ...record,
      conflictStatus,
      conflictSummary: hasOverlap
        ? "Potential paid-search/social pacing overlap detected"
        : "No channel conflicts detected",
      synchronizationStatus: hasOverlap ? "conflicted" : record.synchronizationStatus,
      timestamp: new Date().toISOString(),
    };
  }

  conflictedCount(records: OrchestrationRecord[]): number {
    return records.filter((r) => r.conflictStatus === "detected").length;
  }
}

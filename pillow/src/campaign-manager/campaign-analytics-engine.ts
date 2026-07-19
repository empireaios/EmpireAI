/** R5-07 — Campaign Analytics Engine (execution tracking / failure detection). */

import { appendCamLog } from "./cam-logging.js";
import type { CampaignRecord } from "./types.js";

export class CampaignAnalyticsEngine {
  trackExecution(records: CampaignRecord[]): CampaignRecord[] {
    const updated: CampaignRecord[] = [];
    for (const record of records) {
      if (record.executionStatus === "executing") {
        const channelStates = Object.values(record.channelExecution);
        if (channelStates.length > 0 && channelStates.every((s) => s === "executing")) {
          record.executionStatus = "succeeded";
          if (record.campaignStatus === "running") {
            /* keep running until explicitly completed */
          }
        }
      }
      record.timestamp = new Date().toISOString();
      updated.push({ ...record });
    }

    appendCamLog({
      event: "campaign_execution",
      level: "info",
      details: `Tracked execution for ${updated.length} campaign(s)`,
    });
    return updated;
  }

  detectFailures(records: CampaignRecord[]): CampaignRecord[] {
    const failed: CampaignRecord[] = [];
    for (const record of records) {
      const channelFailed = Object.values(record.channelExecution).some((s) => s === "failed");
      if (
        record.executionStatus === "failed" ||
        record.campaignStatus === "failed" ||
        channelFailed
      ) {
        if (!record.failureSummary) {
          record.failureSummary = "Campaign execution failure detected";
        }
        record.executionStatus = "failed";
        record.campaignStatus = "failed";
        record.timestamp = new Date().toISOString();
        failed.push({ ...record });
      }
    }

    appendCamLog({
      event: "campaign_failures",
      level: failed.length > 0 ? "warn" : "info",
      details: `Detected ${failed.length} campaign failure(s)`,
    });
    return failed;
  }
}

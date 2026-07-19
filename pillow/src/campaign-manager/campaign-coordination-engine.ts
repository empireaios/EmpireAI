/** R5-07 — Campaign Coordination Engine. */

import { appendCamLog } from "./cam-logging.js";
import type { CampaignRecord, ExecutionStatus, MarketingChannel } from "./types.js";

export type ChannelAvailability = Record<MarketingChannel, boolean>;

export class CampaignCoordinationEngine {
  coordinate(
    record: CampaignRecord,
    availability: ChannelAvailability,
  ): { record: CampaignRecord; partial: boolean; missing: MarketingChannel[] } {
    const missing: MarketingChannel[] = [];
    const channelExecution: Partial<Record<MarketingChannel, ExecutionStatus>> = {
      ...record.channelExecution,
    };

    for (const channel of record.marketingChannels) {
      if (!availability[channel]) {
        missing.push(channel);
        channelExecution[channel] = "failed";
      } else {
        channelExecution[channel] =
          record.campaignStatus === "running" || record.campaignStatus === "scheduled"
            ? "executing"
            : "queued";
      }
    }

    record.channelExecution = channelExecution;
    record.timestamp = new Date().toISOString();

    if (missing.length === 0) {
      record.executionStatus = "executing";
      record.failureSummary = null;
    } else if (missing.length === record.marketingChannels.length) {
      record.executionStatus = "failed";
      record.campaignStatus = "failed";
      record.failureSummary = `All channels unavailable: ${missing.join(", ")}`;
    } else {
      record.executionStatus = "partial";
      record.failureSummary = `Partial channel failure: ${missing.join(", ")}`;
    }

    appendCamLog({
      event: "campaign_execution",
      level: missing.length > 0 ? "warn" : "info",
      details: `Coordinated ${record.campaignId} across ${record.marketingChannels.length} channel(s)`,
    });

    return { record, partial: missing.length > 0, missing };
  }
}

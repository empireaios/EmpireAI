/** R5-07 — Campaign Status Engine. */

import { appendCamLog } from "./cam-logging.js";
import type { CampaignRecord, CampaignStatus } from "./types.js";

export class CampaignStatusEngine {
  updateStatus(record: CampaignRecord, status: CampaignStatus): CampaignRecord {
    record.campaignStatus = status;
    record.timestamp = new Date().toISOString();
    appendCamLog({
      event: "campaign_updates",
      level: "info",
      details: `Status set ${record.campaignId} → ${status}`,
    });
    return record;
  }

  summarize(records: CampaignRecord[]): {
    total: number;
    running: number;
    failed: number;
    scheduled: number;
  } {
    return {
      total: records.length,
      running: records.filter((r) => r.campaignStatus === "running").length,
      failed: records.filter((r) => r.campaignStatus === "failed").length,
      scheduled: records.filter((r) => r.campaignStatus === "scheduled").length,
    };
  }
}

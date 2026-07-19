/** R5-07 — Campaign Scheduler. */

import { appendCamLog } from "./cam-logging.js";
import type { CampaignRecord, CampaignSchedule } from "./types.js";

export class CampaignScheduler {
  schedule(
    record: CampaignRecord,
    schedule: CampaignSchedule,
  ): { ok: boolean; record: CampaignRecord; error?: string } {
    const start = Date.parse(schedule.startAt);
    if (!Number.isFinite(start)) {
      return { ok: false, record, error: "Invalid campaign start time" };
    }
    if (schedule.endAt) {
      const end = Date.parse(schedule.endAt);
      if (!Number.isFinite(end) || end <= start) {
        return { ok: false, record, error: "Campaign end time must be after start time" };
      }
    }

    record.campaignSchedule = { ...schedule };
    if (record.campaignStatus === "approved" || record.campaignStatus === "draft") {
      record.campaignStatus = "scheduled";
      record.executionStatus = "queued";
    }
    record.timestamp = new Date().toISOString();

    appendCamLog({
      event: "campaign_scheduling",
      level: "info",
      details: `Scheduled ${record.campaignId} start=${schedule.startAt}`,
    });
    return { ok: true, record };
  }
}

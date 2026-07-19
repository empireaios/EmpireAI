/** R5-07 — Campaign Lifecycle Engine. */

import { appendCamLog } from "./cam-logging.js";
import type { CampaignRecord, CampaignStatus } from "./types.js";

const ALLOWED_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ["pending_approval", "cancelled"],
  pending_approval: ["approved", "draft", "cancelled"],
  approved: ["scheduled", "running", "cancelled"],
  scheduled: ["running", "paused", "cancelled"],
  running: ["paused", "completed", "failed"],
  paused: ["running", "cancelled", "completed"],
  completed: [],
  failed: ["draft", "cancelled"],
  cancelled: [],
};

export class CampaignLifecycleEngine {
  transition(record: CampaignRecord, targetStatus: CampaignStatus): {
    ok: boolean;
    record: CampaignRecord;
    error?: string;
  } {
    const allowed = ALLOWED_TRANSITIONS[record.campaignStatus];
    if (!allowed.includes(targetStatus)) {
      return {
        ok: false,
        record,
        error: `Invalid lifecycle transition ${record.campaignStatus} → ${targetStatus}`,
      };
    }

    record.campaignStatus = targetStatus;
    record.timestamp = new Date().toISOString();
    if (targetStatus === "running") record.executionStatus = "executing";
    if (targetStatus === "completed") record.executionStatus = "succeeded";
    if (targetStatus === "failed") record.executionStatus = "failed";
    if (targetStatus === "scheduled") record.executionStatus = "queued";

    appendCamLog({
      event: "campaign_updates",
      level: "info",
      details: `Lifecycle ${record.campaignId}: ${targetStatus}`,
    });
    return { ok: true, record };
  }
}

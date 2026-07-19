/** R5-05 — Campaign Synchronization Engine. */

import { appendYaiLog } from "./yai-logging.js";
import type { VideoCampaignManager } from "./video-campaign-manager.js";
import type { YouTubeAdsRecord } from "./types.js";

export class CampaignSynchronizationEngine {
  constructor(private readonly campaigns: VideoCampaignManager) {}

  syncStatus(campaignReference?: string): YouTubeAdsRecord[] {
    const synced = this.campaigns.syncStatus(campaignReference);
    appendYaiLog({
      event: "campaign_synchronization",
      level: "info",
      details: `Synchronized ${synced.length} YouTube campaign(s)`,
    });
    return synced;
  }
}

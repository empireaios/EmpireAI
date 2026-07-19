/** R5-08 — Audience Analytics Engine (engagement / quality). */

import { appendAudLog } from "./aud-logging.js";
import type { AudienceRecord } from "./types.js";

export class AudienceAnalyticsEngine {
  measureEngagement(record: AudienceRecord): AudienceRecord {
    const engagement = Math.min(
      100,
      Math.max(5, Math.round(30 + Math.log10(record.audienceSize + 10) * 15 + record.intentScore * 0.2)),
    );
    record.engagementScore = engagement;
    record.timestamp = new Date().toISOString();
    appendAudLog({
      event: "audience_scoring",
      level: "info",
      details: `Engagement measured for ${record.audienceRecordId}`,
    });
    return record;
  }

  measureQuality(record: AudienceRecord): AudienceRecord {
    const quality = Math.min(
      100,
      Math.max(
        1,
        Math.round(
          record.engagementScore * 0.4 +
            record.intentScore * 0.35 +
            (record.demographicSummary.includes("Pending") ? 10 : 25) +
            (record.overlapAudienceIds.length > 2 ? -10 : 0),
        ),
      ),
    );
    record.audienceQualityScore = quality;
    record.timestamp = new Date().toISOString();
    appendAudLog({
      event: "audience_scoring",
      level: "info",
      details: `Quality measured for ${record.audienceRecordId}`,
    });
    return record;
  }
}

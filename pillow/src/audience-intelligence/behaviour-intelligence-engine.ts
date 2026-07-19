/** R5-08 — Behaviour Intelligence Engine. */

import { appendAudLog } from "./aud-logging.js";
import type { AudienceRecord } from "./types.js";

export class BehaviourIntelligenceEngine {
  analyzeBehaviour(record: AudienceRecord, hints?: string[]): AudienceRecord {
    const hintText = hints?.length ? hints.join(", ") : "recency, frequency, channel mix";
    record.behaviourSummary = `Behaviour signals: ${hintText}`;
    record.timestamp = new Date().toISOString();
    appendAudLog({
      event: "audience_analysis",
      level: "info",
      details: `Behaviour analyzed for ${record.audienceRecordId}`,
    });
    return record;
  }

  analyzeIntent(record: AudienceRecord): AudienceRecord {
    const base = Math.min(95, 40 + Math.floor(record.audienceSize / 100) + record.engagementScore / 4);
    record.intentScore = Math.max(1, Math.min(100, Math.round(base)));
    record.timestamp = new Date().toISOString();
    appendAudLog({
      event: "audience_scoring",
      level: "info",
      details: `Intent scored for ${record.audienceRecordId}`,
    });
    return record;
  }
}

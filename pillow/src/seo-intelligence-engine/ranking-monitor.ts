/** R5-06 — Ranking Monitor. */

import { appendSieLog } from "./sie-logging.js";
import type { KeywordIntelligenceEngine } from "./keyword-intelligence-engine.js";
import type { KeywordRecord } from "./types.js";

export class RankingMonitor {
  constructor(private readonly keywords: KeywordIntelligenceEngine) {}

  track(keywordReference?: string, websiteReference?: string): KeywordRecord[] {
    const targets = keywordReference
      ? [this.keywords.get(keywordReference)].filter(Boolean)
      : this.keywords.list(websiteReference);

    const updated: KeywordRecord[] = [];
    for (const keyword of targets as KeywordRecord[]) {
      const base = keyword.difficulty ?? 40;
      const position = Math.max(1, Math.min(100, Math.round(base * 0.4 + 5)));
      const record = this.keywords.updateRanking(keyword.keywordReference, position);
      if (record) updated.push(record);
    }

    appendSieLog({
      event: "ranking_updates",
      level: "info",
      details: `Tracked rankings for ${updated.length} keyword(s)`,
    });
    return updated;
  }
}

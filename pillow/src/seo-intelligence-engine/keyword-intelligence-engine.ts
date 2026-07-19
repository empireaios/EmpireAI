/** R5-06 — Keyword Intelligence Engine. */

import { appendSieLog } from "./sie-logging.js";
import type { KeywordRecord, ManageKeywordInput } from "./types.js";

export class KeywordIntelligenceEngine {
  private keywords = new Map<string, KeywordRecord>();

  manageKeyword(
    input: ManageKeywordInput,
    websiteReference: string,
  ): KeywordRecord {
    const keywordReference = `sie-kw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record: KeywordRecord = {
      keywordReference,
      keyword: input.keyword.trim().toLowerCase(),
      websiteReference: input.websiteReference ?? websiteReference,
      targetPageReference: input.targetPageReference ?? null,
      searchVolume: input.searchVolume ?? 100,
      difficulty: input.difficulty ?? 40,
      rankingPosition: null,
      timestamp: new Date().toISOString(),
    };
    this.keywords.set(keywordReference, record);
    appendSieLog({
      event: "keyword_tracking",
      level: "info",
      details: `Keyword managed: ${keywordReference}`,
    });
    return { ...record };
  }

  updateRanking(keywordReference: string, position: number): KeywordRecord | null {
    const record = this.keywords.get(keywordReference);
    if (!record) return null;
    record.rankingPosition = position;
    record.timestamp = new Date().toISOString();
    this.keywords.set(keywordReference, record);
    appendSieLog({
      event: "ranking_updates",
      level: "info",
      details: `Ranking updated for ${keywordReference}: position ${position}`,
    });
    return { ...record };
  }

  get(keywordReference: string): KeywordRecord | null {
    const record = this.keywords.get(keywordReference);
    return record ? { ...record } : null;
  }

  list(websiteReference?: string): KeywordRecord[] {
    const all = [...this.keywords.values()];
    return (websiteReference
      ? all.filter((k) => k.websiteReference === websiteReference)
      : all
    ).map((k) => ({ ...k }));
  }

  count(): number {
    return this.keywords.size;
  }

  resetForTesting(): void {
    this.keywords.clear();
  }
}

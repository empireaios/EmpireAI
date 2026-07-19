/** R4-03 — Timeline search engine. */

import type { CustomerTimelineEngineConfiguration } from "./configuration.js";
import type { EventType, TimelineRecord, TimelineSearchResult } from "./types.js";
import { TimelineMetadataGenerator } from "./timeline-metadata-generator.js";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export class TimelineSearchEngine {
  private readonly metadata = new TimelineMetadataGenerator();

  search(
    records: TimelineRecord[],
    query: string,
    config: CustomerTimelineEngineConfiguration,
    options: { customerId?: string; eventType?: EventType; limit?: number } = {},
  ): TimelineSearchResult[] {
    if (!config.searchRulesEnabled) return [];

    const searchRule = config.searchRules.find((r) => r.ruleId === "default_search");
    const minLength = searchRule?.enabled ? searchRule.minQueryLength : 1;
    if (query.trim().length < minLength) return [];

    const normalizedQuery = normalize(query);
    const limit = options.limit ?? config.defaultSearchLimit;
    let filtered = records;

    if (options.customerId) {
      filtered = filtered.filter((r) => r.customerId === options.customerId);
    }
    if (options.eventType) {
      filtered = filtered.filter((r) => r.eventType === options.eventType);
    }

    const results: TimelineSearchResult[] = [];
    for (const record of filtered) {
      const match = this.matchRecord(record, normalizedQuery);
      if (match) {
        results.push(
          this.metadata.buildSearchResult({
            timelineRecordId: record.timelineRecordId,
            customerId: record.customerId,
            matchReason: match.reason,
            relevanceScore: match.score,
          }),
        );
      }
    }

    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  private matchRecord(
    record: TimelineRecord,
    query: string,
  ): { reason: string; score: number } | null {
    const checks: Array<{ field: string; value: string; score: number }> = [];

    if (normalize(record.eventDescription).includes(query)) {
      checks.push({ field: "description", value: record.eventDescription, score: 90 });
    }
    if (normalize(record.eventReference).includes(query)) {
      checks.push({ field: "reference", value: record.eventReference, score: 85 });
    }
    if (normalize(record.customerId).includes(query)) {
      checks.push({ field: "customerId", value: record.customerId, score: 80 });
    }
    if (normalize(record.eventType).includes(query)) {
      checks.push({ field: "eventType", value: record.eventType, score: 75 });
    }
    if (normalize(record.eventSource).includes(query)) {
      checks.push({ field: "eventSource", value: record.eventSource, score: 70 });
    }

    if (checks.length === 0) return null;
    const best = checks.sort((a, b) => b.score - a.score)[0]!;
    return { reason: `Matched ${best.field}: ${best.value}`, score: best.score };
  }
}

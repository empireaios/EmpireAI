/** R5-09 — Attribution Analytics Engine. */

import type { AttributionRecord, ContributionBreakdown } from "./types.js";

export class AttributionAnalyticsEngine {
  byCampaign(records: AttributionRecord[]): ContributionBreakdown[] {
    return this.group(records, (r) => r.campaignReference ?? "unassigned");
  }

  byChannel(records: AttributionRecord[]): ContributionBreakdown[] {
    return this.group(records, (r) => r.marketingChannel);
  }

  byAdvertisement(records: AttributionRecord[]): ContributionBreakdown[] {
    const keys = new Map<string, AttributionRecord[]>();
    for (const record of records) {
      const key =
        record.touchpointSequence[record.touchpointSequence.length - 1] ??
        record.campaignReference ??
        "unknown-ad";
      const list = keys.get(key) ?? [];
      list.push(record);
      keys.set(key, list);
    }
    return this.fromGroups(keys);
  }

  private group(
    records: AttributionRecord[],
    keyFn: (r: AttributionRecord) => string,
  ): ContributionBreakdown[] {
    const keys = new Map<string, AttributionRecord[]>();
    for (const record of records) {
      const key = keyFn(record);
      const list = keys.get(key) ?? [];
      list.push(record);
      keys.set(key, list);
    }
    return this.fromGroups(keys);
  }

  private fromGroups(keys: Map<string, AttributionRecord[]>): ContributionBreakdown[] {
    const total = [...keys.values()]
      .flat()
      .reduce((sum, r) => sum + r.attributionValue, 0);
    const safeTotal = total || 1;

    return [...keys.entries()]
      .map(([key, list]) => {
        const attributedValue = list.reduce((sum, r) => sum + r.attributionValue, 0);
        return {
          key,
          attributedValue: Math.round(attributedValue * 100) / 100,
          contributionPercent: Math.round((attributedValue / safeTotal) * 10000) / 100,
          touchpointCount: new Set(list.flatMap((r) => r.touchpointSequence)).size,
        };
      })
      .sort((a, b) => b.attributedValue - a.attributedValue);
  }
}

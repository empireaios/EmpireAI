/** R5-11 — Asset Usage Tracker. */

import type { AssetUsageEvent, CreativeAssetRecord } from "./types.js";

export class AssetUsageTracker {
  private readonly events: AssetUsageEvent[] = [];

  track(
    asset: CreativeAssetRecord,
    context?: string,
    campaignReference?: string | null,
  ): { asset: CreativeAssetRecord; event: AssetUsageEvent } {
    const event: AssetUsageEvent = {
      usageEventId: `cra-use-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      assetId: asset.assetId,
      timestamp: new Date().toISOString(),
      context: context?.trim() || "campaign_usage",
      campaignReference: campaignReference ?? asset.campaignReference,
    };
    this.events.push(event);
    return {
      asset: {
        ...asset,
        usageCount: asset.usageCount + 1,
        usageStatus: "in_use",
        timestamp: new Date().toISOString(),
      },
      event,
    };
  }

  listForAsset(assetId: string): AssetUsageEvent[] {
    return this.events.filter((e) => e.assetId === assetId).map((e) => ({ ...e }));
  }

  list(): AssetUsageEvent[] {
    return this.events.map((e) => ({ ...e }));
  }

  resetForTesting(): void {
    this.events.length = 0;
  }
}

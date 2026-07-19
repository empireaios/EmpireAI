/** R5-13 — Cross-Channel Budget Engine. */

import type { MarketingChannel } from "./types.js";

export class CrossChannelBudgetEngine {
  defaultChannels(available: MarketingChannel[]): MarketingChannel[] {
    const preferred: MarketingChannel[] = [
      "meta_ads",
      "google_ads",
      "tiktok_ads",
      "youtube_ads",
    ];
    const selected = preferred.filter((c) => available.includes(c));
    return selected.length > 0 ? selected : preferred;
  }

  synthesizeSpendByChannel(
    channels: MarketingChannel[],
    totalBudget: number,
  ): Record<string, number> {
    const result: Record<string, number> = {};
    channels.forEach((channel, index) => {
      const share = 0.2 + (index % 3) * 0.05;
      result[channel] = Math.round(totalBudget * share * 100) / 100;
    });
    return result;
  }
}

/** R5-05 — Video Asset Manager. */

import { appendYaiLog } from "./yai-logging.js";
import type { ManageVideoAssetInput } from "./types.js";

export type VideoAssetRecord = {
  videoAssetReference: string;
  videoAssetName: string;
  durationSeconds: number;
  campaignReference: string | null;
  status: "registered" | "synced" | "failed";
  timestamp: string;
};

export class VideoAssetManager {
  private assets = new Map<string, VideoAssetRecord>();

  manageVideoAsset(input: ManageVideoAssetInput): VideoAssetRecord {
    const videoAssetReference = `yai-vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record: VideoAssetRecord = {
      videoAssetReference,
      videoAssetName: input.videoAssetName,
      durationSeconds: input.durationSeconds ?? 15,
      campaignReference: input.campaignReference ?? null,
      status: "synced",
      timestamp: new Date().toISOString(),
    };
    this.assets.set(videoAssetReference, record);
    appendYaiLog({
      event: "video_asset_synchronization",
      level: "info",
      details: `Video asset managed: ${videoAssetReference} (${input.videoAssetName})`,
    });
    return { ...record };
  }

  get(videoAssetReference: string): VideoAssetRecord | null {
    const asset = this.assets.get(videoAssetReference);
    return asset ? { ...asset } : null;
  }

  list(): VideoAssetRecord[] {
    return [...this.assets.values()].map((a) => ({ ...a }));
  }

  count(): number {
    return this.assets.size;
  }

  resetForTesting(): void {
    this.assets.clear();
  }
}

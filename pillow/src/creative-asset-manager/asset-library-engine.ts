/** R5-11 — Asset Library Engine. */

import { CRA_METADATA_VERSION } from "./paths.js";
import type {
  AssetType,
  CreativeAssetRecord,
} from "./types.js";

export class AssetLibraryEngine {
  private readonly assets = new Map<string, CreativeAssetRecord>();

  create(input: {
    assetName: string;
    assetType: AssetType;
    tags?: string[];
    storageRef?: string;
    classification: string;
    campaignReference: string | null;
  }): CreativeAssetRecord {
    const assetId = `cra-asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record: CreativeAssetRecord = {
      assetId,
      timestamp: new Date().toISOString(),
      assetName: input.assetName.trim(),
      assetType: input.assetType,
      campaignReference: input.campaignReference,
      version: 1,
      approvalStatus: "draft",
      usageStatus: "unused",
      validationStatus: "passed",
      tags: [...new Set((input.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean))],
      classification: input.classification,
      storageRef: input.storageRef?.trim() || `vault://creative-assets/${assetId}`,
      usageCount: 0,
      metadataVersion: CRA_METADATA_VERSION,
    };
    this.assets.set(assetId, record);
    return { ...record };
  }

  get(assetId: string): CreativeAssetRecord | null {
    const record = this.assets.get(assetId);
    return record ? { ...record, tags: [...record.tags] } : null;
  }

  persist(record: CreativeAssetRecord): void {
    this.assets.set(record.assetId, {
      ...record,
      tags: [...record.tags],
      timestamp: new Date().toISOString(),
    });
  }

  list(): CreativeAssetRecord[] {
    return [...this.assets.values()].map((r) => ({ ...r, tags: [...r.tags] }));
  }

  count(): number {
    return this.assets.size;
  }

  approvedCount(): number {
    return this.list().filter((a) => a.approvalStatus === "approved").length;
  }

  resetForTesting(): void {
    this.assets.clear();
  }
}

export function defaultClassification(assetType: AssetType): string {
  switch (assetType) {
    case "image":
      return "visual_static";
    case "video":
      return "visual_motion";
    case "document":
      return "document_collateral";
    case "advertising_creative":
      return "paid_media_creative";
    default:
      return "unclassified";
  }
}

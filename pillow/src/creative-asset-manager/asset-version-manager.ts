/** R5-11 — Asset Version Manager. */

import type { AssetVersionRecord, CreativeAssetRecord } from "./types.js";

export class AssetVersionManager {
  private readonly versions: AssetVersionRecord[] = [];

  createVersion(asset: CreativeAssetRecord, changeSummary?: string): {
    asset: CreativeAssetRecord;
    version: AssetVersionRecord;
  } {
    const nextVersion = asset.version + 1;
    const updated: CreativeAssetRecord = {
      ...asset,
      version: nextVersion,
      approvalStatus: "draft",
      validationStatus: "pending",
      timestamp: new Date().toISOString(),
    };
    const version: AssetVersionRecord = {
      versionId: `cra-ver-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      assetId: asset.assetId,
      version: nextVersion,
      timestamp: new Date().toISOString(),
      changeSummary: changeSummary?.trim() || `Version ${nextVersion}`,
      approvalStatus: "draft",
    };
    this.versions.push(version);
    return { asset: updated, version };
  }

  seedInitial(asset: CreativeAssetRecord): AssetVersionRecord {
    const version: AssetVersionRecord = {
      versionId: `cra-ver-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      assetId: asset.assetId,
      version: 1,
      timestamp: asset.timestamp,
      changeSummary: "Initial version",
      approvalStatus: asset.approvalStatus,
    };
    this.versions.push(version);
    return version;
  }

  listForAsset(assetId: string): AssetVersionRecord[] {
    return this.versions.filter((v) => v.assetId === assetId).map((v) => ({ ...v }));
  }

  list(): AssetVersionRecord[] {
    return this.versions.map((v) => ({ ...v }));
  }

  syncApproval(assetId: string, version: number, approvalStatus: AssetVersionRecord["approvalStatus"]): void {
    const record = this.versions.find((v) => v.assetId === assetId && v.version === version);
    if (record) record.approvalStatus = approvalStatus;
  }

  resetForTesting(): void {
    this.versions.length = 0;
  }
}

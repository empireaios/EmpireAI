/** R5-11 — Asset Search Engine. */

import type { CreativeAssetRecord, SearchAssetsInput } from "./types.js";

export class AssetSearchEngine {
  search(assets: CreativeAssetRecord[], input: SearchAssetsInput): CreativeAssetRecord[] {
    const query = input.query?.trim().toLowerCase();
    return assets.filter((asset) => {
      if (input.assetType && asset.assetType !== input.assetType) return false;
      if (input.approvalStatus && asset.approvalStatus !== input.approvalStatus) return false;
      if (input.tag && !asset.tags.includes(input.tag.trim().toLowerCase())) return false;
      if (!query) return true;
      return (
        asset.assetName.toLowerCase().includes(query) ||
        asset.classification.toLowerCase().includes(query) ||
        asset.tags.some((t) => t.includes(query)) ||
        (asset.campaignReference?.toLowerCase().includes(query) ?? false)
      );
    });
  }
}

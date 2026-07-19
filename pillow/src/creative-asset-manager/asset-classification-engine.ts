/** R5-11 — Asset Classification Engine. */

import { defaultClassification } from "./asset-library-engine.js";
import type { CreativeAssetRecord } from "./types.js";

export class AssetClassificationEngine {
  classify(asset: CreativeAssetRecord): CreativeAssetRecord {
    const base = defaultClassification(asset.assetType);
    const tagHint = asset.tags.includes("hero")
      ? "hero"
      : asset.tags.includes("retargeting")
        ? "retargeting"
        : asset.tags.includes("brand")
          ? "brand"
          : "standard";
    return {
      ...asset,
      classification: `${base}:${tagHint}`,
      timestamp: new Date().toISOString(),
    };
  }
}

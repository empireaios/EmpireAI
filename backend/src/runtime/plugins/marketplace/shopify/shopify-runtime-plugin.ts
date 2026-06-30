import { MarketplaceRuntimePlugin } from "../marketplace-runtime-plugin.js";
import type { MarketplaceCapabilityDeclaration } from "../marketplace-runtime-plugin.js";

/** B-003 — Shopify runtime plugin skeleton. Architecture only — no OAuth, HTTP, or API. */
export class ShopifyRuntimePlugin extends MarketplaceRuntimePlugin {
  readonly manifest = this.buildManifest({
    pluginId: "shopify",
    displayName: "Shopify",
    version: "2024-10.0-arch",
    missionId: "B-003",
    description: "Shopify marketplace runtime plugin — architecture skeleton (Build Wave 1)",
    dependencies: ["reality-integration", "commerce-runtime"],
    certificationState: "UNCERTIFIED",
    executionState: "ARCHITECTURE_ONLY",
    lifecycle: "REGISTERED",
    sourceModule: "runtime/plugins/marketplace/shopify",
  });

  protected declareMarketplaceCapabilities(): MarketplaceCapabilityDeclaration[] {
    return [
      { capability: "publish_product", support: "DECLARED" },
      { capability: "update_product", support: "DECLARED" },
      { capability: "delete_product", support: "DECLARED" },
      { capability: "inventory", support: "DECLARED" },
      { capability: "orders", support: "DECLARED" },
      { capability: "customers", support: "DECLARED" },
      { capability: "collections", support: "DECLARED" },
      { capability: "returns", support: "PARTIAL" },
      { capability: "messaging", support: "UNSUPPORTED" },
      { capability: "analytics", support: "PARTIAL" },
      { capability: "webhooks", support: "DECLARED" },
      { capability: "pricing", support: "DECLARED" },
      { capability: "images", support: "DECLARED" },
      { capability: "categories", support: "DECLARED" },
      { capability: "attributes", support: "DECLARED" },
      { capability: "bulk_operations", support: "PARTIAL" },
    ];
  }
}

export function createShopifyRuntimePlugin(): ShopifyRuntimePlugin {
  return new ShopifyRuntimePlugin();
}

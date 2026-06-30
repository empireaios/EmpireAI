import { MarketplaceRuntimePlugin } from "../marketplace-runtime-plugin.js";
import type { MarketplaceCapabilityDeclaration } from "../marketplace-runtime-plugin.js";
import { AMAZON_DOMAIN_DEFINITIONS } from "../../../amazon-global-seller/models/amazon-capability-profile.js";

/** RS-002 — Amazon Runtime Plugin. Architecture only — no OAuth, HTTP, or SP-API. */
export class AmazonRuntimePlugin extends MarketplaceRuntimePlugin {
  readonly manifest = this.buildManifest({
    pluginId: "amazon-seller",
    displayName: "Amazon Seller",
    version: "2024.1-arch",
    missionId: "RS-002",
    description: "Amazon Seller runtime plugin — SP-API capability mapping (Revenue Slice 001)",
    dependencies: ["reality-integration", "commerce-runtime", "amazon-global-seller"],
    certificationState: "UNCERTIFIED",
    executionState: "ARCHITECTURE_ONLY",
    lifecycle: "REGISTERED",
    sourceModule: "runtime/plugins/marketplace/amazon",
  });

  protected declareMarketplaceCapabilities(): MarketplaceCapabilityDeclaration[] {
    return [
      { capability: "publish_product", support: "DECLARED" },
      { capability: "update_product", support: "DECLARED" },
      { capability: "delete_product", support: "DECLARED" },
      { capability: "inventory", support: "DECLARED" },
      { capability: "orders", support: "DECLARED" },
      { capability: "customers", support: "PARTIAL" },
      { capability: "collections", support: "UNSUPPORTED" },
      { capability: "returns", support: "DECLARED" },
      { capability: "messaging", support: "PARTIAL" },
      { capability: "analytics", support: "DECLARED" },
      { capability: "webhooks", support: "DECLARED" },
      { capability: "pricing", support: "DECLARED" },
      { capability: "images", support: "DECLARED" },
      { capability: "categories", support: "DECLARED" },
      { capability: "attributes", support: "DECLARED" },
      { capability: "bulk_operations", support: "DECLARED" },
    ];
  }

  /** RS-001 domain mapping exposed on plugin instance. */
  getAmazonDomainCoverage(): Array<{ domain: string; mappedCapability: string; support: string }> {
    const domainToCapability: Record<string, string> = {
      listings: "publish_product",
      catalog: "categories",
      inventory: "inventory",
      pricing: "pricing",
      orders: "orders",
      returns: "returns",
      reviews: "analytics",
      fulfillment: "inventory",
      settlement: "analytics",
      advertising: "analytics",
      reports: "analytics",
      notifications: "webhooks",
      regional_marketplaces: "categories",
      compliance: "attributes",
    };

    return AMAZON_DOMAIN_DEFINITIONS.map((d) => ({
      domain: d.domain,
      mappedCapability: domainToCapability[d.domain] ?? "attributes",
      support: this.declareMarketplaceCapabilities().find((c) => c.capability === domainToCapability[d.domain])?.support ?? "DECLARED",
    }));
  }
}

export function createAmazonRuntimePlugin(): AmazonRuntimePlugin {
  return new AmazonRuntimePlugin();
}

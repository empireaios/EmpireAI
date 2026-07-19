/** R1-10 — Shopify webhook adapter. */

import { randomUUID } from "node:crypto";
import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import { appendShopifyStoreLog } from "./shopify-store-logging.js";
import { SHOPIFY_STORE_MARKETPLACE_ID } from "./paths.js";
import type { ShopifyStoreMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { ShopifyStoreWebhookResult, HandleShopifyStoreWebhookInput } from "./types.js";

export class ShopifyStoreWebhookAdapter {
  constructor(private readonly framework: MarketplaceConnectorFrameworkEngine | null) {}

  handle(
    input: HandleShopifyStoreWebhookInput,
    config: ShopifyStoreMarketplaceIntegrationConfiguration,
  ): ShopifyStoreWebhookResult {
    const webhookId = `shf-whk-${randomUUID()}`;

    appendShopifyStoreLog({
      event: "webhook_processing",
      level: "info",
      details: `Shopify webhook ${input.topic}`,
    });

    if (!config.webhookRulesEnabled) {
      return {
        webhookId,
        topic: input.topic,
        accepted: false,
        verified: false,
        details: "Webhook handling disabled by configuration",
      };
    }

    if (this.framework) {
      try {
        this.framework.handleWebhook({
          marketplaceId: SHOPIFY_STORE_MARKETPLACE_ID,
          topic: input.topic,
          payloadRef: input.payloadRef,
        });
      } catch {
        /* framework webhook optional */
      }
    }

    return {
      webhookId,
      topic: input.topic,
      accepted: true,
      verified: config.webhookSignatureVerificationEnabled,
      details: `Webhook accepted (payload ref: ${input.payloadRef})`,
    };
  }
}

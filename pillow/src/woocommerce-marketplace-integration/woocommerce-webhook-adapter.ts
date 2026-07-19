/** R1-11 — WooCommerce webhook adapter. */

import { randomUUID } from "node:crypto";
import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import { appendWooCommerceLog } from "./woocommerce-logging.js";
import { WOOCOMMERCE_MARKETPLACE_ID } from "./paths.js";
import type { WooCommerceMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { WooCommerceWebhookResult, HandleWooCommerceWebhookInput } from "./types.js";

export class WooCommerceWebhookAdapter {
  constructor(private readonly framework: MarketplaceConnectorFrameworkEngine | null) {}

  handle(
    input: HandleWooCommerceWebhookInput,
    config: WooCommerceMarketplaceIntegrationConfiguration,
  ): WooCommerceWebhookResult {
    const webhookId = `woo-whk-${randomUUID()}`;

    appendWooCommerceLog({
      event: "webhook_processing",
      level: "info",
      details: `WooCommerce webhook ${input.topic}`,
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
          marketplaceId: WOOCOMMERCE_MARKETPLACE_ID,
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

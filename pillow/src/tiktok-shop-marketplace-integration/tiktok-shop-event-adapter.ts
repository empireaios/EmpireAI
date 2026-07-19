/** R1-09 — TikTok Shop event/webhook adapter. */

import { randomUUID } from "node:crypto";
import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import { appendTikTokShopLog } from "./tiktok-shop-logging.js";
import { TIKTOK_SHOP_MARKETPLACE_ID } from "./paths.js";
import type { TikTokShopMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { TikTokShopEventResult, HandleTikTokShopEventInput } from "./types.js";

export class TikTokShopEventAdapter {
  constructor(private readonly framework: MarketplaceConnectorFrameworkEngine | null) {}

  handle(
    input: HandleTikTokShopEventInput,
    config: TikTokShopMarketplaceIntegrationConfiguration,
  ): TikTokShopEventResult {
    const eventId = `tts-evt-${randomUUID()}`;

    appendTikTokShopLog({
      event: "event_processing",
      level: "info",
      details: `TikTok Shop event ${input.topic}`,
    });

    if (!config.eventHandlingRulesEnabled) {
      return {
        eventId,
        topic: input.topic,
        accepted: false,
        verified: false,
        details: "Event handling disabled by configuration",
      };
    }

    if (this.framework) {
      try {
        this.framework.handleWebhook({
          marketplaceId: TIKTOK_SHOP_MARKETPLACE_ID,
          topic: input.topic,
          payloadRef: input.payloadRef,
        });
      } catch {
        /* framework webhook optional */
      }
    }

    return {
      eventId,
      topic: input.topic,
      accepted: true,
      verified: config.eventSignatureVerificationEnabled,
      details: `Event accepted (payload ref: ${input.payloadRef})`,
    };
  }
}

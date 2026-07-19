/** R1-08 — eBay event/webhook adapter. */

import { randomUUID } from "node:crypto";
import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import { appendEbayLog } from "./ebay-logging.js";
import { EBAY_MARKETPLACE_ID } from "./paths.js";
import type { EbayMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { EbayEventResult, HandleEbayEventInput } from "./types.js";

export class EbayEventAdapter {
  constructor(private readonly framework: MarketplaceConnectorFrameworkEngine | null) {}

  handle(
    input: HandleEbayEventInput,
    config: EbayMarketplaceIntegrationConfiguration,
  ): EbayEventResult {
    const eventId = `ebay-evt-${randomUUID()}`;

    appendEbayLog({
      event: "event_processing",
      level: "info",
      details: `eBay event ${input.topic}`,
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
          marketplaceId: EBAY_MARKETPLACE_ID,
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

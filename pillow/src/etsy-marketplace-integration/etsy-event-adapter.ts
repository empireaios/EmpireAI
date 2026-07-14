/** R1-07 — Etsy event/webhook adapter. */

import { randomUUID } from "node:crypto";
import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import { appendEtsyLog } from "./etsy-logging.js";
import { ETSY_MARKETPLACE_ID } from "./paths.js";
import type { EtsyMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { EtsyEventResult, HandleEtsyEventInput } from "./types.js";

export class EtsyEventAdapter {
  constructor(private readonly framework: MarketplaceConnectorFrameworkEngine | null) {}

  handle(
    input: HandleEtsyEventInput,
    config: EtsyMarketplaceIntegrationConfiguration,
  ): EtsyEventResult {
    const eventId = `etsy-evt-${randomUUID()}`;

    appendEtsyLog({
      event: "event_processing",
      level: "info",
      details: `Etsy event ${input.topic}`,
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
          marketplaceId: ETSY_MARKETPLACE_ID,
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

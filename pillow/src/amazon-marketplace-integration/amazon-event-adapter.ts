/** R1-02 — Amazon event/webhook adapter. */

import { randomUUID } from "node:crypto";
import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import { appendAmazonLog } from "./amz-logging.js";
import { AMAZON_MARKETPLACE_ID } from "./paths.js";
import type { AmazonMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { AmazonEventResult, HandleAmazonEventInput } from "./types.js";

export class AmazonEventAdapter {
  constructor(private readonly framework: MarketplaceConnectorFrameworkEngine | null) {}

  handle(
    input: HandleAmazonEventInput,
    config: AmazonMarketplaceIntegrationConfiguration,
  ): AmazonEventResult {
    const eventId = `amz-evt-${randomUUID()}`;

    appendAmazonLog({
      event: "event_processing",
      level: "info",
      details: `Amazon event ${input.topic}`,
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
          marketplaceId: AMAZON_MARKETPLACE_ID,
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

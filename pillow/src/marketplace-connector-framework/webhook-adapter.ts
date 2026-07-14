/** R1-01 — Webhook abstraction adapter. */

import { randomUUID } from "node:crypto";
import { appendFrameworkLog } from "./mcf-logging.js";
import type { ConnectorRegistry } from "./connector-registry.js";
import type { MarketplaceConnectorFrameworkConfiguration } from "./configuration.js";
import type { HandleWebhookInput, WebhookPayload, WebhookResult } from "./types.js";

export class WebhookAdapter {
  constructor(private readonly registry: ConnectorRegistry) {}

  handle(
    input: HandleWebhookInput,
    config: MarketplaceConnectorFrameworkConfiguration,
  ): WebhookResult {
    const record = this.registry.get(input.marketplaceId);
    if (!record) {
      throw new Error(`Connector not registered: ${input.marketplaceId}`);
    }
    if (!record.webhookConfiguration.enabled) {
      return {
        eventId: `mcf-wh-${randomUUID()}`,
        accepted: false,
        verified: false,
        normalized: false,
        details: "Webhooks disabled for connector",
      };
    }

    const payload: WebhookPayload = {
      eventId: `mcf-wh-${randomUUID()}`,
      marketplaceId: input.marketplaceId,
      topic: input.topic,
      payloadRef: input.payloadRef,
      receivedAt: new Date().toISOString(),
    };

    const verified =
      !config.webhookSignatureVerificationEnabled ||
      record.webhookConfiguration.verifySignatures;

    appendFrameworkLog({
      event: "webhook_handling",
      level: "info",
      details: `Webhook ${payload.topic} from ${input.marketplaceId}`,
    });

    return {
      eventId: payload.eventId,
      accepted: config.webhookRulesEnabled,
      verified,
      normalized: true,
      details: `Webhook accepted (payload ref: ${payload.payloadRef})`,
    };
  }
}

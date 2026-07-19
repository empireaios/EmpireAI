/** R2-02 — CJdropshipping event/webhook adapter. */

import { randomUUID } from "node:crypto";
import { appendCjLog } from "./cj-logging.js";
import type { CjDropshippingIntegrationConfiguration } from "./configuration.js";
import type { CjWebhookResult, HandleCjWebhookInput } from "./types.js";

export class CjEventWebhookAdapter {
  handle(
    input: HandleCjWebhookInput,
    config: CjDropshippingIntegrationConfiguration,
  ): CjWebhookResult {
    const eventId = `cj-evt-${randomUUID()}`;

    appendCjLog({
      event: "webhook_event",
      level: "info",
      details: `CJdropshipping webhook topic=${input.topic}`,
    });

    if (!config.webhookRulesEnabled) {
      return {
        eventId,
        accepted: true,
        verified: false,
        normalized: true,
        details: "Webhook rules disabled — structural accept",
      };
    }

    if (!input.topic || !input.payloadRef) {
      return {
        eventId,
        accepted: false,
        verified: false,
        normalized: false,
        details: "Invalid webhook payload",
      };
    }

    return {
      eventId,
      accepted: true,
      verified: true,
      normalized: true,
      details: `CJdropshipping webhook ${input.topic} accepted`,
    };
  }
}

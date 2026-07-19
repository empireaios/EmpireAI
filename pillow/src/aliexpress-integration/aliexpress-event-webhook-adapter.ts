/** R2-03 — AliExpress event/webhook adapter. */

import { randomUUID } from "node:crypto";
import { appendAexLog } from "./aex-logging.js";
import type { AliExpressIntegrationConfiguration } from "./configuration.js";
import type { AliExpressWebhookResult, HandleAliExpressWebhookInput } from "./types.js";

export class AliExpressEventWebhookAdapter {
  handle(
    input: HandleAliExpressWebhookInput,
    config: AliExpressIntegrationConfiguration,
  ): AliExpressWebhookResult {
    const eventId = `aex-evt-${randomUUID()}`;

    appendAexLog({
      event: "webhook_event",
      level: "info",
      details: `AliExpress webhook topic=${input.topic}`,
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
      details: `AliExpress webhook ${input.topic} accepted`,
    };
  }
}

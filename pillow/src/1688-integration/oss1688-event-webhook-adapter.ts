/** R2-04 — 1688 event/webhook adapter. */

import { randomUUID } from "node:crypto";
import { appendOssLog } from "./oss-logging.js";
import type { Oss1688IntegrationConfiguration } from "./configuration.js";
import type { Oss1688WebhookResult, HandleOss1688WebhookInput } from "./types.js";

export class Oss1688EventWebhookAdapter {
  handle(
    input: HandleOss1688WebhookInput,
    config: Oss1688IntegrationConfiguration,
  ): Oss1688WebhookResult {
    const eventId = `oss-evt-${randomUUID()}`;

    appendOssLog({
      event: "webhook_event",
      level: "info",
      details: `1688 webhook topic=${input.topic}`,
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
      details: `1688 webhook ${input.topic} accepted`,
    };
  }
}

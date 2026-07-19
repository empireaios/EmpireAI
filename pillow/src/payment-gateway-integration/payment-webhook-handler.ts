/** R3-02 — Payment webhook handler. */

import { randomUUID } from "node:crypto";
import { appendPgLog } from "./pg-logging.js";
import type { GatewayRegistry } from "./gateway-registry.js";
import type { PaymentGatewayIntegrationConfiguration } from "./configuration.js";
import type { HandlePaymentWebhookInput, PaymentWebhookResult } from "./types.js";

export class PaymentWebhookHandler {
  constructor(private readonly registry: GatewayRegistry) {}

  handle(
    input: HandlePaymentWebhookInput,
    config: PaymentGatewayIntegrationConfiguration,
  ): PaymentWebhookResult {
    const eventId = `pg-wh-${randomUUID()}`;

    if (!config.webhookRulesEnabled) {
      return {
        eventId,
        accepted: false,
        verified: false,
        normalized: false,
        paymentId: null,
        details: "Webhook rules disabled",
      };
    }

    if (!input.topic || !input.payloadRef) {
      return {
        eventId,
        accepted: false,
        verified: false,
        normalized: false,
        paymentId: null,
        details: "Missing webhook topic or payload reference",
      };
    }

    let paymentId: string | null = null;
    if (input.transactionId) {
      const payment = this.registry
        .listPayments()
        .find((p) => p.transactionId === input.transactionId);
      paymentId = payment?.paymentId ?? null;
    }

    appendPgLog({
      event: "payment_webhook",
      level: "info",
      details: `Webhook ${input.topic} received`,
    });

    return {
      eventId,
      accepted: true,
      verified: true,
      normalized: true,
      paymentId,
      details: `Webhook ${input.topic} processed`,
    };
  }
}

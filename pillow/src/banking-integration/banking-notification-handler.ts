/** R3-03 — Banking notification handler. */

import { randomUUID } from "node:crypto";
import { appendBiLog } from "./bi-logging.js";
import type { BankingProviderRegistry } from "./banking-provider-registry.js";
import type { BankingIntegrationConfiguration } from "./configuration.js";
import type { BankingNotificationResult, HandleBankingNotificationInput } from "./types.js";

export class BankingNotificationHandler {
  constructor(private readonly registry: BankingProviderRegistry) {}

  handle(
    input: HandleBankingNotificationInput,
    config: BankingIntegrationConfiguration,
  ): BankingNotificationResult {
    const notificationId = `bi-notif-${randomUUID()}`;

    if (!config.notificationRulesEnabled) {
      return {
        notificationId,
        accepted: false,
        verified: false,
        bankingRecordId: null,
        details: "Notification rules disabled",
      };
    }

    if (!input.topic || !input.payloadRef) {
      return {
        notificationId,
        accepted: false,
        verified: false,
        bankingRecordId: null,
        details: "Missing notification topic or payload reference",
      };
    }

    let bankingRecordId: string | null = null;
    if (input.bankAccountReference) {
      const account = this.registry.getAccount(input.bankAccountReference);
      bankingRecordId = account?.bankingRecordId ?? null;
    }

    appendBiLog({
      event: "banking_notification",
      level: "info",
      details: `Notification ${input.topic} received`,
    });

    return {
      notificationId,
      accepted: true,
      verified: true,
      bankingRecordId,
      details: `Notification ${input.topic} processed`,
    };
  }
}

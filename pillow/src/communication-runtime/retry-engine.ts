import { nextComrtId, type CommunicationStore } from "./communication-store.js";
import type { CommunicationRuntimeConfiguration } from "./configuration.js";
import type { CommunicationMessage, DeliveryRecord } from "./types.js";

export type RetryResult = {
  message: CommunicationMessage;
  delivery: DeliveryRecord;
  deadLettered: boolean;
};

/**
 * Retry failed deliveries; dead-letter after maxRetries.
 */
export class RetryEngine {
  retryFailed(
    store: CommunicationStore,
    messageId: string,
    channelId: string,
    config: CommunicationRuntimeConfiguration,
  ): RetryResult | null {
    const existing = store.getMessage(messageId);
    if (!existing) return null;
    if (existing.deliveryStatus !== "failed" && existing.deliveryStatus !== "retrying") {
      return null;
    }

    const maxRetries = existing.maxRetries || config.defaultMaxRetries;
    const nextRetry = existing.retryCount + 1;

    if (nextRetry >= maxRetries) {
      const dead = store.updateMessage(messageId, {
        deliveryStatus: "dead_lettered",
        retryCount: nextRetry,
        messageType: "dead_letter",
      })!;
      const delivery = this.record(
        store,
        messageId,
        channelId,
        "dead_lettered",
        nextRetry,
        "max_retries_exhausted",
      );
      return { message: dead, delivery, deadLettered: true };
    }

    const retrying = store.updateMessage(messageId, {
      deliveryStatus: "retrying",
      retryCount: nextRetry,
    })!;
    this.record(store, messageId, channelId, "retrying", nextRetry, null);

    const delivered = store.updateMessage(messageId, {
      deliveryStatus: "delivered",
    })!;
    const delivery = this.record(store, messageId, channelId, "delivered", nextRetry, null);
    return { message: delivered, delivery, deadLettered: false };
  }

  listRetryEligible(store: CommunicationStore): CommunicationMessage[] {
    return store.listFailedMessages().filter((m) => m.deliveryStatus === "failed");
  }

  private record(
    store: CommunicationStore,
    messageId: string,
    channelId: string,
    status: DeliveryRecord["status"],
    attempt: number,
    errorClass: string | null,
  ): DeliveryRecord {
    const delivery: DeliveryRecord = {
      deliveryId: nextComrtId("comrt-dlv"),
      messageId,
      channelId,
      status,
      attempt,
      timestamp: new Date().toISOString(),
      errorClass,
      structuralSignalOnly: true,
      fabricated: false,
    };
    return store.saveDelivery(delivery);
  }
}

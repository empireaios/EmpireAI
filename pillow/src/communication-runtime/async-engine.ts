import { nextComrtId, type CommunicationStore } from "./communication-store.js";
import type { CommunicationMessage, DeliveryRecord } from "./types.js";

export type AsyncDeliveryResult = {
  message: CommunicationMessage;
  deliveries: DeliveryRecord[];
  failed: boolean;
};

/**
 * Asynchronous send — pending → routed → delivered.
 * NEVER fabricates message content; operates on caller-provided contextReference only.
 */
export class AsyncEngine {
  deliver(
    store: CommunicationStore,
    message: CommunicationMessage,
    channelId: string,
    simulateFailure: boolean,
  ): AsyncDeliveryResult {
    const deliveries: DeliveryRecord[] = [];

    let current = store.updateMessage(message.messageId, {
      deliveryStatus: "pending",
      syncMode: "async",
    })!;
    deliveries.push(this.recordDelivery(store, current.messageId, channelId, "pending", 1, null));

    current = store.updateMessage(current.messageId, { deliveryStatus: "routed" })!;
    deliveries.push(this.recordDelivery(store, current.messageId, channelId, "routed", 1, null));

    if (simulateFailure) {
      current = store.updateMessage(current.messageId, {
        deliveryStatus: "failed",
        retryCount: current.retryCount,
      })!;
      deliveries.push(
        this.recordDelivery(store, current.messageId, channelId, "failed", 1, "simulated_failure"),
      );
      return { message: current, deliveries, failed: true };
    }

    current = store.updateMessage(current.messageId, { deliveryStatus: "delivered" })!;
    deliveries.push(this.recordDelivery(store, current.messageId, channelId, "delivered", 1, null));

    return { message: current, deliveries, failed: false };
  }

  private recordDelivery(
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

import { nextComrtId, type CommunicationStore } from "./communication-store.js";
import type { CommunicationMessage, DeliveryRecord } from "./types.js";

/**
 * Acknowledge messages — NEVER removes acknowledged messages from history.
 */
export class AcknowledgementHandler {
  acknowledge(
    store: CommunicationStore,
    messageId: string,
    channelId: string,
  ): { message: CommunicationMessage; delivery: DeliveryRecord } | null {
    const existing = store.getMessage(messageId);
    if (!existing) return null;

    const acknowledgedAt = new Date().toISOString();
    const updated = store.updateMessage(messageId, {
      deliveryStatus: "acknowledged",
      acknowledgedAt,
      messageType:
        existing.messageType === "acknowledgement" ? existing.messageType : existing.messageType,
    })!;

    const delivery: DeliveryRecord = {
      deliveryId: nextComrtId("comrt-dlv"),
      messageId,
      channelId,
      status: "acknowledged",
      attempt: existing.retryCount + 1,
      timestamp: acknowledgedAt,
      errorClass: null,
      structuralSignalOnly: true,
      fabricated: false,
    };
    store.saveDelivery(delivery);

    // History already retains prior snapshots via saveMessage/updateMessage — never delete.
    return { message: updated, delivery };
  }
}

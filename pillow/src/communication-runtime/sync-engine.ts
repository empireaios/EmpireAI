import { COMRT_METADATA_VERSION, COMRT_MISSION_ID } from "./paths.js";
import { nextComrtId, type CommunicationStore } from "./communication-store.js";
import type { CommunicationMessage, ComrtInput, DeliveryRecord } from "./types.js";

export type SyncDeliveryResult = {
  request: CommunicationMessage;
  response: CommunicationMessage;
  deliveries: DeliveryRecord[];
};

/**
 * Synchronous request-response — pairs request+response via correlationId.
 * NEVER fabricates message content; response uses caller's contextReference pattern.
 */
export class SyncEngine {
  deliver(
    store: CommunicationStore,
    request: CommunicationMessage,
    channelId: string,
    input: ComrtInput,
  ): SyncDeliveryResult {
    const correlationId = request.correlationId ?? request.messageId;
    const now = new Date().toISOString();

    const routed = store.updateMessage(request.messageId, {
      deliveryStatus: "routed",
      correlationId,
      syncMode: "sync",
    })!;

    const requestDelivery = this.recordDelivery(store, routed.messageId, channelId, "routed", 1, null);

    const delivered = store.updateMessage(routed.messageId, {
      deliveryStatus: "delivered",
    })!;
    const deliveredRecord = this.recordDelivery(
      store,
      delivered.messageId,
      channelId,
      "delivered",
      1,
      null,
    );

    const responseContext =
      input.contextReference
        ? `${input.contextReference}/response`
        : `${delivered.contextReference}/response`;

    const response: CommunicationMessage = {
      messageId: nextComrtId("comrt-msg"),
      sender: delivered.receiver,
      receiver: delivered.sender,
      messageType: "response",
      correlationId,
      sessionId: delivered.sessionId,
      missionId: delivered.missionId || COMRT_MISSION_ID,
      priority: delivered.priority,
      deliveryStatus: "delivered",
      retryCount: 0,
      maxRetries: delivered.maxRetries,
      timestamp: now,
      contextReference: responseContext.startsWith("ctx://")
        ? responseContext
        : `ctx://structural/response/${correlationId}`,
      auditReference: `audit://comrt/response/${correlationId}`,
      channelType: delivered.channelType,
      syncMode: "sync",
      acknowledgedAt: null,
      fabricated: false,
      structuralSignalOnly: true,
      metadataVersion: COMRT_METADATA_VERSION,
    };
    store.saveMessage(response);
    const responseDelivery = this.recordDelivery(
      store,
      response.messageId,
      channelId,
      "delivered",
      1,
      null,
    );

    return {
      request: delivered,
      response,
      deliveries: [requestDelivery, deliveredRecord, responseDelivery],
    };
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

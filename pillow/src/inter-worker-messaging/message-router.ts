import type { InterWorkerMessagingConfiguration } from "./configuration.js";
import type {
  DeliveryStatus,
  InterWorkerMessagingInput,
  MessagePriority,
  MessageType,
} from "./types.js";

export type RouteBundle = {
  senderWorker: string;
  receiverWorker: string;
  businessId: string;
  missionId: string;
  conversationId: string;
  messageType: MessageType | string;
  priority: MessagePriority;
  messageSummary: string;
  payloadReference: string;
  inReplyTo: string | null;
  isBroadcast: boolean;
  deliveryStatus: DeliveryStatus;
};

/** Pure message routing helpers for Q0-24. */
export class MessageRouter {
  route(
    input: InterWorkerMessagingInput,
    config: InterWorkerMessagingConfiguration,
    options: { broadcast?: boolean; reply?: boolean } = {},
  ): RouteBundle {
    const isBroadcast = options.broadcast === true || input.broadcast === true;
    const senderWorker = input.senderWorker?.trim() || "worker-sender";
    const receiverWorker = isBroadcast
      ? "*broadcast*"
      : input.receiverWorker?.trim() || "worker-receiver";
    const businessId = input.businessId?.trim() || "biz-unspecified";
    const missionId = input.missionId?.trim() || "mission-unspecified";
    const conversationId =
      input.conversationId?.trim() ||
      `conv-${missionId}-${businessId}-${senderWorker}-${isBroadcast ? "broadcast" : receiverWorker}`;
    const messageType =
      input.messageType?.toString().trim() ||
      (isBroadcast
        ? "broadcast"
        : options.reply
          ? "task_response"
          : "information");
    const priority = normalizePriority(input.priority) ?? config.defaultPriority;
    const messageSummary =
      input.messageSummary?.trim() ||
      `${messageType.replace(/_/g, " ")} from ${senderWorker} to ${receiverWorker}`;
    const payloadReference =
      input.payloadReference?.trim() || `payload://${conversationId}/${Date.now()}`;
    const inReplyTo = input.inReplyTo?.trim() || null;

    return {
      senderWorker,
      receiverWorker,
      businessId,
      missionId,
      conversationId,
      messageType,
      priority,
      messageSummary,
      payloadReference,
      inReplyTo,
      isBroadcast,
      deliveryStatus: "queued",
    };
  }

  responseTypeFor(requestType: string): MessageType | string {
    switch (requestType) {
      case "task_request":
        return "task_response";
      case "review_request":
        return "review_response";
      case "approval_request":
        return "approval_response";
      default:
        return "information";
    }
  }

  advanceDelivery(current: DeliveryStatus, target?: DeliveryStatus | null): DeliveryStatus {
    if (target) return target;
    const order: DeliveryStatus[] = [
      "queued",
      "sent",
      "delivered",
      "read",
      "acknowledged",
    ];
    const idx = order.indexOf(current);
    if (idx < 0) return current;
    if (idx >= order.length - 1) return current;
    return order[idx + 1]!;
  }
}

function normalizePriority(value: string | null | undefined): MessagePriority | null {
  if (!value) return null;
  const normalized = value.toString().trim().toLowerCase();
  if (
    normalized === "critical" ||
    normalized === "high" ||
    normalized === "medium" ||
    normalized === "low"
  ) {
    return normalized;
  }
  return null;
}

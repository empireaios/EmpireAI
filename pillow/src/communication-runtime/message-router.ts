import { PRIORITY_RANK } from "./paths.js";
import type { CommunicationMessage, Priority } from "./types.js";

export type RouteDecision = {
  routed: boolean;
  channelId: string;
  receiver: string;
  channelType: CommunicationMessage["channelType"];
  priority: Priority;
  orderKey: string;
};

/**
 * Deterministic message routing — stable sort by priority then timestamp then messageId.
 */
export class MessageRouter {
  route(
    message: CommunicationMessage,
    channelId: string,
  ): RouteDecision {
    return {
      routed: true,
      channelId,
      receiver: message.receiver,
      channelType: message.channelType,
      priority: message.priority,
      orderKey: this.orderKey(message),
    };
  }

  /** Stable deterministic ordering: priority rank → timestamp → messageId. */
  sortDeterministically(messages: CommunicationMessage[]): CommunicationMessage[] {
    return [...messages].sort((a, b) => {
      const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (pr !== 0) return pr;
      const ts = a.timestamp.localeCompare(b.timestamp);
      if (ts !== 0) return ts;
      return a.messageId.localeCompare(b.messageId);
    });
  }

  orderKey(message: CommunicationMessage): string {
    const rank = String(PRIORITY_RANK[message.priority]).padStart(2, "0");
    return `${rank}|${message.timestamp}|${message.messageId}`;
  }
}

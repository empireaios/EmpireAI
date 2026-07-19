/** R4-07 — Chat queue manager. */

import type { LiveChatIntegrationConfiguration } from "./configuration.js";
import type { ChatMessage } from "./types.js";
import type { LiveChatRegistry } from "./live-chat-registry.js";

export class ChatQueueManager {
  dequeueBatch(
    registry: LiveChatRegistry,
    config: LiveChatIntegrationConfiguration,
    limit?: number,
  ): ChatMessage[] {
    const rule = config.queueRules.find((r) => r.ruleId === "default_queue");
    const batchSize = limit ?? rule?.batchSize ?? 25;
    return registry.queuedMessages().slice(0, batchSize);
  }

  markProcessed(registry: LiveChatRegistry, message: ChatMessage): void {
    registry.dequeueMessage(message.messageId);
  }
}

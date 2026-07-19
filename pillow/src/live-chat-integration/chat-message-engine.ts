/** R4-07 — Chat message engine. */

import type { ChatMessage } from "./types.js";
import type { LiveChatRegistry } from "./live-chat-registry.js";
import { ChatMetadataGenerator } from "./chat-metadata-generator.js";

export class ChatMessageEngine {
  private readonly metadata = new ChatMetadataGenerator();

  createCustomerMessage(
    registry: LiveChatRegistry,
    input: { chatSessionId: string; conversationId: string; customerId: string; body: string },
  ): ChatMessage {
    const message = this.metadata.buildMessage({
      ...input,
      sender: "customer",
    });
    registry.storeMessage(message, true);
    return message;
  }

  createSupportResponse(
    registry: LiveChatRegistry,
    input: { chatSessionId: string; conversationId: string; customerId: string; body: string },
  ): ChatMessage {
    const message = this.metadata.buildMessage({
      ...input,
      sender: "agent",
    });
    registry.storeMessage(message);
    return message;
  }
}

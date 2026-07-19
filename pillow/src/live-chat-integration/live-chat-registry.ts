/** R4-07 — Live chat registry. */

import type { ChatConversation, ChatMessage, LiveChatRecord } from "./types.js";

export class LiveChatRegistry {
  private readonly sessions = new Map<string, LiveChatRecord>();
  private readonly conversations = new Map<string, ChatConversation>();
  private readonly messages = new Map<string, ChatMessage>();
  private readonly queuedMessageIds = new Set<string>();
  private readonly sendKeys = new Set<string>();

  storeSession(record: LiveChatRecord): void {
    this.sessions.set(record.chatSessionId, record);
  }

  storeConversation(conversation: ChatConversation): void {
    this.conversations.set(conversation.conversationId, conversation);
  }

  storeMessage(message: ChatMessage, queued = false): void {
    this.messages.set(message.messageId, message);
    if (queued) this.queuedMessageIds.add(message.messageId);
  }

  getSession(chatSessionId: string): LiveChatRecord | null {
    return this.sessions.get(chatSessionId) ?? null;
  }

  getConversation(conversationId: string): ChatConversation | null {
    return this.conversations.get(conversationId) ?? null;
  }

  getMessage(messageId: string): ChatMessage | null {
    return this.messages.get(messageId) ?? null;
  }

  listSessions(): LiveChatRecord[] {
    return [...this.sessions.values()];
  }

  listConversations(): ChatConversation[] {
    return [...this.conversations.values()];
  }

  listMessages(): ChatMessage[] {
    return [...this.messages.values()];
  }

  queuedMessages(): ChatMessage[] {
    return this.listMessages().filter((m) => this.queuedMessageIds.has(m.messageId));
  }

  dequeueMessage(messageId: string): void {
    this.queuedMessageIds.delete(messageId);
  }

  hasSendKey(key: string): boolean {
    return this.sendKeys.has(key);
  }

  addSendKey(key: string): void {
    this.sendKeys.add(key);
  }

  resetForTesting(): void {
    this.sessions.clear();
    this.conversations.clear();
    this.messages.clear();
    this.queuedMessageIds.clear();
    this.sendKeys.clear();
  }
}

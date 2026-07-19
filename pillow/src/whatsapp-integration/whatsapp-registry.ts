/** R4-06 — WhatsApp record registry. */

import type { WhatsAppConversation, WhatsAppRecord, WhatsAppTemplate } from "./types.js";

export class WhatsAppRegistry {
  private readonly messages = new Map<string, WhatsAppRecord>();
  private readonly templates = new Map<string, WhatsAppTemplate>();
  private readonly conversations = new Map<string, WhatsAppConversation>();
  private readonly sendKeys = new Set<string>();

  storeMessage(record: WhatsAppRecord, sendKey?: string): void {
    this.messages.set(record.whatsAppRecordId, record);
    if (sendKey) this.sendKeys.add(sendKey);
  }

  storeTemplate(template: WhatsAppTemplate): void {
    this.templates.set(template.templateId, template);
  }

  storeConversation(conversation: WhatsAppConversation): void {
    this.conversations.set(conversation.conversationId, conversation);
  }

  getMessage(whatsAppRecordId: string): WhatsAppRecord | null {
    return this.messages.get(whatsAppRecordId) ?? null;
  }

  getTemplate(templateId: string): WhatsAppTemplate | null {
    return this.templates.get(templateId) ?? null;
  }

  getConversation(conversationId: string): WhatsAppConversation | null {
    return this.conversations.get(conversationId) ?? null;
  }

  listMessages(): WhatsAppRecord[] {
    return [...this.messages.values()];
  }

  listTemplates(): WhatsAppTemplate[] {
    return [...this.templates.values()];
  }

  listConversations(): WhatsAppConversation[] {
    return [...this.conversations.values()];
  }

  queued(): WhatsAppRecord[] {
    return this.listMessages().filter((r) => r.deliveryStatus === "queued");
  }

  findConversation(customerId: string, phone: string): WhatsAppConversation | null {
    return (
      this.listConversations().find(
        (c) => c.customerId === customerId && c.recipientPhoneNumber === phone && c.status === "active",
      ) ?? null
    );
  }

  hasSendKey(key: string): boolean {
    return this.sendKeys.has(key);
  }

  resetForTesting(): void {
    this.messages.clear();
    this.templates.clear();
    this.conversations.clear();
    this.sendKeys.clear();
  }
}

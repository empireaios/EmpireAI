/** R4-04 — Email record registry. */

import type { EmailRecord, EmailTemplate } from "./types.js";

export class EmailRegistry {
  private readonly emails = new Map<string, EmailRecord>();
  private readonly templates = new Map<string, EmailTemplate>();
  private readonly sendKeys = new Set<string>();

  storeEmail(record: EmailRecord, sendKey?: string): void {
    this.emails.set(record.emailRecordId, record);
    if (sendKey) this.sendKeys.add(sendKey);
  }

  storeTemplate(template: EmailTemplate): void {
    this.templates.set(template.templateId, template);
  }

  getEmail(emailRecordId: string): EmailRecord | null {
    return this.emails.get(emailRecordId) ?? null;
  }

  getTemplate(templateId: string): EmailTemplate | null {
    return this.templates.get(templateId) ?? null;
  }

  listEmails(): EmailRecord[] {
    return [...this.emails.values()];
  }

  listTemplates(): EmailTemplate[] {
    return [...this.templates.values()];
  }

  queued(): EmailRecord[] {
    return this.listEmails().filter((e) => e.deliveryStatus === "queued");
  }

  hasSendKey(key: string): boolean {
    return this.sendKeys.has(key);
  }

  resetForTesting(): void {
    this.emails.clear();
    this.templates.clear();
    this.sendKeys.clear();
  }
}

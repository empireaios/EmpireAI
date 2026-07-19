/** R4-05 — SMS record registry. */

import type { SmsRecord, SmsTemplate } from "./types.js";

export class SmsRegistry {
  private readonly smsRecords = new Map<string, SmsRecord>();
  private readonly templates = new Map<string, SmsTemplate>();
  private readonly sendKeys = new Set<string>();

  storeSms(record: SmsRecord, sendKey?: string): void {
    this.smsRecords.set(record.smsRecordId, record);
    if (sendKey) this.sendKeys.add(sendKey);
  }

  storeTemplate(template: SmsTemplate): void {
    this.templates.set(template.templateId, template);
  }

  getSms(smsRecordId: string): SmsRecord | null {
    return this.smsRecords.get(smsRecordId) ?? null;
  }

  getTemplate(templateId: string): SmsTemplate | null {
    return this.templates.get(templateId) ?? null;
  }

  listSms(): SmsRecord[] {
    return [...this.smsRecords.values()];
  }

  listTemplates(): SmsTemplate[] {
    return [...this.templates.values()];
  }

  queued(): SmsRecord[] {
    return this.listSms().filter((r) => r.deliveryStatus === "queued");
  }

  hasSendKey(key: string): boolean {
    return this.sendKeys.has(key);
  }

  resetForTesting(): void {
    this.smsRecords.clear();
    this.templates.clear();
    this.sendKeys.clear();
  }
}

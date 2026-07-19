/** R4-08 — AI support registry. */

import type {
  AiSupportRecord,
  CustomerContext,
  SupportSummary,
} from "./types.js";

export class AiSupportRegistry {
  private readonly records = new Map<string, AiSupportRecord>();
  private readonly contexts = new Map<string, CustomerContext>();
  private readonly summaries = new Map<string, SupportSummary>();
  private readonly sendKeys = new Set<string>();

  storeRecord(record: AiSupportRecord, sendKey?: string): void {
    this.records.set(record.aiSupportRecordId, record);
    if (sendKey) this.sendKeys.add(sendKey);
  }

  storeContext(context: CustomerContext): void {
    this.contexts.set(context.contextId, context);
  }

  storeSummary(summary: SupportSummary): void {
    this.summaries.set(summary.summaryId, summary);
  }

  getRecord(aiSupportRecordId: string): AiSupportRecord | null {
    return this.records.get(aiSupportRecordId) ?? null;
  }

  getContext(contextId: string): CustomerContext | null {
    return this.contexts.get(contextId) ?? null;
  }

  getSummary(summaryId: string): SupportSummary | null {
    return this.summaries.get(summaryId) ?? null;
  }

  listRecords(): AiSupportRecord[] {
    return [...this.records.values()];
  }

  listContexts(): CustomerContext[] {
    return [...this.contexts.values()];
  }

  listSummaries(): SupportSummary[] {
    return [...this.summaries.values()];
  }

  hasSendKey(key: string): boolean {
    return this.sendKeys.has(key);
  }

  resetForTesting(): void {
    this.records.clear();
    this.contexts.clear();
    this.summaries.clear();
    this.sendKeys.clear();
  }
}

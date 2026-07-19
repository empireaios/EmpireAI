/** R4-09 — Ticket registry. */

import type { TicketRecord } from "./types.js";

export class TicketRegistry {
  private readonly records = new Map<string, TicketRecord>();
  private readonly createKeys = new Set<string>();
  private readonly ticketTexts = new Map<string, { subject: string; description: string }>();
  private readonly statusHistory = new Map<string, string[]>();

  storeRecord(record: TicketRecord, createKey?: string): void {
    this.records.set(record.ticketId, record);
    if (createKey) this.createKeys.add(createKey);
  }

  storeTicketText(ticketId: string, subject: string, description: string): void {
    this.ticketTexts.set(ticketId, { subject, description });
  }

  getTicketText(ticketId: string): { subject: string; description: string } | null {
    return this.ticketTexts.get(ticketId) ?? null;
  }

  appendStatusHistory(ticketId: string, status: string): void {
    const history = this.statusHistory.get(ticketId) ?? [];
    history.push(`${new Date().toISOString()}|${status}`);
    this.statusHistory.set(ticketId, history);
  }

  getStatusHistory(ticketId: string): string[] {
    return this.statusHistory.get(ticketId) ?? [];
  }

  getRecord(ticketId: string): TicketRecord | null {
    return this.records.get(ticketId) ?? null;
  }

  listRecords(): TicketRecord[] {
    return [...this.records.values()];
  }

  hasCreateKey(key: string): boolean {
    return this.createKeys.has(key);
  }

  resetForTesting(): void {
    this.records.clear();
    this.createKeys.clear();
    this.ticketTexts.clear();
    this.statusHistory.clear();
  }
}

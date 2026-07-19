/** R4-03 — Timeline record registry. */

import type { TimelineRecord } from "./types.js";

export class TimelineRegistry {
  private readonly records = new Map<string, TimelineRecord>();
  private readonly byCustomerId = new Map<string, string[]>();
  private readonly eventKeys = new Set<string>();

  store(record: TimelineRecord): void {
    this.records.set(record.timelineRecordId, record);
    const existing = this.byCustomerId.get(record.customerId) ?? [];
    existing.push(record.timelineRecordId);
    this.byCustomerId.set(record.customerId, existing);
    this.eventKeys.add(this.buildEventKey(record));
  }

  get(timelineRecordId: string): TimelineRecord | null {
    return this.records.get(timelineRecordId) ?? null;
  }

  list(): TimelineRecord[] {
    return [...this.records.values()];
  }

  listByCustomer(customerId: string): TimelineRecord[] {
    const ids = this.byCustomerId.get(customerId) ?? [];
    return ids
      .map((id) => this.get(id))
      .filter(Boolean)
      .sort((a, b) => a!.timestamp.localeCompare(b!.timestamp)) as TimelineRecord[];
  }

  hasDuplicateEvent(record: TimelineRecord): boolean {
    return this.eventKeys.has(this.buildEventKey(record));
  }

  countUniqueCustomers(): number {
    return this.byCustomerId.size;
  }

  private buildEventKey(record: TimelineRecord): string {
    return `${record.customerId}:${record.eventType}:${record.eventReference}`;
  }

  resetForTesting(): void {
    this.records.clear();
    this.byCustomerId.clear();
    this.eventKeys.clear();
  }
}

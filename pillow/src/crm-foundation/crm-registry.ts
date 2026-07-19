/** R4-02 — CRM record registry. */

import type { CrmRecord } from "./types.js";

export class CrmRegistry {
  private readonly records = new Map<string, CrmRecord>();
  private readonly byCustomerId = new Map<string, string>();

  store(record: CrmRecord): void {
    this.records.set(record.crmRecordId, record);
    this.byCustomerId.set(record.customerId, record.crmRecordId);
  }

  get(crmRecordId: string): CrmRecord | null {
    return this.records.get(crmRecordId) ?? null;
  }

  getByCustomerId(customerId: string): CrmRecord | null {
    const id = this.byCustomerId.get(customerId);
    return id ? this.get(id) : null;
  }

  list(): CrmRecord[] {
    return [...this.records.values()];
  }

  active(): CrmRecord[] {
    return this.list().filter(
      (r) => r.customerLifecycleStatus === "active" || r.customerLifecycleStatus === "prospect",
    );
  }

  resetForTesting(): void {
    this.records.clear();
    this.byCustomerId.clear();
  }
}

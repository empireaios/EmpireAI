/** R4-01 — Customer identity registry. */

import type { CustomerIdentityRecord } from "./types.js";

export class IdentityRegistry {
  private readonly identities = new Map<string, CustomerIdentityRecord>();

  store(record: CustomerIdentityRecord): void {
    this.identities.set(record.customerId, record);
  }

  get(customerId: string): CustomerIdentityRecord | null {
    return this.identities.get(customerId) ?? null;
  }

  list(): CustomerIdentityRecord[] {
    return [...this.identities.values()];
  }

  active(): CustomerIdentityRecord[] {
    return this.list().filter(
      (r) => r.identityStatus === "active" || r.identityStatus === "linked",
    );
  }

  resetForTesting(): void {
    this.identities.clear();
  }
}

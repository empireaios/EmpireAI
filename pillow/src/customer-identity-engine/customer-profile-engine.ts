/** R4-01 — Customer profile engine. */

import type { CustomerIdentityRecord } from "./types.js";
import type { IdentityRegistry } from "./identity-registry.js";

export class CustomerProfileEngine {
  getUnifiedProfile(
    registry: IdentityRegistry,
    customerId: string,
  ): CustomerIdentityRecord | null {
    return registry.get(customerId);
  }

  listProfiles(registry: IdentityRegistry): CustomerIdentityRecord[] {
    return registry.list();
  }

  countActive(registry: IdentityRegistry): number {
    return registry.active().length;
  }

  countMerged(registry: IdentityRegistry): number {
    return registry.list().filter((r) => r.identityStatus === "merged").length;
  }

  toMachineReadable(record: CustomerIdentityRecord): Record<string, unknown> {
    return {
      customerId: record.customerId,
      timestamp: record.timestamp,
      customerIdentifiers: record.customerIdentifiers.map((id) => ({
        type: id.identifierType,
        value: id.identifierValue,
        channel: id.channel,
      })),
      customerName: record.customerName,
      contactReferences: record.contactReferences,
      marketplaceReferences: record.marketplaceReferences,
      communicationReferences: record.communicationReferences,
      identityStatus: record.identityStatus,
      validationStatus: record.validationStatus,
      metadataVersion: record.metadataVersion,
    };
  }
}

/** R4-02 — Customer profile manager. */

import type { CrmRecord } from "./types.js";
import type { CrmRegistry } from "./crm-registry.js";

export class CustomerProfileManager {
  getProfile(registry: CrmRegistry, crmRecordId: string): CrmRecord | null {
    return registry.get(crmRecordId);
  }

  getProfileByCustomerId(registry: CrmRegistry, customerId: string): CrmRecord | null {
    return registry.getByCustomerId(customerId);
  }

  listProfiles(registry: CrmRegistry): CrmRecord[] {
    return registry.list();
  }

  countActive(registry: CrmRegistry): number {
    return registry.active().length;
  }

  toMachineReadable(record: CrmRecord): Record<string, unknown> {
    return {
      crmRecordId: record.crmRecordId,
      timestamp: record.timestamp,
      customerId: record.customerId,
      customerProfileReference: record.customerProfileReference,
      customerLifecycleStatus: record.customerLifecycleStatus,
      customerOwner: record.customerOwner,
      customerTags: record.customerTags,
      customerNotes: record.customerNotes.map((n) => ({
        noteId: n.noteId,
        timestamp: n.timestamp,
        author: n.author,
        content: n.content,
      })),
      customAttributes: record.customAttributes,
      customerAccountRefs: record.customerAccountRefs,
      contactInformation: record.contactInformation,
      validationStatus: record.validationStatus,
      metadataVersion: record.metadataVersion,
    };
  }
}

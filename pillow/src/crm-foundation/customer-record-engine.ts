/** R4-02 — Customer record engine. */

import { CRM_METADATA_VERSION } from "./paths.js";
import type { CrmRecord, CustomerContactInfo, LifecycleStatus } from "./types.js";

export class CustomerRecordEngine {
  applyUpdate(
    record: CrmRecord,
    updates: {
      customerOwner?: string;
      customerLifecycleStatus?: LifecycleStatus;
      customerAccountRefs?: string[];
      contactInformation?: Partial<CustomerContactInfo>;
    },
  ): CrmRecord {
    return {
      ...record,
      timestamp: new Date().toISOString(),
      customerOwner: updates.customerOwner ?? record.customerOwner,
      customerLifecycleStatus:
        updates.customerLifecycleStatus ?? record.customerLifecycleStatus,
      customerAccountRefs: updates.customerAccountRefs ?? record.customerAccountRefs,
      contactInformation: {
        ...record.contactInformation,
        ...updates.contactInformation,
      },
      metadataVersion: CRM_METADATA_VERSION,
    };
  }
}

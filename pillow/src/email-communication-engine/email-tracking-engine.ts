/** R4-04 — Email tracking engine. */

import { ECE_METADATA_VERSION } from "./paths.js";
import type { EmailRecord } from "./types.js";

export class EmailTrackingEngine {
  trackOpen(record: EmailRecord): EmailRecord {
    return {
      ...record,
      timestamp: new Date().toISOString(),
      openStatus: "opened",
      metadataVersion: ECE_METADATA_VERSION,
    };
  }

  trackClick(record: EmailRecord): EmailRecord {
    return {
      ...record,
      timestamp: new Date().toISOString(),
      clickStatus: "clicked",
      openStatus: record.openStatus === "not_opened" ? "opened" : record.openStatus,
      metadataVersion: ECE_METADATA_VERSION,
    };
  }
}

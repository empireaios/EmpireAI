/** R2-13 — Return Label Generator. */

import { buildReturnLabelReference } from "./return-fixtures.js";
import type { ReturnRecord } from "./types.js";

export class ReturnLabelGenerator {
  generateLabel(record: ReturnRecord): string {
    return buildReturnLabelReference(record.returnId);
  }

  applyLabel(record: ReturnRecord): ReturnRecord {
    const labelRef = this.generateLabel(record);
    return {
      ...record,
      timestamp: new Date().toISOString(),
      returnLabelReference: labelRef,
      returnShipmentStatus: "label_generated",
    };
  }
}

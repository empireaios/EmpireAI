/** R2-09 — Procurement Workflow Engine. */

import type { ProcurementRecord, ProcurementStatus } from "./types.js";
import { PCE_METADATA_VERSION } from "./paths.js";

export class ProcurementWorkflowEngine {
  createInitialRecord(input: {
    procurementId: string;
    productReference: string;
    internalProductId: string | null;
    requestedQuantity: number;
    supplierId: string;
    unitCost: number;
    currency: ProcurementRecord["currency"];
  }): ProcurementRecord {
    return {
      procurementId: input.procurementId,
      timestamp: new Date().toISOString(),
      supplierId: input.supplierId,
      purchaseOrderId: null,
      productReference: input.productReference,
      internalProductId: input.internalProductId,
      requestedQuantity: input.requestedQuantity,
      unitCost: input.unitCost,
      currency: input.currency,
      procurementStatus: "supplier_selected",
      approvalStatus: "pending",
      validationStatus: "pending",
      metadataVersion: PCE_METADATA_VERSION,
    };
  }

  advanceStatus(
    record: ProcurementRecord,
    status: ProcurementStatus,
  ): ProcurementRecord {
    return { ...record, procurementStatus: status };
  }

  attachPurchaseOrder(
    record: ProcurementRecord,
    purchaseOrderId: string,
  ): ProcurementRecord {
    return {
      ...record,
      purchaseOrderId,
      procurementStatus: "purchase_order_created",
    };
  }
}

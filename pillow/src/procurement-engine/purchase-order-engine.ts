/** R2-09 — Purchase Order Engine. */

import type { PurchaseOrderRecord, SupportedCurrency } from "./types.js";
import { PCE_METADATA_VERSION } from "./paths.js";

export class PurchaseOrderEngine {
  createPurchaseOrder(input: {
    procurementId: string;
    supplierId: string;
    productReference: string;
    quantity: number;
    unitCost: number;
    currency: SupportedCurrency;
  }): PurchaseOrderRecord {
    const totalCost = Math.round(input.quantity * input.unitCost * 100) / 100;
    return {
      purchaseOrderId: `pce-po-${input.supplierId}-${Date.now()}`,
      procurementId: input.procurementId,
      supplierId: input.supplierId,
      productReference: input.productReference,
      quantity: input.quantity,
      unitCost: input.unitCost,
      totalCost,
      currency: input.currency,
      createdAt: new Date().toISOString(),
      status: "created",
    };
  }
}

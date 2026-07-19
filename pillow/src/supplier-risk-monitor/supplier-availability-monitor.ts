/** R2-16 — Supplier Availability Monitor. */

import type { SupplierInventoryRecord } from "../supplier-inventory-sync/types.js";
import type { AvailabilityStatus } from "./types.js";

export class SupplierAvailabilityMonitor {
  assessAvailability(inventory: SupplierInventoryRecord[]): AvailabilityStatus {
    if (!inventory.length) return "unavailable";
    const inStock = inventory.filter((i) => i.currentStockQuantity > 0).length;
    const ratio = inStock / inventory.length;
    if (ratio >= 0.8) return "available";
    if (ratio >= 0.4) return "limited";
    if (ratio > 0) return "unavailable";
    return "disrupted";
  }
}

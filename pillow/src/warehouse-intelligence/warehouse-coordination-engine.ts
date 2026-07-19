/** R2-14 — Warehouse Coordination Engine. */

import type { SupplierInventorySyncEngine } from "../supplier-inventory-sync/engine.js";
import type { FulfilmentOrchestrator } from "../fulfilment-orchestrator/engine.js";
import type { ShipmentTrackingEngine } from "../shipment-tracking-engine/engine.js";
import type { WarehouseIntelligenceConfiguration } from "./configuration.js";
import type { WarehouseIdentifier } from "./types.js";

export type CoordinationContext = {
  totalInventory: number;
  activeFulfilments: number;
  inTransitShipments: number;
  supplierCount: number;
};

export class WarehouseCoordinationEngine {
  constructor(
    private readonly inventorySync: SupplierInventorySyncEngine | null,
    private readonly fulfilmentOrchestrator: FulfilmentOrchestrator | null,
    private readonly shipmentTracking: ShipmentTrackingEngine | null,
  ) {}

  buildContext(): CoordinationContext {
    const inventory = this.inventorySync?.getInventory() ?? [];
    const fulfilments = this.fulfilmentOrchestrator?.getRecords() ?? [];
    const tracking = this.shipmentTracking?.getRecords() ?? [];

    return {
      totalInventory: inventory.reduce((sum, r) => sum + r.currentStockQuantity, 0),
      activeFulfilments: fulfilments.filter(
        (r) => r.fulfilmentStatus === "routed" || r.fulfilmentStatus === "in_progress",
      ).length,
      inTransitShipments: tracking.filter(
        (r) => r.currentShipmentStatus === "in_transit" || r.currentShipmentStatus === "out_for_delivery",
      ).length,
      supplierCount: new Set(inventory.map((r) => r.supplierId)).size,
    };
  }

  resolveWorkloadBoost(warehouseId: WarehouseIdentifier, context: CoordinationContext): number {
    const base = warehouseId === "wh-central" ? 10 : 0;
    return base + context.activeFulfilments * 2 + context.inTransitShipments;
  }

  isCoordinationEnabled(config: WarehouseIntelligenceConfiguration): boolean {
    return config.enabled && config.warehouseAllocationRulesEnabled;
  }
}

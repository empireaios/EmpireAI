/** R2-10 — Supplier Route Selector. */

import type { ProcurementRecord } from "../procurement-engine/types.js";
import type { FulfilmentRoute, RouteSelectionResult } from "./types.js";
import type { FulfilmentOrchestratorConfiguration } from "./configuration.js";

export class SupplierRouteSelector {
  selectRoute(input: {
    procurement: ProcurementRecord;
    config: FulfilmentOrchestratorConfiguration;
  }): RouteSelectionResult | null {
    if (!input.config.supplierRouteSelectionRulesEnabled) return null;

    let route: FulfilmentRoute;
    let reason: string;

    if (input.procurement.supplierId === "cj-dropshipping") {
      route = "dropship_express";
      reason = "CJ Dropshipping express dropship route";
    } else if (input.procurement.supplierId === "1688") {
      route = "warehouse_dispatch";
      reason = "1688 bulk warehouse dispatch route";
    } else if (input.procurement.requestedQuantity >= 50) {
      route = "standard_fulfilment";
      reason = "Standard fulfilment for bulk quantity";
    } else {
      route = "direct_supplier";
      reason = "Direct supplier fulfilment route";
    }

    return {
      selectionId: `fo-route-${input.procurement.supplierId}-${Date.now()}`,
      fulfilmentRoute: route,
      supplierId: input.procurement.supplierId,
      selectionReason: reason,
    };
  }
}

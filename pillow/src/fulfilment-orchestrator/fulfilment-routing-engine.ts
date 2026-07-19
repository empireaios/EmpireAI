/** R2-10 — Fulfilment Routing Engine. */

import type { ProcurementRecord } from "../procurement-engine/types.js";
import type { FulfilmentRecord, FulfilmentRoute } from "./types.js";
import { FO_METADATA_VERSION } from "./paths.js";
import type { FulfilmentOrchestratorConfiguration } from "./configuration.js";
import { SupplierRouteSelector } from "./supplier-route-selector.js";

export class FulfilmentRoutingEngine {
  private readonly routeSelector = new SupplierRouteSelector();

  routeOrder(input: {
    orderReference: string;
    procurement: ProcurementRecord;
    config: FulfilmentOrchestratorConfiguration;
  }): { record: FulfilmentRecord; routeSelection: ReturnType<SupplierRouteSelector["selectRoute"]> } | null {
    const routeSelection = this.routeSelector.selectRoute({
      procurement: input.procurement,
      config: input.config,
    });

    if (!routeSelection) return null;

    const record: FulfilmentRecord = {
      fulfilmentId: `fo-${input.procurement.supplierId}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      orderReference: input.orderReference,
      procurementReference: input.procurement.procurementId,
      supplierId: input.procurement.supplierId,
      productReference: input.procurement.productReference,
      quantity: input.procurement.requestedQuantity,
      selectedFulfilmentRoute: routeSelection.fulfilmentRoute,
      fulfilmentStatus: "routed",
      failureStatus: "none",
      validationStatus: "pending",
      metadataVersion: FO_METADATA_VERSION,
    };

    return { record, routeSelection };
  }

  isValidRoute(route: FulfilmentRoute): boolean {
    return ["direct_supplier", "dropship_express", "warehouse_dispatch", "standard_fulfilment"].includes(route);
  }
}

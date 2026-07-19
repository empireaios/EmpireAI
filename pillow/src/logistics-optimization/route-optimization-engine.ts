/** R2-17 — Route Optimization Engine. */

import type { FulfilmentRecord } from "../fulfilment-orchestrator/types.js";
import type { ShipmentTrackingRecord } from "../shipment-tracking-engine/types.js";
import type { LogisticsOptimizationConfiguration } from "./configuration.js";
import type { BottleneckType, ShippingRoute } from "./types.js";

export class RouteOptimizationEngine {
  analyzeRoutes(
    fulfilments: FulfilmentRecord[],
    tracking: ShipmentTrackingRecord[],
    config: LogisticsOptimizationConfiguration,
  ): { route: ShippingRoute; score: number; inefficient: boolean } {
    if (!config.routeOptimizationRulesEnabled) {
      return { route: "standard_fulfilment", score: 50, inefficient: false };
    }

    const hasWarehouse = fulfilments.some((f) => f.selectedFulfilmentRoute === "warehouse_dispatch");
    const hasDelays = tracking.some((t) => t.delayStatus === "delayed" || t.delayStatus === "at_risk");

    if (hasWarehouse && !hasDelays) {
      return { route: "optimized_route", score: 85, inefficient: false };
    }
    if (hasDelays) {
      return { route: "dropship_express", score: 62, inefficient: true };
    }
    if (fulfilments.some((f) => f.selectedFulfilmentRoute === "direct_supplier")) {
      return { route: "direct_supplier", score: 72, inefficient: false };
    }
    return { route: "standard_fulfilment", score: 68, inefficient: false };
  }

  detectBottleneck(
    route: ShippingRoute,
    delayStatus: ShipmentTrackingRecord["delayStatus"] | null,
    warehouseHealth: string | null,
  ): BottleneckType | null {
    if (warehouseHealth === "capacity_issue" || warehouseHealth === "imbalanced") {
      return "warehouse_capacity";
    }
    if (delayStatus === "delayed") return "carrier_delay";
    if (route === "standard_fulfilment") return "route_congestion";
    if (delayStatus === "at_risk") return "fulfilment_backlog";
    return null;
  }

  isInefficientRoute(route: ShippingRoute, optimizationScore: number, config: LogisticsOptimizationConfiguration): boolean {
    if (!config.routeOptimizationRulesEnabled) return false;
    return route === "standard_fulfilment" && optimizationScore < 50;
  }
}

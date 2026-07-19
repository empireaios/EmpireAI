/** R2-17 — Logistics optimization fixtures (structural — no live HTTP). */

import type { ShippingRoute, SupportedCarrierIdentifier } from "./types.js";
import { SUPPORTED_CARRIER_IDENTIFIERS } from "./paths.js";

export function buildLogisticsRecordId(orderReference: string): string {
  const slug = orderReference.replace(/[^a-z0-9]/gi, "").slice(0, 24) || "order";
  return `lo-${slug}`;
}

export function listFixtureOrderReferences(): string[] {
  return ["ord-lo-1001", "ord-lo-1002", "ord-lo-1003"];
}

export function getFixtureLogisticsProfile(
  orderReference: string,
  mode?: "optimal" | "bottleneck" | "inefficient" | "high_cost",
): {
  shipmentReference: string;
  warehouseReference: string;
  carrierReference: SupportedCarrierIdentifier;
  selectedRoute: ShippingRoute;
  estimatedShippingCost: number;
  estimatedDeliveryTime: number;
  optimizationScore: number;
} {
  const carrier = SUPPORTED_CARRIER_IDENTIFIERS[orderReference.length % SUPPORTED_CARRIER_IDENTIFIERS.length]!;

  if (mode === "bottleneck") {
    return {
      shipmentReference: `ship-${orderReference}-bn`,
      warehouseReference: "wh-east",
      carrierReference: carrier,
      selectedRoute: "warehouse_dispatch",
      estimatedShippingCost: 18.5,
      estimatedDeliveryTime: 7,
      optimizationScore: 42,
    };
  }
  if (mode === "inefficient") {
    return {
      shipmentReference: `ship-${orderReference}-ineff`,
      warehouseReference: "wh-north",
      carrierReference: "usps",
      selectedRoute: "standard_fulfilment",
      estimatedShippingCost: 22.0,
      estimatedDeliveryTime: 9,
      optimizationScore: 35,
    };
  }
  if (mode === "high_cost") {
    return {
      shipmentReference: `ship-${orderReference}-cost`,
      warehouseReference: "wh-west",
      carrierReference: "fedex",
      selectedRoute: "dropship_express",
      estimatedShippingCost: 34.75,
      estimatedDeliveryTime: 3,
      optimizationScore: 55,
    };
  }

  const optimizedCarrier = carrier === "usps" ? "ups" : carrier;
  return {
    shipmentReference: `ship-${orderReference}-opt`,
    warehouseReference: "wh-central",
    carrierReference: optimizedCarrier,
    selectedRoute: "optimized_route",
    estimatedShippingCost: 9.25,
    estimatedDeliveryTime: 4,
    optimizationScore: 88,
  };
}

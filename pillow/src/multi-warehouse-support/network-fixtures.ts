/** R2-15 — Multi-warehouse network fixtures (structural — no live HTTP). */

import type { WarehouseHealthStatus, WarehouseIdentifier } from "./types.js";
import { WAREHOUSE_IDENTIFIERS } from "./paths.js";

export const WAREHOUSE_LOCATIONS: Record<WarehouseIdentifier, string> = {
  "wh-east": "Newark, NJ",
  "wh-west": "Los Angeles, CA",
  "wh-central": "Dallas, TX",
  "wh-north": "Chicago, IL",
  "wh-south": "Atlanta, GA",
};

export const WAREHOUSE_CAPACITY = 10000;

export function buildWarehouseNetworkId(warehouseId: WarehouseIdentifier): string {
  return `mws-${warehouseId}`;
}

export function listRegisteredWarehouseIds(): WarehouseIdentifier[] {
  return [...WAREHOUSE_IDENTIFIERS];
}

export function getFixtureNetworkMetrics(
  warehouseId: WarehouseIdentifier,
  mode?: "balanced" | "imbalanced" | "capacity_issue",
): {
  inventoryAllocation: number;
  availableCapacity: number;
  assignedFulfilmentWorkload: number;
  warehouseHealthStatus: WarehouseHealthStatus;
} {
  if (mode === "imbalanced") {
    const high = warehouseId === "wh-east";
    return {
      inventoryAllocation: high ? 8500 : 1200,
      availableCapacity: high ? 1500 : 8800,
      assignedFulfilmentWorkload: high ? 80 : 20,
      warehouseHealthStatus: high ? "imbalanced" : "healthy",
    };
  }
  if (mode === "capacity_issue") {
    return {
      inventoryAllocation: 9200,
      availableCapacity: 800,
      assignedFulfilmentWorkload: 92,
      warehouseHealthStatus: "capacity_issue",
    };
  }
  const base = warehouseId === "wh-east" ? 4200 : warehouseId === "wh-west" ? 3800 : 3500;
  return {
    inventoryAllocation: base,
    availableCapacity: WAREHOUSE_CAPACITY - base,
    assignedFulfilmentWorkload: 40 + (warehouseId === "wh-central" ? 10 : 0),
    warehouseHealthStatus: "healthy",
  };
}

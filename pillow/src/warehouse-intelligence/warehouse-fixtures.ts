/** R2-14 — Warehouse fixtures (structural — no live HTTP). */

import type { WarehouseIdentifier, WarehouseStatus } from "./types.js";
import { WAREHOUSE_IDENTIFIERS } from "./paths.js";

export const WAREHOUSE_LOCATIONS: Record<WarehouseIdentifier, string> = {
  "wh-east": "Newark, NJ",
  "wh-west": "Los Angeles, CA",
  "wh-central": "Dallas, TX",
};

export const WAREHOUSE_CAPACITY = 10000;

export function buildWarehouseRecordId(warehouseId: WarehouseIdentifier): string {
  return `wi-${warehouseId}`;
}

export function computeUtilization(assigned: number, capacity: number): number {
  return Math.round((assigned / capacity) * 100);
}

export function getFixtureWarehouseMetrics(
  warehouseId: WarehouseIdentifier,
  mode?: "optimal" | "bottleneck" | "shortage" | "overstock",
): {
  inventoryLevel: number;
  assignedInventory: number;
  fulfilmentWorkload: number;
  warehouseStatus: WarehouseStatus;
} {
  if (mode === "bottleneck") {
    return {
      inventoryLevel: 4000,
      assignedInventory: 8700,
      fulfilmentWorkload: 95,
      warehouseStatus: "bottleneck",
    };
  }
  if (mode === "shortage") {
    return {
      inventoryLevel: 500,
      assignedInventory: 1200,
      fulfilmentWorkload: 40,
      warehouseStatus: "shortage",
    };
  }
  if (mode === "overstock") {
    return {
      inventoryLevel: 9500,
      assignedInventory: 9800,
      fulfilmentWorkload: 30,
      warehouseStatus: "overstock",
    };
  }
  const base = warehouseId === "wh-east" ? 4500 : warehouseId === "wh-west" ? 3800 : 3200;
  return {
    inventoryLevel: base,
    assignedInventory: base + 500,
    fulfilmentWorkload: warehouseId === "wh-central" ? 55 : 45,
    warehouseStatus: "optimal",
  };
}

export function listWarehouseIds(): WarehouseIdentifier[] {
  return [...WAREHOUSE_IDENTIFIERS];
}

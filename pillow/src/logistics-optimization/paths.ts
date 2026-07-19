/** PILLOW-LO-001 — Logistics Optimization paths (R2-17). */

export const LOGISTICS_OPTIMIZATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_LOGISTICS_OPTIMIZATION_SYSTEM.md";

export const LO_METADATA_VERSION = "LO-001-v1" as const;

export const SUPPORTED_CARRIER_IDENTIFIERS = ["usps", "ups", "fedex", "dhl"] as const;

export const SHIPPING_ROUTES = [
  "direct_supplier",
  "dropship_express",
  "warehouse_dispatch",
  "standard_fulfilment",
  "optimized_route",
] as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "optimizing",
  "active",
  "degraded",
  "failed",
  "stopped",
] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const BOTTLENECK_TYPES = [
  "warehouse_capacity",
  "carrier_delay",
  "route_congestion",
  "fulfilment_backlog",
  "tracking_gap",
] as const;

export const IMPROVEMENT_TYPES = [
  "switch_carrier",
  "reroute_warehouse",
  "consolidate_shipments",
  "expedite_delivery",
  "reduce_cost",
] as const;

/** R2-16 — Supplier risk fixtures (structural — no live HTTP). */

import type {
  AvailabilityStatus,
  FulfilmentReliabilityStatus,
  StabilityStatus,
  SupportedSupplierIdentifier,
} from "./types.js";
import { SUPPORTED_SUPPLIER_IDENTIFIERS } from "./paths.js";

export function buildSupplierRiskId(supplierId: SupportedSupplierIdentifier): string {
  return `srm-${supplierId.replace(/[^a-z0-9]/gi, "")}`;
}

export function listSupplierIds(): SupportedSupplierIdentifier[] {
  return [...SUPPORTED_SUPPLIER_IDENTIFIERS];
}

export function getFixtureRiskProfile(
  supplierId: SupportedSupplierIdentifier,
  mode?: "healthy" | "elevated" | "disrupted" | "abnormal",
): {
  supplierHealthScore: number;
  riskScore: number;
  availabilityStatus: AvailabilityStatus;
  inventoryStability: StabilityStatus;
  pricingStability: StabilityStatus;
  fulfilmentReliability: FulfilmentReliabilityStatus;
  activeRiskAlerts: string[];
} {
  if (mode === "disrupted") {
    return {
      supplierHealthScore: 25,
      riskScore: 88,
      availabilityStatus: "disrupted",
      inventoryStability: "critical",
      pricingStability: "volatile",
      fulfilmentReliability: "failed",
      activeRiskAlerts: ["disruption", "inventory_instability", "fulfilment_failure"],
    };
  }
  if (mode === "abnormal") {
    return {
      supplierHealthScore: 40,
      riskScore: 72,
      availabilityStatus: "limited",
      inventoryStability: "volatile",
      pricingStability: "volatile",
      fulfilmentReliability: "low",
      activeRiskAlerts: ["abnormal_behaviour", "pricing_volatility"],
    };
  }
  if (mode === "elevated") {
    return {
      supplierHealthScore: 55,
      riskScore: 58,
      availabilityStatus: "limited",
      inventoryStability: "volatile",
      pricingStability: "stable",
      fulfilmentReliability: "moderate",
      activeRiskAlerts: ["communication_degraded"],
    };
  }
  const base = supplierId === "cj-dropshipping" ? 82 : supplierId === "aliexpress" ? 78 : 75;
  return {
    supplierHealthScore: base,
    riskScore: 100 - base,
    availabilityStatus: "available",
    inventoryStability: "stable",
    pricingStability: "stable",
    fulfilmentReliability: "high",
    activeRiskAlerts: [],
  };
}

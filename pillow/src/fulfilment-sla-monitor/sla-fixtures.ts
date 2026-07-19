/** R2-18 — Fulfilment SLA fixtures (structural — no live HTTP). */

import type { ComplianceStatus, SupportedCarrierIdentifier, SupportedSupplierIdentifier } from "./types.js";
import { SUPPORTED_SUPPLIER_IDENTIFIERS } from "./paths.js";

export function buildSlaRecordId(orderReference: string): string {
  const slug = orderReference.replace(/[^a-z0-9]/gi, "").slice(0, 24) || "order";
  return `fsm-${slug}`;
}

export function listFixtureOrderReferences(): string[] {
  return ["ord-fsm-1001", "ord-fsm-1002", "ord-fsm-1003"];
}

export function getFixtureSlaProfile(
  orderReference: string,
  mode?: "compliant" | "at_risk" | "breached",
): {
  shipmentReference: string;
  supplierReference: SupportedSupplierIdentifier;
  carrierReference: SupportedCarrierIdentifier;
  slaTarget: number;
  actualFulfilmentTime: number;
  complianceStatus: ComplianceStatus;
  complianceScore: number;
  activeAlerts: string[];
} {
  const supplier = SUPPORTED_SUPPLIER_IDENTIFIERS[orderReference.length % SUPPORTED_SUPPLIER_IDENTIFIERS.length]!;

  if (mode === "breached") {
    return {
      shipmentReference: `ship-${orderReference}-br`,
      supplierReference: supplier,
      carrierReference: "fedex",
      slaTarget: 48,
      actualFulfilmentTime: 96,
      complianceStatus: "breached",
      complianceScore: 25,
      activeAlerts: ["fulfilment_breach", "shipment_breach", "carrier_non_compliance"],
    };
  }
  if (mode === "at_risk") {
    return {
      shipmentReference: `ship-${orderReference}-risk`,
      supplierReference: supplier,
      carrierReference: "usps",
      slaTarget: 72,
      actualFulfilmentTime: 68,
      complianceStatus: "at_risk",
      complianceScore: 62,
      activeAlerts: ["sla_risk", "supplier_non_compliance"],
    };
  }

  return {
    shipmentReference: `ship-${orderReference}-ok`,
    supplierReference: supplier,
    carrierReference: "ups",
    slaTarget: 72,
    actualFulfilmentTime: 36,
    complianceStatus: "compliant",
    complianceScore: 92,
    activeAlerts: [],
  };
}

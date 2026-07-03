/**
 * G2-06 — Logistics domain contract definitions (framework contracts only).
 */

import type {
  LogisticsAuthenticationMethod,
  LogisticsDomainCapability,
  LogisticsProviderKind,
  LogisticsServiceRef,
} from "./logistics-integration-types.js";

export type LogisticsAuthenticationContract = {
  contractKind: "authentication";
  contractVersion: string;
  authenticationMethod: LogisticsAuthenticationMethod;
  pillowGoverned: true;
};

export type LogisticsShipmentCreationContract = {
  contractKind: "shipment_creation";
  contractVersion: string;
  supportedServices: LogisticsServiceRef[];
  labelGenerationSupported: false;
};

export type LogisticsRateQuotationContract = {
  contractKind: "rate_quotation";
  contractVersion: string;
  quotationSupported: boolean;
  policyRef: string | null;
};

export type LogisticsTrackingContract = {
  contractKind: "tracking";
  contractVersion: string;
  trackingServices: LogisticsServiceRef[];
  webhookIngressSupported: boolean;
};

export type LogisticsDeliveryStatusContract = {
  contractKind: "delivery_status";
  contractVersion: string;
  statusNormalizationSupported: boolean;
};

export type LogisticsReturnShipmentContract = {
  contractKind: "return_shipment";
  contractVersion: string;
  returnSupported: boolean;
  returnServices: LogisticsServiceRef[];
};

export type LogisticsWarehouseContract = {
  contractKind: "warehouse";
  contractVersion: string;
  warehouseSupported: boolean;
  warehouseServices: LogisticsServiceRef[];
};

export type LogisticsDomainContractBundle = {
  authentication: LogisticsAuthenticationContract;
  shipmentCreation: LogisticsShipmentCreationContract;
  rateQuotation: LogisticsRateQuotationContract;
  tracking: LogisticsTrackingContract;
  deliveryStatus: LogisticsDeliveryStatusContract;
  returnShipment: LogisticsReturnShipmentContract;
  warehouse: LogisticsWarehouseContract;
};

export const LOGISTICS_DOMAIN_CONTRACT_KINDS: LogisticsDomainCapability[] = [
  "authentication",
  "shipment_creation",
  "rate_quotation",
  "tracking",
  "delivery_status",
  "return_shipment",
  "warehouse",
];

export function listLogisticsDomainContractKinds(): readonly LogisticsDomainCapability[] {
  return LOGISTICS_DOMAIN_CONTRACT_KINDS;
}

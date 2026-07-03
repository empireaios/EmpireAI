/**
 * G2-06 — Logistics domain contract builder from registry-backed adapter contracts.
 */

import type { CommerceLogisticsRow } from "../../../../registry/types/commerce-registry-types.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type { LogisticsDomainContractBundle } from "../contracts/logistics-domain-contracts.js";
import {
  buildLogisticsAdapterContract,
  parseLogisticsIntegrationConfiguration,
} from "../validation/logistics-contract-validator.js";
import { resolvePolicyForLogistics } from "../registry/logistics-registry-resolver.js";

export function buildLogisticsDomainContractBundle(
  context: RegistryLoaderContext,
  logistics: CommerceLogisticsRow,
): LogisticsDomainContractBundle {
  const contract = buildLogisticsAdapterContract(logistics);
  const integration = parseLogisticsIntegrationConfiguration(logistics.configuration);
  const policy = resolvePolicyForLogistics(context, logistics);

  return {
    authentication: {
      contractKind: "authentication",
      contractVersion: integration.domainContracts.authentication.contractVersion,
      authenticationMethod: integration.authenticationMethod,
      pillowGoverned: true,
    },
    shipmentCreation: {
      contractKind: "shipment_creation",
      contractVersion: integration.domainContracts.shipment_creation.contractVersion,
      supportedServices: contract.shippingServices.filter((service) => service.supported),
      labelGenerationSupported: false,
    },
    rateQuotation: {
      contractKind: "rate_quotation",
      contractVersion: integration.domainContracts.rate_quotation.contractVersion,
      quotationSupported: integration.domainContracts.rate_quotation.supported,
      policyRef: policy?.id ?? null,
    },
    tracking: {
      contractKind: "tracking",
      contractVersion: integration.domainContracts.tracking.contractVersion,
      trackingServices: contract.trackingServices.filter((service) => service.supported),
      webhookIngressSupported: contract.capabilities.includes("status-normalize"),
    },
    deliveryStatus: {
      contractKind: "delivery_status",
      contractVersion: integration.domainContracts.delivery_status.contractVersion,
      statusNormalizationSupported: integration.domainContracts.delivery_status.supported,
    },
    returnShipment: {
      contractKind: "return_shipment",
      contractVersion: integration.domainContracts.return_shipment.contractVersion,
      returnSupported: integration.domainContracts.return_shipment.supported,
      returnServices: contract.returnServices.filter((service) => service.supported),
    },
    warehouse: {
      contractKind: "warehouse",
      contractVersion: integration.domainContracts.warehouse.contractVersion,
      warehouseSupported: integration.domainContracts.warehouse.supported,
      warehouseServices: contract.warehouseServices.filter((service) => service.supported),
    },
  };
}

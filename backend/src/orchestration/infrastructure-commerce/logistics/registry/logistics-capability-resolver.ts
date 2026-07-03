/**
 * G2-06 — Logistics capability resolution from registry-backed contracts.
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import {
  LOGISTICS_DOMAIN_CAPABILITIES,
  LOGISTICS_SHIPMENT_LIFECYCLE,
  type LogisticsCapabilityResolution,
  type LogisticsDomainCapability,
  type LogisticsServiceRef,
  type LogisticsShipmentLifecyclePhase,
} from "../contracts/logistics-integration-types.js";
import { parseLogisticsIntegrationConfiguration } from "../validation/logistics-contract-validator.js";
import {
  resolveLogisticsRegistrySnapshot,
  resolvePolicyForLogistics,
} from "./logistics-registry-resolver.js";

function resolveDomainCapabilities(
  configuration: ReturnType<typeof parseLogisticsIntegrationConfiguration>,
): LogisticsDomainCapability[] {
  return LOGISTICS_DOMAIN_CAPABILITIES.filter(
    (domain) => configuration.domainContracts[domain]?.supported === true,
  );
}

function isPolicyCompliant(
  context: RegistryLoaderContext,
  logistics: Parameters<typeof resolvePolicyForLogistics>[1],
): boolean {
  const policy = resolvePolicyForLogistics(context, logistics);
  if (!policy) {
    return logistics.dependencies.length === 0;
  }
  return policy.status === "VALIDATED" || policy.status === "PUBLISHED";
}

export function resolveLogisticsCapabilities(
  context: RegistryLoaderContext,
  providerId: string,
  lifecyclePhase: LogisticsShipmentLifecyclePhase = "discover",
): LogisticsCapabilityResolution {
  const snapshot = resolveLogisticsRegistrySnapshot(context, { registryRowId: providerId });
  const logistics = snapshot.logistics[0];
  if (!logistics) {
    throw new Error(`Unknown logistics registry row: ${providerId}`);
  }

  const integration = parseLogisticsIntegrationConfiguration(logistics.configuration);
  const shippingServices = integration.shippingServices.filter(
    (service) => service.supported,
  ) as LogisticsServiceRef[];

  return {
    providerId: logistics.id,
    resolvedCapabilities: resolveDomainCapabilities(integration),
    shippingServices,
    lifecyclePhase,
    policyCompliant: isPolicyCompliant(context, logistics),
    registryBacked: true,
  };
}

export function resolveAllLogisticsCapabilities(
  context: RegistryLoaderContext = {},
  lifecyclePhase: LogisticsShipmentLifecyclePhase = "discover",
): LogisticsCapabilityResolution[] {
  const snapshot = resolveLogisticsRegistrySnapshot(context);
  return snapshot.logistics.map((logistics) =>
    resolveLogisticsCapabilities(context, logistics.id, lifecyclePhase),
  );
}

export function listSupportedLogisticsLifecyclePhases(): readonly LogisticsShipmentLifecyclePhase[] {
  return LOGISTICS_SHIPMENT_LIFECYCLE;
}

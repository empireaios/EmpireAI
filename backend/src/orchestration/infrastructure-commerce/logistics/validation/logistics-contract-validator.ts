/**
 * G2-06 — Logistics contract validation.
 */

import type { CommerceLogisticsRow } from "../../../../registry/types/commerce-registry-types.js";
import {
  LOGISTICS_INTEGRATION_VERSION,
  logisticsAdapterContractSchema,
  logisticsIntegrationConfigurationSchema,
  type LogisticsAdapterContract,
  type LogisticsIntegrationConfiguration,
} from "../contracts/logistics-integration-types.js";

export class LogisticsContractValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LogisticsContractValidationError";
  }
}

export function parseLogisticsIntegrationConfiguration(
  configuration: Record<string, unknown>,
): LogisticsIntegrationConfiguration {
  const integration = configuration.integrationFramework;
  try {
    return logisticsIntegrationConfigurationSchema.parse(integration);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new LogisticsContractValidationError(
      `Invalid logistics integration configuration: ${detail}`,
    );
  }
}

export function buildLogisticsAdapterContract(
  row: CommerceLogisticsRow,
  healthStatus: LogisticsAdapterContract["healthStatus"] = "unknown",
  adapterStatus: LogisticsAdapterContract["status"] = "validated",
): LogisticsAdapterContract {
  const integration = parseLogisticsIntegrationConfiguration(row.configuration);

  const contract = {
    providerId: row.id,
    providerName: row.name,
    version: row.version,
    status: adapterStatus,
    capabilities: row.capabilities,
    supportedCountries: row.supportedCountries,
    supportedRegions: row.supportedRegions,
    authenticationMethod: integration.authenticationMethod,
    providerKind: integration.providerKind,
    shippingServices: integration.shippingServices,
    trackingServices: integration.trackingServices,
    returnServices: integration.returnServices,
    warehouseServices: integration.warehouseServices,
    healthStatus,
    pluginCompatibility: {
      allowPluginRegistration: row.pluginSupport.allowPluginRegistration,
      pluginKind: row.pluginSupport.pluginKind,
      pluginId: row.pluginSupport.pluginId,
    },
    domainContracts: integration.domainContracts,
    registryRowRef: row.id,
    policyRef: row.policyRef,
    providerRef: row.providerRef,
    discoverySource: "RegistryLoader:REG-LOGISTICS" as const,
  };

  try {
    return logisticsAdapterContractSchema.parse(contract);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new LogisticsContractValidationError(
      `Invalid logistics adapter contract for ${row.id}: ${detail}`,
    );
  }
}

export function validateLogisticsAdapterContract(contract: unknown): LogisticsAdapterContract {
  try {
    return logisticsAdapterContractSchema.parse(contract);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new LogisticsContractValidationError(`Malformed logistics adapter contract: ${detail}`);
  }
}

export function assertUniqueLogisticsProviderIds(contracts: LogisticsAdapterContract[]): void {
  const seen = new Set<string>();
  for (const contract of contracts) {
    if (seen.has(contract.providerId)) {
      throw new LogisticsContractValidationError(
        `Duplicate logistics provider id: ${contract.providerId}`,
      );
    }
    seen.add(contract.providerId);
  }
}

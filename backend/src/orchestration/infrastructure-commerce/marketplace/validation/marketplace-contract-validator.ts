/**
 * G2-02 — Marketplace contract validation.
 */

import type { CommerceMarketplaceRow } from "../../../../registry/types/commerce-registry-types.js";
import {
  MARKETPLACE_INTEGRATION_VERSION,
  marketplaceAdapterContractSchema,
  marketplaceIntegrationConfigurationSchema,
  type MarketplaceAdapterContract,
  type MarketplaceIntegrationConfiguration,
} from "../contracts/marketplace-integration-types.js";

export class MarketplaceContractValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MarketplaceContractValidationError";
  }
}

export function parseMarketplaceIntegrationConfiguration(
  configuration: Record<string, unknown>,
): MarketplaceIntegrationConfiguration {
  const integration = configuration.integrationFramework;
  try {
    return marketplaceIntegrationConfigurationSchema.parse(integration);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new MarketplaceContractValidationError(
      `Invalid marketplace integration configuration: ${detail}`,
    );
  }
}

export function buildMarketplaceAdapterContract(
  row: CommerceMarketplaceRow,
  healthStatus: MarketplaceAdapterContract["healthStatus"] = "unknown",
  adapterStatus: MarketplaceAdapterContract["status"] = "validated",
): MarketplaceAdapterContract {
  const integration = parseMarketplaceIntegrationConfiguration(row.configuration);

  const contract = {
    marketplaceId: row.id,
    marketplaceName: row.name,
    version: row.version,
    status: adapterStatus,
    capabilities: row.capabilities,
    supportedCountries: row.supportedCountries,
    supportedRegions: row.supportedRegions,
    authenticationMethod: integration.authenticationMethod,
    apiSpecification: integration.apiSpecification,
    rateLimits: integration.rateLimits,
    supportedFeatures: integration.supportedFeatures,
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
    discoverySource: "RegistryLoader:REG-MARKETPLACE" as const,
  };

  try {
    return marketplaceAdapterContractSchema.parse(contract);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new MarketplaceContractValidationError(
      `Invalid marketplace adapter contract for ${row.id}: ${detail}`,
    );
  }
}

export function validateMarketplaceAdapterContract(contract: unknown): MarketplaceAdapterContract {
  try {
    return marketplaceAdapterContractSchema.parse(contract);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new MarketplaceContractValidationError(`Malformed marketplace adapter contract: ${detail}`);
  }
}

export function assertMarketplaceIntegrationSchemaVersion(
  configuration: MarketplaceIntegrationConfiguration,
): void {
  if (configuration.schemaVersion !== MARKETPLACE_INTEGRATION_VERSION) {
    throw new MarketplaceContractValidationError(
      `Unsupported integration schema version: ${configuration.schemaVersion}`,
    );
  }
}

export function assertUniqueMarketplaceIds(contracts: MarketplaceAdapterContract[]): void {
  const seen = new Set<string>();
  for (const contract of contracts) {
    if (seen.has(contract.marketplaceId)) {
      throw new MarketplaceContractValidationError(
        `Duplicate marketplace adapter id: ${contract.marketplaceId}`,
      );
    }
    seen.add(contract.marketplaceId);
  }
}

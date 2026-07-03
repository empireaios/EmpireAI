/**
 * G2-04 — Storefront contract validation.
 */

import type { CommerceStorefrontRow } from "../../../../registry/types/commerce-registry-types.js";
import {
  STOREFRONT_INTEGRATION_VERSION,
  storefrontAdapterContractSchema,
  storefrontIntegrationConfigurationSchema,
  type StorefrontAdapterContract,
  type StorefrontIntegrationConfiguration,
} from "../contracts/storefront-integration-types.js";

export class StorefrontContractValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorefrontContractValidationError";
  }
}

export function parseStorefrontIntegrationConfiguration(
  configuration: Record<string, unknown>,
): StorefrontIntegrationConfiguration {
  const integration = configuration.integrationFramework;
  try {
    return storefrontIntegrationConfigurationSchema.parse(integration);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new StorefrontContractValidationError(
      `Invalid storefront integration configuration: ${detail}`,
    );
  }
}

export function buildStorefrontAdapterContract(
  row: CommerceStorefrontRow,
  healthStatus: StorefrontAdapterContract["healthStatus"] = "unknown",
  adapterStatus: StorefrontAdapterContract["status"] = "validated",
): StorefrontAdapterContract {
  const integration = parseStorefrontIntegrationConfiguration(row.configuration);

  const contract = {
    storefrontId: row.id,
    storefrontName: row.name,
    version: row.version,
    status: adapterStatus,
    capabilities: row.capabilities,
    supportedCountries: row.supportedCountries,
    supportedRegions: row.supportedRegions,
    authenticationMethod: integration.authenticationMethod,
    publishingCapabilities: integration.publishingCapabilities,
    themeCapabilities: integration.themeCapabilities,
    collectionCapabilities: integration.collectionCapabilities,
    contentCapabilities: integration.contentCapabilities,
    healthStatus,
    pluginCompatibility: {
      allowPluginRegistration: row.pluginSupport.allowPluginRegistration,
      pluginKind: row.pluginSupport.pluginKind,
      pluginId: row.pluginSupport.pluginId,
    },
    domainContracts: integration.domainContracts,
    registryRowRef: row.id,
    brandRef: integration.brandRef,
    categoryRef: integration.categoryRef,
    policyRef: row.policyRef,
    deploymentRef: row.deploymentRef,
    discoverySource: "RegistryLoader:REG-STOREFRONT" as const,
  };

  try {
    return storefrontAdapterContractSchema.parse(contract);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new StorefrontContractValidationError(
      `Invalid storefront adapter contract for ${row.id}: ${detail}`,
    );
  }
}

export function validateStorefrontAdapterContract(contract: unknown): StorefrontAdapterContract {
  try {
    return storefrontAdapterContractSchema.parse(contract);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new StorefrontContractValidationError(`Malformed storefront adapter contract: ${detail}`);
  }
}

export function assertUniqueStorefrontIds(contracts: StorefrontAdapterContract[]): void {
  const seen = new Set<string>();
  for (const contract of contracts) {
    if (seen.has(contract.storefrontId)) {
      throw new StorefrontContractValidationError(
        `Duplicate storefront adapter id: ${contract.storefrontId}`,
      );
    }
    seen.add(contract.storefrontId);
  }
}

export function assertStorefrontIntegrationSchemaVersion(
  configuration: StorefrontIntegrationConfiguration,
): void {
  if (configuration.schemaVersion !== STOREFRONT_INTEGRATION_VERSION) {
    throw new StorefrontContractValidationError(
      `Unsupported integration schema version: ${configuration.schemaVersion}`,
    );
  }
}

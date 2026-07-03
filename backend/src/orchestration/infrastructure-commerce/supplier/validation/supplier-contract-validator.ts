/**
 * G2-03 — Supplier contract validation.
 */

import type { CommerceProductSourceRow, CommerceSupplierRow } from "../../../../registry/types/commerce-registry-types.js";
import {
  SUPPLIER_INTEGRATION_VERSION,
  supplierAdapterContractSchema,
  supplierIntegrationConfigurationSchema,
  type SupplierAdapterContract,
  type SupplierIntegrationConfiguration,
} from "../contracts/supplier-integration-types.js";

export class SupplierContractValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupplierContractValidationError";
  }
}

export function parseSupplierIntegrationConfiguration(
  configuration: Record<string, unknown>,
): SupplierIntegrationConfiguration {
  const integration = configuration.integrationFramework;
  try {
    return supplierIntegrationConfigurationSchema.parse(integration);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new SupplierContractValidationError(
      `Invalid supplier integration configuration: ${detail}`,
    );
  }
}

export function buildSupplierAdapterContract(
  row: CommerceSupplierRow,
  productSourceRefs: string[] = [],
  healthStatus: SupplierAdapterContract["healthStatus"] = "unknown",
  adapterStatus: SupplierAdapterContract["status"] = "validated",
): SupplierAdapterContract {
  const integration = parseSupplierIntegrationConfiguration(row.configuration);

  const contract = {
    supplierId: row.id,
    supplierName: row.name,
    version: row.version,
    status: adapterStatus,
    capabilities: row.capabilities,
    supportedCountries: row.supportedCountries,
    supportedRegions: row.supportedRegions,
    authenticationMethod: integration.authenticationMethod,
    apiSpecification: integration.apiSpecification,
    rateLimits: integration.rateLimits,
    fulfilmentModes: integration.fulfilmentModes,
    inventoryFeatures: integration.inventoryFeatures,
    trackingFeatures: integration.trackingFeatures,
    supportedFeatures: integration.supportedFeatures,
    healthStatus,
    pluginCompatibility: {
      allowPluginRegistration: row.pluginSupport.allowPluginRegistration,
      pluginKind: row.pluginSupport.pluginKind,
      pluginId: row.pluginSupport.pluginId,
    },
    domainContracts: integration.domainContracts,
    registryRowRef: row.id,
    productSourceRefs,
    policyRef: row.policyRef,
    providerRef: row.providerRef,
    discoverySource: "RegistryLoader:REG-SUPPLIER" as const,
  };

  try {
    return supplierAdapterContractSchema.parse(contract);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new SupplierContractValidationError(
      `Invalid supplier adapter contract for ${row.id}: ${detail}`,
    );
  }
}

export function validateSupplierAdapterContract(contract: unknown): SupplierAdapterContract {
  try {
    return supplierAdapterContractSchema.parse(contract);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new SupplierContractValidationError(`Malformed supplier adapter contract: ${detail}`);
  }
}

export function assertSupplierIntegrationSchemaVersion(
  configuration: SupplierIntegrationConfiguration,
): void {
  if (configuration.schemaVersion !== SUPPLIER_INTEGRATION_VERSION) {
    throw new SupplierContractValidationError(
      `Unsupported integration schema version: ${configuration.schemaVersion}`,
    );
  }
}

export function assertUniqueSupplierIds(contracts: SupplierAdapterContract[]): void {
  const seen = new Set<string>();
  for (const contract of contracts) {
    if (seen.has(contract.supplierId)) {
      throw new SupplierContractValidationError(
        `Duplicate supplier adapter id: ${contract.supplierId}`,
      );
    }
    seen.add(contract.supplierId);
  }
}

export function resolveProductSourceRefsForSupplier(
  supplierId: string,
  productSources: CommerceProductSourceRow[],
): string[] {
  return productSources
    .filter((row) => row.dependencies.includes(supplierId) || row.channelRef === supplierId)
    .map((row) => row.id);
}

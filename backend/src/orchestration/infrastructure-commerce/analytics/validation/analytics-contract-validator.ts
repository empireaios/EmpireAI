/**
 * G2-07 — Analytics contract validation.
 */

import {
  analyticsAdapterContractSchema,
  analyticsIntegrationConfigurationSchema,
  type AnalyticsAdapterContract,
  type AnalyticsIntegrationConfiguration,
  type AnalyticsProviderRow,
} from "../contracts/analytics-integration-types.js";

export class AnalyticsContractValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalyticsContractValidationError";
  }
}

export function parseAnalyticsIntegrationConfiguration(
  configuration: Record<string, unknown>,
): AnalyticsIntegrationConfiguration {
  const integration = configuration.integrationFramework;
  try {
    return analyticsIntegrationConfigurationSchema.parse(integration);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new AnalyticsContractValidationError(
      `Invalid analytics integration configuration: ${detail}`,
    );
  }
}

export function buildAnalyticsAdapterContract(
  row: AnalyticsProviderRow,
  healthStatus: AnalyticsAdapterContract["healthStatus"] = "unknown",
  adapterStatus: AnalyticsAdapterContract["status"] = "validated",
): AnalyticsAdapterContract {
  const integration = parseAnalyticsIntegrationConfiguration(row.configuration);

  const contract = {
    analyticsId: row.id,
    providerName: row.name,
    version: row.version,
    status: adapterStatus,
    capabilities: row.capabilities,
    supportedMetrics: integration.supportedMetrics,
    supportedEvents: integration.supportedEvents,
    aggregationModes: integration.aggregationModes,
    retentionPolicy: integration.retentionPolicy,
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
    discoverySource: "AnalyticsProviderCatalog:dynamic" as const,
  };

  try {
    return analyticsAdapterContractSchema.parse(contract);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new AnalyticsContractValidationError(
      `Invalid analytics adapter contract for ${row.id}: ${detail}`,
    );
  }
}

export function validateAnalyticsAdapterContract(contract: unknown): AnalyticsAdapterContract {
  try {
    return analyticsAdapterContractSchema.parse(contract);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new AnalyticsContractValidationError(`Malformed analytics adapter contract: ${detail}`);
  }
}

export function assertUniqueAnalyticsProviderIds(contracts: AnalyticsAdapterContract[]): void {
  const seen = new Set<string>();
  for (const contract of contracts) {
    if (seen.has(contract.analyticsId)) {
      throw new AnalyticsContractValidationError(
        `Duplicate analytics provider id: ${contract.analyticsId}`,
      );
    }
    seen.add(contract.analyticsId);
  }
}

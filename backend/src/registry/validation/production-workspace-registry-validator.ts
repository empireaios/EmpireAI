/**
 * G7-01 — Production workspace registry validator.
 */

import type { ProductionWorkspaceRegistryRowBase } from "../types/production-workspace-registry-types.js";
import {
  executivePolicyConfigurationSchema,
  financialPolicyConfigurationSchema,
  optimizationPolicyConfigurationSchema,
  identityMonitorConfigurationSchema,
  identityProviderConfigurationSchema,
  productionWorkspaceConfigurationSchema,
  readinessPolicyConfigurationSchema,
} from "../types/production-workspace-registry-types.js";
import { connectionRegistryProviderConfigurationSchema } from "../types/connection-registry-types.js";
import type { ProductionWorkspaceRegistryId } from "../types/registry-ids.js";

export class ProductionWorkspaceRegistryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductionWorkspaceRegistryValidationError";
  }
}

export function validateProductionWorkspaceRegistryRows(
  registryId: ProductionWorkspaceRegistryId,
  rows: ProductionWorkspaceRegistryRowBase[],
): void {
  for (const row of rows) {
    const config = row.configuration;
    switch (registryId) {
      case "REG-WORKSPACE":
        productionWorkspaceConfigurationSchema.parse(config.productionWorkspace);
        break;
      case "REG-READINESS-POLICY":
        readinessPolicyConfigurationSchema.parse(config.readinessPolicy);
        break;
      case "REG-CONNECTION-PROVIDER":
        connectionRegistryProviderConfigurationSchema.parse(config.connectionProvider);
        break;
      case "REG-IDENTITY-PROVIDER":
        identityProviderConfigurationSchema.parse(config.identityProvider);
        break;
      case "REG-EXECUTIVE-POLICY":
        executivePolicyConfigurationSchema.parse(config.executivePolicy);
        break;
      case "REG-FINANCIAL-POLICY":
        financialPolicyConfigurationSchema.parse(config.financialPolicy);
        break;
      case "REG-OPTIMIZATION-POLICY":
        optimizationPolicyConfigurationSchema.parse(config.optimizationPolicy);
        break;
      case "REG-IDENTITY-MONITOR":
        identityMonitorConfigurationSchema.parse(config.identityMonitor);
        break;
      default:
        throw new ProductionWorkspaceRegistryValidationError(`Unknown production workspace registry: ${registryId}`);
    }
  }
}

export function validateProductionWorkspaceRegistryBatch(
  batch: Record<ProductionWorkspaceRegistryId, ProductionWorkspaceRegistryRowBase[]>,
): void {
  for (const [registryId, rows] of Object.entries(batch) as Array<
    [ProductionWorkspaceRegistryId, ProductionWorkspaceRegistryRowBase[]]
  >) {
    validateProductionWorkspaceRegistryRows(registryId, rows);
  }
}

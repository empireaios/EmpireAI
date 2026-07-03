/**
 * G8-01 — Connection registry validator.
 */

import type { ConnectionRegistryRowBase } from "../types/connection-registry-types.js";
import {
  connectionAccountHolderConfigurationSchema,
  connectionCapabilityConfigurationSchema,
  connectionDependencyConfigurationSchema,
  connectionPermissionConfigurationSchema,
  connectionRegistryProviderConfigurationSchema,
  connectionRequirementConfigurationSchema,
  connectionScopeConfigurationSchema,
} from "../types/connection-registry-types.js";
import type { ConnectionRegistryRegistryId } from "../types/registry-ids.js";
import type { ProductionWorkspaceRegistryRowBase } from "../types/production-workspace-registry-types.js";

export class ConnectionRegistryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConnectionRegistryValidationError";
  }
}

export function validateConnectionProviderRows(rows: ProductionWorkspaceRegistryRowBase[]): void {
  const seen = new Set<string>();
  for (const row of rows) {
    const config = connectionRegistryProviderConfigurationSchema.parse(row.configuration.connectionProvider);
    if (seen.has(config.providerId)) {
      throw new ConnectionRegistryValidationError(`Duplicate connection provider: ${config.providerId}`);
    }
    seen.add(config.providerId);
  }
}

export function validateConnectionRegistryRows(
  registryId: ConnectionRegistryRegistryId,
  rows: ConnectionRegistryRowBase[],
): void {
  for (const row of rows) {
    const config = row.configuration;
    switch (registryId) {
      case "REG-CONNECTION-SCOPE":
        connectionScopeConfigurationSchema.parse(config.connectionScope);
        break;
      case "REG-CONNECTION-PERMISSION":
        connectionPermissionConfigurationSchema.parse(config.connectionPermission);
        break;
      case "REG-CONNECTION-ACCOUNT-HOLDER":
        connectionAccountHolderConfigurationSchema.parse(config.connectionAccountHolder);
        break;
      case "REG-CONNECTION-REQUIREMENT":
        connectionRequirementConfigurationSchema.parse(config.connectionRequirement);
        break;
      case "REG-CONNECTION-CAPABILITY":
        connectionCapabilityConfigurationSchema.parse(config.connectionCapability);
        break;
      case "REG-CONNECTION-DEPENDENCY":
        connectionDependencyConfigurationSchema.parse(config.connectionDependency);
        break;
      default:
        throw new ConnectionRegistryValidationError(`Unknown connection registry: ${registryId}`);
    }
  }
}

export function validateConnectionRegistryBatch(
  batch: Record<ConnectionRegistryRegistryId, ConnectionRegistryRowBase[]>,
): void {
  for (const [registryId, rows] of Object.entries(batch) as Array<
    [ConnectionRegistryRegistryId, ConnectionRegistryRowBase[]]
  >) {
    validateConnectionRegistryRows(registryId, rows);
  }
}

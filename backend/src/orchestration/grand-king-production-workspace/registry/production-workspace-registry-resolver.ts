/**
 * G7-01 — Production workspace registry resolver.
 */

import {
  connectionProviderConfigurationSchema,
  identityProviderConfigurationSchema,
  productionWorkspaceConfigurationSchema,
  readinessPolicyConfigurationSchema,
  type ProductionWorkspaceRegistryRowBase,
} from "../../../registry/types/production-workspace-registry-types.js";
import {
  REG_CONNECTION_PROVIDER,
  REG_IDENTITY_PROVIDER,
  REG_READINESS_POLICY,
  REG_WORKSPACE,
} from "../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext, RegistryQuery } from "../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../registry/registry-loader.js";

export function resolveProductionWorkspaceConfig(
  context: RegistryLoaderContext = {},
  query?: RegistryQuery,
): ReturnType<typeof productionWorkspaceConfigurationSchema.parse> {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_WORKSPACE, query).rows as ProductionWorkspaceRegistryRowBase[];
  const row = rows[0];
  if (!row) {
    throw new Error("Grand King production workspace not found in REG-WORKSPACE");
  }
  return productionWorkspaceConfigurationSchema.parse(row.configuration.productionWorkspace);
}

export function resolveReadinessPolicies(context: RegistryLoaderContext = {}): Array<
  ReturnType<typeof readinessPolicyConfigurationSchema.parse>
> {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_READINESS_POLICY).rows as ProductionWorkspaceRegistryRowBase[];
  return rows.map((row) => readinessPolicyConfigurationSchema.parse(row.configuration.readinessPolicy));
}

export function resolveConnectionProviders(context: RegistryLoaderContext = {}): Array<
  ReturnType<typeof connectionProviderConfigurationSchema.parse>
> {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_CONNECTION_PROVIDER).rows as ProductionWorkspaceRegistryRowBase[];
  return rows.map((row) => connectionProviderConfigurationSchema.parse(row.configuration.connectionProvider));
}

export function resolveIdentityProviders(context: RegistryLoaderContext = {}): Array<
  ReturnType<typeof identityProviderConfigurationSchema.parse>
> {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_IDENTITY_PROVIDER).rows as ProductionWorkspaceRegistryRowBase[];
  return rows.map((row) => identityProviderConfigurationSchema.parse(row.configuration.identityProvider));
}

export function listProductionWorkspaceRegistryIds(): string[] {
  return [REG_WORKSPACE, REG_READINESS_POLICY, REG_CONNECTION_PROVIDER, REG_IDENTITY_PROVIDER];
}

/**
 * G7-01 — Workspace configuration manager.
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type { WorkspaceDependencySummary } from "../contracts/production-workspace-types.js";
import {
  resolveConnectionProviders,
  resolveIdentityProviders,
  resolveProductionWorkspaceConfig,
} from "../registry/production-workspace-registry-resolver.js";

export function buildWorkspaceConfiguration(context: RegistryLoaderContext = {}): {
  config: ReturnType<typeof resolveProductionWorkspaceConfig>;
  dependencies: WorkspaceDependencySummary;
} {
  const config = resolveProductionWorkspaceConfig(context);
  const providers = resolveConnectionProviders(context).filter((provider) =>
    config.connectionProviderRefs.includes(`connection-provider-${provider.providerId}`),
  );
  const identityProviders = resolveIdentityProviders(context);

  return {
    config,
    dependencies: {
      readinessPolicy: config.readinessPolicyRef ?? "REG-READINESS-POLICY",
      commercePolicy: config.commercePolicyRef ?? "REG-COMMERCE-POLICY",
      automationWorkflow: config.automationWorkflowRef ?? "REG-AUTOMATION-WORKFLOW",
      connectionProviders: providers.map((provider) => ({
        providerId: provider.providerId,
        ref: provider.registryRef ?? provider.providerId,
        kind: provider.providerKind,
      })),
      identityRef: identityProviders[0]?.registryRef ?? config.identityRef ?? "REG-IDENTITY-PROVIDER",
    },
  };
}

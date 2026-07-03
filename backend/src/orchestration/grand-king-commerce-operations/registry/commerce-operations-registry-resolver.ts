/**
 * G7-02 — Commerce operations registry resolver.
 */

import { REG_AUTOMATION_WORKFLOW, REG_COMMERCE_POLICY } from "../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import {
  resolveConnectionProviders,
  resolveIdentityProviders,
  resolveProductionWorkspaceConfig,
  resolveReadinessPolicies,
} from "../../grand-king-production-workspace/registry/production-workspace-registry-resolver.js";
import type { CommerceOperationDependencySummary } from "../contracts/commerce-operations-types.js";

export function resolveCommerceOperationDependencies(
  context: RegistryLoaderContext = {},
): CommerceOperationDependencySummary {
  const workspace = resolveProductionWorkspaceConfig(context);
  const providers = resolveConnectionProviders(context);
  const identity = resolveIdentityProviders(context);
  const policies = resolveReadinessPolicies(context);

  return {
    readinessPolicy: policies[0]?.policyId ?? workspace.readinessPolicyRef ?? "REG-READINESS-POLICY",
    commercePolicy: workspace.commercePolicyRef ?? REG_COMMERCE_POLICY,
    automationWorkflow: workspace.automationWorkflowRef ?? REG_AUTOMATION_WORKFLOW,
    identityProvider: identity[0]?.providerId ?? "grand-king-identity",
    connectionProviders: providers.map((provider) => provider.providerId),
  };
}

export function listCommerceOperationsRegistryIds(): string[] {
  return [
    "REG-CONNECTION-PROVIDER",
    "REG-COMMERCE-POLICY",
    "REG-AUTOMATION-WORKFLOW",
    "REG-READINESS-POLICY",
    "REG-IDENTITY-PROVIDER",
  ];
}

/**
 * G7-04 — Executive decision registry resolver.
 */

import {
  REG_AUTOMATION_POLICY,
  REG_COMMERCE_POLICY,
  REG_CONNECTION_PROVIDER,
  REG_EXECUTIVE_POLICY,
  REG_IDENTITY_PROVIDER,
  REG_READINESS_POLICY,
} from "../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../registry/registry-loader.js";
import {
  executivePolicyConfigurationSchema,
  type ProductionWorkspaceRegistryRowBase,
} from "../../../registry/types/production-workspace-registry-types.js";

export function resolveExecutivePolicies(context: RegistryLoaderContext = {}) {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_EXECUTIVE_POLICY).rows as ProductionWorkspaceRegistryRowBase[];
  return rows.map((row) => executivePolicyConfigurationSchema.parse(row.configuration.executivePolicy));
}

export function listExecutiveDecisionRegistryIds(): string[] {
  return [
    REG_AUTOMATION_POLICY,
    REG_COMMERCE_POLICY,
    REG_READINESS_POLICY,
    REG_IDENTITY_PROVIDER,
    REG_CONNECTION_PROVIDER,
    REG_EXECUTIVE_POLICY,
  ];
}

export function resolveExecutiveDecisionDependencies(context: RegistryLoaderContext = {}) {
  const loader = getRegistryLoader();
  const policies = resolveExecutivePolicies(context);
  return {
    executivePolicy: policies[0]?.policyId ?? REG_EXECUTIVE_POLICY,
    readinessPolicy: REG_READINESS_POLICY,
    commercePolicy: REG_COMMERCE_POLICY,
    automationPolicy: REG_AUTOMATION_POLICY,
    identityProvider: REG_IDENTITY_PROVIDER,
    connectionProvider: REG_CONNECTION_PROVIDER,
    kpiMetricRefs: policies[0]?.kpiMetricRefs ?? [],
    decisionRuleRefs: policies[0]?.decisionRuleRefs ?? [],
    riskScoringRefs: policies[0]?.riskScoringRefs ?? [],
    automationPolicies: loader.resolve(context, REG_AUTOMATION_POLICY).rows.length,
    commercePolicies: loader.resolve(context, REG_COMMERCE_POLICY).rows.length,
  };
}

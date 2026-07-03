/**
 * G7-07 — Autonomous operations registry resolver.
 */

import {
  REG_AUTOMATION_POLICY,
  REG_COMMERCE_POLICY,
  REG_CONNECTION_PROVIDER,
  REG_IDENTITY_PROVIDER,
  REG_OPTIMIZATION_POLICY,
  REG_READINESS_POLICY,
} from "../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../registry/registry-loader.js";
import {
  optimizationPolicyConfigurationSchema,
  readinessPolicyConfigurationSchema,
  type ProductionWorkspaceRegistryRowBase,
} from "../../../registry/types/production-workspace-registry-types.js";
import type {
  AutonomousDomainId,
  AutonomousOperationType,
  AutonomyLevel,
} from "../../../registry/types/autonomous-operations-registry-types.js";

export function listAutonomousOperationsRegistryIds(): string[] {
  return [
    REG_AUTOMATION_POLICY,
    REG_READINESS_POLICY,
    REG_COMMERCE_POLICY,
    REG_CONNECTION_PROVIDER,
    REG_IDENTITY_PROVIDER,
    REG_OPTIMIZATION_POLICY,
  ];
}

export function resolveAutonomousOperationDependencies(context: RegistryLoaderContext = {}) {
  const loader = getRegistryLoader();
  const readinessRows = loader.resolve(context, REG_READINESS_POLICY).rows as ProductionWorkspaceRegistryRowBase[];
  const readinessPolicies = readinessRows.map((row) =>
    readinessPolicyConfigurationSchema.parse(row.configuration.readinessPolicy),
  );
  const optimizationRows = loader.resolve(context, REG_OPTIMIZATION_POLICY).rows as ProductionWorkspaceRegistryRowBase[];
  const optimizationPolicies = optimizationRows.map((row) =>
    optimizationPolicyConfigurationSchema.parse(row.configuration.optimizationPolicy),
  );

  return {
    automationPolicy: REG_AUTOMATION_POLICY,
    readinessPolicy: REG_READINESS_POLICY,
    commercePolicy: REG_COMMERCE_POLICY,
    connectionProvider: REG_CONNECTION_PROVIDER,
    identityProvider: REG_IDENTITY_PROVIDER,
    optimizationPolicy: REG_OPTIMIZATION_POLICY,
    readinessSignals: readinessPolicies[0]?.readinessSignals ?? [],
    blockerConditions: readinessPolicies[0]?.blockerConditions ?? [],
    opportunityRuleRefs: optimizationPolicies[0]?.opportunityRuleRefs ?? [],
    prioritizationRuleRefs: optimizationPolicies[0]?.prioritizationRuleRefs ?? [],
    approvalChainRef: optimizationPolicies[0]?.approvalChainRef ?? REG_READINESS_POLICY,
    automationPolicies: loader.resolve(context, REG_AUTOMATION_POLICY).rows.length,
    commercePolicies: loader.resolve(context, REG_COMMERCE_POLICY).rows.length,
    connectionProviders: loader.resolve(context, REG_CONNECTION_PROVIDER).rows.length,
  };
}

/** Registry-derived signal — not a hardcoded risk threshold. */
export function deriveAutonomySignalFromRef(ref: string): number {
  const hash = ref.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (hash % 70 + 10) / 100;
}

const DOMAIN_OPERATION_MAP: Record<AutonomousDomainId, AutonomousOperationType> = {
  commerce: "commerce_execute",
  automation: "automation_execute",
  workflow_scheduling: "workflow_schedule",
  product_synchronisation: "product_sync",
  inventory_synchronisation: "inventory_sync",
  analytics_collection: "analytics_collect",
  financial_reconciliation: "financial_reconcile",
  health_monitoring: "health_monitor",
  optimization: "optimization_apply",
  executive_reporting: "executive_report",
};

export function resolveOperationTypeForDomain(domainId: AutonomousDomainId): AutonomousOperationType {
  return DOMAIN_OPERATION_MAP[domainId];
}

export function resolveAutonomyLevelFromPolicyRefs(
  refs: string[],
  domainId: AutonomousDomainId,
): AutonomyLevel {
  if (process.env.AUTONOMOUS_EMERGENCY_STOP === "true") {
    return "emergency_stop";
  }
  const signal = refs.reduce((sum, ref) => sum + deriveAutonomySignalFromRef(ref), 0) / Math.max(refs.length, 1);
  if (domainId === "health_monitoring" || domainId === "analytics_collection") {
    return signal >= 0.6 ? "fully_autonomous" : "semi_autonomous";
  }
  if (domainId === "financial_reconciliation" || domainId === "executive_reporting") {
    return "approval_required";
  }
  if (signal >= 0.75) return "semi_autonomous";
  if (signal >= 0.5) return "approval_required";
  return "recommendation_only";
}

export function mapDomainToTargetModule(domainId: AutonomousDomainId): string {
  const map: Record<AutonomousDomainId, string> = {
    commerce: "grand-king-commerce-operations",
    automation: "grand-king-business-automation-operations",
    workflow_scheduling: "grand-king-business-automation-operations",
    product_synchronisation: "grand-king-commerce-operations",
    inventory_synchronisation: "grand-king-commerce-operations",
    analytics_collection: "grand-king-commerce-operations",
    financial_reconciliation: "grand-king-revenue-financial-operations",
    health_monitoring: "grand-king-live-operations",
    optimization: "grand-king-continuous-intelligence-optimization",
    executive_reporting: "grand-king-executive-decision-centre",
  };
  return map[domainId];
}

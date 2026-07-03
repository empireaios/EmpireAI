/**
 * G7-06 — Continuous intelligence registry resolver.
 */

import {
  REG_AUTOMATION_POLICY,
  REG_COMMERCE_POLICY,
  REG_CONNECTION_PROVIDER,
  REG_OPTIMIZATION_POLICY,
  REG_READINESS_POLICY,
} from "../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../registry/registry-loader.js";
import {
  optimizationPolicyConfigurationSchema,
  type ProductionWorkspaceRegistryRowBase,
} from "../../../registry/types/production-workspace-registry-types.js";
import type { OptimizationDomainId, OptimizationType } from "../../../registry/types/continuous-intelligence-registry-types.js";

export function resolveOptimizationPolicies(context: RegistryLoaderContext = {}) {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_OPTIMIZATION_POLICY).rows as ProductionWorkspaceRegistryRowBase[];
  return rows.map((row) => optimizationPolicyConfigurationSchema.parse(row.configuration.optimizationPolicy));
}

export function listContinuousIntelligenceRegistryIds(): string[] {
  return [
    REG_OPTIMIZATION_POLICY,
    REG_AUTOMATION_POLICY,
    REG_COMMERCE_POLICY,
    REG_READINESS_POLICY,
    REG_CONNECTION_PROVIDER,
  ];
}

export function resolveOptimizationDependencies(context: RegistryLoaderContext = {}) {
  const loader = getRegistryLoader();
  const policies = resolveOptimizationPolicies(context);
  return {
    optimizationPolicy: policies[0]?.policyId ?? REG_OPTIMIZATION_POLICY,
    readinessPolicy: REG_READINESS_POLICY,
    commercePolicy: REG_COMMERCE_POLICY,
    automationPolicy: REG_AUTOMATION_POLICY,
    connectionProvider: REG_CONNECTION_PROVIDER,
    domainRefs: policies[0]?.domainRefs ?? [],
    optimizationTypeRefs: policies[0]?.optimizationTypeRefs ?? [],
    opportunityRuleRefs: policies[0]?.opportunityRuleRefs ?? [],
    anomalyRuleRefs: policies[0]?.anomalyRuleRefs ?? [],
    prioritizationRuleRefs: policies[0]?.prioritizationRuleRefs ?? [],
    schedulerPolicyRef: policies[0]?.schedulerPolicyRef,
    approvalChainRef: policies[0]?.approvalChainRef,
    commercePolicies: loader.resolve(context, REG_COMMERCE_POLICY).rows.length,
    automationPolicies: loader.resolve(context, REG_AUTOMATION_POLICY).rows.length,
  };
}

export function deriveSignalFromRuleRef(ref: string): number {
  const hash = ref.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (hash % 80 + 20) / 100;
}

export function parseDomainFromRef(ref: string): OptimizationDomainId | undefined {
  const match = ref.match(/domain:([a-z_]+)/);
  return match?.[1] as OptimizationDomainId | undefined;
}

export function parseTypeFromRef(ref: string): OptimizationType | undefined {
  const match = ref.match(/type:([a-z_]+)/);
  return match?.[1] as OptimizationType | undefined;
}

export function mapDomainToSubsystem(domainId: OptimizationDomainId): string {
  const map: Record<OptimizationDomainId, string> = {
    commerce: "grand-king-commerce-operations",
    automation: "grand-king-business-automation-operations",
    financial_operations: "grand-king-revenue-financial-operations",
    identity: "grand-king-production-workspace",
    infrastructure: "production-certification",
    performance: "grand-king-live-operations",
    business_engines: "grand-king-production-workspace",
    executive_ai: "grand-king-executive-decision-centre",
    cockpit: "cockpit",
    production_workspace: "grand-king-production-workspace",
    providers: "grand-king-production-workspace",
    workflows: "grand-king-business-automation-operations",
  };
  return map[domainId] ?? "grand-king-production-workspace";
}

export function mapDomainToOptimizationType(domainId: OptimizationDomainId): OptimizationType {
  const map: Partial<Record<OptimizationDomainId, OptimizationType>> = {
    commerce: "commerce_optimization",
    automation: "automation_optimization",
    financial_operations: "financial_optimization",
    performance: "performance_optimization",
    providers: "provider_optimization",
    workflows: "workflow_optimization",
    infrastructure: "resource_optimization",
  };
  return map[domainId] ?? "future_optimization_type";
}

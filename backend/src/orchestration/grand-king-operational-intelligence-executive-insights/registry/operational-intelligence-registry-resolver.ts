/**
 * G7-09 — Operational intelligence registry resolver.
 */

import {
  REG_AUTOMATION_POLICY,
  REG_COMMERCE_POLICY,
  REG_EXECUTIVE_POLICY,
  REG_OPTIMIZATION_POLICY,
  REG_READINESS_POLICY,
} from "../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../registry/registry-loader.js";
import {
  executivePolicyConfigurationSchema,
  optimizationPolicyConfigurationSchema,
  type ProductionWorkspaceRegistryRowBase,
} from "../../../registry/types/production-workspace-registry-types.js";
import type { ExecutiveKpiId, IntelligenceDomainId } from "../../../registry/types/operational-intelligence-registry-types.js";

export function listOperationalIntelligenceRegistryIds(): string[] {
  return [
    REG_EXECUTIVE_POLICY,
    REG_OPTIMIZATION_POLICY,
    REG_COMMERCE_POLICY,
    REG_AUTOMATION_POLICY,
    REG_READINESS_POLICY,
  ];
}

export function resolveExecutivePolicies(context: RegistryLoaderContext = {}) {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_EXECUTIVE_POLICY).rows as ProductionWorkspaceRegistryRowBase[];
  return rows.map((row) => executivePolicyConfigurationSchema.parse(row.configuration.executivePolicy));
}

export function resolveOperationalIntelligenceDependencies(context: RegistryLoaderContext = {}) {
  const loader = getRegistryLoader();
  const executivePolicies = resolveExecutivePolicies(context);
  const optimizationRows = loader.resolve(context, REG_OPTIMIZATION_POLICY).rows as ProductionWorkspaceRegistryRowBase[];
  const optimizationPolicies = optimizationRows.map((row) =>
    optimizationPolicyConfigurationSchema.parse(row.configuration.optimizationPolicy),
  );

  return {
    executivePolicy: executivePolicies[0]?.policyId ?? REG_EXECUTIVE_POLICY,
    optimizationPolicy: optimizationPolicies[0]?.policyId ?? REG_OPTIMIZATION_POLICY,
    commercePolicy: REG_COMMERCE_POLICY,
    automationPolicy: REG_AUTOMATION_POLICY,
    readinessPolicy: REG_READINESS_POLICY,
    kpiMetricRefs: executivePolicies[0]?.kpiMetricRefs ?? [],
    decisionRuleRefs: executivePolicies[0]?.decisionRuleRefs ?? [],
    riskScoringRefs: executivePolicies[0]?.riskScoringRefs ?? [],
    opportunityRuleRefs: optimizationPolicies[0]?.opportunityRuleRefs ?? [],
    anomalyRuleRefs: optimizationPolicies[0]?.anomalyRuleRefs ?? [],
    prioritizationRuleRefs: optimizationPolicies[0]?.prioritizationRuleRefs ?? [],
    domainRefs: optimizationPolicies[0]?.domainRefs ?? [],
    commercePolicies: loader.resolve(context, REG_COMMERCE_POLICY).rows.length,
    automationPolicies: loader.resolve(context, REG_AUTOMATION_POLICY).rows.length,
  };
}

export function deriveIntelligenceSignalFromRef(ref: string): number {
  const hash = ref.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (hash % 80 + 20) / 100;
}

export function parseKpiFromRef(ref: string): ExecutiveKpiId | undefined {
  const match = ref.match(/kpi:([a-z_]+)/);
  return match?.[1] as ExecutiveKpiId | undefined;
}

export function parseDomainFromRef(ref: string): IntelligenceDomainId | undefined {
  const domainMap: Record<string, IntelligenceDomainId> = {
    commerce: "commerce",
    automation: "automation",
    financial_operations: "finance",
    identity: "identity",
    infrastructure: "infrastructure",
    providers: "providers",
    performance: "operational_health",
    business_engines: "business_health",
    executive_ai: "executive_kpis",
    cockpit: "operational_health",
    production_workspace: "infrastructure",
    workflows: "automation",
  };
  const match = ref.match(/domain:([a-z_]+)/);
  if (match?.[1]) {
    return domainMap[match[1]] ?? "business_health";
  }
  const kpiMatch = ref.match(/kpi:([a-z_]+)/);
  if (kpiMatch?.[1]) {
    const kpiDomainMap: Partial<Record<string, IntelligenceDomainId>> = {
      revenue: "finance",
      orders: "commerce",
      automation_success_rate: "automation",
      provider_health: "providers",
      business_health: "business_health",
      empire_health_score: "executive_kpis",
      learning_growth: "learning_trends",
    };
    return kpiDomainMap[kpiMatch[1]] ?? "executive_kpis";
  }
  return undefined;
}

export function mapDomainToSubsystem(domainId: IntelligenceDomainId): string {
  const map: Record<IntelligenceDomainId, string> = {
    commerce: "grand-king-commerce-operations",
    automation: "grand-king-business-automation-operations",
    finance: "grand-king-revenue-financial-operations",
    infrastructure: "production-certification",
    identity: "grand-king-production-workspace",
    providers: "grand-king-production-workspace",
    marketplace: "grand-king-commerce-operations",
    storefront: "grand-king-commerce-operations",
    supplier: "grand-king-commerce-operations",
    advertising: "grand-king-commerce-operations",
    customer_behaviour: "grand-king-commerce-operations",
    business_health: "grand-king-executive-decision-centre",
    operational_health: "grand-king-live-operations",
    executive_kpis: "grand-king-executive-decision-centre",
    learning_trends: "ekls",
  };
  return map[domainId] ?? "grand-king-production-workspace";
}

export function mapKpiRefToLabel(ref: string): string {
  const kpiId = parseKpiFromRef(ref);
  if (!kpiId) return ref;
  return kpiId
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * G6-03 — Individual infrastructure validators (registry-driven).
 */

import type { InfrastructureDeploymentViolation, ServiceHealthEntry } from "../contracts/infrastructure-deployment-types.js";
import type { InfrastructureDeploymentRule } from "../registry/infrastructure-deployment-registry-resolver.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { validateInfrastructureRulesByKind } from "./infrastructure-rule-validator.js";

type RuleKind = InfrastructureDeploymentRule["ruleKind"];

function runValidator(
  rules: InfrastructureDeploymentRule[],
  ruleKinds: RuleKind[],
  context: RegistryLoaderContext,
): { violations: InfrastructureDeploymentViolation[]; serviceHealth: ServiceHealthEntry[] } {
  return validateInfrastructureRulesByKind(rules, ruleKinds, context);
}

export const validateHostingRules = (rules: InfrastructureDeploymentRule[], ctx: RegistryLoaderContext) =>
  runValidator(rules, ["hosting"], ctx);

export const validateBackendRules = (rules: InfrastructureDeploymentRule[], ctx: RegistryLoaderContext) =>
  runValidator(rules, ["backend", "api_layer"], ctx);

export const validateFrontendRules = (rules: InfrastructureDeploymentRule[], ctx: RegistryLoaderContext) =>
  runValidator(rules, ["frontend"], ctx);

export const validateDatabaseRules = (rules: InfrastructureDeploymentRule[], ctx: RegistryLoaderContext) =>
  runValidator(rules, ["database"], ctx);

export const validateQueueRules = (rules: InfrastructureDeploymentRule[], ctx: RegistryLoaderContext) =>
  runValidator(rules, ["queue"], ctx);

export const validateCacheRules = (rules: InfrastructureDeploymentRule[], ctx: RegistryLoaderContext) =>
  runValidator(rules, ["cache"], ctx);

export const validateStorageRules = (rules: InfrastructureDeploymentRule[], ctx: RegistryLoaderContext) =>
  runValidator(rules, ["storage"], ctx);

export const validateMonitoringRules = (rules: InfrastructureDeploymentRule[], ctx: RegistryLoaderContext) =>
  runValidator(rules, ["monitoring", "alerting", "logging"], ctx);

export const validateBackupRules = (rules: InfrastructureDeploymentRule[], ctx: RegistryLoaderContext) =>
  runValidator(rules, ["backup"], ctx);

export const validateDisasterRecoveryRules = (rules: InfrastructureDeploymentRule[], ctx: RegistryLoaderContext) =>
  runValidator(rules, ["disaster_recovery"], ctx);

export const validateDeploymentTopologyRules = (rules: InfrastructureDeploymentRule[], ctx: RegistryLoaderContext) =>
  runValidator(rules, ["deployment_topology"], ctx);

export const validateScalabilityRules = (rules: InfrastructureDeploymentRule[], ctx: RegistryLoaderContext) =>
  runValidator(rules, ["scalability", "worker", "scheduler"], ctx);

export function validateDeploymentHealthRules(
  rules: InfrastructureDeploymentRule[],
  context: RegistryLoaderContext,
): InfrastructureDeploymentViolation[] {
  const violations: InfrastructureDeploymentViolation[] = [];
  for (const rule of rules) {
    for (const condition of rule.forbiddenConditions) {
      if (condition === "monitoring_disabled" && process.env.MONITORING_DISABLED === "true") {
        violations.push({
          violationId: `health-${rule.ruleId}-${condition}`,
          ruleId: rule.ruleId,
          ruleKind: rule.ruleKind,
          infrastructureDomain: rule.infrastructureDomain,
          serviceId: rule.serviceId,
          severity: "high",
          message: `Deployment health condition violated: ${condition}`,
        });
      }
      if (condition === "logging_disabled" && process.env.LOGGING_DISABLED === "true") {
        violations.push({
          violationId: `health-${rule.ruleId}-${condition}`,
          ruleId: rule.ruleId,
          ruleKind: rule.ruleKind,
          infrastructureDomain: rule.infrastructureDomain,
          serviceId: rule.serviceId,
          severity: "medium",
          message: `Deployment health condition violated: ${condition}`,
        });
      }
    }
  }
  return violations;
}

export function deriveReadinessSummary(input: {
  violations: InfrastructureDeploymentViolation[];
  serviceHealth: ServiceHealthEntry[];
}): InfrastructureDeploymentScanResultReadiness {
  const critical = input.violations.some((v) => v.severity === "critical");
  const degraded = input.serviceHealth.some((s) => s.status === "degraded");
  return {
    rollbackReady: !critical,
    upgradeReady: !critical && !degraded,
    capacityReady: input.serviceHealth.every((s) => s.status !== "unavailable"),
    recoveryAvailable: !input.violations.some((v) => v.ruleKind === "disaster_recovery"),
  };
}

type InfrastructureDeploymentScanResultReadiness = {
  rollbackReady: boolean;
  upgradeReady: boolean;
  capacityReady: boolean;
  recoveryAvailable: boolean;
};

export function analyseDeploymentRisks(input: {
  infrastructureFindings: InfrastructureDeploymentViolation[];
  deploymentFindings: InfrastructureDeploymentViolation[];
}): { riskRegister: import("../contracts/infrastructure-deployment-types.js").DeploymentRiskEntry[]; executiveRecommendations: string[] } {
  const all = [...input.infrastructureFindings, ...input.deploymentFindings];
  const riskRegister = all
    .filter((f) => f.severity === "critical" || f.severity === "high" || f.severity === "medium")
    .map((finding) => ({
      riskId: `risk-${finding.violationId}`,
      ruleId: finding.ruleId,
      infrastructureDomain: finding.infrastructureDomain,
      severity: finding.severity,
      summary: finding.message,
      mitigation: finding.recommendation,
    }));

  const recommendations = new Set<string>();
  if (all.some((f) => f.ruleKind === "database")) {
    recommendations.add("Verify database connectivity and configuration before production deployment");
  }
  if (all.some((f) => f.ruleKind === "disaster_recovery")) {
    recommendations.add("Validate disaster recovery procedures and backup restoration");
  }
  if (all.length > 0 && recommendations.size === 0) {
    recommendations.add("Review infrastructure deployment findings before production go-live");
  }
  if (riskRegister.length === 0) {
    recommendations.add("Infrastructure deployment satisfies readiness checks — proceed with remaining G6 domains");
  }
  return { riskRegister, executiveRecommendations: [...recommendations] };
}

// Re-export readiness type for service
export type { InfrastructureDeploymentScanResultReadiness };
